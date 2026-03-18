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
  rcaExpiry?: string;
  itpExpiry?: string;
  cascoExpiry?: string;
  rovinietaExpiry?: string;
}) {
  const orgId = await getUserOrganization();
  if (!orgId) throw new Error("Neautorizat");

  const { rcaExpiry, itpExpiry, cascoExpiry, rovinietaExpiry, ...rest } = data;

  await (prisma as any).vehicle.create({
    data: {
      orgId: orgId as string,
      ...rest,
      rcaExpiry: rcaExpiry ? new Date(rcaExpiry) : null,
      itpExpiry: itpExpiry ? new Date(itpExpiry) : null,
      cascoExpiry: cascoExpiry ? new Date(cascoExpiry) : null,
      rovinietaExpiry: rovinietaExpiry ? new Date(rovinietaExpiry) : null,
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
  expiryDate?: string;
}) {
  const orgId = await getUserOrganization();
  if (!orgId) throw new Error("Neautorizat");

  const vehicle = await (prisma as any).vehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle || vehicle.orgId !== orgId) throw new Error("Vehicul invalid");

  // Create the maintenance record
  const log = await (prisma as any).vehicleMaintenance.create({
    data: {
      vehicleId,
      type: data.type,
      date: new Date(data.date),
      cost: data.cost || 0,
      details: data.details,
      documentUrl: data.documentUrl
    }
  });

  // Create a Financial Transaction automatically
  if (data.cost && data.cost > 0) {
    await (prisma as any).financialTransaction.create({
      data: {
        orgId: orgId as string,
        type: "expense",
        category: "maintenance",
        amount: data.cost,
        date: new Date(data.date),
        description: `Mentenanță ${vehicle.name}: ${data.type.replace('_', ' ')} ${data.details ? `- ${data.details}` : ''}`,
        referenceId: vehicleId
      }
    });
  }

  // Update vehicle expiry date if applicable
  if (data.expiryDate) {
    const expiryUpdate: any = {};
    if (data.type === "insurance_rca") expiryUpdate.rcaExpiry = new Date(data.expiryDate);
    if (data.type === "insurance_casco") expiryUpdate.cascoExpiry = new Date(data.expiryDate);
    if (data.type === "itp") expiryUpdate.itpExpiry = new Date(data.expiryDate);
    if (data.type === "other" && data.details?.toLowerCase().includes("rovinieta")) expiryUpdate.rovinietaExpiry = new Date(data.expiryDate);
    
    // We can also infer from type if user doesn't use "other" for rovinieta
    // Adding a dedicated case for rovinieta if we add it to types later
    
    if (Object.keys(expiryUpdate).length > 0) {
      await (prisma as any).vehicle.update({
        where: { id: vehicleId },
        data: expiryUpdate
      });
    }
  }

  revalidatePath("/utilaje");
  revalidatePath("/financiar");
}

export async function removeVehicle(vehicleId: string) {
  const orgId = await getUserOrganization();
  if (!orgId) throw new Error("Neautorizat");

  await (prisma as any).vehicle.delete({
    where: { id: vehicleId, orgId: orgId as string }
  });

  revalidatePath("/utilaje");
}

export async function updateVehicle(id: string, data: {
  name?: string;
  type?: string;
  brand?: string;
  model?: string;
  year?: number;
  vin?: string;
  licensePlate?: string;
  notes?: string;
  rcaExpiry?: string;
  itpExpiry?: string;
  cascoExpiry?: string;
  rovinietaExpiry?: string;
}) {
  const orgId = await getUserOrganization();
  if (!orgId) throw new Error("Neautorizat");

  const { rcaExpiry, itpExpiry, cascoExpiry, rovinietaExpiry, ...rest } = data;

  await (prisma as any).vehicle.update({
    where: { id, orgId: orgId as string },
    data: {
      ...rest,
      rcaExpiry: rcaExpiry ? new Date(rcaExpiry) : undefined,
      itpExpiry: itpExpiry ? new Date(itpExpiry) : undefined,
      cascoExpiry: cascoExpiry ? new Date(cascoExpiry) : undefined,
      rovinietaExpiry: rovinietaExpiry ? new Date(rovinietaExpiry) : undefined,
    }
  });

  revalidatePath("/utilaje");
}
