import { getVehicles } from "@/lib/actions/vehicles";
import VehiclesClient from "@/components/utilaje/VehiclesClient";
import { Suspense } from "react";
import { VehiclesSkeleton } from "@/components/utilaje/VehiclesSkeleton";

export const dynamic = "force-dynamic";

export default async function UtilajePage() {
  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black tracking-tight">Parcul Auto & Utilaje</h1>
        <p className="text-muted-foreground">Gestionează reparațiile, RCA, ITP și alimentările utilajelor agricole din flotă.</p>
      </div>

      <Suspense fallback={<VehiclesSkeleton />}>
        <VehiclesDynamicContent />
      </Suspense>
    </div>
  );
}

async function VehiclesDynamicContent() {
  const vehicles = await getVehicles();

  return (
    <VehiclesClient 
      initialVehicles={vehicles} 
      hideHeader
    />
  );
}
