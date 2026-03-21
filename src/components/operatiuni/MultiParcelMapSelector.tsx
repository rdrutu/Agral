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
      try {
        const bounds = L.latLngBounds(allCoords);
        map.fitBounds(bounds, { padding: [50, 50], animate: false });
      } catch (e) {
        console.error("Leaflet fitBounds error", e);
      }
    }
  }, [parcels, map]);

  return null;
}

export default function MultiParcelMapSelector({ 
  parcels, 
  availableIds = [],
  selectedIds, 
  onToggleParcel 
}: { 
  parcels: any[], 
  availableIds?: string[],
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

  return (<>
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
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
          maxZoom={19}
        />
        
        <MapBoundsFitter parcels={parcels} />

        {parcels.map((p, i) => {
          if (!p.coordinates?.geometry?.coordinates) return null;
          
          const isAvailable = availableIds.includes(p.id);
          const isSelected = selectedIds.includes(p.id);
          const baseColor = isAvailable ? colors[i % colors.length] : "#64748b"; // slate-500 for unavailable

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
                fillOpacity: isSelected ? 0.7 : isAvailable ? 0.3 : 0.1,
                weight: isSelected ? 3 : isAvailable ? 2 : 1,
                dashArray: (isSelected || !isAvailable) ? undefined : "5, 5"
              }}
              eventHandlers={{
                click: () => isAvailable && onToggleParcel(p.id)
              }}
            >
              <Tooltip direction="center" className="font-sans font-bold text-sm bg-white/90 backdrop-blur border-none shadow-lg">
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

        {/* Adăugare Markere cu Iconițe de Cultură și Pinuri */}
        {parcels.map((p) => {
          if (!p.coordinates?.geometry?.coordinates) return null;
          
          const isAvailable = availableIds.includes(p.id);
          const isSelected = selectedIds.includes(p.id);
          const cropType = p.cropPlans?.[0]?.cropType;
          const ring = p.coordinates.geometry.coordinates[0];
          
          // Calcul centroid
          let latSum = 0, lngSum = 0;
          ring.forEach((c: [number, number]) => {
            lngSum += c[0];
            latSum += c[1];
          });
          const center: [number, number] = [latSum / ring.length, lngSum / ring.length];
          
          const cropEmoji = cropType && cropIcons[cropType] ? cropIcons[cropType] : "📍";
          
          // Custom marker styling with an animated pulse if selected
          const iconHtml = `
            <div style="
              position: relative;
              display: flex;
              align-items: center;
              justify-content: center;
              opacity: ${isAvailable ? 1 : 0.6};
            ">
              ${isSelected ? `
                <div style="
                  position: absolute;
                  width: 48px;
                  height: 48px;
                  background-color: #22c55e;
                  border-radius: 50%;
                  opacity: 0.3;
                  animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
                "></div>
              ` : ''}
              <div style="
                width: 36px; 
                height: 36px; 
                background-color: ${isSelected ? '#22c55e' : (isAvailable ? '#f59e0b' : '#94a3b8')}; 
                border: 3px solid white; 
                border-radius: 50% 50% 50% 0; 
                transform: rotate(-45deg); 
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10;
              ">
                <span style="transform: rotate(45deg); font-size: 16px; display: flex; align-items: center; justify-content: center; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.5));">
                  ${isSelected ? '✅' : (isAvailable ? cropEmoji : '🚫')}
                </span>
              </div>
            </div>
            <style>
              @keyframes ping {
                75%, 100% {
                  transform: scale(2);
                  opacity: 0;
                }
              }
            </style>
          `;

          return (
            <Marker
              key={`icon-${p.id}`}
              position={center}
              zIndexOffset={isSelected ? 1000 : 0}
              eventHandlers={{
                click: () => onToggleParcel(p.id)
              }}
              icon={L.divIcon({
                html: iconHtml,
                className: 'custom-pin-marker',
                iconSize: [36, 36],
                iconAnchor: [18, 36] // Anchor at the bottom tip of the pin
              })}
            >
              <Tooltip direction="top" offset={[0, -36]} className="font-bold text-sm bg-white/90 shadow-lg">
                <div className="flex flex-col items-center">
                  <span className="text-foreground">{p.name}</span>
                  <span className={isSelected ? "text-green-600 font-extrabold" : (isAvailable ? "text-amber-600" : "text-destructive font-bold")}>
                    {isSelected ? "Selectată (Click pt deselectare)" : (isAvailable ? "Apasă pentru selectare" : `Ocupată: ${p.cropPlans?.[0]?.cropType || 'Altă cultură'}`)}
                  </span>
                </div>
              </Tooltip>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Overlay indicator jos harta */}
      <div className="absolute bottom-4 left-4 z-[400] pointer-events-none bg-background/90 backdrop-blur-md px-3 py-2 rounded-lg text-xs font-semibold shadow-xl border flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#22c55e] border border-white shadow-sm flex items-center justify-center text-[8px] text-white">✓</div>
          Selectată activ
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#f59e0b] border border-white shadow-sm flex items-center justify-center text-[8px]">📍</div>
          Disponibilă (Deselectată)
        </div>
      </div>
    </div>

    {/* Lista Parcele jos (Sub Hartă) */}
    <div className="bg-background w-full mt-3 rounded-xl shadow-sm border p-3 flex flex-col gap-2">
        <div className="pb-2 mb-1 border-b flex items-center justify-between">
          <h4 className="text-sm font-bold text-foreground">Alege din listă manual ({parcels.length} disponibile)</h4>
          <span className="text-xs bg-primary/20 text-primary px-3 py-1 rounded-full font-bold">{selectedIds.length} selectate</span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[250px] overflow-y-auto pr-1">
          {parcels.length === 0 && <p className="text-xs text-muted-foreground col-span-full text-center py-4">Nicio parcelă găsită</p>}
          {parcels.map(p => {
            const isAvailable = availableIds.includes(p.id);
            const isSelected = selectedIds.includes(p.id);
            const cropType = p.cropPlans?.[0]?.cropType;

            return (
              <div 
                key={`list-${p.id}`}
                onClick={() => isAvailable && onToggleParcel(p.id)}
                className={`flex items-center justify-between p-2.5 rounded-lg border transition-all ${
                  isSelected ? 'bg-green-500/10 border-green-500/50 shadow-sm' : 
                  isAvailable ? 'hover:bg-muted bg-background border-border/50 cursor-pointer' : 
                  'bg-muted/50 border-border/30 opacity-60 cursor-not-allowed'
                }`}
              >
                <div className="flex flex-col overflow-hidden mr-2">
                   <div className="flex items-center gap-1.5">
                     <span className="text-sm font-semibold truncate" title={p.name}>{p.name}</span>
                     {!isAvailable && <span className="text-[9px] bg-destructive/10 text-destructive px-1.5 py-0.5 rounded uppercase font-bold">Ocupată</span>}
                   </div>
                   <span className="text-[11px] text-muted-foreground">
                     {Number(p.areaHa).toFixed(2)} ha • {cropType || p.landUse}
                   </span>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  isSelected ? 'bg-green-500 border-green-500 text-white' : 
                  isAvailable ? 'border-muted-foreground' : 
                  'border-muted/30 bg-muted/20'
                }`}>
                  {isSelected && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                  {!isSelected && !isAvailable && <div className="w-2 h-0.5 bg-muted-foreground/30 rotate-45" />}
                </div>
              </div>
            )
          })}
        </div>
    </div>
  </>);
}
