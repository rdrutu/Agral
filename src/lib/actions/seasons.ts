"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getUserOrganization } from "./parcels";
import { Prisma } from "@prisma/client";

// -------------------------------------------------------------
// SEZOANE (Campanii Agricole)
// -------------------------------------------------------------

export async function getSeasons() {
  const orgId = await getUserOrganization();
  return prisma.season.findMany({
    where: { orgId: orgId as string },
    orderBy: { startDate: "desc" },
    include: {
      _count: { select: { cropPlans: true } }
    }
  });
}

export async function createSeason(data: { name: string; startDate: string; endDate: string }) {
  const orgId = await getUserOrganization();

  // Dacă e primul sezon, îl facem activ default
  const existingCount = await prisma.season.count({
    where: { orgId: orgId as string }
  });

  const season = await prisma.season.create({
    data: {
      orgId: orgId as string,
      name: data.name,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      isActive: existingCount === 0 
    }
  });

  revalidatePath("/campanii");
  revalidatePath("/dashboard");
  return season;
}

export async function setActiveSeason(seasonId: string) {
  const orgId = await getUserOrganization();
  
  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // Dezactivam toate
    await tx.season.updateMany({
      where: { orgId: orgId as string },
      data: { isActive: false }
    });
    // Activam cel dorit
    await tx.season.update({
      where: { id: seasonId, orgId: orgId as string },
      data: { isActive: true }
    });
  });

  revalidatePath("/campanii");
  revalidatePath("/dashboard");
}

export async function deleteSeason(seasonId: string) {
  const orgId = await getUserOrganization();
  await prisma.season.delete({
    where: { id: seasonId, orgId: orgId as string }
  });
  revalidatePath("/campanii");
}

// -------------------------------------------------------------
// PLAN DE CULTURI (Alocare Parcele -> Campanie)
// -------------------------------------------------------------

export async function getCropPlans(seasonId: string) {
  const orgId = await getUserOrganization();
  
  // Verifică că sezonul ii apartine
  const season = await prisma.season.findUnique({ where: { id: seasonId, orgId: orgId as string }});
  if (!season) throw new Error("Neautorizat");

  return prisma.cropPlan.findMany({
    where: { seasonId },
    include: { parcel: true },
    orderBy: { parcel: { name: "asc" } }
  });
}

export async function allocateParcelsToCrop(data: { 
  seasonId: string; 
  parcelIds: string[]; 
  cropType: string;
  variety?: string;
}) {
  const orgId = await getUserOrganization();
  
  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    for (const pId of data.parcelIds) {
      // Verificam sa nu fie deja alocata in sezonul asta (o stergem daca exista pt alocare noua, sau ignoram?)
      // Simplu: Overwrite (Daca o parcelă e re-alocată in acelasi sezon la o cultură nouă, suprascrie).
      
      const parcel = await tx.parcel.findUnique({ where: { id: pId }});
      if (!parcel || parcel.orgId !== orgId) continue;

      const existingPlan = await tx.cropPlan.findFirst({
        where: { seasonId: data.seasonId, parcelId: pId }
      });

      if (existingPlan) {
        await tx.cropPlan.update({
          where: { id: existingPlan.id },
          data: {
            cropType: data.cropType,
            variety: data.variety || null,
            sownAreaHa: parcel.areaHa,
            status: "planned"
          }
        });
      } else {
        await tx.cropPlan.create({
          data: {
            seasonId: data.seasonId,
            parcelId: pId,
            cropType: data.cropType,
            variety: data.variety || null,
            sownAreaHa: parcel.areaHa,
            status: "planned"
          }
        });
      }
    }
  });

  revalidatePath("/campanii");
  revalidatePath("/dashboard/parcele");
}

export async function removeCropPlan(planId: string) {
  await prisma.cropPlan.delete({ where: { id: planId }});
  revalidatePath("/campanii");
}
