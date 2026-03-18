"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateOrganizationSalaryDay(orgId: string, salaryDay: number) {
  if (!orgId) throw new Error("ID organizație lipsește");
  if (salaryDay < 1 || salaryDay > 31) throw new Error("Ziua de salariu trebuie să fie între 1 și 31");

  await prisma.organization.update({
    where: { id: orgId },
    data: { 
      // @ts-ignore
      salaryDay 
    }
  });

  revalidatePath("/angajati");
  return { success: true };
}
