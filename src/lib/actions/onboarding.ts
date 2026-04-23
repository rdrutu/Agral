"use server";

import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

  let dbUser = await prisma.user.findUnique({
    where: { id: user.id }
  });

  if (!dbUser) {
    try {
      const userCount = await prisma.user.count();
      dbUser = await prisma.user.create({
        data: {
          id: user.id,
          email: user.email || "",
          role: userCount === 0 ? "superadmin" : "owner",
        }
      });
    } catch (err) {
      dbUser = await prisma.user.findUnique({
        where: { id: user.id }
      });
    }
  }

  if (!dbUser) throw new Error("Eroare la crearea profilului.");

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

export async function cancelOnboarding() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: true };

  try {
    const adminClient = createAdminClient();
    
    // 1. Delete from Prisma (will cascade to related data)
    await prisma.user.delete({
      where: { id: user.id }
    }).catch(() => {
      // Ignorăm dacă nu exista în DB
    });

    // 2. Delete from Supabase Auth
    const { error } = await adminClient.auth.admin.deleteUser(user.id);
    if (error) throw error;

    return { success: true };
  } catch (err: any) {
    console.error("Error canceling onboarding:", err);
    return { success: false, error: err.message };
  }
}
