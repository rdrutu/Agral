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

    return inventory.map(serializeInventoryItem);
  } catch (error) {
    console.error("Error fetching inventory:", error);
    return [];
  }
}

function serializeInventoryItem(item: any) {
  if (!item) return null;
  return {
    ...item,
    id: String(item.id),
    stockQuantity: Number(item.stockQuantity || 0),
    pricePerUnit: Number(item.pricePerUnit || 0),
    minStockThreshold: Number(item.minStockThreshold || 0),
    tvaRate: Number(item.tvaRate || 0.19),
    createdAt: item.createdAt instanceof Date ? item.createdAt.toISOString() : item.createdAt,
    updatedAt: item.updatedAt instanceof Date ? item.updatedAt.toISOString() : item.updatedAt,
    lots: item.lots ? item.lots.map(serializeInventoryLot) : undefined
  };
}

function serializeInventoryLot(lot: any) {
  if (!lot) return null;
  return {
    ...lot,
    id: String(lot.id),
    inventoryItemId: String(lot.inventoryItemId),
    quantity: Number(lot.quantity || 0),
    initialQuantity: Number(lot.initialQuantity || 0),
    pricePerUnit: Number(lot.pricePerUnit || 0),
    tvaRate: Number(lot.tvaRate || 0.19),
    purchaseDate: lot.purchaseDate instanceof Date ? lot.purchaseDate.toISOString() : lot.purchaseDate,
    expiryDate: lot.expiryDate instanceof Date ? lot.expiryDate.toISOString() : lot.expiryDate,
    createdAt: lot.createdAt instanceof Date ? lot.createdAt.toISOString() : lot.createdAt,
    transactions: lot.transactions ? lot.transactions.map(serializeInventoryTransaction) : undefined
  };
}

