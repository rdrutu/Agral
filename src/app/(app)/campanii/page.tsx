import { getSeasons, getCropPlans } from "@/lib/actions/seasons";
import { getParcels } from "@/lib/actions/parcels";
import SeasonsClient from "@/components/sezoane/SeasonsClient";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export default async function SeasonsPage() {
  const seasons = await getSeasons();
  const parcels = await getParcels();

  // Luăm planurile celui activ sau al primului din listă
  const activeSeasonFallback = seasons.find((s: any) => s.isActive) || seasons[0];
  const plans = activeSeasonFallback ? await getCropPlans(activeSeasonFallback.id) : [];

  return (
    <main className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500">
      <Suspense fallback={<div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
        <SeasonsClient 
          initialSeasons={seasons} 
          allParcels={parcels} 
          initialPlans={plans}
        />
      </Suspense>
    </main>
  );
}
