"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getUserOrganization } from "./parcels";
import { Prisma } from "@prisma/client";

// -------------------------------------------------------------
// SEZOANE (Campanii Agricole)
// -------------------------------------------------------------

export async function getSeasons() {
  const orgId = await getUserOrganization();
  const seasons = await prisma.season.findMany({
    where: { orgId: orgId as string },
    orderBy: { startDate: "desc" },
    include: {
      _count: { select: { cropPlans: true } }
    }
  });

  return JSON.parse(JSON.stringify(seasons));
}

export async function createSeason(data: { name: string; startDate: string; endDate: string }) {
  const orgId = await getUserOrganization();

  // Dacă e primul sezon, îl facem activ default
  const existingCount = await prisma.season.count({
    where: { orgId: orgId as string }
  });

  const season = await prisma.season.create({
    data: {
      orgId: orgId as string,
      name: data.name,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      isActive: existingCount === 0 
    }
  });

  revalidatePath("/campanii");
  revalidatePath("/dashboard");
  return season;
}

export async function setActiveSeason(seasonId: string) {
  const orgId = await getUserOrganization();
  
  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // Dezactivam toate
    await tx.season.updateMany({
      where: { orgId: orgId as string },
      data: { isActive: false }
    });
    // Activam cel dorit
    await tx.season.update({
      where: { id: seasonId, orgId: orgId as string },
      data: { isActive: true }
    });
  });

  revalidatePath("/campanii");
  revalidatePath("/dashboard");
}

export async function deleteSeason(seasonId: string) {
  const orgId = await getUserOrganization();
  await prisma.season.delete({
    where: { id: seasonId, orgId: orgId as string }
  });
  revalidatePath("/campanii");
}

// -------------------------------------------------------------
// PLAN DE CULTURI (Alocare Parcele -> Campanie)
// -------------------------------------------------------------

export async function getCropPlans(seasonId: string) {
  const orgId = await getUserOrganization();
  
  // Verifică că sezonul ii apartine
  const season = await prisma.season.findUnique({ where: { id: seasonId, orgId: orgId as string }});
  if (!season) throw new Error("Neautorizat");

  const plans = await prisma.cropPlan.findMany({
    where: { seasonId },
    include: { 
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
    },
    orderBy: { parcel: { name: "asc" } }
  });

  return JSON.parse(JSON.stringify(plans));
}

