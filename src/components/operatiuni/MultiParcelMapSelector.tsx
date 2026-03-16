"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Polygon, Popup, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Marker } from "react-leaflet";

const cropIcons: Record<string, string> = {
  "Grâu": "🌾",
  "Porumb": "🌽",
  "Floarea Soarelui": "🌻",
  "Rapiță": "🟡",
  "Orz": "🌾",
  "Soia": "🟢",
  "Lucernă": "☘️",
  "Mazăre": "🫛",
  "Sfeclă de zahăr": "🥔",
  "Fâneață": "🌿",
  "Pârloagă": "🌫️"
};

const colors = [
  "#3b82f6", // blue-500
  "#10b981", // emerald-500
  "#f59e0b", // amber-500
  "#ec4899", // pink-500
  "#8b5cf6", // violet-500
  "#eab308", // yellow-500
];

function MapBoundsFitter({ parcels }: { parcels: any[] }) {
  const map = useMap();

  useEffect(() => {
    if (parcels.length === 0) return;

    const allCoords: [number, number][] = [];
    parcels.forEach(p => {
      if (p.coordinates?.geometry?.coordinates) {
        // GeoJSON polygons are [[[lng, lat], [lng, lat]...]]
        const ring = p.coordinates.geometry.coordinates[0];
        if (ring) {
          ring.forEach((coord: [number, number]) => {
            // Leaflet folosește [lat, lng], GeoJSON e [lng, lat]
            allCoords.push([coord[1], coord[0]]);
          });
        }
      }
    });

    if (allCoords.length > 0) {
      const bounds = L.latLngBounds(allCoords);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [parcels, map]);

  return null;
}

export default function MultiParcelMapSelector({ 
  parcels, 
  selectedIds, 
  onToggleParcel 
}: { 
  parcels: any[], 
  selectedIds: string[], 
  onToggleParcel: (id: string) => void 
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Fix leaflet icons
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });
  }, []);

  if (!mounted) return <div className="h-[400px] bg-muted/20 animate-pulse rounded-xl" />;

  const center: [number, number] = [45.9432, 24.9668]; // Centrul RO by default

  return (
    <div className="h-[400px] w-full rounded-xl overflow-hidden shadow-inner border border-border/50 relative">
      <MapContainer
        center={center}
        zoom={6}
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          maxZoom={19}
        />
        
        <MapBoundsFitter parcels={parcels} />

        {parcels.map((p, i) => {
          if (!p.coordinates?.geometry?.coordinates) return null;
          
          const isSelected = selectedIds.includes(p.id);
          const baseColor = colors[i % colors.length];

          // GeoJSON are ring(s) formattate [lng, lat]. Inversăm pt leaflet -> [lat, lng]
          const ring = p.coordinates.geometry.coordinates[0];
          const positions: [number, number][] = ring.map((coord: [number, number]) => [coord[1], coord[0]]);

          return (
            <Polygon
              key={p.id}
              positions={positions}
              pathOptions={{
                color: isSelected ? "#ffffff" : baseColor,
                fillColor: isSelected ? "#ffffff" : baseColor,
                fillOpacity: isSelected ? 0.7 : 0.3,
                weight: isSelected ? 3 : 2,
                dashArray: isSelected ? undefined : "5, 5"
              }}
              eventHandlers={{
                click: () => onToggleParcel(p.id)
              }}
            >
              <Tooltip sticky direction="top" className="font-sans font-bold text-sm bg-white/90 backdrop-blur border-none shadow-lg">
                <div className="flex flex-col items-center">
                  <span className="text-foreground">{p.name} {isSelected && "✅"}</span>
                  <span className="text-primary text-xs">{p.areaHa?.toString()} hectare</span>
                  <span className="text-muted-foreground text-[10px] uppercase tracking-wider">
                    {p.cropPlans?.[0]?.cropType ? (
                      <span className="flex items-center gap-1 font-bold text-amber-600">
                        {cropIcons[p.cropPlans[0].cropType] || "🌱"} {p.cropPlans[0].cropType}
                      </span>
                    ) : (
                      p.landUse
                    )}
                  </span>
                </div>
              </Tooltip>
            </Polygon>
          );
        })}

        {/* Adăugare Markere cu Iconițe de Cultură */}
        {parcels.map((p) => {
          if (!p.coordinates?.geometry?.coordinates) return null;
          const cropType = p.cropPlans?.[0]?.cropType;
          if (!cropType) return null;

          const ring = p.coordinates.geometry.coordinates[0];
          
          // Calcul centroid rapid (medie) în loc de L.polygon().getBounds()
          let latSum = 0, lngSum = 0;
          ring.forEach((c: [number, number]) => {
            lngSum += c[0];
            latSum += c[1];
          });
          const center: [number, number] = [latSum / ring.length, lngSum / ring.length];
          
          const icon = cropIcons[cropType] || "🌱";

          return (
            <Marker
              key={`icon-${p.id}`}
              position={center}
              icon={L.divIcon({
                html: `<div style="font-size: 24px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3)); transform: translate(-50%, -50%); cursor: pointer; pointer-events: none;">${icon}</div>`,
                className: 'crop-icon-marker',
                iconSize: [24, 24],
                iconAnchor: [12, 12]
              })}
            />
          );
        })}
      </MapContainer>
      
      {/* Overlay indicator */}
      <div className="absolute bottom-4 left-4 z-[400] bg-background/90 backdrop-blur-md px-3 py-2 rounded-lg text-xs font-semibold shadow-xl border flex items-center gap-2">
        <div className="w-3 h-3 rounded bg-white border border-border shadow-sm"></div>
        Parcelă selectată ({selectedIds.length})
      </div>
    </div>
  );
}
