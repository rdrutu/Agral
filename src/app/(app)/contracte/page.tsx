import prisma from "@/lib/prisma";
import LeaseContractClient from "@/components/contracte/LeaseContractClient";
import { getUserOrganization } from "@/lib/actions/parcels";
import { getLeaseContracts } from "@/lib/actions/leases";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export const metadata = {
  title: "Arendă & Contracte | Agral",
  description: "Managementul contractelor de arendă și proprietarilor de teren.",
};

export default async function LeaseContractsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black tracking-tight">Contracte Arendă</h1>
        <p className="text-muted-foreground">Gestionează proprietarii de terenuri și scadențele plăților.</p>
      </div>
      <Suspense fallback={<div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
        <LeaseContractsDynamic />
      </Suspense>
    </div>
  );
}

async function LeaseContractsDynamic() {
  const orgId = await getUserOrganization();
  if (!orgId) return null;
  
  const [contracts, parcels, organization] = await Promise.all([
    getLeaseContracts(),
    prisma.parcel.findMany({
      where: { orgId: orgId as string },
      include: {
        leaseContracts: {
          select: { id: true, endDate: true }
        }
      },
      orderBy: { name: 'asc' }
    }),
    prisma.organization.findUnique({
      where: { id: orgId as string },
      include: {
        users: {
          where: { role: 'owner' },
          take: 1
        }
      }
    })
  ]);

  const processedOrg = organization ? {
    ...organization,
    representative: organization.users?.[0] ? `${organization.users[0].firstName} ${organization.users[0].lastName}` : "Administrator"
  } : null;

  return (
    <LeaseContractClient 
      initialContracts={contracts} 
      parcels={JSON.parse(JSON.stringify(parcels))}
      organization={JSON.parse(JSON.stringify(processedOrg))}
    />
  );
}
