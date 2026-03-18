import { getSeasons, getCropPlans } from "@/lib/actions/seasons";
import { getParcels } from "@/lib/actions/parcels";
import { getInventory } from "@/lib/actions/inventory";
import SeasonsClient from "@/components/sezoane/SeasonsClient";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export default async function SeasonsPage(props: { searchParams: Promise<{ seasonId?: string }> }) {
  const searchParams = await props.searchParams;
  const seasons = await getSeasons();
  const parcels = await getParcels();

  // Luăm planurile celui activ, al celui din URL sau al primului din listă
  const requestedSeasonId = searchParams.seasonId;
  const activeSeasonFallback = requestedSeasonId 
    ? seasons.find((s: any) => s.id === requestedSeasonId)
    : (seasons.find((s: any) => s.isActive) || seasons[0]);
    
  const plans = activeSeasonFallback ? await getCropPlans(activeSeasonFallback.id) : [];

  const inventory = await getInventory();
  // Filtrăm doar ce poate fi sămânță sau recoltă refolosită
  const seeds = inventory.filter((i: any) => i.category === "samanta" || i.category === "recolta");

  return (
    <main className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500">
      <Suspense fallback={<div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
        <SeasonsClient
          initialSeasons={JSON.parse(JSON.stringify(seasons))}
          allParcels={JSON.parse(JSON.stringify(parcels))}
          initialPlans={JSON.parse(JSON.stringify(plans))}
          seedItems={JSON.parse(JSON.stringify(seeds))}
          currentSeasonId={activeSeasonFallback?.id || null}
        />
      </Suspense>
    </main>
  );
}
