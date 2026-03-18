"use server";

import prisma from "@/lib/prisma";
import { getUserOrganization } from "./parcels";

export async function getFinancialTransactions() {
  const orgId = await getUserOrganization();
  if (!orgId) return [];

  const transactions = await prisma.financialTransaction.findMany({
    where: { orgId: orgId as string },
    orderBy: { date: "desc" },
  });

  return JSON.parse(JSON.stringify(transactions));
}

export async function getFinancialSummary() {
  const orgId = await getUserOrganization();
  if (!orgId) return null;

  const [transactions, users, operationResources, maintenance] = await Promise.all([
    prisma.financialTransaction.findMany({
      where: { orgId: orgId as string }
    }),
    prisma.user.findMany({
      where: { orgId: orgId as string, monthlySalary: { not: null } },
      select: { monthlySalary: true }
    }),
    prisma.operationResource.findMany({
      where: { operation: { orgId: orgId as string } },
      select: { totalConsumed: true, quantityPerHa: true, pricePerUnit: true, operation: { select: { totalAreaHa: true } } }
    }),
    prisma.vehicleMaintenance.findMany({
      where: { vehicle: { orgId: orgId as string } },
      select: { cost: true }
    })
  ]);

  const rawIncome = transactions
    .filter((t: any) => t.type === "income")
    .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

  const rawExpense = transactions
    .filter((t: any) => t.type === "expense")
    .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

  // Group categories from transactions
  const categories: Record<string, number> = {};
  transactions.forEach((t: any) => {
    const cat = t.category;
    if (!categories[cat]) categories[cat] = 0;
    categories[cat] += Number(t.amount);
  });

  // Add Dynamic Costs
  const totalSalaries = users.reduce((sum, u) => sum + Number(u.monthlySalary || 0), 0);
  const totalOpCosts = operationResources.reduce((sum, res) => {
    const qty = res.totalConsumed ? Number(res.totalConsumed) : (Number(res.quantityPerHa) * Number(res.operation.totalAreaHa));
    return sum + (qty * Number(res.pricePerUnit));
  }, 0);
  const totalMaintenance = maintenance.reduce((sum, m) => sum + Number(m.cost || 0), 0);

  // Add to categories
  categories["Salarii"] = (categories["Salarii"] || 0) + totalSalaries;
  categories["Lucrări"] = (categories["Lucrări"] || 0) + totalOpCosts;
  categories["Mentenanță"] = (categories["Mentenanță"] || 0) + totalMaintenance;

  const totalExpense = rawExpense + totalSalaries + totalOpCosts + totalMaintenance;

  return {
    totalIncome: rawIncome,
    totalExpense,
    profit: rawIncome - totalExpense,
    categories
  };
}

export async function sellCrop(data: {
  inventoryItemId: string;
  quantity: number;
  pricePerUnit: number;
  buyer?: string;
  notes?: string;
}) {
  const orgId = await getUserOrganization();
  if (!orgId) throw new Error("Neautorizat");

  const totalAmount = Number(data.quantity) * Number(data.pricePerUnit);

  const sale = await prisma.$transaction(async (tx) => {
    // 1. Fetch item
    const item = await tx.inventoryItem.findUnique({
      where: { id: data.inventoryItemId }
    });

    if (!item || item.orgId !== (orgId as string)) {
      throw new Error("Produsul nu a fost găsit în magazia ta.");
    }

    if (Number(item.stockQuantity) < Number(data.quantity)) {
      throw new Error("Stoc insuficient pentru această vânzare.");
    }

    // 2. Create Sale record
    const saleRecord = await tx.sale.create({
      data: {
        orgId: orgId as string,
        inventoryItemId: data.inventoryItemId,
        quantity: data.quantity,
        unit: item.unit,
        pricePerUnit: data.pricePerUnit,
        totalAmount: totalAmount,
        buyer: data.buyer,
        notes: data.notes
      }
    });

    // 3. FIFO - Deduct from lots
    let remainingToDeduct = Number(data.quantity);
    const lots = await (tx as any).inventoryLot.findMany({
      where: { inventoryItemId: data.inventoryItemId, quantity: { gt: 0 } },
      orderBy: { purchaseDate: 'asc' }
    });

    for (const lot of lots) {
      if (remainingToDeduct <= 0) break;
      const deductFromLot = Math.min(Number(lot.quantity), remainingToDeduct);
      
      await (tx as any).inventoryLot.update({
        where: { id: lot.id },
        data: { quantity: { decrement: deductFromLot } }
      });

      await (tx as any).inventoryTransaction.create({
        data: {
          inventoryLotId: lot.id,
          type: "sale",
          quantity: deductFromLot,
          referenceId: saleRecord.id,
          description: `Vânzare către ${data.buyer || 'client'}`
        }
      });

      remainingToDeduct -= deductFromLot;
    }

    // 4. Update total stock
    await tx.inventoryItem.update({
      where: { id: data.inventoryItemId },
      data: {
        stockQuantity: { decrement: data.quantity }
      }
    });

    // 5. Record Financial Transaction (Income)
    await tx.financialTransaction.create({
      data: {
        orgId: orgId as string,
        type: "income",
        category: "sale",
        amount: totalAmount,
        description: `Vânzare ${item.name}: ${data.quantity} ${item.unit} către ${data.buyer || 'client anonim'}`,
        referenceId: saleRecord.id
      }
    });

    return saleRecord;
  });

  const { revalidatePath } = await import("next/cache");
  revalidatePath("/magazie");
  revalidatePath("/stocuri");
  revalidatePath("/financiar");
  return JSON.parse(JSON.stringify(sale));
}

export async function getSaleDetails(saleId: string) {
  const orgId = await getUserOrganization();
  if (!orgId) throw new Error("Neautorizat");

  const sale = await prisma.sale.findUnique({
    where: { id: saleId, orgId: orgId as string },
    include: {
      inventoryItem: true,
      organization: true
    }
  });

  return JSON.parse(JSON.stringify(sale));
}
