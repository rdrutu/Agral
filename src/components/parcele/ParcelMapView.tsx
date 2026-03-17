"use client";

import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Repararea iconițelor de marker default
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface ParcelMapViewProps {
  geoJson: any;
}

export function ParcelMapView({ geoJson }: ParcelMapViewProps) {
  if (!geoJson) {
    return (
      <div className="h-full w-full bg-muted flex items-center justify-center text-muted-foreground font-medium italic">
        Nicio geometrie înregistrată pentru această parcelă.
      </div>
    );
  }

  // Calculăm centrul pentru a centra harta
  // GeoJSON geom (Polygon) -> Coordinates[0] e un array de puncte [lng, lat]
  const firstCoords = geoJson.geometry?.coordinates?.[0]?.[0] || [26.1025, 44.4268];
  const center: [number, number] = [firstCoords[1], firstCoords[0]];

  return (
    <div className="h-full w-full rounded-xl overflow-hidden relative z-0">
      <MapContainer
        center={center}
        zoom={15}
        className="h-full w-full"
        scrollWheelZoom={false}
      >
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution="&copy; Esri"
        />
        <GeoJSON 
          data={geoJson} 
          style={() => ({
            color: "#16a34a",
            fillOpacity: 0.4,
            weight: 3,
          })}
        />
      </MapContainer>
    </div>
  );
}
