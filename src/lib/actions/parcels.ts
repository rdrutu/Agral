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
    // Dacă utilizatorul s-a conectat pentru prima dată în Supabase
    // și nu are înregistrare în Prisma
    dbUser = await prisma.user.create({
      data: {
        id: user.id,
        email: user.email || "",
      },
      include: { organization: true }
    });
  }

  let orgId = dbUser.orgId;

  // Dacă user-ul nu are organizație, îi creăm "Ferma Mea"
  if (!orgId) {
    const newOrg = await prisma.organization.create({
      data: {
        name: "Ferma Mea",
        subscriptionTier: "trial",
      },
    });
    
    await prisma.user.update({
      where: { id: user.id },
      data: { orgId: newOrg.id }
    });

    orgId = newOrg.id;
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

  return parcels;
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
