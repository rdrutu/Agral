"use server";

import prisma from "@/lib/prisma";
import { getUserOrganization } from "./parcels";
import { formatMonthYear } from "@/lib/utils";

export async function getFinancialTransactions(startDate?: Date, endDate?: Date) {
  const orgId = await getUserOrganization();
  if (!orgId) return [];

  const where: any = { orgId: orgId as string };
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = startDate;
    if (endDate) where.date.lte = endDate;
  }

  const transactions = await prisma.financialTransaction.findMany({
    where,
    orderBy: { date: "desc" },
  });

  return JSON.parse(JSON.stringify(transactions));
}

export async function getFinancialSummary(startDate?: Date, endDate?: Date) {
  const orgId = await getUserOrganization();
  if (!orgId) return null;

  const transactionWhere: any = { orgId: orgId as string };
  if (startDate || endDate) {
    transactionWhere.date = {};
    if (startDate) transactionWhere.date.gte = startDate;
    if (endDate) transactionWhere.date.lte = endDate;
  }

  const opWhere: any = { operation: { orgId: orgId as string } };
  if (startDate || endDate) {
    opWhere.operation.date = {};
    if (startDate) opWhere.operation.date.gte = startDate;
    if (endDate) opWhere.operation.date.lte = endDate;
  }

  const maintWhere: any = { vehicle: { orgId: orgId as string } };
  if (startDate || endDate) {
    maintWhere.date = {};
    if (startDate) maintWhere.date.gte = startDate;
    if (endDate) maintWhere.date.lte = endDate;
  }

  const [transactions, users, operationResources, maintenance] = await Promise.all([
    prisma.financialTransaction.findMany({
      where: transactionWhere
    }),
    prisma.user.findMany({
      where: { orgId: orgId as string, monthlySalary: { not: null } },
      select: { monthlySalary: true }
    }),
    prisma.operationResource.findMany({
      where: opWhere,
      select: { totalConsumed: true, quantityPerHa: true, pricePerUnit: true, operation: { select: { totalAreaHa: true } } }
    }),
    prisma.vehicleMaintenance.findMany({
      where: maintWhere,
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

  // Salaries are a bit special - if we are filtering for a period, we might want to scale them.
  // But usually farmers want to see the "fixed costs" if they fall within the period.
  // For now, let's only include salaries if we are in "Overall" or if the period is significant.
  // Actually, let's keep it simple: if filtering by date, we show transaction-based salaries if any,
  // or we don't include the "virtual" monthly salaries unless it's overall.
  
  let totalSalaries = 0;
  if (!startDate && !endDate) {
     totalSalaries = users.reduce((sum, u) => sum + Number(u.monthlySalary || 0), 0);
  } else {
    // If we have a range, maybe we just count months?
    // User requested "Overall" to be default, so let's stick to that for virtual costs.
  }

  const totalOpCosts = operationResources.reduce((sum, res) => {
    const qty = res.totalConsumed ? Number(res.totalConsumed) : (Number(res.quantityPerHa) * Number(res.operation.totalAreaHa));
    return sum + (qty * Number(res.pricePerUnit));
  }, 0);
  const totalMaintenance = maintenance.reduce((sum, m) => sum + Number(m.cost || 0), 0);

  // Add to categories
  if (totalSalaries > 0) categories["Salarii"] = (categories["Salarii"] || 0) + totalSalaries;
  categories["Lucrări"] = (categories["Lucrări"] || 0) + totalOpCosts;
  categories["Mentenanță"] = (categories["Mentenanță"] || 0) + totalMaintenance;

  const totalExpense = rawExpense + totalSalaries + totalOpCosts + totalMaintenance;

  // Monthly stats
  const statsByMonth: Record<string, { income: number, expense: number }> = {};
  transactions.forEach((t: any) => {
    const month = formatMonthYear(t.date);
    if (!statsByMonth[month]) statsByMonth[month] = { income: 0, expense: 0 };
    if (t.type === 'income') statsByMonth[month].income += Number(t.amount);
    else statsByMonth[month].expense += Number(t.amount);
  });

  return {
    totalIncome: rawIncome,
    totalExpense,
    profit: rawIncome - totalExpense,
    categories,
    statsByMonth
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

export async function addFinancialTransaction(data: {
  type: "income" | "expense";
  category: string;
  amount: number;
  description: string;
  date?: Date;
}) {
  const orgId = await getUserOrganization();
  if (!orgId) throw new Error("Neautorizat");

  const transaction = await prisma.financialTransaction.create({
    data: {
      orgId: orgId as string,
      type: data.type,
      category: data.category,
      amount: data.amount,
      description: data.description,
      date: data.date || new Date()
    }
  });

  const { revalidatePath } = await import("next/cache");
  revalidatePath("/financiar");
  return JSON.parse(JSON.stringify(transaction));
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
export async function getCropFinancialReport() {
  const orgId = await getUserOrganization();
  if (!orgId) return [];

  // 1. Get all crop plans (historically) with their seasons and associated parcels
  const cropPlans = await prisma.cropPlan.findMany({
    where: { 
      season: { orgId: orgId as string },
      status: "harvested"
    },
    include: {
      season: true,
      parcel: {
        include: {
          operationParcels: {
            include: {
              operation: {
                include: { resources: true }
              }
            }
          }
        }
      }
    }
  });

  // 2. Group by cropType and season
  const report: Record<string, { 
    cropType: string, 
    seasonName: string, 
    totalAreaHa: number, 
    totalExpenses: number, 
    totalRevenue: number, 
    totalYield: number,
    plansCount: number 
  }> = {};

  cropPlans.forEach((plan: any) => {
    const key = `${plan.cropType}-${plan.season.name}`;
    if (!report[key]) {
      report[key] = {
        cropType: plan.cropType,
        seasonName: plan.season.name,
        totalAreaHa: 0,
        totalExpenses: 0,
        totalRevenue: 0,
        totalYield: 0,
        plansCount: 0
      };
    }

    const area = Number(plan.sownAreaHa) || Number(plan.parcel.areaHa);
    const yieldT = Number(plan.actualYieldTha || 0) * area;
    const price = Number(plan.harvestPricePerUnit || 0);

    report[key].totalAreaHa += area;
    report[key].totalYield += yieldT;
    report[key].totalRevenue += yieldT * price;
    report[key].plansCount += 1;

    // Calculate expenses for this specific parcel during this season
    const seasonStart = new Date(plan.season.startDate);
    const seasonEnd = new Date(plan.season.endDate);

    plan.parcel.operationParcels.forEach((opParcel: any) => {
      const opDate = new Date(opParcel.operation.date);
      if (opDate >= seasonStart && opDate <= seasonEnd) {
        // Prorate operation costs to this parcel
        const opTotalArea = Number(opParcel.operation.totalAreaHa);
        const share = Number(opParcel.operatedAreaHa) / opTotalArea;

        opParcel.operation.resources.forEach((res: any) => {
          const resQty = res.totalConsumed ? Number(res.totalConsumed) : (Number(res.quantityPerHa) * opTotalArea);
          report[key].totalExpenses += (resQty * share * Number(res.pricePerUnit));
        });
      }
    });
  });

  return Object.values(report).sort((a, b) => b.seasonName.localeCompare(a.seasonName));
}
