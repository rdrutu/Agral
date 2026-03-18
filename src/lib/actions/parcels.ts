"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function getUserOrganization() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Neautorizat. Te rugăm să te autentifici.");
  }

  // Căutăm userul în Prisma (asumăm că la crearea contului am declanșat/trigger insert,
  // sau facem upsert dacă nu există)
  let dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: { organization: true }
  });

  if (!dbUser) {
    dbUser = await prisma.user.create({
      data: {
        id: user.id,
        email: user.email || "",
      },
      include: { organization: true }
    });
  }

  // DACĂ E SUPERADMIN, NU ARE VOIE SĂ AIBĂ ORG
  if (dbUser.role === "superadmin") {
    if (dbUser.orgId) {
      await prisma.user.update({
        where: { id: user.id },
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
}

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

export async function createParcel(formData: FormData) {
  const orgId = await getUserOrganization();

  const name = formData.get("name") as string;
  const cadastralCode = formData.get("cadastralCode") as string;
  const areaHa = parseFloat(formData.get("areaHa") as string);
  const soilType = formData.get("soilType") as string;
  const landUse = formData.get("landUse") as string;
  const ownership = formData.get("ownership") as string;
  const coordinatesStr = formData.get("coordinates") as string;

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

export async function updateParcel(id: string, data: { name?: string, cadastralCode?: string, areaHa?: number, soilType?: string, landUse?: string, ownership?: string }) {
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
