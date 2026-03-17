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
