"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUserOrganization } from "./parcels";

export async function getLeaseContracts() {
  const orgId = await getUserOrganization();
  
  const contracts = await prisma.leaseContract.findMany({
    where: { orgId: orgId as string },
    include: {
      parcel: true
    },
    orderBy: { startDate: 'desc' }
  });

  return JSON.parse(JSON.stringify(contracts));
}

export async function createLeaseContract(data: any) {
  const orgId = await getUserOrganization();
  
  // If parcel cadastral data is provided, update the parcel as well
  if (data.parcelId && data.cadastralCode) {
    await prisma.parcel.update({
      where: { id: data.parcelId, orgId: orgId as string },
      data: { cadastralCode: data.cadastralCode }
    });
  }

  // Remove fields that should not be in the contract model
  const { cadastralCode, pricing, ...contractData } = data;

  const contract = await prisma.leaseContract.create({
    data: {
      ...contractData,
      orgId: orgId as string,
      pricePerHa: Number(data.pricePerHa || 0),
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
    },
  });

  revalidatePath("/contracte");
  return contract;
}

export async function updateLeaseContract(id: string, data: any) {
  const orgId = await getUserOrganization();
  
  // If parcel cadastral data is provided, update the parcel as well
  if (data.parcelId && data.cadastralCode) {
    await prisma.parcel.update({
      where: { id: data.parcelId, orgId: orgId as string },
      data: { cadastralCode: data.cadastralCode }
    });
  }

  // Remove fields that should not be updated
  const { id: _, orgId: __, parcel: ___, createdAt: ____, updatedAt: _____, cadastralCode: ______, ...updateData } = data;
  
  if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
  if (updateData.endDate) updateData.endDate = new Date(updateData.endDate);
  if (updateData.pricePerHa) updateData.pricePerHa = Number(updateData.pricePerHa);
  if (updateData.lastPaymentDate) updateData.lastPaymentDate = new Date(updateData.lastPaymentDate);

  // Handle parcel relation update
  const { parcelId, ...finalUpdateData } = updateData;
  const dataToUpdate = {
    ...finalUpdateData,
    ...(parcelId ? { parcel: { connect: { id: parcelId } } } : {})
  };

  const contract = await prisma.leaseContract.update({
    where: { 
      id,
      orgId: orgId as string
    },
    data: dataToUpdate,
  });

  revalidatePath("/contracte");
  return contract;
}

export async function deleteLeaseContract(id: string) {
  const orgId = await getUserOrganization();

  await prisma.leaseContract.delete({
    where: { id, orgId: orgId as string }
  });

  revalidatePath("/contracte");
}

export async function updateLeasePayment(id: string, paymentStatus: string, lastPaymentDate: string) {
  const orgId = await getUserOrganization();

  const contract = await prisma.leaseContract.update({
    where: { id, orgId: orgId as string },
    data: {
      paymentStatus,
      lastPaymentDate: new Date(lastPaymentDate)
    }
  });

  revalidatePath("/contracte");
  return JSON.parse(JSON.stringify(contract));
}
