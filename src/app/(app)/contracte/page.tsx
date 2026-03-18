import prisma from "@/lib/prisma";
import LeaseContractClient from "@/components/contracte/LeaseContractClient";
import { getUserOrganization } from "@/lib/actions/parcels";
import { getLeaseContracts } from "@/lib/actions/leases";

export const metadata = {
  title: "Arendă & Contracte | Agral",
  description: "Managementul contractelor de arendă și proprietarilor de teren.",
};

export default async function LeaseContractsPage() {
  const orgId = await getUserOrganization();
  
  const contracts = await getLeaseContracts();
  
  // Get all parcels to allow linking them in the UI
  const parcels = await prisma.parcel.findMany({
    where: { orgId: orgId as string },
    include: {
      leaseContracts: {
        select: { id: true, endDate: true }
      }
    },
    orderBy: { name: 'asc' }
  });

  // Get organization details with users to find the owner/administrator
  const organization = await prisma.organization.findUnique({
    where: { id: orgId as string },
    include: {
      users: {
        where: { role: 'owner' },
        take: 1
      }
    }
  });

  const processedOrg = organization ? {
    ...organization,
    representative: organization.users?.[0] ? `${organization.users[0].firstName} ${organization.users[0].lastName}` : "Administrator"
  } : null;

  return (
    <div className="flex flex-col gap-6">
      <LeaseContractClient 
        initialContracts={contracts} 
        parcels={JSON.parse(JSON.stringify(parcels))}
        organization={JSON.parse(JSON.stringify(processedOrg))}
      />
    </div>
  );
}
