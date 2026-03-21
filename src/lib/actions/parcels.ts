"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { cache } from "react";
import { getCurrentUser } from "./profile";

export const getUserOrganization = cache(async () => {
  const dbUser = await getCurrentUser();

  if (!dbUser) {
    throw new Error("Neautorizat. Te rugăm să te autentifici.");
  }

  // DACĂ E SUPERADMIN, NU ARE VOIE SĂ AIBĂ ORG
  if (dbUser.role === "superadmin") {
    if (dbUser.orgId) {
      await prisma.user.update({
        where: { id: dbUser.id },
        data: { orgId: null }
      });
    }
    return null;
  }

  let orgId = dbUser.orgId;

  // Dacă user-ul nu are organizație, în mod normal trebuie să parcurgă onboarding-ul.
  if (!orgId) {
    throw new Error("Fără organizație. Te rugăm să finalizezi configurarea fermei.");
  }

  return orgId;
});

export async function getParcels() {
  const orgId = await getUserOrganization();
  
  const parcels = await prisma.parcel.findMany({
    where: { orgId: orgId as string },
    orderBy: { createdAt: 'desc' },
    include: {
      cropPlans: {
        where: { status: { not: "harvested" } },
        take: 1,
      }
    }
  });

  return JSON.parse(JSON.stringify(parcels));
}

export async function getParcelGroups() {
  const orgId = await getUserOrganization();
  if (!orgId) return [];

  const groups = await prisma.parcelGroup.findMany({
    where: { orgId: orgId as string },
    orderBy: { name: 'asc' }
  });

  return JSON.parse(JSON.stringify(groups));
}

export async function createParcelGroup(name: string, color?: string) {
  const orgId = await getUserOrganization();
  if (!orgId) throw new Error("Neautorizat");

  const group = await prisma.parcelGroup.create({
    data: {
      orgId: orgId as string,
      name,
      color: color || "#3b82f6"
    }
  });

  revalidatePath("/dashboard/parcele");
  return JSON.parse(JSON.stringify(group));
}

export async function updateParcelGroup(id: string, name: string, color?: string) {
  const orgId = await getUserOrganization();
  if (!orgId) throw new Error("Neautorizat");

  await prisma.parcelGroup.update({
    where: { id, orgId: orgId as string },
    data: { name, color }
  });

  revalidatePath("/dashboard/parcele");
}

export async function deleteParcelGroup(id: string) {
  const orgId = await getUserOrganization();
  if (!orgId) throw new Error("Neautorizat");

  // Move parcels back to no group before deleting
  await prisma.parcel.updateMany({
    where: { groupId: id, orgId: orgId as string },
    data: { groupId: null }
  });

  await prisma.parcelGroup.delete({
    where: { id, orgId: orgId as string }
  });

  revalidatePath("/dashboard/parcele");
}

export async function createParcel(formData: FormData) {
  const orgId = await getUserOrganization();

  const name = formData.get("name") as string;
  const cadastralCode = formData.get("cadastralCode") as string;
  const areaHa = parseFloat(formData.get("areaHa") as string);
  const soilType = formData.get("soilType") as string;
  const landUse = formData.get("landUse") as string;
  const ownership = formData.get("ownership") as string;
  const groupId = formData.get("groupId") as string;
  const coordinatesStr = formData.get("coordinates") as string;
  
  // Cadastral data
  const uat = formData.get("uat") as string;
  const cadastralNumber = formData.get("cadastralNumber") as string;
  const cfNumber = formData.get("cfNumber") as string;

  if (!name || isNaN(areaHa)) {
    throw new Error("Date invalide pentru parcelă");
  }

  let coordinates = null;
  if (coordinatesStr) {
    try {
      coordinates = JSON.parse(coordinatesStr);
    } catch (e) {
      console.error("Coordonate JSON invalide", e);
    }
  }

  // Folosire 'as any' la data dacă Prisma client nu s-a actualizat intern
  await prisma.parcel.create({
    data: {
      orgId: orgId as string,
      name,
      cadastralCode,
      areaHa,
      soilType,
      landUse,
      ownership,
      groupId: groupId || undefined,
      uat,
      cadastralNumber,
      cfNumber,
      coordinates: coordinates ? coordinates : undefined,
    } as any,
  });

  revalidatePath("/dashboard/parcele");
  revalidatePath("/dashboard");
}

