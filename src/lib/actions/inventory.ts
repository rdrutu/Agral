"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getUserOrganization } from "./parcels";

export async function getInventory() {
  const orgId = await getUserOrganization();

  const inventory = await prisma.inventoryItem.findMany({
    where: { orgId: orgId as string },
    orderBy: { name: "asc" },
  });

  return inventory;
}

export async function createInventoryItem(formData: FormData) {
  const orgId = await getUserOrganization();

  const name = formData.get("name") as string;
  const category = formData.get("category") as string;
  const stockQuantity = parseFloat(formData.get("stockQuantity") as string);
  const unit = formData.get("unit") as string;
  const pricePerUnit = parseFloat(formData.get("pricePerUnit") as string);
  const notes = formData.get("notes") as string;

  if (!name || isNaN(stockQuantity) || isNaN(pricePerUnit)) {
    throw new Error("Date invalide pentru stoc");
  }

  const item = await prisma.inventoryItem.create({
    data: {
      orgId: orgId as string,
      name,
      category,
      stockQuantity,
      unit,
      pricePerUnit,
      notes,
    },
  });

  revalidatePath("/stocuri");
  revalidatePath("/dashboard");
  return item;
}

export async function updateInventoryStock(id: string, newStock: number) {
  const orgId = await getUserOrganization();
  
  // Asigură securitatea
  const item = await prisma.inventoryItem.findUnique({ where: { id } });
  if (item?.orgId !== orgId) throw new Error("Neautorizat");

  await prisma.inventoryItem.update({
    where: { id },
    data: { stockQuantity: newStock }
  });

  revalidatePath("/stocuri");
}
