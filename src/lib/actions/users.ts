"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getUserOrganization } from "./parcels";

export async function getEmployees() {
  const orgId = await getUserOrganization();
  if (!orgId) return [];

  const users = await prisma.user.findMany({
    where: { orgId: orgId as string },
    orderBy: { createdAt: "desc" }
  });

  return JSON.parse(JSON.stringify(users));
}

export async function addEmployee(data: { 
  email?: string, 
  firstName: string, 
  lastName: string, 
  role: string, 
  canLogin?: boolean,
  monthlySalary?: number,
  employmentType?: string,
  salaryDay?: number
}) {
  const orgId = await getUserOrganization();
  if (!orgId) throw new Error("Nu aparții unei ferme");

  const actualEmail = data.email || `fictiv_${Date.now()}@agral.local`;

  const org = await prisma.organization.findUnique({
    where: { id: orgId as string }
  });

  if (!org) throw new Error("Fermă inexistentă");

    const activeUsersCount = await prisma.user.count({
      where: { 
        orgId: orgId as string,
        canLogin: true 
      } as any
    });

  if (activeUsersCount >= (org as any).maxUsers && data.canLogin !== false) {
    throw new Error(`Limită utilizatori atinsă (${(org as any).maxUsers}). Modificați abonamentul.`);
  }

  // Verificăm dacă userul există deja în platformă
  const existingUser = await prisma.user.findUnique({ where: { email: actualEmail } });

  if (existingUser) {
    if (existingUser.orgId && existingUser.orgId !== orgId) throw new Error("Acest utilizator aparține deja unei alte ferme.");
    
    await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        orgId: orgId as string,
        role: data.role,
        firstName: data.firstName,
        lastName: data.lastName,
        monthlySalary: data.monthlySalary,
        employmentType: data.employmentType,
        salaryDay: data.salaryDay,
        canLogin: data.canLogin ?? (existingUser as any).canLogin
      } as any
    });
  } else {
    // Generăm un UUID temp
    const tempId = crypto.randomUUID();
    
    await prisma.user.create({
      data: {
        id: tempId,
        orgId: orgId as string,
        email: actualEmail,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        canLogin: data.canLogin ?? true,
        monthlySalary: data.monthlySalary,
        employmentType: data.employmentType,
        salaryDay: data.salaryDay
      } as any
    });
  }

  revalidatePath("/angajati");
  return { success: true };
}

export async function removeEmployee(userId: string) {
  const orgId = await getUserOrganization();
  
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.orgId !== orgId) throw new Error("Neautorizat");

  if (user.role === 'owner') throw new Error("Nu poți șterge proprietarul fermei");

  await prisma.user.update({
    where: { id: userId },
    data: { 
      orgId: null,
      role: 'worker' // revine la rolul de bază fără fermă
    }
  });

  revalidatePath("/angajati");
}

export async function editEmployeeSalary(userId: string, data: { monthlySalary: number, employmentType: string, salaryDay?: number }) {
  const orgId = await getUserOrganization();
  
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.orgId !== orgId) throw new Error("Neautorizat");

  await prisma.user.update({
    where: { id: userId },
    data: {
      monthlySalary: data.monthlySalary,
      employmentType: data.employmentType,
      salaryDay: data.salaryDay
    } as any
  });

  revalidatePath("/angajati");
}

export async function paySalary(userId: string, amount: number, month: string) {
  const orgId = await getUserOrganization();
  if (!orgId) throw new Error("Neautorizat");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.orgId !== orgId) throw new Error("Angajat inexistent");

  // Create Financial Transaction
  await (prisma as any).financialTransaction.create({
    data: {
      orgId: orgId as string,
      type: "expense",
      category: "salary",
      amount: amount,
      date: new Date(),
      description: `Salariu ${user.firstName} ${user.lastName} - ${month}`,
      referenceId: userId
    }
  });

  revalidatePath("/angajati");
  revalidatePath("/financiar");
  
  return { success: true };
}
