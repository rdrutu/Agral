"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateDashboardConfig(config: any) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Neautorizat");
  }

  await (prisma.user as any).update({
    where: { id: user.id },
    data: {
      dashboardConfig: config
    }
  });

  revalidatePath("/dashboard");
  return { success: true };
}
