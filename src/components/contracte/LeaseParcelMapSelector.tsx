"use client";

import { useEffect, useState } from "react";
import { 
  MapContainer, 
  TileLayer, 
  Polygon, 
  Tooltip, 
  useMap 
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

function MapBoundsFitter({ parcels }: { parcels: any[] }) {
  const map = useMap();

  useEffect(() => {
    if (parcels.length === 0) return;

    const allCoords: [number, number][] = [];
    parcels.forEach(p => {
      if (p.coordinates?.geometry?.coordinates) {
        const ring = p.coordinates.geometry.coordinates[0];
        if (ring) {
          ring.forEach((coord: [number, number]) => {
            allCoords.push([coord[1], coord[0]]);
          });
        }
      }
    });

    if (allCoords.length > 0) {
      const bounds = L.latLngBounds(allCoords);
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [parcels, map]);

  return null;
}

interface LeaseParcelMapSelectorProps {
  parcels: any[];
  selectedParcelId: string;
  onSelect: (parcelId: string) => void;
}

export default function LeaseParcelMapSelector({ 
  parcels, 
  selectedParcelId, 
  onSelect 
}: LeaseParcelMapSelectorProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Fix leaflet icons fallback
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });
  }, []);

  if (!mounted) return <div className="h-[300px] w-full bg-muted/20 animate-pulse rounded-lg border" />;

  return (
    <div className="h-[300px] w-full rounded-lg overflow-hidden border shadow-inner relative z-0">
      <MapContainer
        center={[45.9432, 24.9668]}
        zoom={6}
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; OSM'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          maxZoom={19}
        />
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
          maxZoom={19}
        />
        
        <MapBoundsFitter parcels={parcels} />

        {parcels.map((p) => {
          if (!p.coordinates?.geometry?.coordinates) return null;
          
          const isSelected = p.id === selectedParcelId;
          const ring = p.coordinates.geometry.coordinates[0];
          const positions: [number, number][] = ring.map((coord: [number, number]) => [coord[1], coord[0]]);

          return (
            <Polygon
              key={p.id}
              positions={positions}
              pathOptions={{
                color: isSelected ? "#3b82f6" : "#fbbf24",
                fillColor: isSelected ? "#3b82f6" : "#fbbf24",
                fillOpacity: isSelected ? 0.6 : 0.3,
                weight: isSelected ? 3 : 1.5,
              }}
              eventHandlers={{
                click: () => onSelect(p.id)
              }}
            >
              <Tooltip sticky>
                <div className="text-xs font-bold">
                  {p.name} ({p.areaHa} ha)
                  {isSelected && <span className="ml-1 text-blue-600 block">(Selectat)</span>}
                </div>
              </Tooltip>
            </Polygon>
          );
        })}
      </MapContainer>
      <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm p-2 rounded border shadow-sm text-[10px] font-bold z-[1000] pointer-events-none">
        Apasă pe o parcelă galbenă pentru a o selecta
      </div>
    </div>
  );
}
