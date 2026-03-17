import { getEmployees } from "@/lib/actions/users";
import { getUserOrganization } from "@/lib/actions/parcels";
import prisma from "@/lib/prisma";
import EmployeesClient from "@/components/angajati/EmployeesClient";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AngajatiPage() {
  const orgId = await getUserOrganization();
  if (!orgId) redirect("/dashboard");

  const [employees, org] = await Promise.all([
    getEmployees(),
    prisma.organization.findUnique({
      where: { id: orgId as string },
      select: { maxUsers: true }
    })
  ]);

  if (!org) redirect("/dashboard");

  return (
    <div className="p-6">
      <EmployeesClient 
        initialEmployees={employees} 
        maxUsers={org.maxUsers} 
      />
    </div>
  );
}
