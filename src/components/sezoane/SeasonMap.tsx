"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Polygon, Tooltip, useMap } from "react-leaflet";
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
      try {
        const bounds = L.latLngBounds(allCoords);
        map.fitBounds(bounds, { padding: [50, 50] });
      } catch (e) {
        console.error("Leaflet fitBounds error", e);
      }
    }
  }, [parcels, map]);

  return null;
}

export default function SeasonMap({ 
  parcels, 
  selectedIds, 
  onToggleSelection,
  plans
}: { 
  parcels: any[], 
  selectedIds: string[],
  onToggleSelection: (id: string) => void,
  plans: any[]
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

  if (!mounted) return <div className="h-full w-full bg-slate-100 animate-pulse rounded-2xl" />;

  return (
    <MapContainer
      center={[45.9432, 24.9668]}
      zoom={6}
      scrollWheelZoom={true}
      className="h-full w-full z-0 rounded-2xl"
    >
      <TileLayer
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
        
        const isSelected = selectedIds.includes(p.id);
        const plan = plans.find(pl => pl.parcelId === p.id);
        
        const ring = p.coordinates.geometry.coordinates[0];
        const positions: [number, number][] = ring.map((coord: [number, number]) => [coord[1], coord[0]]);

        // Color logic: Selected = Primary Blue, Planned = Greenish, Unplanned = Gray
        const color = isSelected ? "#3b82f6" : (plan ? "#10b981" : "#94a3b8");
        const weight = isSelected ? 4 : 2;
        const fillOpacity = isSelected ? 0.6 : 0.3;

        return (
          <Polygon
            key={p.id}
            positions={positions}
            pathOptions={{
              color: color,
              fillColor: color,
              fillOpacity: fillOpacity,
              weight: weight,
            }}
            eventHandlers={{
              click: (e) => {
                L.DomEvent.stopPropagation(e);
                onToggleSelection(p.id);
              }
            }}
          >
            <Tooltip direction="top" className="font-bold text-xs shadow-lg border-none rounded-lg">
              <div className="flex flex-col gap-0.5">
                <span className="text-slate-900">{p.name}</span>
                <span className="text-slate-500 text-[10px]">{Number(p.areaHa).toFixed(2)} ha</span>
                {plan && <span className="text-primary font-black uppercase text-[9px]">{plan.cropType}</span>}
              </div>
            </Tooltip>
          </Polygon>
        );
      })}
    </MapContainer>
  );
}
