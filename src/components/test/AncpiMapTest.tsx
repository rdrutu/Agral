"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, WMSTileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default marker icons
if (typeof L !== 'undefined' && L.Icon && L.Icon.Default) {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
}

function ANCPICadastruLayer() {
  // Revenim la INSPIRE CP_View conform cerinței userului
  const baseUrl = "https://geoportal.ancpi.ro/inspireview/services/CP/CP_View/MapServer/WMSServer";
  const proxyUrl = `/api/ancpi/proxy?url=${encodeURIComponent(baseUrl)}`;

  return (
    <WMSTileLayer
      url={proxyUrl}
      layers="CP.CadastralZoning,CP.CadastralParcel"
      format="image/png"
      transparent={true}
      version="1.1.1"
      attribution="© ANCPI INSPIRE"
      opacity={0.8}
      minZoom={6}
      maxZoom={20}
    />
  );
}

export default function AncpiMapTest() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="h-[600px] w-full bg-slate-100 animate-pulse rounded-2xl flex items-center justify-center text-slate-400 font-bold">
        Se inițializează harta...
      </div>
    );
  }

  return (
    <div className="h-[600px] w-full rounded-2xl overflow-hidden border-4 border-green-500/20 shadow-2xl relative">
      <MapContainer
        center={[46.7712, 23.5897] as [number, number]} // Cluj-Napoca
        zoom={14}
        className="h-full w-full"
      >
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution="Tiles &copy; Esri"
        />
        <ANCPICadastruLayer />
      </MapContainer>
      
      <div className="absolute top-4 left-4 z-[1000] bg-white/90 backdrop-blur-md p-4 rounded-xl border border-green-100 shadow-lg max-w-xs">
        <h3 className="font-bold text-green-800 mb-1">Test ANCPI Cadastru</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Acest strat (INSPIRE CP_View) devine vizibil de la <strong>zoom nivel 14</strong>. 
          Apropie-te de o localitate pentru a vedea limitele parcelelor.
        </p>
      </div>
    </div>
  );
}
