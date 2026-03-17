"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getUserOrganization } from "./parcels";
import { getWeatherData } from "@/lib/weather";

export async function fetchWeatherData(lat: number, lon: number) {
  return await getWeatherData(lat, lon);
}

export async function addWeatherPOI(name: string, lat: number, lng: number) {
  const orgId = await getUserOrganization();
  if (!orgId) throw new Error("Neautorizat");

  const poi = await (prisma as any).weatherPOI.create({
    data: {
      orgId: orgId as string,
      name,
      lat,
      lng
    }
  });

  revalidatePath("/vreme");
  return JSON.parse(JSON.stringify(poi));
}

export async function deleteWeatherPOI(id: string) {
  const orgId = await getUserOrganization();
  if (!orgId) throw new Error("Neautorizat");

  // Securitate
  const poi = await (prisma as any).weatherPOI.findUnique({ where: { id } });
  if (poi?.orgId !== orgId) throw new Error("Neautorizat");

  await (prisma as any).weatherPOI.delete({ where: { id } });

  revalidatePath("/vreme");
}
