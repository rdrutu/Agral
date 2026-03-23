"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Polygon, Popup, Tooltip, useMap, Marker, WMSTileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useRouter } from "next/navigation";
import { Layers } from "lucide-react";

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

function MapBoundsFitter({ parcels, farmBase }: { parcels: any[], farmBase?: {lat: number, lng: number} | null }) {
  const map = useMap();

  useEffect(() => {
    if (parcels.length === 0 && !farmBase) return;

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

    if (farmBase) {
       allCoords.push([farmBase.lat, farmBase.lng]);
    }

    if (allCoords.length > 0) {
      try {
        const bounds = L.latLngBounds(allCoords);
        map.fitBounds(bounds, { padding: [50, 50], animate: false });
      } catch (e) {
        console.error("Leaflet fitBounds error", e);
      }
    }
  }, [parcels, farmBase, map]);

  return null;
}

function ANCPITileLayer() {
  const map = useMap();

  useEffect(() => {
    const layer = L.tileLayer(
      'https://geoportal.ancpi.ro/maps/rest/services/ANCPI/CP_Yellow_vt/MapServer/tile/{z}/{y}/{x}?blankTile=false',
      {
        opacity: 0.6,
        minZoom: 10,
        maxZoom: 20,
        attribution: '© ANCPI',
      }
    );

    layer.addTo(map);
    return () => { layer.remove(); };
  }, [map]);

  return null;
}

