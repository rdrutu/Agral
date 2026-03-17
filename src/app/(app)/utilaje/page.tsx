import { getVehicles } from "@/lib/actions/vehicles";
import VehiclesClient from "@/components/utilaje/VehiclesClient";

export const dynamic = "force-dynamic";

export default async function UtilajePage() {
  const vehicles = await getVehicles();

  return (
    <div className="p-6">
      <VehiclesClient initialVehicles={vehicles} />
    </div>
  );
}
