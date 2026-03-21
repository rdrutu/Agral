import { getWeatherData, countyCoords } from "@/lib/weather";
import { getUserOrganization } from "@/lib/actions/parcels";
import prisma from "@/lib/prisma";
import WeatherClient from "@/components/vreme/WeatherClient";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export default function WeatherPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black tracking-tight">Meteo & Agrometeo</h1>
        <p className="text-muted-foreground">Prognoza detaliată pentru sediul fermei și parcelele cheie.</p>
      </div>
      <Suspense fallback={<div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
        <WeatherDynamicContent />
      </Suspense>
    </div>
  );
}

async function WeatherDynamicContent() {
  const orgId = await getUserOrganization();
  if (!orgId) return <div>Neautorizat</div>;

  const org = await prisma.organization.findUnique({
    where: { id: orgId as string },
    include: { weatherPOIs: true } as any
  }) as any;

  const county = org?.county || "Bucuresti";
  const baseLat = org?.baseLat ? Number(org.baseLat) : null;
  const baseLng = org?.baseLng ? Number(org.baseLng) : null;

  const mainCoords = (baseLat && baseLng) 
    ? { lat: baseLat, lon: baseLng, name: "Ferma Mea (Sediu)" }
    : { ...countyCoords[county] || countyCoords["Bucuresti"], name: `Județ ${county}` };

  // Fetch initial weather for the main location
  const initialWeather = await getWeatherData(mainCoords.lat, mainCoords.lon);

  const pois = org?.weatherPOIs?.map((p: any) => ({
    id: p.id,
    name: p.name,
    lat: Number(p.lat),
    lon: Number(p.lng)
  })) || [];

  return (
    <WeatherClient 
      initialWeather={initialWeather} 
      mainLocation={mainCoords}
      pois={pois}
    />
  );
}