export async function getCropGroupStats(seasonId: string, cropType: string) {
  const orgId = await getUserOrganization();
  
  const season = await prisma.season.findUnique({ 
    where: { id: seasonId, orgId: orgId as string }
  });
  if (!season) throw new Error("Sezon negăsit");

  const plans = await prisma.cropPlan.findMany({
    where: { seasonId, cropType },
    include: {
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

  let totalArea = 0;
  let totalCost = 0;
  let totalYield = 0;
  const parcelIds: string[] = [];

  const seasonStart = new Date(season.startDate);
  const seasonEnd = new Date(season.endDate);

  plans.forEach(plan => {
    const area = Number(plan.sownAreaHa);
    totalArea += area;
    totalYield += Number(plan.actualYieldTha || 0) * area;
    parcelIds.push(plan.parcelId);

    // Calculate costs for this parcel during this season
    plan.parcel.operationParcels.forEach(opParcel => {
      const opDate = new Date(opParcel.operation.date);
      if (opDate >= seasonStart && opDate <= seasonEnd) {
        const opTotalArea = Number(opParcel.operation.totalAreaHa);
        const share = Number(opParcel.operatedAreaHa) / opTotalArea;

        opParcel.operation.resources.forEach(res => {
          const resQty = res.totalConsumed ? Number(res.totalConsumed) : (Number(res.quantityPerHa) * opTotalArea);
          totalCost += (resQty * share * Number(res.pricePerUnit));
        });
      }
    });
  });

  return {
    cropType,
    totalArea,
    totalCost: Math.round(totalCost * 100) / 100,
    totalYield,
    avgYieldTha: totalArea > 0 ? totalYield / totalArea : 0,
    parcelCount: plans.length,
    status: plans.every(p => p.status === "harvested") ? "harvested" : "active"
  };
}

export async function allocateParcelsToCrop(data: {
  seasonId: string;
  parcelIds: string[];
  cropType: string;
  variety?: string;
  inventoryItemId?: string;
}) {
  const orgId = await getUserOrganization();

  await prisma.$transaction(async (tx) => {
    for (const pId of data.parcelIds) {
      const parcel = await tx.parcel.findUnique({
        where: { id: pId }
      });

      if (!parcel || parcel.orgId !== (orgId as string)) continue;

      const existingPlan = await tx.cropPlan.findFirst({
        where: {
          seasonId: data.seasonId,
          parcelId: pId,
        }
      });

      if (existingPlan) {
        await tx.cropPlan.update({
          where: { id: existingPlan.id },
          data: {
            status: existingPlan.status === "harvested" ? "planned" : existingPlan.status, // Reset to planned if it was harvested or keep current status
            cropType: data.cropType,
            variety: data.variety || null,
            sownAreaHa: parcel.areaHa,
          }
        });
      } else {
        await tx.cropPlan.create({
          data: {
            seasonId: data.seasonId,
            parcelId: pId,
            cropType: data.cropType,
            variety: data.variety || null,
            sownAreaHa: parcel.areaHa,
            status: "planned"
          }
        });
      }

      if (data.inventoryItemId) {
        const item = await tx.inventoryItem.findUnique({
          where: { id: data.inventoryItemId }
        });

        if (item) {
          await tx.financialTransaction.create({
            data: {
              orgId: orgId as string,
              type: "expense",
              category: "operation",
              amount: 0,
              description: `Sămânță ${data.cropType} utilizată din stoc (${item.name}) pe parcela ${parcel.name}`,
              referenceId: pId
            }
          });
        }
      }
    }
  });

  revalidatePath("/campanii");
  revalidatePath("/dashboard/parcele");
}

export async function removeCropPlan(planId: string) {
  await prisma.cropPlan.delete({ where: { id: planId }});
  revalidatePath("/campanii");
}

// -------------------------------------------------------------
// RECOLTARE — Închidere Plan de Cultură
// -------------------------------------------------------------

export async function harvestCropPlan(planId: string, actualYieldTha: number) {
  const orgId = await getUserOrganization();

  // Verificăm că planul face parte dintr-un sezon al organizației
  const plan = await prisma.cropPlan.findUnique({
    where: { id: planId },
    include: { season: true, parcel: true }
  });

  if (!plan || plan.season.orgId !== (orgId as string)) {
    throw new Error("Neautorizat sau plan negăsit");
  }

  const totalYield = Number(actualYieldTha) * Number(plan.sownAreaHa);

  await prisma.$transaction(async (tx) => {
    // 1. Update Crop Plan status
    await tx.cropPlan.update({
      where: { id: planId },
      data: {
        status: "harvested",
        actualYieldTha: actualYieldTha,
      }
    });

    // 2. Add to Inventory (Recoltă)
    const existingStock = await tx.inventoryItem.findFirst({
      where: { 
        orgId: orgId as string,
        name: plan.cropType,
        category: "recolta"
      }
    });

    if (existingStock) {
      await tx.inventoryItem.update({
        where: { id: existingStock.id },
        data: {
          stockQuantity: { increment: totalYield }
        }
      });
    } else {
      await tx.inventoryItem.create({
        data: {
          orgId: orgId as string,
          name: plan.cropType,
          category: "recolta",
          stockQuantity: totalYield,
          unit: "tone",
          pricePerUnit: 0, // Va fi actualizat la vânzare sau manual
          notes: `Recolta inițială din parcela ${plan.parcel.name}`
        }
      });
    }

    // 3. Record Financial Transaction (Internal move - info only for now)
    await (tx as any).financialTransaction.create({
      data: {
        orgId: orgId as string,
        type: "income",
        category: "sale", // Sau o categorie nouă 'harvest'
        amount: 0, // Încă nu e vândut, deci valoare 0 monetară, dar record de activitate
        description: `Recoltare ${plan.cropType} pe parcela ${plan.parcel.name}: ${totalYield.toFixed(2)} tone`,
        referenceId: planId
      }
    });
  });

  revalidatePath("/campanii");
  revalidatePath("/dashboard");
}

export async function harvestCropGroup(seasonId: string, cropType: string, avgYieldTha: number) {
  const orgId = await getUserOrganization();

  const plans = await prisma.cropPlan.findMany({
    where: { 
      seasonId, 
      cropType,
      season: { orgId: orgId as string }
    },
    include: { parcel: true }
  });

  if (plans.length === 0) throw new Error("Nu există planuri pentru această cultură.");

  await prisma.$transaction(async (tx) => {
    for (const plan of plans) {
      const totalYield = Number(avgYieldTha) * Number(plan.sownAreaHa);

      // 1. Update Crop Plan status
      await tx.cropPlan.update({
        where: { id: plan.id },
        data: {
          status: "harvested",
          actualYieldTha: avgYieldTha,
        }
      });

      // 2. Add to Inventory (Recoltă) - unique per crop name per org
      const existingStock = await tx.inventoryItem.findFirst({
        where: { 
          orgId: orgId as string,
          name: plan.cropType,
          category: "recolta"
        }
      });

      if (existingStock) {
        await tx.inventoryItem.update({
          where: { id: existingStock.id },
          data: {
            stockQuantity: { increment: totalYield }
          }
        });
      } else {
        await tx.inventoryItem.create({
          data: {
            orgId: orgId as string,
            name: plan.cropType,
            category: "recolta",
            stockQuantity: totalYield,
            unit: "tone",
            pricePerUnit: 0,
            notes: `Recoltă ${plan.cropType} în sezonul curent`
          }
        });
      }

      // 3. Record Financial Transaction
      await (tx as any).financialTransaction.create({
        data: {
          orgId: orgId as string,
          type: "income",
          category: "sale", 
          amount: 0,
          description: `Recoltare grupată ${plan.cropType} pe parcela ${plan.parcel.name}: ${totalYield.toFixed(2)} tone`,
          referenceId: plan.id
        }
      });
    }
  });

  revalidatePath("/campanii");
  revalidatePath("/dashboard");
}

// -------------------------------------------------------------
// RAPORT PARCELĂ — Costuri totale per parcelă per sezon
// -------------------------------------------------------------

export async function getParcelReport(parcelId: string, seasonId: string) {
  const orgId = await getUserOrganization();

  // Verificăm parcela
  const parcel = await prisma.parcel.findUnique({
    where: { id: parcelId, orgId: orgId as string },
    include: {
      cropPlans: {
        where: { seasonId },
      }
    }
  });

  if (!parcel) throw new Error("Parcelă negăsită");

  // Găsim toate lucrările efectuate pe această parcelă
  const operationParcels = await prisma.operationParcel.findMany({
    where: {
      parcelId,
      operation: { orgId: orgId as string }
    },
    include: {
      operation: {
        include: { resources: true }
      }
    }
  });

  // Calculăm costul total
  let totalCost = 0;
  const breakdown: { name: string; type: string; totalCost: number; totalConsumed: number; unit: string }[] = [];

  for (const op of operationParcels) {
    const areaHa = Number(op.operatedAreaHa);
    for (const res of op.operation.resources) {
      const consumed = res.totalConsumed
        ? Number(res.totalConsumed)
        : Number(res.quantityPerHa) * Number(op.operation.totalAreaHa);
      // Prorata: costul atribuit acestei parcele
      const parcelShare = areaHa / Number(op.operation.totalAreaHa);
      const cost = consumed * parcelShare * Number(res.pricePerUnit);
      totalCost += cost;
      breakdown.push({
        name: `${op.operation.name} — ${res.name}`,
        type: res.type,
        totalCost: Math.round(cost * 100) / 100,
        totalConsumed: Math.round(consumed * parcelShare * 100) / 100,
        unit: res.unit,
      });
    }
  }

  const cropPlan = parcel.cropPlans[0] || null;
  const areaHa = Number(parcel.areaHa);
  const costPerHa = areaHa > 0 ? totalCost / areaHa : 0;

  // History: all harvested plans for this parcel
  const history = await prisma.cropPlan.findMany({
    where: { parcelId, status: "harvested" },
    include: { season: true },
    orderBy: { season: { startDate: "desc" } }
  });

  // Fetch all operations for this parcel to filter them into history items
  const allOps = await prisma.operationParcel.findMany({
    where: { parcelId },
    include: {
      operation: {
        include: { resources: true }
      }
    },
    orderBy: { operation: { date: "desc" } }
  });

  return {
    parcelName: parcel.name,
    areaHa,
    totalCost: Math.round(totalCost * 100) / 100,
    costPerHa: Math.round(costPerHa * 100) / 100,
    cropType: cropPlan?.cropType || null,
    status: cropPlan?.status || null,
    actualYieldTha: cropPlan?.actualYieldTha ? Number(cropPlan.actualYieldTha) : null,
    estimatedYieldTha: cropPlan?.estimatedYieldTha ? Number(cropPlan.estimatedYieldTha) : null,
    breakdown,
    history: history.map(h => {
      // Filter operations that happened during this crop's season
      const relatedOps = allOps.filter(op => 
        op.operation.date >= h.season.startDate && 
        op.operation.date <= h.season.endDate
      ).map(op => ({
        id: op.operation.id,
        name: op.operation.name,
        date: op.operation.date,
        type: op.operation.type,
      }));

      return {
        id: h.id,
        seasonName: h.season.name,
        cropType: h.cropType,
        yieldTha: h.actualYieldTha ? Number(h.actualYieldTha) : 0,
        totalYield: h.actualYieldTha ? Number(h.actualYieldTha) * Number(h.sownAreaHa) : 0,
        date: h.season.startDate,
        operations: relatedOps
      };
    })
  };
}
