"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getUserOrganization } from "./parcels";

export async function deleteAgriculturalOperation(operationId: string) {
  const orgId = await getUserOrganization();
  if (!orgId) throw new Error("Neautorizat");

  await prisma.$transaction(async (tx) => {
    // 1. Fetch operation and resources to restore inventory
    const op = await tx.agriculturalOperation.findUnique({
      where: { id: operationId, orgId: orgId as string },
      include: { resources: true }
    });

    if (!op) throw new Error("Operațiunea nu a fost găsită.");

    // 2. Restore stocks for resources linked to inventory
    for (const res of op.resources) {
      if (res.inventoryItemId) {
        const consumed = res.totalConsumed 
          ? Number(res.totalConsumed) 
          : Number(res.quantityPerHa) * Number(op.totalAreaHa);
          
        await tx.inventoryItem.update({
          where: { id: res.inventoryItemId },
          data: {
            stockQuantity: { increment: consumed }
          }
        });
      }
    }

    // 3. Delete the operation (cascades and relations)
    await tx.agriculturalOperation.delete({
      where: { id: operationId }
    });
  });

  revalidatePath("/campanii");
  revalidatePath("/dashboard");
  revalidatePath("/financiar");
}

export async function deleteVehicleMaintenance(maintenanceId: string) {
  const orgId = await getUserOrganization();
  if (!orgId) throw new Error("Neautorizat");

  // Verify ownership via vehicle
  const maintenance = await prisma.vehicleMaintenance.findUnique({
    where: { id: maintenanceId },
    include: { vehicle: true }
  });

  if (!maintenance || maintenance.vehicle.orgId !== (orgId as string)) {
    throw new Error("Mentenanța nu a fost găsită.");
  }

  await prisma.vehicleMaintenance.delete({
    where: { id: maintenanceId }
  });

  revalidatePath("/utilaje");
  revalidatePath("/financiar");
}

export const deleteOperation = deleteAgriculturalOperation;

export async function getOperations() {
  const orgId = await getUserOrganization();
  if (!orgId) return [];

  return prisma.agriculturalOperation.findMany({
    where: { orgId: orgId as string },
    include: {
      parcels: {
        include: {
          parcel: true
        }
      },
      resources: true
    },
    orderBy: { date: 'desc' }
  });
}

export async function createOperation(data: any) {
  const orgId = await getUserOrganization();
  if (!orgId) throw new Error("Neautorizat");

  const totalAreaHa = data.parcels.reduce((sum: number, p: any) => sum + Number(p.operatedAreaHa), 0);

  const op = await prisma.$transaction(async (tx) => {
    const operation = await tx.agriculturalOperation.create({
      data: {
        orgId: orgId as string,
        name: data.name,
        date: new Date(data.date),
        notes: data.notes || "",
        totalAreaHa,
        status: "completed",
        parcels: {
          create: data.parcels.map((p: any) => ({
            parcelId: p.parcelId,
            operatedAreaHa: p.operatedAreaHa
          }))
        },
        resources: {
          create: data.resources.map((r: any) => ({
            inventoryItemId: r.inventoryItemId || null,
            name: r.name,
            type: r.type,
            quantityPerHa: r.quantityPerHa,
            unit: r.unit,
            pricePerUnit: r.pricePerUnit,
          }))
        }
      },
      include: {
        parcels: { include: { parcel: true } },
        resources: true
      }
    });

    // Deduct from inventory
    for (const r of data.resources) {
      if (r.inventoryItemId) {
        const totalQty = Number(r.quantityPerHa) * totalAreaHa;
        await tx.inventoryItem.update({
          where: { id: r.inventoryItemId },
          data: {
            stockQuantity: { decrement: totalQty }
          }
        });
      }
    }

    // Add financial transactions for the operation resources cost
    let totalCost = 0;
    for (const r of data.resources) {
      totalCost += Number(r.quantityPerHa) * totalAreaHa * Number(r.pricePerUnit);
    }
    
    if (totalCost > 0) {
      await tx.financialTransaction.create({
        data: {
          orgId: orgId as string,
          type: "expense",
          category: "operation",
          amount: totalCost,
          date: new Date(data.date),
          description: `Costuri materiale pt lucrarea: ${data.name}`,
          referenceId: operation.id
        }
      });
    }

    return operation;
  });

  revalidatePath("/operatiuni");
  revalidatePath("/dashboard");
  revalidatePath("/financiar");
  
  return op;
}

