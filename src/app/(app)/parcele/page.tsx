import { getParcels } from "@/lib/actions/parcels";
import { getCurrentUser } from "@/lib/actions/profile";
import ParcelListClient from "@/components/parcele/ParcelListClient";
import { Suspense } from "react";
import { ParcelSkeleton } from "@/components/parcele/ParcelSkeleton";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ParcelelePage() {
  const user = await getCurrentUser();
  const farmBase = user?.organization?.baseLat && user?.organization?.baseLng 
    ? { lat: Number(user.organization.baseLat), lng: Number(user.organization.baseLng) } 
    : null;

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header - Immediate */}
      <div className="flex items-center justify-between">
        <div>
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
  const parcels = await getParcels();
  return <ParcelListClient initialParcels={parcels} farmBase={farmBase} hideHeader />;
}
