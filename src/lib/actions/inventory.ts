"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getUserOrganization } from "./parcels";
import { formatDate } from "@/lib/utils";
import { createNotification } from "./notifications";

export async function getInventory() {
  try {
    const orgId = await getUserOrganization();
    if (!orgId) return [];

    const inventory = await prisma.inventoryItem.findMany({
      where: { orgId: orgId as string },
      orderBy: { name: "asc" },
    });

    return JSON.parse(JSON.stringify(inventory));
  } catch (error) {
    console.error("Error fetching inventory:", error);
    return [];
  }
}

export async function createInventoryItem(formData: FormData) {
  try {
    const orgId = await getUserOrganization();
    if (!orgId) throw new Error("Neautorizat");

    const name = formData.get("name") as string;
    const category = formData.get("category") as string;
    let quantity = parseFloat(formData.get("quantity") as string);
    let unit = formData.get("unit") as string;
    let pricePerUnit = parseFloat(formData.get("pricePerUnit") as string);
    const minStockThreshold = parseFloat(formData.get("minStockThreshold") as string || "0");
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
            minStockThreshold,
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

      // 3. Înregistrăm tranzacția de consum (intake)
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
    return JSON.parse(JSON.stringify(result));
  } catch (error: any) {
    console.error("Error creating inventory item:", error);
    throw new Error(error.message || "Eroare la crearea elementului de inventar");
  }
}

export async function getProductSuggestions(query: string) {
  const orgId = await getUserOrganization();
  const suggestions = await prisma.inventoryItem.findMany({
    where: {
      orgId: orgId as string,
      name: { contains: query, mode: 'insensitive' }
    },
    take: 5,
    select: { name: true, category: true, unit: true, pricePerUnit: true }
  });
  return JSON.parse(JSON.stringify(suggestions));
}

export async function updateInventoryStock(id: string, newStock: number) {
  try {
    const orgId = await getUserOrganization();
    if (!orgId) throw new Error("Neautorizat");
    
    // Asigură securitatea
    const item = await prisma.inventoryItem.findUnique({ where: { id } });
    if (item?.orgId !== orgId) throw new Error("Neautorizat");

    const updatedItem = await prisma.inventoryItem.update({
      where: { id },
      data: { stockQuantity: newStock }
    });

    // Notificare Stoc Scăzut (Manual)
    const itemAny = updatedItem as any;
    if (itemAny.minStockThreshold && Number(itemAny.minStockThreshold) > 0) {
      if (Number(itemAny.stockQuantity) < Number(itemAny.minStockThreshold)) {
        await createNotification({
          orgId: orgId as string,
          title: "Stoc Scăzut (Manual)",
          message: `Atenție: Stocul pentru "${itemAny.name}" a fost actualizat manual și este sub pragul minim (${itemAny.minStockThreshold} ${itemAny.unit}).`,
          type: "stock",
          link: "/stocuri"
        });
      }
    }

    revalidatePath("/stocuri");
    return { success: true };
  } catch (error: any) {
    console.error("Error updating stock:", error);
    throw new Error(error.message || "Eroare la actualizarea stocului");
  }
}

export async function deleteInventoryItem(id: string) {
  try {
    const orgId = await getUserOrganization();
    if (!orgId) throw new Error("Neautorizat");
    
    const itemRecord = await prisma.inventoryItem.findUnique({ where: { id } });
    if (!itemRecord || itemRecord.orgId !== orgId) throw new Error("Neautorizat");

    await (prisma as any).inventoryItem.delete({
      where: { id }
    });

    revalidatePath("/stocuri");
    revalidatePath("/magazie");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting item:", error);
    throw new Error(error.message || "Eroare la ștergerea produsului");
  }
}

export async function getInventoryItemHistory(id: string) {
  try {
    const orgId = await getUserOrganization();
    if (!orgId) throw new Error("Neautorizat");
    
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

    // Simplificare serializare folosind JSON.parse/stringify
    const serializedItem = JSON.parse(JSON.stringify(item));

    // Îmbunătățim descrierile pentru tranzacții în client
    if (serializedItem.lots) {
      for (const lot of serializedItem.lots) {
        if (lot.transactions) {
          for (const t of lot.transactions) {
            // Dacă e intrare din recoltă, încercăm să găsim parcelele din lucrare
            if (t.type === 'intake' && t.referenceId && lot.source === 'harvest') {
              const op = await (prisma as any).agriculturalOperation.findUnique({
                where: { id: t.referenceId },
                include: { parcels: { include: { parcel: true } } }
              });
              if (op) {
                const parcelsStr = op.parcels.map((p: any) => p.parcel.name).join(", ");
                t.description = `Recoltă: ${parcelsStr} (${formatDate(new Date(op.date))})`;
              }
            }
          }
        }
      }
    }

    return serializedItem;
  } catch (error: any) {
    console.error("Error fetching item history:", error);
    throw new Error(error.message || "Eroare la obținerea istoricului");
  }
}
