import { getWeatherData, countyCoords } from "@/lib/weather";
import { getUserOrganization } from "@/lib/actions/parcels";
import prisma from "@/lib/prisma";
import WeatherClient from "@/components/vreme/WeatherClient";

export default async function WeatherPage() {
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
    <div className="p-6">
      <WeatherClient 
        initialWeather={initialWeather} 
        mainLocation={mainCoords}
        pois={pois}
      /> as any
    </div>
  );
}
