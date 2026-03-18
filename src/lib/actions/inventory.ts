"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getUserOrganization } from "./parcels";
import { formatDate } from "@/lib/utils";

export async function getInventory() {
  const orgId = await getUserOrganization();

  const inventory = await prisma.inventoryItem.findMany({
    where: { orgId: orgId as string },
    orderBy: { name: "asc" },
  });

  // Convertim Decimal în number pentru serializare (RSC -> Client)
  return inventory.map(item => ({
    ...item,
    stockQuantity: Number(item.stockQuantity),
    pricePerUnit: Number(item.pricePerUnit),
  }));
}

export async function createInventoryItem(formData: FormData) {
  const orgId = await getUserOrganization();

  const name = formData.get("name") as string;
  const category = formData.get("category") as string;
  let quantity = parseFloat(formData.get("quantity") as string);
  let unit = formData.get("unit") as string;
  let pricePerUnit = parseFloat(formData.get("pricePerUnit") as string);
  const bagWeight = parseFloat(formData.get("bagWeight") as string || "0");
  
  // Dacă e Sac, convertim în Kg
  if (unit === "Sac" && bagWeight > 0) {
    quantity = quantity * bagWeight;
    unit = "Kg";
  }

  const notes = formData.get("notes") as string;
  const source = (formData.get("source") as string) || "purchase";

  if (!name || isNaN(quantity) || isNaN(pricePerUnit)) {
    throw new Error("Date invalide pentru stoc");
  }

  const result = await prisma.$transaction(async (tx) => {
    // 1. Găsim sau creăm produsul (unicitate pe NUME la nivel de organizație)
    let item = await (tx as any).inventoryItem.findFirst({
      where: { orgId: orgId as string, name: { equals: name, mode: 'insensitive' } }
    });

    if (!item) {
      item = await (tx as any).inventoryItem.create({
        data: {
          orgId: orgId as string,
          name,
          category,
          stockQuantity: 0,
          unit,
          pricePerUnit,
          notes,
          cropType: (formData.get("cropType") as string) || null
        }
      });
    }

    // 2. Creăm Lotul
    const lot = await (tx as any).inventoryLot.create({
        data: {
          inventoryItemId: item.id,
          quantity,
          initialQuantity: quantity,
          pricePerUnit,
          purchaseDate: formData.get("date") ? new Date(formData.get("date") as string) : new Date(),
          source: source || "purchase",
          notes: notes || ""
        }
      });
          // Înregistrăm tranzacția de consum
          await (tx as any).inventoryTransaction.create({
      data: {
        inventoryLotId: lot.id,
        type: "intake",
        quantity,
        description: source === "harvest" ? "Recoltare proprie" : `Achiziție: ${name}`,
      }
    });

    // 4. Actualizăm stocul total și prețul de referință al produsului
    const updatedItem = await (tx as any).inventoryItem.update({
      where: { id: item.id },
      data: {
        stockQuantity: { increment: quantity },
        pricePerUnit: pricePerUnit // Actualizăm cu ultimul preț de achiziție
      }
    });

    // 5. Record financial transaction if it's a purchase
    if (source === "purchase" && quantity * pricePerUnit > 0) {
      await (tx as any).financialTransaction.create({
        data: {
          orgId: orgId as string,
          type: "expense",
          category: "initial_stock",
          amount: quantity * pricePerUnit,
          description: `Achiziție stoc: ${name} (${quantity} ${unit})`,
          referenceId: lot.id
        }
      });
    }

    return updatedItem;
  });

  revalidatePath("/magazie");
  revalidatePath("/stocuri");
  revalidatePath("/dashboard");
  revalidatePath("/financiar");
  return result;
}

export async function getProductSuggestions(query: string) {
  const orgId = await getUserOrganization();
  return prisma.inventoryItem.findMany({
    where: {
      orgId: orgId as string,
      name: { contains: query, mode: 'insensitive' }
    },
    take: 5,
    select: { name: true, category: true, unit: true, pricePerUnit: true }
  });
}

export async function updateInventoryStock(id: string, newStock: number) {
  const orgId = await getUserOrganization();
  
  // Asigură securitatea
  const item = await prisma.inventoryItem.findUnique({ where: { id } });
  if (item?.orgId !== orgId) throw new Error("Neautorizat");

  await prisma.inventoryItem.update({
    where: { id },
    data: { stockQuantity: newStock }
  });

  revalidatePath("/stocuri");
}

export async function deleteInventoryItem(id: string) {
  const orgId = await getUserOrganization();
  
  const itemRecord = await prisma.inventoryItem.findUnique({ where: { id } });
  if (!itemRecord || itemRecord.orgId !== orgId) throw new Error("Neautorizat");

  await (prisma as any).inventoryItem.delete({
    where: { id }
  });

  revalidatePath("/stocuri");
  revalidatePath("/magazie");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function getInventoryItemHistory(id: string) {
  const orgId = await getUserOrganization();
  
  const item = await (prisma as any).inventoryItem.findUnique({
    where: { id },
    include: {
      lots: {
        orderBy: { purchaseDate: 'asc' }, // FIFO: order by oldest first
        include: {
          transactions: {
            orderBy: { date: 'desc' }
          }
        }
      }
    }
  });

  if (!item || item.orgId !== orgId) {
    throw new Error("Produs negăsit sau acces refuzat");
  }

  // Serializare Decimale și Date
  return {
    ...item,
    stockQuantity: Number(item.stockQuantity),
    pricePerUnit: Number(item.pricePerUnit),
    lots: await Promise.all(((item as any).lots || []).map(async (lot: any) => {
      const txs = await (prisma as any).inventoryTransaction.findMany({
        where: { inventoryLotId: lot.id },
        orderBy: { date: 'desc' }
      });
      
      const serializedTxs = await Promise.all(txs.map(async (t: any) => {
        let enhancedDescription = t.description;
        
        // Dacă e intrare din recoltă, încercăm să găsim parcelele din lucrare
        if (t.type === 'intake' && t.referenceId && lot.source === 'harvest') {
          const op = await (prisma as any).agriculturalOperation.findUnique({
            where: { id: t.referenceId },
            include: { parcels: { include: { parcel: true } } }
          });
          if (op) {
            const parcelsStr = op.parcels.map((p: any) => p.parcel.name).join(", ");
            enhancedDescription = `Recoltă: ${parcelsStr} (${formatDate(op.date)})`;
          }
        }

        return {
          ...t,
          quantity: Number(t.quantity),
          description: enhancedDescription,
          date: t.date.toISOString()
        };
      }));

      return {
        ...lot,
        quantity: Number(lot.quantity),
        initialQuantity: Number(lot.initialQuantity),
        pricePerUnit: Number(lot.pricePerUnit),
        purchaseDate: lot.purchaseDate.toISOString(),
        transactions: serializedTxs
      };
    }))
  } as any;
}
