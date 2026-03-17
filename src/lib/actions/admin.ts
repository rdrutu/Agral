"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function checkSuperadmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true }
  });

  return dbUser?.role === "superadmin";
}

export async function getAllOrganizations() {
  const isSuper = await checkSuperadmin();
  if (!isSuper) throw new Error("Neautorizat. Ai nevoie de rol superadmin.");

  const orgs = await prisma.organization.findMany({
    include: {
      _count: {
        select: { 
          users: { where: { canLogin: true } }, 
          parcels: true 
        }
      },
      parcels: {
        select: { areaHa: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  // Calculate total hectares for each org
  const serialized = (orgs as any[]).map(org => {
    const totalHa = org.parcels.reduce((sum: number, p: any) => sum + Number(p.areaHa), 0);
    return {
      id: org.id,
      name: org.name,
      county: org.county,
      subscriptionTier: org.subscriptionTier,
      maxUsers: org.maxUsers,
      userCount: org._count.users,
      parcelCount: org._count.parcels,
      totalAreaHa: totalHa,
      createdAt: org.createdAt,
      phone: org.phone,
      subscriptionExpiresAt: org.subscriptionExpiresAt
    };
  });

  return JSON.parse(JSON.stringify(serialized));
}

export async function getOrganizationDetails(orgId: string) {
  const isSuper = await checkSuperadmin();
  if (!isSuper || !orgId) throw new Error("Neautorizat sau organizație invalidă");

  const org = await prisma.organization.findUnique({
    where: { id: orgId as string },
    include: {
      users: { orderBy: { createdAt: "asc" } },
      payments: { orderBy: { date: "desc" } },
      _count: { select: { parcels: true } },
      parcels: { select: { areaHa: true } }
    } as any
  });

  if (!org) throw new Error("Ferma nu a fost găsită");

  const totalHa = ((org as any).parcels || []).reduce((sum: number, p: any) => sum + Number(p.areaHa), 0);

  const result = {
    ...org,
    totalAreaHa: totalHa
  };

  return JSON.parse(JSON.stringify(result));
}

export async function addSubscriptionMonths(orgId: string, data: { 
  months: number, 
  amount: number, 
  tier: string, 
  notes?: string,
  amountBeforeDiscount?: number,
  discountApplied?: number,
  validUntil?: string
}) {
  const isSuper = await checkSuperadmin();
  if (!isSuper) throw new Error("Neautorizat");

  const org = await prisma.organization.findUnique({ where: { id: orgId } }) as any;
  if (!org) throw new Error("Ferma nu a fost găsită");

  let newExpiry: Date;
  if (data.validUntil) {
    newExpiry = new Date(data.validUntil);
  } else {
    const currentExpiry = org.subscriptionExpiresAt ? new Date(org.subscriptionExpiresAt) : new Date();
    const baseDate = currentExpiry > new Date() ? currentExpiry : new Date();
    
    newExpiry = new Date(baseDate);
    newExpiry.setMonth(newExpiry.getMonth() + data.months);
  }

  await prisma.$transaction([
    prisma.organization.update({
      where: { id: orgId },
      data: {
        subscriptionExpiresAt: newExpiry,
        subscriptionTier: data.tier,
        subscriptionStatus: "active"
      } as any
    }),
    (prisma as any).subscriptionPayment.create({
      data: {
        orgId,
        months: data.months,
        amount: data.amount,
        tier: data.tier,
        notes: data.notes,
        amountBeforeDiscount: data.amountBeforeDiscount,
        discountApplied: data.discountApplied
      }
    })
  ]);

  revalidatePath("/admin");
  revalidatePath(`/admin/${orgId}`);
}

export async function deleteParcel(parcelId: string) {
  const isSuper = await checkSuperadmin();
  if (!isSuper) throw new Error("Neautorizat. Doar un admin poate șterge parcele de aici.");

  await prisma.parcel.delete({
    where: { id: parcelId }
  });

  revalidatePath("/admin");
}

export async function updateOrgSubscription(orgId: string, data: { tier: string, maxUsers: number }) {
  const isSuper = await checkSuperadmin();
  if (!isSuper) throw new Error("Neautorizat. Ai nevoie de rol superadmin.");
  if (!orgId) throw new Error("ID-ul organizației este invalid.");

  await prisma.organization.update({
    where: { id: orgId },
    data: {
      subscriptionTier: data.tier,
      maxUsers: data.maxUsers
    }
  });

  revalidatePath("/admin");
}

export async function deleteOrganization(orgId: string) {
  const isSuper = await checkSuperadmin();
  if (!isSuper || !orgId) throw new Error("Neautorizat.");

  // Stergem organizația (userii vor fi orfanii sau stergeti in cascada daca avem relatia setata, 
  // dar in Prisma schema actuala userul are orgId optional. Voi sterge manual si userii asociati 
  // ai acestei organizatii pentru curatenie completa.)
  
  await prisma.user.deleteMany({
    where: { orgId: orgId }
  });

  await prisma.organization.delete({
    where: { id: orgId }
  });

  revalidatePath("/admin");
}

export async function promoteToSuperadmin(targetUserId?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user && !targetUserId) return false;

  const idToUpdate = targetUserId || user!.id;

  try {
    // Verificăm dacă există utilizatorul în tabelul Prisma
    const existingUser = await prisma.user.findUnique({
      where: { id: idToUpdate }
    });

    if (!existingUser) {
      if (!user) throw new Error("Nu se poate crea contul fără email-ul din sesiune.");
      // Dacă nu există, folosim datele din sesiune pentru a-l crea și a-l seta ca superadmin direct
      await prisma.user.create({
        data: {
          id: idToUpdate,
          email: user.email!,
          role: "superadmin",
          orgId: null
        }
      });
    } else {
      // Dacă există, doar îi updatăm rolul și îl disociem de la orice fermă (orgId = null)
      await prisma.user.update({
        where: { id: idToUpdate },
        data: { 
          role: "superadmin",
          orgId: null 
        }
      });
    }
  } catch (error) {
    console.error("Eroare la promovare admin:", error);
    throw error;
  }

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/dashboard");
  return true;
}

export async function getSuperadmins() {
  const isSuper = await checkSuperadmin();
  if (!isSuper) throw new Error("Neautorizat");

  const admins = await prisma.user.findMany({
    where: { role: "superadmin" },
    orderBy: { createdAt: "desc" }
  });

  return JSON.parse(JSON.stringify(admins));
}

export async function demoteSuperadmin(adminId: string) {
  const isSuper = await checkSuperadmin();
  if (!isSuper) throw new Error("Neautorizat");

  // Nu lăsăm utilizatorul să se auto-demită dacă e singurul mod de acces (opțional, preventiv)
  
  await prisma.user.update({
    where: { id: adminId },
    data: { role: "worker" }
  });

  revalidatePath("/admin");
  return { success: true };
}

export async function cleanupGhostFarms() {
  const isSuper = await checkSuperadmin();
  if (!isSuper) throw new Error("Neautorizat");

  // Ștergem organizațiile care nu au niciun membru asociat (conturi admin deconectate anterior)
  // și niciun parcel desenat.
  const emptyOrgs = await prisma.organization.findMany({
    where: {
      users: { none: {} },
      parcels: { none: {} }
    }
  });

  if (emptyOrgs.length > 0) {
    await prisma.organization.deleteMany({
      where: {
        id: { in: emptyOrgs.map(o => o.id) }
      }
    });
  }

  revalidatePath("/admin");
  return emptyOrgs.length;
}