export default function AllParcelsMapClient({ 
  parcels, 
  groups = [],
  farmBase 
}: { 
  parcels: any[],
  groups?: any[],
  farmBase?: {lat: number, lng: number} | null
}) {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  // Create a mapping of groupId to color
  const groupColorsMap = (groups || []).reduce((acc: any, g: any, idx: number) => {
    acc[g.id] = colors[idx % colors.length];
    return acc;
  }, {});

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

  if (!mounted) return <div className="h-[500px] w-full bg-muted/20 animate-pulse rounded-xl border border-border/50" />;

  const defaultCenter: [number, number] = farmBase ? [farmBase.lat, farmBase.lng] : [45.9432, 24.9668];

  return (
    <div className="h-[500px] w-full rounded-2xl overflow-hidden shadow-sm border border-border/50 relative group">
      <MapContainer
        center={defaultCenter}
        zoom={ farmBase ? 12 : 6 }
        scrollWheelZoom={true}
        className="h-full w-full z-0"
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
        <ANCPITileLayer />
        {/* Stratul Cadastral ANCPI WMS - Serviciul eterra3_publish (Layer 1) */}
        
        <MapBoundsFitter parcels={parcels} farmBase={farmBase} />

        {/* Poligoane */}
        {parcels.map((p) => {
          if (!p.coordinates?.geometry?.coordinates) return null;
          
          // Use group color if available, otherwise fallback to index-based or gray
          const baseColor = p.groupId ? groupColorsMap[p.groupId] : "#94a3b8"; 
          const ring = p.coordinates.geometry.coordinates[0];
          const positions: [number, number][] = ring.map((coord: [number, number]) => [coord[1], coord[0]]);

          return (
            <Polygon
              key={p.id}
              positions={positions}
              pathOptions={{
                color: baseColor,
                fillColor: baseColor,
                fillOpacity: 0.4,
                weight: 2,
              }}
              eventHandlers={{
                click: () => router.push(`/parcele/${p.id}`)
              }}
            >
              <Tooltip direction="center" className="font-bold text-sm bg-white/90 shadow-lg border-none rounded-lg p-3">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-foreground text-base mb-1">{p.name}</span>
                  {p.groupId && (
                    <div className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-full mb-1">
                      Sector: {groups.find(g => g.id === p.groupId)?.name}
                    </div>
                  )}
                  <div className="flex items-center gap-2 bg-muted/50 px-2 py-1 rounded w-full justify-center">
                     <span className="text-muted-foreground text-xs">Suprafață:</span>
                     <span className="text-primary text-sm">{Number(p.areaHa).toFixed(2)} ha</span>
                  </div>
                  <span className="text-muted-foreground text-xs uppercase tracking-wider mt-1">
                    {p.cropPlans?.[0]?.cropType ? (
                      <span className="flex items-center gap-1 font-bold text-amber-600">
                        {cropIcons[p.cropPlans[0].cropType] || "🌱"} {p.cropPlans[0].cropType}
                      </span>
                    ) : (
                      <span className="text-gray-500">Teren {p.landUse}</span>
                    )}
                  </span>
                </div>
              </Tooltip>
            </Polygon>
          );
        })}

        {/* Markere cu Iconițe de Cultură */}
        {parcels.map((p) => {
          if (!p.coordinates?.geometry?.coordinates) return null;
          
          const cropType = p.cropPlans?.[0]?.cropType;
          const ring = p.coordinates.geometry.coordinates[0];
          
          let latSum = 0, lngSum = 0;
          ring.forEach((c: [number, number]) => {
            lngSum += c[0];
            latSum += c[1];
          });
          const center: [number, number] = [latSum / ring.length, lngSum / ring.length];
          
          const cropEmoji = cropType && cropIcons[cropType] ? cropIcons[cropType] : "📍";
          const baseColor = p.groupId ? groupColorsMap[p.groupId] : "#10b981"; 
          
          const iconHtml = `
            <div style="
              width: 32px; 
              height: 32px; 
              background-color: ${baseColor}; 
              border: 2.5px solid white; 
              border-radius: 50% 50% 50% 0; 
              transform: rotate(-45deg); 
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5);
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <span style="transform: rotate(45deg); font-size: 14px; display: flex; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.5));">
                ${cropEmoji}
              </span>
            </div>
          `;

          return (
            <Marker
              key={`icon-${p.id}`}
              position={center}
              eventHandlers={{
                click: () => router.push(`/parcele/${p.id}`)
              }}
              icon={L.divIcon({
                html: iconHtml,
                className: 'custom-pin-marker',
                iconSize: [32, 32],
                iconAnchor: [16, 32] 
              })}
            />
          );
        })}

        {/* Marker Bază Ferma (Sediu) */}
        {farmBase && (
           <Marker 
             position={[farmBase.lat, farmBase.lng]}
             zIndexOffset={2000}
             icon={L.divIcon({
                html: `
                <div style="
                  width: 44px; 
                  height: 44px; 
                  background-color: #2563eb; 
                  border: 3px solid white; 
                  border-radius: 50% 50% 50% 0; 
                  transform: rotate(-45deg); 
                  box-shadow: 0 4px 8px rgba(0,0,0,0.4);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                ">
                  <span style="transform: rotate(45deg); font-size: 20px;">🏢</span>
                </div>
                `,
                className: 'custom-farm-marker',
                iconSize: [44, 44],
                iconAnchor: [22, 44]
             })}
           >
              <Tooltip direction="top" offset={[0, -40]} className="font-bold text-sm shadow-lg whitespace-nowrap" permanent={false}>
                Baza Fermei (Sediu)
              </Tooltip>
           </Marker>
        )}
      </MapContainer>

      {/* Legendă Sectoare Overlay */}
      <div className="absolute bottom-4 left-4 z-[400] bg-background/95 backdrop-blur-md px-4 py-3 rounded-2xl text-xs font-semibold shadow-2xl border border-primary/10 flex flex-col gap-2 min-w-[140px]">
        <h4 className="border-b pb-1.5 text-foreground flex items-center gap-2 font-bold uppercase tracking-tighter">
          <Layers className="w-3.5 h-3.5 text-primary" />
          Sectoare
        </h4>
        {groups.length > 0 ? (
          <div className="flex flex-col gap-2 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
            {groups.map((g, idx) => (
              <div key={g.id} className="flex items-center gap-2.5">
                <div 
                  className="w-3.5 h-3.5 rounded-full border border-white shadow-sm shrink-0" 
                  style={{ backgroundColor: colors[idx % colors.length] }} 
                />
                <span className="truncate max-w-[100px] text-muted-foreground">{g.name}</span>
              </div>
            ))}
            <div className="flex items-center gap-2.5 opacity-60">
                <div className="w-3.5 h-3.5 rounded-full bg-slate-400 border border-white shadow-sm shrink-0" />
                <span className="text-muted-foreground">Fără sector</span>
            </div>
          </div>
        ) : (
          <div className="text-[10px] text-muted-foreground italic">
            Niciun sector definit
          </div>
        )}
        <div className="mt-2 pt-2 border-t flex flex-col gap-2 border-primary/5">
           <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-600 border border-white shadow-sm flex items-center justify-center text-[10px]">🏢</div>
              <span className="text-muted-foreground">Sediu Fermă</span>
           </div>
        </div>
      </div>
    </div>
  );
}