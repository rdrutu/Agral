"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getUserOrganization } from "./parcels";
import { Prisma } from "@prisma/client";

export async function getOperations() {
  const orgId = await getUserOrganization();

  const operations = await prisma.agriculturalOperation.findMany({
    where: { orgId: orgId as string },
    orderBy: { date: "desc" },
    include: {
      parcels: {
        include: { parcel: true }
      },
      resources: true
    }
  });

  return operations;
}

export async function createOperation(data: {
  name: string;
  date: string;
  notes?: string;
  parcels: { parcelId: string; operatedAreaHa: number }[];
  resources: { name: string; type: string; quantityPerHa: number; unit: string; pricePerUnit: number; inventoryItemId?: string }[];
}) {
  const orgId = await getUserOrganization();
  const totalAreaHa = data.parcels.reduce((sum, p) => sum + p.operatedAreaHa, 0);

  const operation = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const op = await tx.agriculturalOperation.create({
      data: {
        orgId: orgId as string,
        name: data.name,
        date: new Date(data.date),
        notes: data.notes,
        totalAreaHa,
        parcels: {
          create: data.parcels.map(p => ({
            parcelId: p.parcelId,
            operatedAreaHa: p.operatedAreaHa
          }))
        },
        resources: {
          create: data.resources.map(r => ({
            name: r.name,
            type: r.type,
            quantityPerHa: r.quantityPerHa,
            unit: r.unit,
            pricePerUnit: r.pricePerUnit,
            inventoryItemId: r.inventoryItemId || null
          }))
        }
      }
    });

    // Deducere automată de pe stocul organizației
    for (const res of data.resources) {
      if (res.inventoryItemId) {
        const totalConsumed = res.quantityPerHa * totalAreaHa;
        await tx.inventoryItem.update({
          where: { id: res.inventoryItemId },
          data: {
            stockQuantity: {
              decrement: totalConsumed
            }
          }
        });
      }
    }

    return op;
  });

  revalidatePath("/operatiuni");
  revalidatePath("/stocuri");
  revalidatePath("/dashboard");
  return operation;
}

export async function updateResourceConsumed(resourceId: string, finalConsumed: number) {
  const orgId = await getUserOrganization();
  
  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const res = await tx.operationResource.findUnique({
      where: { id: resourceId },
      include: { operation: true }
    });

    if (!res || res.operation.orgId !== orgId) throw new Error("Neautorizat");

    // Calculăm deviația față de estimatul inițial (sau vechiul final)
    const oldTotal = res.totalConsumed 
      ? Number(res.totalConsumed) 
      : (Number(res.quantityPerHa) * Number(res.operation.totalAreaHa));
      
    const delta = finalConsumed - oldTotal;

    await tx.operationResource.update({
      where: { id: resourceId },
      data: { totalConsumed: finalConsumed }
    });

    if (res.inventoryItemId) {
      await tx.inventoryItem.update({
        where: { id: res.inventoryItemId },
        data: { stockQuantity: { decrement: delta } } // scade extraconsumul sau returnează restul dacă delta e negativ
      });
    }
  });

  revalidatePath("/operatiuni");
  revalidatePath("/stocuri");
}

export async function deleteOperation(opId: string) {
  const orgId = await getUserOrganization();

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const op = await tx.agriculturalOperation.findUnique({
      where: { id: opId, orgId: orgId as string },
      include: { resources: true }
    });

    if (!op) throw new Error("Nu a fost gasita");

    // Pentru fiecare resursă din magazie, ii returnam in stoc echivalentul
    for (const res of op.resources) {
      if (res.inventoryItemId) {
        const consumed = res.totalConsumed 
          ? Number(res.totalConsumed) 
          : (Number(res.quantityPerHa) * Number(op.totalAreaHa));
          
        await tx.inventoryItem.update({
          where: { id: res.inventoryItemId },
          data: { stockQuantity: { increment: consumed } }
        });
      }
    }

    await tx.agriculturalOperation.delete({ where: { id: opId } });
  });

  revalidatePath("/operatiuni");
  revalidatePath("/stocuri");
}

export async function updateOperation(opId: string, data: {
  name: string;
  date: string;
  notes?: string;
  parcels: { parcelId: string; operatedAreaHa: number }[];
  resources: { name: string; type: string; quantityPerHa: number; unit: string; pricePerUnit: number; inventoryItemId?: string }[];
}) {
  const orgId = await getUserOrganization();
  const totalAreaHa = data.parcels.reduce((sum, p) => sum + p.operatedAreaHa, 0);

  const updatedOp = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // 1. Luăm op-ul vechi pt a da rollback la stocuri
    const oldOp = await tx.agriculturalOperation.findUnique({
      where: { id: opId, orgId: orgId as string },
      include: { resources: true }
    });
    if (!oldOp) throw new Error("Operațiunea nu a fost găsită");

    // 2. Rollback la consumuri vechi
    for (const res of oldOp.resources) {
      if (res.inventoryItemId) {
        const oldConsumed = res.totalConsumed 
          ? Number(res.totalConsumed) 
          : (Number(res.quantityPerHa) * Number(oldOp.totalAreaHa));
        
        await tx.inventoryItem.update({
          where: { id: res.inventoryItemId },
          data: { stockQuantity: { increment: oldConsumed } }
        });
      }
    }

    // 3. Ștergem vechile asocieri (parcele & resurse)
    await tx.operationParcel.deleteMany({ where: { operationId: opId } });
    await tx.operationResource.deleteMany({ where: { operationId: opId } });

    // 4. Update head-ul și creăm asocierile noi
    const newOp = await tx.agriculturalOperation.update({
      where: { id: opId },
      data: {
        name: data.name,
        date: new Date(data.date),
        notes: data.notes,
        totalAreaHa,
        parcels: {
          create: data.parcels.map(p => ({
            parcelId: p.parcelId,
            operatedAreaHa: p.operatedAreaHa
          }))
        },
        resources: {
          create: data.resources.map(r => ({
            name: r.name,
            type: r.type,
            quantityPerHa: r.quantityPerHa,
            unit: r.unit,
            pricePerUnit: r.pricePerUnit,
            inventoryItemId: r.inventoryItemId || null
          }))
        }
      }
    });

    // 5. Scădem noile valori din stoc
    for (const res of data.resources) {
      if (res.inventoryItemId) {
        const newConsumed = res.quantityPerHa * totalAreaHa;
        await tx.inventoryItem.update({
          where: { id: res.inventoryItemId },
          data: { stockQuantity: { decrement: newConsumed } }
        });
      }
    }

    return newOp;
  });

  revalidatePath("/operatiuni");
  revalidatePath("/stocuri");
  revalidatePath("/dashboard");
  return updatedOp;
}
