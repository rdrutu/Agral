import { getOperations } from "@/lib/actions/operations";
import { getParcels } from "@/lib/actions/parcels";
import { getInventory } from "@/lib/actions/inventory";
import OperationsClient from "@/components/operatiuni/OperationsClient";
import { Suspense } from "react";
import { OperationsSkeleton } from "@/components/operatiuni/OperationsSkeleton";

export const dynamic = "force-dynamic";

export default async function OperationsPage() {
  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black tracking-tight">Operațiuni Agricole</h1>
        <p className="text-muted-foreground">Înregistrează și gestionează lucrările din câmp.</p>
      </div>

      <Suspense fallback={<OperationsSkeleton />}>
        <OperationsDynamicContent />
      </Suspense>
    </div>
  );
}

async function OperationsDynamicContent() {
  const [operations, parcels, inventory] = await Promise.all([
    getOperations(),
    getParcels(),
    getInventory()
  ]);

  // Convertim obiectele complexe la plain JS
  const plainOperations = JSON.parse(JSON.stringify(operations));
  const plainParcels = JSON.parse(JSON.stringify(parcels));
  const plainInventory = JSON.parse(JSON.stringify(inventory));

  return (
    <OperationsClient 
      initialOperations={plainOperations} 
      parcels={plainParcels} 
      inventory={plainInventory} 
      hideHeader
    />
  );
}
