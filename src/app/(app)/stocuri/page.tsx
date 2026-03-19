import { getInventory } from "@/lib/actions/inventory";
import { getCurrentUser } from "@/lib/actions/profile";
import InventoryClient from "@/components/stocuri/InventoryClient";
import { Suspense } from "react";
import { InventorySkeleton } from "@/components/stocuri/InventorySkeleton";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black tracking-tight">Magazia Fermei</h1>
        <p className="text-muted-foreground">Gestionează input-urile agricole, cantitățile și prețurile de achiziție.</p>
      </div>

      <Suspense fallback={<InventorySkeleton />}>
        <InventoryDynamicContent />
      </Suspense>
    </div>
  );
}

async function InventoryDynamicContent() {
  const [inventory, user] = await Promise.all([
    getInventory(),
    getCurrentUser()
  ]);

  return (
    <InventoryClient 
      initialInventory={inventory} 
      orgName={user?.organization?.name || "Ferma Mea"}
      hideHeader
    />
  );
}
