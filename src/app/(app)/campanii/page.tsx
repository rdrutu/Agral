import { getSeasons, getCropPlans } from "@/lib/actions/seasons";
import { getParcels } from "@/lib/actions/parcels";
import { getInventory } from "@/lib/actions/inventory";
import SeasonsClient from "@/components/sezoane/SeasonsClient";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export default async function SeasonsPage(props: { searchParams: Promise<{ seasonId?: string }> }) {
  const searchParams = await props.searchParams;
  const requestedSeasonId = searchParams.seasonId;

  return (
    <main className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black tracking-tight">Plan de Culturi & Campanii Agricole</h1>
        <p className="text-muted-foreground">Planifică sezoanele agricole, culturile și estimează producțiile generale din fermă.</p>
      </div>
      <Suspense fallback={<div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
        <SeasonsDynamicContent requestedSeasonId={requestedSeasonId} />
      </Suspense>
    </main>
  );
}

async function SeasonsDynamicContent({ requestedSeasonId }: { requestedSeasonId?: string }) {
  // Executăm paralela pe primele niveluri de resurse
  const [seasons, parcels, inventory] = await Promise.all([
    getSeasons(),
    getParcels(),
    getInventory()
  ]);

  const activeSeasonFallback = requestedSeasonId 
    ? seasons.find((s: any) => s.id === requestedSeasonId)
    : (seasons.find((s: any) => s.isActive) || seasons[0]);
    
  // Cerem planurile doar după ce avem id-ul sezonului curent
  const plans = activeSeasonFallback ? await getCropPlans(activeSeasonFallback.id) : [];

  const seeds = inventory.filter((i: any) => i.category === "samanta" || i.category === "recolta");

  return (
    <SeasonsClient
      initialSeasons={JSON.parse(JSON.stringify(seasons))}
      allParcels={JSON.parse(JSON.stringify(parcels))}
      initialPlans={JSON.parse(JSON.stringify(plans))}
      seedItems={JSON.parse(JSON.stringify(seeds))}
      currentSeasonId={activeSeasonFallback?.id || null}
    />
  );
}
