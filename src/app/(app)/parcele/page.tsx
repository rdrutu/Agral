import { getParcels, getParcelGroups, getUserOrganization } from "@/lib/actions/parcels";
import ParcelListClient from "@/components/parcele/ParcelListClient";
import { Suspense } from "react";
import { ParcelSkeleton } from "@/components/parcele/ParcelSkeleton";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ParcelelePage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto" suppressHydrationWarning>
      <Suspense fallback={<ParcelSkeleton />}>
        <ParcelDynamicContent />
      </Suspense>
    </div>
  );
}

async function ParcelDynamicContent() {
  const orgId = await getUserOrganization();
  
  // Start fetches immediately as Promises (non-blocking)
  const parcelsPromise = getParcels();
  const groupsPromise = getParcelGroups();
  
  // Fetch farmBase coordinates
  const organization = await prisma.organization.findUnique({
    where: { id: orgId as string },
    select: { baseLat: true, baseLng: true }
  });

  const farmBase = organization?.baseLat && organization?.baseLng 
    ? { lat: Number(organization.baseLat), lng: Number(organization.baseLng) } 
    : null;
  
  return (
    <ParcelListClient 
      parcelsPromise={parcelsPromise} 
      groupsPromise={groupsPromise}
      farmBase={farmBase} 
    />
  );
}
