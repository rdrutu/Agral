import { getEmployees } from "@/lib/actions/users";
import { getUserOrganization } from "@/lib/actions/parcels";
import prisma from "@/lib/prisma";
import EmployeesClient from "@/components/angajati/EmployeesClient";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AngajatiPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black tracking-tight">Angajați & Personal</h1>
        <p className="text-muted-foreground">Gestionează personalul, organigrama și drepturile de acces din platformă.</p>
      </div>
      <Suspense fallback={<div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
        <EmployeesDynamicContent />
      </Suspense>
    </div>
  );
}

async function EmployeesDynamicContent() {
  const orgId = await getUserOrganization();
  if (!orgId) redirect("/dashboard");

  const [employees, org] = await Promise.all([
    getEmployees(),
    prisma.organization.findUnique({
      where: { id: orgId as string },
      // @ts-ignore
      select: { id: true, maxUsers: true, salaryDay: true }
    })
  ]);

  if (!org) redirect("/dashboard");

  return (
    <>
      {/* @ts-ignore */}
      <EmployeesClient 
        initialEmployees={employees} 
        organization={org}
      />
    </>
  );
}
