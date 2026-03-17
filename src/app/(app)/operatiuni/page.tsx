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

  // Convertim obiectele complexe (cum ar fi instanțele Decimal sau Date din Prisma) la plain JS
  const plainOperations = JSON.parse(JSON.stringify(operations));
  const plainParcels = JSON.parse(JSON.stringify(parcels));
  const plainInventory = JSON.parse(JSON.stringify(inventory));

  return <OperationsClient initialOperations={plainOperations} parcels={plainParcels} inventory={plainInventory} />;
}
