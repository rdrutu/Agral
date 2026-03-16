import { getParcels } from "@/lib/actions/parcels";
import ParcelListClient from "@/components/parcele/ParcelListClient";

// Optăm pentru dynamic render pt date mereu proaspete (sau revalidate path funcționează oricum)
export const dynamic = "force-dynamic";

export default async function ParcelelePage() {
  const parcels = await getParcels();

  return <ParcelListClient initialParcels={parcels} />;
}
