import { getParcels } from "@/lib/actions/parcels";
import { getCurrentUser } from "@/lib/actions/profile";
import ParcelListClient from "@/components/parcele/ParcelListClient";

export const dynamic = "force-dynamic";

export default async function ParcelelePage() {
  const [parcels, user] = await Promise.all([
    getParcels(),
    getCurrentUser()
  ]);

  const farmBase = user?.organization?.baseLat && user?.organization?.baseLng 
    ? { lat: Number(user.organization.baseLat), lng: Number(user.organization.baseLng) } 
    : null;

  return <ParcelListClient initialParcels={parcels} farmBase={farmBase} />;
}
