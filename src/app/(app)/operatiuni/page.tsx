import { getOperations } from "@/lib/actions/operations";
import { getParcels } from "@/lib/actions/parcels";
import { getInventory } from "@/lib/actions/inventory";
import { getCurrentUser } from "@/lib/actions/profile";
import OperationsClient from "@/components/operatiuni/OperationsClient";
import { Suspense } from "react";
import { OperationsSkeleton } from "@/components/operatiuni/OperationsSkeleton";
import { Skeleton } from "@/components/ui/skeleton";

export const dynamic = "force-dynamic";

export default async function OperationsPage() {
  return (
    <main className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500">
      <Suspense fallback={<OperationsSkeleton />}>
        <OperationsPageContent />
      </Suspense>
    </main>
  );
}

async function OperationsPageContent() {
  // Fetch only what's needed for the initial UI and the Form
  // We parallelize parcels, inventory and user
  const [parcels, inventory, user] = await Promise.all([
    getParcels(),
    getInventory(),
    getCurrentUser()
  ]);

  // Operations are fetched separately to allow streaming if we want, 
  // but for now we'll pass them to the client.
  // To truly optimize, we'll fetch the first page here.
  const initialOps = await getOperations({ take: 30 });

  return (
    <OperationsClient 
      initialOperations={initialOps} 
      parcels={parcels} 
      inventory={inventory} 
      orgName={user?.organization?.name || "Ferma Mea"}
      hideHeader
    />
  );
}
