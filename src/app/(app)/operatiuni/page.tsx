import { getOperations } from "@/lib/actions/operations";
import { getParcels } from "@/lib/actions/parcels";
import { getInventory } from "@/lib/actions/inventory";
import OperationsClient from "@/components/operatiuni/OperationsClient";

export const dynamic = "force-dynamic";

export default async function OperationsPage() {
  const [operations, parcels, inventory] = await Promise.all([
    getOperations(),
    getParcels(),
    getInventory()
  ]);

  return <OperationsClient initialOperations={operations} parcels={parcels} inventory={inventory} />;
}
