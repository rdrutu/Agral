"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUserOrganization } from "./parcels";

export async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: { 
      organization: {
        include: {
          payments: {
            orderBy: { date: 'desc' }
          }
        }
      } 
    }
  });

  return JSON.parse(JSON.stringify(dbUser));
}

export async function updateUserProfile(data: {
  firstName: string;
  lastName: string;
  orgName?: string;
  county?: string;
  address?: string;
  legalName?: string;
  registrationNumber?: string;
  caen?: string;
  cui?: string;
  phone?: string;
  baseLat?: number | null;
  baseLng?: number | null;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Neautorizat");

  await prisma.user.update({
    where: { id: user.id },
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
    }
  });

  if (data.orgName !== undefined) {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true, orgId: true }
    });

    if (dbUser?.orgId && dbUser.role !== 'superadmin') {
      await prisma.organization.update({
        where: { id: dbUser.orgId },
        data: {
          name: data.orgName,
          county: data.county,
          address: data.address,
          legalName: data.legalName,
          registrationNumber: data.registrationNumber,
          caen: data.caen,
          cui: data.cui,
          phone: data.phone,
          baseLat: data.baseLat,
          baseLng: data.baseLng,
        }
      });
    }
  }

  revalidatePath("/profil");
  revalidatePath("/dashboard");
}
