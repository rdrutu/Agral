import { getParcelDetails } from "@/lib/actions/parcels";
import ParcelDetailClient from "@/components/parcele/ParcelDetailClient";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ParcelDetailPage({ params }: PageProps) {
  const { id } = await params;
  
  return (
    <Suspense fallback={<div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
      <ParcelDetailDynamicContent id={id} />
    </Suspense>
  );
}

async function ParcelDetailDynamicContent({ id }: { id: string }) {
  try {
    const parcel = await getParcelDetails(id);
    return <ParcelDetailClient parcel={parcel} />;
  } catch (error) {
    console.error(error);
    return notFound();
  }
}