function serializeInventoryTransaction(tx: any) {
  if (!tx) return null;
  return {
    ...tx,
    id: String(tx.id),
    inventoryLotId: String(tx.inventoryLotId),
    quantity: Number(tx.quantity || 0),
    unitPrice: Number(tx.unitPrice || 0),
    tvaRate: Number(tx.tvaRate || 0.19),
    date: tx.date instanceof Date ? tx.date.toISOString() : tx.date,
    createdAt: tx.createdAt instanceof Date ? tx.createdAt.toISOString() : tx.createdAt
  };
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
    const tvaRate = parseFloat(formData.get("tvaRate") as string || "0.19");
    const isPriceInclTva = formData.get("isPriceInclTva") === "true";
    const supplierName = formData.get("supplierName") as string;
    const documentNumber = formData.get("documentNumber") as string;
    
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

    // Calculăm prețul NET dacă cel introdus este BRUT
    const netPrice = isPriceInclTva ? pricePerUnit / (1 + tvaRate) : pricePerUnit;
    const grossPrice = isPriceInclTva ? pricePerUnit : pricePerUnit * (1 + tvaRate);
    const totalNet = netPrice * quantity;
    const totalGross = grossPrice * quantity;
    const tvaAmount = totalGross - totalNet;

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
            pricePerUnit: netPrice, // Salvăm prețul NET în catalog
            tvaRate,
            minStockThreshold,
            notes,
            cropType: (formData.get("cropType") as string) || null
          }
        });
      }

      // 2. Creăm Lotul (Intrarea)
      const lot = await (tx as any).inventoryLot.create({
          data: {
            inventoryItemId: item.id,
            quantity,
            initialQuantity: quantity,
            pricePerUnit: netPrice,
            tvaRate,
            purchaseDate: formData.get("date") ? new Date(formData.get("date") as string) : new Date(),
            source: source || "purchase",
            supplierName,
            documentNumber: formData.get("lotNumber") as string || formData.get("documentNumber") as string || null,
            expiryDate: formData.get("expiryDate") ? new Date(formData.get("expiryDate") as string) : null,
            notes: notes || ""
          }
        });

      // 3. Înregistrăm tranzacția de stoc
      await (tx as any).inventoryTransaction.create({
        data: {
          inventoryLotId: lot.id,
          type: "intake",
          quantity,
          unitPrice: netPrice,
          tvaRate,
          description: source === "harvest" ? "Recoltare proprie" : `Achiziție: ${name} (Doc: ${documentNumber || '-'})`,
        }
      });

      // 4. Actualizăm stocul total și prețul de referință (NET)
      const updatedItem = await (tx as any).inventoryItem.update({
        where: { id: item.id },
        data: {
          stockQuantity: { increment: quantity },
          pricePerUnit: netPrice,
          tvaRate: tvaRate
        }
      });

      // 5. Integrare Financiară (doar dacă e achiziție)
      if (source === "purchase" && totalGross > 0) {
        await (tx as any).financialTransaction.create({
          data: {
            orgId: orgId as string,
            type: "expense",
            category: "initial_stock",
            amount: totalGross, // Salvăm suma BRUTĂ în registrul de plăți
            tvaAmount: tvaAmount,
            description: `Achiziție ${name} - ${documentNumber || 'NIR/Factură'}`,
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
    return serializeInventoryItem(result);
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
  return suggestions.map((s: any) => ({
    ...s,
    pricePerUnit: Number(s.pricePerUnit)
  }));
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

export async function recordSale(formData: FormData) {
  try {
    const orgId = await getUserOrganization();
    if (!orgId) throw new Error("Neautorizat");

    const itemId = formData.get("itemId") as string;
    const quantityToSell = parseFloat(formData.get("quantity") as string);
    const pricePerUnit = parseFloat(formData.get("pricePerUnit") as string);
    const tvaRate = parseFloat(formData.get("tvaRate") as string || "0.09");
    const isPriceInclTva = formData.get("isPriceInclTva") === "true";
    const buyer = formData.get("buyer") as string;
    const documentNumber = formData.get("documentNumber") as string;
    const date = formData.get("date") ? new Date(formData.get("date") as string) : new Date();
    const type = formData.get("type") as string || "sale";
    const humidity = formData.get("humidity") as string;
    const impurities = formData.get("impurities") as string;
    const notes = formData.get("notes") as string;

    if (!itemId || isNaN(quantityToSell) || isNaN(pricePerUnit)) {
      throw new Error("Date invalide pentru vânzare");
    }

    const netPrice = isPriceInclTva ? pricePerUnit / (1 + tvaRate) : pricePerUnit;
    const grossPrice = isPriceInclTva ? pricePerUnit : pricePerUnit * (1 + tvaRate);
    const totalGross = grossPrice * quantityToSell;
    const totalNet = netPrice * quantityToSell;
    const tvaAmount = totalGross - totalNet;

    const result = await prisma.$transaction(async (tx) => {
      const item = await (tx as any).inventoryItem.findUnique({
        where: { id: itemId },
        include: { lots: { where: { quantity: { gt: 0 } }, orderBy: { purchaseDate: 'asc' } } }
      });

      if (!item || item.orgId !== orgId) throw new Error("Produsul nu a fost găsit");
      if (Number(item.stockQuantity) < quantityToSell) throw new Error("Stoc insuficient");

      let remainingToSell = quantityToSell;
      const saleRecord = await (tx as any).sale.create({
        data: {
          orgId,
          inventoryItemId: itemId,
          quantity: quantityToSell,
          unit: item.unit,
          pricePerUnit: netPrice,
          tvaRate,
          totalAmount: totalGross,
          buyer,
          documentNumber,
          date,
          notes: humidity || impurities ? `Umiditate: ${humidity || '-'}%, Impurități: ${impurities || '-'}%. ${notes || ''}` : notes
        }
      });

      // Filter lots based on selection
      let lotsToUse = item.lots;
      const requestedLotId = formData.get("lotId") as string;
      if (requestedLotId && requestedLotId !== "fifo") {
        lotsToUse = item.lots.filter((l: any) => String(l.id) === requestedLotId);
        if (lotsToUse.length === 0) throw new Error("Lotul selectat nu mai este disponibil");
      }

      for (const lot of lotsToUse) {
        if (remainingToSell <= 0) break;
        const takeFromLot = Math.min(Number(lot.quantity), remainingToSell);
        
        await (tx as any).inventoryLot.update({
          where: { id: lot.id },
          data: { quantity: { decrement: takeFromLot } }
        });

        await (tx as any).inventoryTransaction.create({
          data: {
            inventoryLotId: lot.id,
            type: type === 'return' ? "return" : "sale",
            quantity: type === 'return' ? -takeFromLot : -takeFromLot, // Both decrease stock in this context (return to supplier)
            unitPrice: netPrice,
            tvaRate,
            description: type === 'return' ? `Retur către furnizor (Doc: ${documentNumber || '-'})` : `Vânzare către ${buyer || 'Client'} (Doc: ${documentNumber || '-'})`,
            referenceId: saleRecord.id
          }
        });

        remainingToSell -= takeFromLot;
      }

      await (tx as any).inventoryItem.update({
        where: { id: itemId },
        data: { stockQuantity: { decrement: quantityToSell } }
      });

      await (tx as any).financialTransaction.create({
        data: {
          orgId,
          type: "income",
          category: "sale",
          amount: totalGross,
          tvaAmount,
          description: `Vânzare ${item.name} - ${buyer || 'Client'}`,
          referenceId: saleRecord.id
        }
      });

      return saleRecord;
    });

    revalidatePath("/stocuri");
    revalidatePath("/magazie");
    revalidatePath("/financiar");
    return { ...result, id: String(result.id) };
  } catch (error: any) {
    console.error("Error recording sale:", error);
    throw new Error(error.message || "Eroare la înregistrarea vânzării");
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
          orderBy: { purchaseDate: 'asc' },
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

    const serializedItem = serializeInventoryItem(item);

    // Îmbogățim istoricul cu date financiare și metadata pentru editare
    const allTransactions = serializedItem.lots.flatMap((l: any) => 
      l.transactions.map((t: any) => ({
        ...t,
        id: String(t.id),
        lotId: String(l.id),
        lotPrice: l.pricePerUnit,
        lotTva: l.tvaRate,
        supplier: l.supplierName,
        doc: l.documentNumber,
        source: l.source
      }))
    ).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Calculăm soldul curent cronologic (Running Balance)
    let balance = 0;
    const historyWithBalance = [...allTransactions].reverse().map(t => {
      balance += Number(t.quantity);
      return { ...t, runningBalance: balance };
    }).reverse();

    serializedItem.history = historyWithBalance;
    return serializedItem;
  } catch (error: any) {
    console.error("Error fetching item history:", error);
    throw new Error(error.message || "Eroare la obținerea istoricului");
  }
}

export async function deleteInventoryTransaction(transactionId: string, updateStock: boolean = true) {
  try {
    const orgId = await getUserOrganization();
    if (!orgId) throw new Error("Neautorizat");

    const result = await prisma.$transaction(async (tx) => {
      const transaction = await (tx as any).inventoryTransaction.findUnique({
        where: { id: transactionId },
        include: { inventoryLot: { include: { inventoryItem: true } } }
      });

      if (!transaction || transaction.inventoryLot.inventoryItem.orgId !== orgId) {
        throw new Error("Tranzacție negăsită");
      }

      const lotId = transaction.inventoryLotId;
      const itemId = transaction.inventoryLot.inventoryItemId;
      const qtyToRevert = Number(transaction.quantity);

      // Dacă este o INTRARE (intake), ștergerea tranzacției înseamnă eliminarea stocului intrat
      // Dacă este o IEȘIRE (sale, consumption), ștergerea înseamnă repunerea pe stoc

      if (updateStock) {
        // Actualizăm Lotul
        await (tx as any).inventoryLot.update({
          where: { id: lotId },
          data: { quantity: { decrement: qtyToRevert } }
        });

        // Actualizăm Itemul
        await (tx as any).inventoryItem.update({
          where: { id: itemId },
          data: { stockQuantity: { decrement: qtyToRevert } }
        });
      }

      // Ștergem tranzacția
      await (tx as any).inventoryTransaction.delete({ where: { id: transactionId } });

      // Dacă era ultima tranzacție a unui lot de tip intake, ștergem și lotul și tranzacția financiară
      if (transaction.type === "intake") {
        const remainingTx = await (tx as any).inventoryTransaction.count({ where: { inventoryLotId: lotId } });
        if (remainingTx === 0) {
          // Ștergem tranzacția financiară asociată
          await (tx as any).financialTransaction.deleteMany({ where: { referenceId: lotId } });
          await (tx as any).inventoryLot.delete({ where: { id: lotId } });
        }
      }

      return { success: true };
    });

    revalidatePath("/stocuri");
    revalidatePath("/magazie");
    return result;
  } catch (error: any) {
    console.error("Error deleting transaction:", error);
    throw new Error(error.message || "Eroare la ștergerea tranzacției");
  }
}

export async function updateInventoryTransaction(
  transactionId: string, 
  data: { quantity: number, date?: Date, description?: string, unitPrice?: number, tvaRate?: number }, 
  updateStock: boolean = true
) {
  try {
    const orgId = await getUserOrganization();
    if (!orgId) throw new Error("Neautorizat");

    const result = await prisma.$transaction(async (tx) => {
      const oldTx = await (tx as any).inventoryTransaction.findUnique({
        where: { id: transactionId },
        include: { inventoryLot: { include: { inventoryItem: true } } }
      });

      if (!oldTx || oldTx.inventoryLot.inventoryItem.orgId !== orgId) {
        throw new Error("Tranzacție negăsită");
      }

      const diff = data.quantity - Number(oldTx.quantity);

      if (updateStock && diff !== 0) {
        // Actualizăm Lotul
        await (tx as any).inventoryLot.update({
          where: { id: oldTx.inventoryLotId },
          data: { quantity: { increment: diff } }
        });

        // Actualizăm Itemul
        await (tx as any).inventoryItem.update({
          where: { id: oldTx.inventoryLot.inventoryItemId },
          data: { stockQuantity: { increment: diff } }
        });
      }

      const updated = await (tx as any).inventoryTransaction.update({
        where: { id: transactionId },
        data: {
          quantity: data.quantity,
          date: data.date || oldTx.date,
          description: data.description || oldTx.description,
          unitPrice: data.unitPrice !== undefined ? data.unitPrice : oldTx.unitPrice,
          tvaRate: data.tvaRate !== undefined ? data.tvaRate : oldTx.tvaRate,
        }
      });

      return updated;
    });

    revalidatePath("/stocuri");
    revalidatePath("/magazie");
    return result;
  } catch (error: any) {
    console.error("Error updating transaction:", error);
    throw new Error(error.message || "Eroare la actualizarea tranzacției");
  }
}

export async function recordAdjustment(itemId: string, data: { type: string, quantity: number, description: string, date?: Date }) {
  try {
    const orgId = await getUserOrganization();
    if (!orgId) throw new Error("Neautorizat");

    const result = await prisma.$transaction(async (tx) => {
      const item = await (tx as any).inventoryItem.findUnique({
        where: { id: itemId },
        include: { lots: { where: { quantity: { gt: 0 } }, orderBy: { purchaseDate: 'asc' } } }
      });

      if (!item || item.orgId !== orgId) throw new Error("Produsul nu a fost găsit");

      let targetLotId = "";

      if (data.quantity > 0) {
        // Dacă e pozitiv (intrare), adăugăm la ultimul lot sau creăm unul nou de ajustare
        let lot = item.lots[item.lots.length - 1];
        if (!lot) {
           lot = await (tx as any).inventoryLot.create({
             data: {
               inventoryItemId: itemId,
               quantity: 0,
               initialQuantity: 0,
               pricePerUnit: item.pricePerUnit,
               purchaseDate: new Date(),
               source: "adjustment"
             }
           });
        }
        targetLotId = lot.id;
      } else {
        // Dacă e negativ (ieșire), folosim FIFO pe loturile existente
        if (item.lots.length === 0) throw new Error("Nu există loturi disponibile pentru scădere");
        targetLotId = item.lots[0].id; // Simplificat: luăm primul lot disponibil
      }

      await (tx as any).inventoryLot.update({
        where: { id: targetLotId },
        data: { quantity: { increment: data.quantity } }
      });

      await (tx as any).inventoryItem.update({
        where: { id: itemId },
        data: { stockQuantity: { increment: data.quantity } }
      });

      return await (tx as any).inventoryTransaction.create({
        data: {
          inventoryLotId: targetLotId,
          type: data.type,
          quantity: data.quantity,
          description: data.description,
          date: data.date || new Date()
        }
      });
    });

    revalidatePath("/stocuri");
    revalidatePath("/magazie");
    return result;
  } catch (error: any) {
    console.error("Error recording adjustment:", error);
    throw new Error(error.message || "Eroare la înregistrarea ajustării");
  }
}

export async function getSupplierSuggestions(query: string) {
  try {
    const orgId = await getUserOrganization();
    if (!orgId) return [];
    
    const lots = await (prisma as any).inventoryLot.findMany({
      where: { 
        inventoryItem: { orgId: orgId as string },
        supplierName: { contains: query, mode: 'insensitive' }
      },
      distinct: ['supplierName'],
      select: { supplierName: true },
      take: 10
    });
    
    return lots.map((l: any) => l.supplierName).filter(Boolean);
  } catch (e) {
    return [];
  }
}

export async function getBuyerSuggestions(query: string) {
  try {
    const orgId = await getUserOrganization();
    if (!orgId) return [];
    
    const sales = await (prisma as any).sale.findMany({
      where: { 
        orgId: orgId as string,
        buyer: { contains: query, mode: 'insensitive' }
      },
      distinct: ['buyer'],
      select: { buyer: true },
      take: 10
    });
    
    return sales.map((s: any) => s.buyer).filter(Boolean);
  } catch (e) {
    return [];
  }
}
