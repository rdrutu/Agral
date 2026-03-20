"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUserOrganization } from "./parcels";

export async function getLeaseContracts() {
  try {
    const orgId = await getUserOrganization();
    if (!orgId) return [];
    
    const contracts = await prisma.leaseContract.findMany({
      where: { orgId: orgId as string },
      include: {
        parcel: true
      },
      orderBy: { startDate: 'desc' }
    });

    return JSON.parse(JSON.stringify(contracts));
  } catch (error) {
    console.error("Error fetching lease contracts:", error);
    return [];
  }
}

export async function createLeaseContract(data: any) {
  try {
    const orgId = await getUserOrganization();
    if (!orgId) throw new Error("Neautorizat");
    
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
    return JSON.parse(JSON.stringify(contract));
  } catch (error: any) {
    console.error("Error creating lease contract:", error);
    throw new Error(error.message || "Eroare la crearea contractului");
  }
}

export async function updateLeaseContract(id: string, data: any) {
  try {
    const orgId = await getUserOrganization();
    if (!orgId) throw new Error("Neautorizat");
    
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
    return JSON.parse(JSON.stringify(contract));
  } catch (error: any) {
    console.error("Error updating lease contract:", error);
    throw new Error(error.message || "Eroare la actualizarea contractului");
  }
}

export async function deleteLeaseContract(id: string) {
  try {
    const orgId = await getUserOrganization();
    if (!orgId) throw new Error("Neautorizat");

    await prisma.leaseContract.delete({
      where: { id, orgId: orgId as string }
    });

    revalidatePath("/contracte");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting lease contract:", error);
    throw new Error(error.message || "Eroare la ștergerea contractului");
  }
}

export async function updateLeasePayment(id: string, paymentStatus: string, lastPaymentDate: string) {
  try {
    const orgId = await getUserOrganization();
    if (!orgId) throw new Error("Neautorizat");

    const contract = await prisma.leaseContract.update({
      where: { id, orgId: orgId as string },
      data: {
        paymentStatus,
        lastPaymentDate: new Date(lastPaymentDate)
      }
    });

    revalidatePath("/contracte");
    return JSON.parse(JSON.stringify(contract));
  } catch (error: any) {
    console.error("Error updating lease payment:", error);
    throw new Error(error.message || "Eroare la actualizarea plății");
  }
}