export async function updateOperation(operationId: string, data: any) {
  const orgId = await getUserOrganization();
  if (!orgId) throw new Error("Neautorizat");

  const totalAreaHa = data.parcels.reduce((sum: number, p: any) => sum + Number(p.operatedAreaHa), 0);

  const newOp = await prisma.$transaction(async (tx) => {
    // 1. Fetch old operation to revert inventory changes
    const oldOp = await tx.agriculturalOperation.findUnique({
      where: { id: operationId },
      include: { resources: true }
    });
    
    if (!oldOp || oldOp.orgId !== orgId) throw new Error("Operațiunea nu a fost găsită.");

    for (const r of oldOp.resources) {
      if (r.inventoryItemId) {
        const consumed = r.totalConsumed ? Number(r.totalConsumed) : (Number(r.quantityPerHa) * Number(oldOp.totalAreaHa));
        await tx.inventoryItem.update({
          where: { id: r.inventoryItemId },
          data: { stockQuantity: { increment: consumed } }
        });
      }
    }

    // Remove old financial transaction if exists
    await tx.financialTransaction.deleteMany({
      where: { referenceId: operationId, category: "operation" }
    });

    // 2. Delete existing relations
    await tx.operationParcel.deleteMany({ where: { operationId } });
    await tx.operationResource.deleteMany({ where: { operationId } });

    // 3. Update operation and recreate relations
    const updated = await tx.agriculturalOperation.update({
      where: { id: operationId },
      data: {
        name: data.name,
        date: new Date(data.date),
        notes: data.notes || "",
        totalAreaHa,
        parcels: {
          create: data.parcels.map((p: any) => ({
            parcelId: p.parcelId,
            operatedAreaHa: p.operatedAreaHa
          }))
        },
        resources: {
          create: data.resources.map((r: any) => ({
            inventoryItemId: r.inventoryItemId || null,
            name: r.name,
            type: r.type,
            quantityPerHa: r.quantityPerHa,
            unit: r.unit,
            pricePerUnit: r.pricePerUnit,
            totalConsumed: r.totalConsumed
          }))
        }
      },
      include: {
        parcels: { include: { parcel: true } },
        resources: true
      }
    });

    // 4. Scădem stocul conform noilor cantități (bazate pe norma per ha dacă lipsește totalConsumed)
    let totalCost = 0;
    for (const r of data.resources) {
      const consumedQty = r.totalConsumed ? Number(r.totalConsumed) : (Number(r.quantityPerHa) * totalAreaHa);
      const cost = consumedQty * Number(r.pricePerUnit);
      totalCost += cost;

      if (r.inventoryItemId) {
        await tx.inventoryItem.update({
          where: { id: r.inventoryItemId },
          data: {
            stockQuantity: { decrement: consumedQty }
          }
        });
      }
    }

    // 5. Recreem înregistrarea financiară
    if (totalCost > 0) {
      await tx.financialTransaction.create({
        data: {
          orgId: orgId as string,
          type: "expense",
          category: "operation",
          amount: totalCost,
          date: new Date(data.date),
          description: `Costuri materiale pt lucrarea revizuită: ${data.name}`,
          referenceId: updated.id
        }
      });
    }

    return updated;
  });

  revalidatePath("/operatiuni");
  revalidatePath("/dashboard");
  revalidatePath("/financiar");

  return newOp;
}

export async function updateResourceConsumed(resourceId: string, newTotal: number) {
  const orgId = await getUserOrganization();
  if (!orgId) throw new Error("Neautorizat");

  const updated = await prisma.$transaction(async (tx) => {
    // 1. Fetch resource and operation to calculate previous total 
    const resource = await tx.operationResource.findUnique({
      where: { id: resourceId },
      include: { operation: true }
    });

    if (!resource || resource.operation.orgId !== orgId) throw new Error("Resursa nu a fost găsită.");

    const prevTotal = resource.totalConsumed 
      ? Number(resource.totalConsumed) 
      : Number(resource.quantityPerHa) * Number(resource.operation.totalAreaHa);

    const diff = newTotal - prevTotal;

    // 2. Update resource totalConsumed
    const resUpdated = await tx.operationResource.update({
      where: { id: resourceId },
      data: { totalConsumed: newTotal }
    });

    // 3. Update inventory item stock by the difference
    if (resource.inventoryItemId) {
      await tx.inventoryItem.update({
        where: { id: resource.inventoryItemId },
        data: {
          stockQuantity: { decrement: diff } 
        }
      });
    }

    // 4. Update financial transaction
    const finTxs = await tx.financialTransaction.findMany({ 
      where: { referenceId: resource.operationId, category: "operation" } 
    });
    
    if (finTxs.length > 0) {
        const oldExpenseDiffAmount = prevTotal * Number(resource.pricePerUnit);
        const newExpenseDiffAmount = newTotal * Number(resource.pricePerUnit);
        const addedExpense = newExpenseDiffAmount - oldExpenseDiffAmount;

        await tx.financialTransaction.update({
            where: { id: finTxs[0].id },
            data: { amount: { increment: addedExpense } }
        });
    }

    return resUpdated;
  });

  revalidatePath("/operatiuni");
  revalidatePath("/dashboard");
  revalidatePath("/financiar");

  return updated;
}
