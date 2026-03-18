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

const safeNum = (v: any) => {
  const n = parseFloat(v);
  return isNaN(n) ? 0 : Number(n.toFixed(2));
};

function serializeOperation(op: any) {
  if (!op) return null;
  return {
    ...op,
    totalAreaHa: op.totalAreaHa ? Number(op.totalAreaHa) : 0,
    yieldPerHa: op.yieldPerHa ? Number(op.yieldPerHa) : undefined,
    totalYield: op.totalYield ? Number(op.totalYield) : undefined,
    parcels: (op.parcels || []).map((p: any) => ({
      ...p,
      operatedAreaHa: p.operatedAreaHa ? Number(p.operatedAreaHa) : 0,
      parcel: p.parcel ? {
        ...p.parcel,
        areaHa: p.parcel.areaHa ? Number(p.parcel.areaHa) : 0
      } : undefined
    })),
    resources: (op.resources || []).map((r: any) => ({
      ...r,
      quantityPerHa: r.quantityPerHa ? Number(r.quantityPerHa) : 0,
      pricePerUnit: r.pricePerUnit ? Number(r.pricePerUnit) : 0,
      totalConsumed: r.totalConsumed ? Number(r.totalConsumed) : null
    }))
  };
}

function serializeResource(res: any) {
  if (!res) return null;
  return {
    ...res,
    quantityPerHa: res.quantityPerHa ? Number(res.quantityPerHa) : 0,
    pricePerUnit: res.pricePerUnit ? Number(res.pricePerUnit) : 0,
    totalConsumed: res.totalConsumed ? Number(res.totalConsumed) : null
  };
}

