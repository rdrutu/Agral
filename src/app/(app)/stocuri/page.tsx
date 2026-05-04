import { getInventory } from "@/lib/actions/inventory";
import { getCurrentUser } from "@/lib/actions/profile";
import InventoryClient from "@/components/stocuri/InventoryClient";
import { Suspense } from "react";
import { InventorySkeleton } from "@/components/stocuri/InventorySkeleton";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  return (
    <Suspense fallback={<InventorySkeleton />}>
      <InventoryDynamicContent />
    </Suspense>
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
    />
  );
}
