import { getParcelDetails } from "@/lib/actions/parcels";
import ParcelDetailClient from "@/components/parcele/ParcelDetailClient";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ParcelDetailPage({ params }: PageProps) {
  const { id } = await params;
  
  try {
    const parcel = await getParcelDetails(id);
    return <ParcelDetailClient parcel={parcel} />;
  } catch (error) {
    console.error(error);
    return notFound();
  }
}