export async function getParcelDetails(id: string) {
  const orgId = await getUserOrganization();
  if (!orgId) throw new Error("Neautorizat");

  const parcel = await prisma.parcel.findUnique({
    where: { id, orgId: orgId as string },
    include: {
      cropPlans: {
        include: { season: true },
        orderBy: { season: { startDate: "desc" } }
      },
      operationParcels: {
        include: {
          operation: {
            include: { resources: true }
          }
        },
        orderBy: { operation: { date: "desc" } }
      }
    }
  });

  if (!parcel) throw new Error("Parcela nu a fost găsită.");

  // Calculate some aggregate stats
  const totalOperations = parcel.operationParcels.length;
  const currentPlan = parcel.cropPlans.find(cp => cp.status !== "harvested");
  
  // Prorated costs
  let totalCost = 0;
  parcel.operationParcels.forEach(opParcel => {
    const totalOpArea = Number(opParcel.operation.totalAreaHa);
    const parcelArea = Number(opParcel.operatedAreaHa);
    const share = parcelArea / totalOpArea;
    
    opParcel.operation.resources.forEach(res => {
      const qty = res.totalConsumed ? Number(res.totalConsumed) : (Number(res.quantityPerHa) * totalOpArea);
      totalCost += (qty * share * Number(res.pricePerUnit));
    });
  });

  return JSON.parse(JSON.stringify({
    ...parcel,
    stats: {
      totalOperations,
      totalCost,
      currentPlan
    }
  }));
}

export async function updateParcel(id: string, data: { 
  name?: string, 
  cadastralCode?: string, 
  areaHa?: number, 
  soilType?: string, 
  landUse?: string, 
  ownership?: string,
  groupId?: string | null,
  uat?: string,
  cadastralNumber?: string,
  cfNumber?: string
}) {
  const orgId = await getUserOrganization();
  if (!orgId) throw new Error("Neautorizat");

  await prisma.parcel.update({
    where: { id, orgId: orgId as string },
    data: data as any
  });

  revalidatePath("/dashboard/parcele");
  revalidatePath("/dashboard");
  revalidatePath(`/parcele/${id}`);
}
export async function updateCropPlanPrice(planId: string, price: number) {
  const orgId = await getUserOrganization();
  if (!orgId) throw new Error("Neautorizat");

  await prisma.cropPlan.update({
    where: { id: planId },
    data: { harvestPricePerUnit: price }
  });

  revalidatePath("/financiar");
  // Get parcel ID to revalidate its detail page
  const plan = await prisma.cropPlan.findUnique({
    where: { id: planId },
    select: { parcelId: true }
  });
  if (plan) revalidatePath(`/parcele/${plan.parcelId}`);
}

export async function deleteParcel(id: string) {
  const orgId = await getUserOrganization();
  if (!orgId) throw new Error("Neautorizat");

  // Verificăm dacă parcela aparține organizației
  const parcel = await prisma.parcel.findUnique({
    where: { id, orgId: orgId as string }
  });

  if (!parcel) {
    throw new Error("Parcela nu a fost găsită sau nu ai permisiunea de a o șterge.");
  }

  // Ștergem parcela (Prisma va șterge cascade dacă e setat, dar în schema.prisma 
  // am văzut onDelete: Restrict la CropPlan și OperationParcel, deci trebuie să fim atenți)
  // De fapt, în schema.prisma:
  // CropPlan -> parcel: onDelete: Restrict
  // OperationParcel -> parcel: onDelete: Restrict
  // Deci trebuie să ștergem manual dependențele sau să informăm utilizatorul.
  // Totuși, de obicei vrem să ștergem tot ce ține de parcelă dacă o ștergem.
  
  // Să verificăm dacă are dependențe
  const dependencies = await prisma.parcel.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          cropPlans: true,
          operationParcels: true,
          leaseContracts: true,
        }
      }
    }
  });

  if (dependencies && (dependencies._count.cropPlans > 0 || dependencies._count.operationParcels > 0)) {
    throw new Error("Nu poți șterge o parcelă care are planuri de cultură sau operațiuni asociate. Șterge mai întâi acele date.");
  }

  await prisma.parcel.delete({
    where: { id, orgId: orgId as string }
  });

  revalidatePath("/dashboard/parcele");
  revalidatePath("/dashboard");
  return { success: true };
}


export async function bulkUpdateParcels(ids: string[], data: any) {
  const orgId = await getUserOrganization();
  if (!orgId) throw new Error('Neautorizat');

  await prisma.parcel.updateMany({
    where: {
      id: { in: ids },
      orgId: orgId as string
    },
    data: data as any
  });

  revalidatePath('/dashboard/parcele');
  revalidatePath('/dashboard');
}
