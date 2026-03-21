"use server";

import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function submitOnboarding(data: {
  firstName: string;
  lastName: string;
  orgName: string;
  legalName: string;
  registrationNumber: string;
  entityType: string;
  county: string;
  city: string;
  address: string;
  cui: string;
  phone: string;
  caen: string;
  iban?: string;
  bankName?: string;
  website?: string;
  representativeName?: string;
  representativeCnp?: string;
  representativeCiSeries?: string;
  representativeCiNumber?: string;
  representativeRole?: string;
  lat: number | null;
  lng: number | null;
  parcelData: { geoJson: any; areaHa: number } | null;
  parcelName?: string;
  parcelOwnership?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Neautorizat.");

  const dbUser = await prisma.user.upsert({
    where: { id: user.id },
    update: {},
    create: {
      id: user.id,
      email: user.email || "",
    }
  });

  if (dbUser.orgId) {
    // Dacă are deja, doar îl trimitem în dashboard (se poate întâmpla prin repetare apel)
    return { success: true };
  }

  // Creăm organizația
  const newOrg = await prisma.organization.create({
    data: {
      name: data.orgName,
      legalName: data.legalName,
      entityType: data.entityType,
      county: data.county,
      city: data.city,
      address: data.address,
      cui: data.cui,
      phone: data.phone,
      caen: data.caen,
      iban: data.iban,
      bankName: data.bankName,
      website: data.website,
      representativeName: data.representativeName,
      representativeCnp: data.representativeCnp,
      representativeCiSeries: data.representativeCiSeries,
      representativeCiNumber: data.representativeCiNumber,
      representativeRole: data.representativeRole,
      baseLat: data.lat ?? undefined,
      baseLng: data.lng ?? undefined,
      subscriptionTier: "trial",
      maxUsers: 1,
    }
  });

  // Setăm orgId al user-ului și salvăm numele
  await (prisma.user as any).update({
    where: { id: user.id },
    data: { 
      orgId: newOrg.id,
      firstName: data.firstName,
      lastName: data.lastName
    }
  });

  // Dacă a desenat prima parcelă
  if (data.parcelData) {
    await prisma.parcel.create({
      data: {
        orgId: newOrg.id,
        name: data.parcelName || "Prima Parcela",
        ownership: data.parcelOwnership || "owned",
        areaHa: data.parcelData.areaHa,
        coordinates: data.parcelData.geoJson ? JSON.parse(JSON.stringify(data.parcelData.geoJson)) : undefined,
      } as any
    });
  }

  return { success: true };
}
