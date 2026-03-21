import { getParcels, getParcelGroups, getUserOrganization } from "@/lib/actions/parcels";
import ParcelListClient from "@/components/parcele/ParcelListClient";
import { Suspense } from "react";
import { ParcelSkeleton } from "@/components/parcele/ParcelSkeleton";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ParcelelePage() {
  const orgId = await getUserOrganization();
  
  // Fetch farmBase coordinates
  const organization = await prisma.organization.findUnique({
    where: { id: orgId as string },
    select: { baseLat: true, baseLng: true }
  });

  const farmBase = organization?.baseLat && organization?.baseLng 
    ? { lat: Number(organization.baseLat), lng: Number(organization.baseLng) } 
    : null;

  return (
    <div className="space-y-6 max-w-7xl" suppressHydrationWarning>
      <div className="flex items-center justify-between" suppressHydrationWarning>
        <div suppressHydrationWarning>
          <h2 className="text-2xl font-extrabold text-foreground">Parcele Agricole</h2>
          <p className="text-muted-foreground mt-1">
            Gestionează suprafețele și culturile fermei tale
          </p>
        </div>
      </div>

      <Suspense fallback={<ParcelSkeleton />}>
        <ParcelDynamicContent farmBase={farmBase} />
      </Suspense>
    </div>
  );
}

async function ParcelDynamicContent({ farmBase }: { farmBase: any }) {
  const [parcels, groups] = await Promise.all([
    getParcels(),
    getParcelGroups()
  ]);
  
  return (
    <ParcelListClient 
      initialParcels={parcels} 
      initialGroups={groups}
      farmBase={farmBase} 
      hideHeader 
    />
  );
}
