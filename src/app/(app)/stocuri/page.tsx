import { getInventory } from "@/lib/actions/inventory";
import InventoryClient from "@/components/stocuri/InventoryClient";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const inventory = await getInventory();

  return <InventoryClient initialInventory={inventory} />;
}
