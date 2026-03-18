"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getUserOrganization } from "./parcels";

export async function getVehicles() {
  const orgId = await getUserOrganization();
  if (!orgId) return [];

  const vehicles = await (prisma as any).vehicle.findMany({
    where: { orgId: orgId as string },
    orderBy: { createdAt: "desc" },
    include: {
      maintenanceLogs: {
        orderBy: { date: "desc" }
      }
    }
  });

  return vehicles.map((v: any) => ({
    ...v,
    maintenanceLogs: v.maintenanceLogs.map((m: any) => ({
      ...m,
      cost: Number(m.cost || 0)
    }))
  }));
}

export async function addVehicle(data: {
  name: string;
  type: string;
  brand?: string;
  model?: string;
  year?: number;
  vin?: string;
  licensePlate?: string;
  notes?: string;
}) {
  const orgId = await getUserOrganization();
  if (!orgId) throw new Error("Neautorizat");

  await (prisma as any).vehicle.create({
    data: {
      orgId: orgId as string,
      ...data
    }
  });

  revalidatePath("/utilaje");
}

export async function addVehicleMaintenance(vehicleId: string, data: {
  type: string;
  date: string;
  cost?: number;
  details?: string;
  documentUrl?: string;
}) {
  const orgId = await getUserOrganization();
  if (!orgId) throw new Error("Neautorizat");

  const vehicle = await (prisma as any).vehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle || vehicle.orgId !== orgId) throw new Error("Vehicul invalid");

  await (prisma as any).vehicleMaintenance.create({
    data: {
      vehicleId,
      type: data.type,
      date: new Date(data.date),
      cost: data.cost || 0,
      details: data.details,
      documentUrl: data.documentUrl
    }
  });

  revalidatePath("/utilaje");
}

export async function removeVehicle(vehicleId: string) {
  const orgId = await getUserOrganization();
  if (!orgId) throw new Error("Neautorizat");

  await (prisma as any).vehicle.delete({
    where: { id: vehicleId, orgId: orgId as string }
  });

  revalidatePath("/utilaje");
}