export async function createOperation(data: any) {
  const orgId = await getUserOrganization();
  if (!orgId) throw new Error("Neautorizat");

  const totalAreaHa = Number(data.parcels.reduce((sum: number, p: any) => sum + Number(p.operatedAreaHa || 0), 0).toFixed(2));

  const op = await prisma.$transaction(async (tx) => {
    // 1. Creăm operațiunea
    const operation = await (tx as any).agriculturalOperation.create({
      data: {
        orgId: orgId as string,
        name: data.name,
        type: data.type || null,
        date: new Date(data.date),
        notes: data.notes || "",
        totalAreaHa,
        status: "completed",
        yieldPerHa: data.yieldPerHa ? Number(Number(data.yieldPerHa).toFixed(2)) : null,
        totalYield: data.totalYield ? Number(Number(data.totalYield).toFixed(2)) : null,
        parcels: {
          create: Array.from(new Map(data.parcels.map((p: any) => [p.parcelId, p])).values()).map((p: any) => ({
            parcelId: p.parcelId,
            operatedAreaHa: safeNum(p.operatedAreaHa)
          }))
        },
        resources: {
          create: data.resources.map((r: any) => ({
            inventoryItemId: (r.inventoryItemId && r.inventoryItemId !== "") ? r.inventoryItemId : null,
            name: r.name,
            type: r.type,
            quantityPerHa: Number(Number(r.quantityPerHa || 0).toFixed(2)),
            unit: r.unit,
            pricePerUnit: Number(Number(r.pricePerUnit || 0).toFixed(2)),
          }))
        }
      },
      include: {
        parcels: { include: { parcel: true } },
        resources: true
      }
    });

    // 2. FIFO - Scădem din loturi consumul de resurse
    let totalMaterialsCost = 0;
    for (const r of data.resources) {
      if (r.inventoryItemId && r.inventoryItemId !== "") {
        const totalQtyNeeded = Number(r.quantityPerHa) * totalAreaHa;
        let remainingToDeduct = totalQtyNeeded;

        // Găsim loturile disponibile pentru acest produs (FIFO: cele mai vechi primele)
        const lots = await (tx as any).inventoryLot.findMany({
          where: { inventoryItemId: r.inventoryItemId, quantity: { gt: 0 } },
          orderBy: { purchaseDate: 'asc' }
        });

        for (const lot of lots) {
          if (remainingToDeduct <= 0) break;

          const deductFromLot = Math.min(Number(lot.quantity), remainingToDeduct);
          
          // Actualizăm lotul
          await (tx as any).inventoryLot.update({
            where: { id: lot.id },
            data: { quantity: { decrement: deductFromLot } }
          });

          // Înregistrăm tranzacția de consum
          await (tx as any).inventoryTransaction.create({
            data: {
              inventoryLotId: lot.id,
              type: "consumption",
              quantity: deductFromLot,
              referenceId: operation.id,
              description: `Consum lucrare: ${data.name}`
            }
          });

          totalMaterialsCost += deductFromLot * Number(lot.pricePerUnit);
          remainingToDeduct -= deductFromLot;
        }

        // Actualizăm stocul total în InventoryItem
        await tx.inventoryItem.update({
          where: { id: r.inventoryItemId },
          data: { stockQuantity: { decrement: totalQtyNeeded } }
        });

        if (remainingToDeduct > 0) {
          console.warn(`Stoc insuficient pentru ${r.name}. Diferență neacoperită: ${remainingToDeduct}`);
        }
      } else {
        // Dacă nu e din inventar, folosim prețul introdus manual
        totalMaterialsCost += Number((Number(r.quantityPerHa) * totalAreaHa * Number(r.pricePerUnit)).toFixed(2));
      }
    }

    // 3. Dacă este operațiune de recoltare, adăugăm automat în magazie (Producție Fermă)
    if (data.type === "recoltat" || data.name.toLowerCase().includes("recolt")) {
      const cropName = data.cropName || "Recoltă nespecificată";
      const totalYield = data.totalYield || 0; 
      const parcelsList = (operation as any).parcels.map((p: any) => p.parcel?.name || "Parcela").join(", ");

      if (totalYield > 0) {
        let harvestItem = await (tx as any).inventoryItem.findFirst({
          where: { orgId: orgId as string, name: cropName, category: "recolta" }
        });

        if (!harvestItem) {
          harvestItem = await (tx as any).inventoryItem.create({
            data: {
              orgId: orgId as string,
              name: cropName,
              category: "recolta",
              unit: data.unit || "Tone",
              stockQuantity: 0,
              pricePerUnit: 0,
              cropType: cropName
            }
          });
        }

        const productionLot = await (tx as any).inventoryLot.create({
          data: {
            inventoryItemId: harvestItem.id,
            quantity: totalYield,
            initialQuantity: totalYield,
            pricePerUnit: 0,
            source: "harvest",
            notes: `Recoltat de pe: ${parcelsList}`
          }
        });

        await (tx as any).inventoryTransaction.create({
          data: {
            inventoryLotId: productionLot.id,
            type: "intake",
            quantity: totalYield,
            referenceId: operation.id,
            description: `Recoltă Parcele: ${parcelsList}`
          }
        });

        await (tx as any).inventoryItem.update({
          where: { id: harvestItem.id },
          data: { stockQuantity: { increment: totalYield } }
        });
      }
    }

    // 4. Automatizare Semănat -> Creare Campanie & Plan Culturi
    await triggerSowingAutomation(tx, orgId as string, data);
    
    // 5. Automatizare Recoltat -> Update Plan Culturi Status
    await triggerHarvestAutomation(tx, orgId as string, data);

    // 6. Înregistrăm tranzacția financiară pentru costurile de materiale
    if (totalMaterialsCost > 0) {
      await tx.financialTransaction.create({
        data: {
          orgId: orgId as string,
          type: "expense",
          category: "operation",
          amount: totalMaterialsCost,
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
  revalidatePath("/stocuri");
  
  return serializeOperation(op);
}

export async function updateOperation(operationId: string, data: any) {
  const orgId = await getUserOrganization();
  if (!orgId) throw new Error("Neautorizat");

  const totalAreaHa = Number((data.parcels.reduce((sum: number, p: any) => sum + Number(p.operatedAreaHa || 0), 0) || 0).toFixed(2));

  try {
    const finalResult = await prisma.$transaction(async (tx) => {
      const _tx = tx as any;
      
      // 1. Fetch old operation
      const oldOp = await _tx.agriculturalOperation.findUnique({
        where: { id: operationId },
        include: { resources: true }
      });
      
      if (!oldOp || oldOp.orgId !== orgId) throw new Error("Operațiunea nu a fost găsită.");

      // 2. Revert inventory (FIFO logic is not fully reversible without tracking lot specific deductions, so we increment the global stock)
      for (const r of oldOp.resources) {
        if (r.inventoryItemId && r.inventoryItemId !== "") {
          const consumed = r.totalConsumed ? Number(r.totalConsumed) : (Number(r.quantityPerHa || 0) * Number(oldOp.totalAreaHa || 0));
          await _tx.inventoryItem.update({
            where: { id: r.inventoryItemId },
            data: { stockQuantity: { increment: consumed } }
          });
        }
      }

      // 3. Clear existing relations and finance
      await _tx.financialTransaction.deleteMany({ where: { referenceId: operationId, category: "operation" } });
      await _tx.operationParcel.deleteMany({ where: { operationId } });
      await _tx.operationResource.deleteMany({ where: { operationId } });

      // 4. Update the basic operation record
      const updateData: any = {
        name: data.name,
        type: data.type || null,
        date: new Date(data.date),
        notes: data.notes || "",
        totalAreaHa: safeNum(totalAreaHa),
        yieldPerHa: data.yieldPerHa ? Number(Number(data.yieldPerHa).toFixed(2)) : null,
        totalYield: data.totalYield ? Number(Number(data.totalYield).toFixed(2)) : null,
      };

      const updated = await _tx.agriculturalOperation.update({
        where: { id: operationId },
        data: updateData
      });

      // 5. Create new relations manually
      for (const p of data.parcels) {
        await _tx.operationParcel.create({
          data: {
            operationId: updated.id,
            parcelId: p.parcelId,
            operatedAreaHa: safeNum(p.operatedAreaHa)
          }
        });
      }

      let totalCost = 0;
      for (const r of data.resources) {
        const consumedQty = Number(((r.totalConsumed !== undefined && r.totalConsumed !== null) ? safeNum(r.totalConsumed) : (safeNum(r.quantityPerHa) * totalAreaHa)).toFixed(2));
        const cost = Number((consumedQty * safeNum(r.pricePerUnit)).toFixed(2));
        totalCost += cost;

        await _tx.operationResource.create({
          data: {
            operationId: updated.id,
            inventoryItemId: (r.inventoryItemId && r.inventoryItemId !== "") ? r.inventoryItemId : null,
            name: r.name,
            type: r.type,
            quantityPerHa: safeNum(r.quantityPerHa),
            unit: r.unit,
            pricePerUnit: safeNum(r.pricePerUnit),
            totalConsumed: (r.totalConsumed !== undefined && r.totalConsumed !== null) ? safeNum(r.totalConsumed) : null
          }
        });

        if (r.inventoryItemId && r.inventoryItemId !== "") {
          await _tx.inventoryItem.update({
            where: { id: r.inventoryItemId },
            data: { stockQuantity: { decrement: consumedQty } }
          });
        }
      }

      // 6. Finance and Automation
      if (totalCost > 0) {
        await _tx.financialTransaction.create({
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

      await triggerSowingAutomation(tx, orgId as string, data);
      await triggerHarvestAutomation(tx, orgId as string, data);

      // Return the full updated object
      return await _tx.agriculturalOperation.findUnique({
        where: { id: updated.id },
        include: {
          parcels: { include: { parcel: true } },
          resources: true
        }
      });
    });

    revalidatePath("/operatiuni");
    revalidatePath("/dashboard");
    revalidatePath("/financiar");
    revalidatePath("/campanii");

    return serializeOperation(finalResult);
  } catch (err: any) {
    console.error("FATAL updateOperation:", err);
    throw err;
  }
}

export async function updateResourceConsumed(resourceId: string, newTotal: number) {
  const orgId = await getUserOrganization();
  if (!orgId) throw new Error("Neautorizat");

  const updated = await prisma.$transaction(async (tx) => {
    const resource = await tx.operationResource.findUnique({
      where: { id: resourceId },
      include: { operation: true }
    });

    if (!resource || resource.operation.orgId !== orgId) throw new Error("Resursa nu a fost găsită.");

    const prevTotal = resource.totalConsumed 
      ? Number(resource.totalConsumed) 
      : Number(resource.quantityPerHa) * Number(resource.operation.totalAreaHa);

    const diff = newTotal - prevTotal;

    const resUpdated = await tx.operationResource.update({
      where: { id: resourceId },
      data: { totalConsumed: newTotal }
    });

    if (resource.inventoryItemId) {
      await tx.inventoryItem.update({
        where: { id: resource.inventoryItemId },
        data: {
          stockQuantity: { decrement: diff } 
        }
      });
    }

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
  return serializeResource(updated);
}

async function triggerSowingAutomation(tx: any, orgId: string, data: any) {
  const _tx = tx as any;
  const isSowing = data.type === "semanat" || 
                   data.name.toLowerCase().includes("semanat") || 
                   data.name.toLowerCase().includes("semănat");

  if (!isSowing) return;

  let cropName = data.cropName && data.cropName !== "Toate" ? data.cropName : null;
  
  if (!cropName) {
    const seedRes = data.resources.find((r: any) => r.type === "samanta");
    if (seedRes) {
      cropName = seedRes.name.replace(/sămânță|samanta|semănat/gi, "").trim();
    }
  }
  cropName = cropName || "Cultură Nespecificată";

  let activeSeason = await _tx.season.findFirst({
    where: { orgId, isActive: true }
  });

  if (!activeSeason) {
    const year = new Date(data.date).getFullYear();
    activeSeason = await _tx.season.create({
      data: {
        orgId,
        name: `Campanie Automată ${year}`,
        startDate: new Date(`${year}-01-01`),
        endDate: new Date(`${year}-12-31`),
        isActive: true
      }
    });
  }

  for (const p of data.parcels) {
    const existingPlan = await _tx.cropPlan.findFirst({
      where: {
        seasonId: activeSeason.id,
        parcelId: p.parcelId
      }
    });

    if (existingPlan) {
      await _tx.cropPlan.update({
        where: { id: existingPlan.id },
        data: {
          cropType: cropName,
          status: "sown",
          sownDate: new Date(data.date),
          sownAreaHa: Number(Number(p.operatedAreaHa).toFixed(2))
        }
      });
    } else {
      await _tx.cropPlan.create({
        data: {
          seasonId: activeSeason.id,
          parcelId: p.parcelId,
          cropType: cropName,
          status: "sown",
          sownDate: new Date(data.date),
          sownAreaHa: Number(Number(p.operatedAreaHa).toFixed(2))
        }
      });
    }
  }
}

async function triggerHarvestAutomation(tx: any, orgId: string, data: any) {
  const _tx = tx as any;
  const isHarvest = data.type === "recoltat" || 
                    data.name.toLowerCase().includes("recoltat") || 
                    data.name.toLowerCase().includes("recoltă");

  if (!isHarvest) return;

  // Găsim sezonul activ
  let activeSeason = await _tx.season.findFirst({
    where: { orgId, isActive: true }
  });

  if (!activeSeason) return;

  for (const p of data.parcels) {
    // Căutăm planul activ pentru această parcelă în acest sezon care nu e deja recoltat
    const existingPlan = await _tx.cropPlan.findFirst({
      where: {
        seasonId: activeSeason.id,
        parcelId: p.parcelId,
        status: { in: ["sown", "growing", "planned"] }
      }
    });

    if (existingPlan) {
      await _tx.cropPlan.update({
        where: { id: existingPlan.id },
        data: {
          status: "harvested"
        }
      });
    }
  }
}
