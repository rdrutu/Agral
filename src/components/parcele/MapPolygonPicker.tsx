"use client";

import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, FeatureGroup, GeoJSON, useMap } from "react-leaflet";
import { EditControl } from "react-leaflet-draw";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import L from "leaflet";
import * as turf from "@turf/turf";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";

// Repararea iconițelor de marker default pentru packagerele moderne
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface MapPolygonPickerProps {
  onPolygonComplete: (geoJson: any, areaHa: number) => void;
  initialPolygon?: any;
  baseLat?: number | null;
  baseLng?: number | null;
}

function SearchOverlay({ onSelect }: { onSelect: (lat: number, lng: number) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.length < 3) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=ro&addressdetails=1&limit=5`);
        const data = await response.json();
        setResults(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="relative z-[100] w-full mb-3 max-w-sm">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Caută în România..."
          className="pl-9 h-11 bg-background shadow-sm border-input"
        />
        {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />}
      </div>
      
      {results.length > 0 && (
        <div className="absolute top-12 left-0 w-full bg-white/95 backdrop-blur rounded-xl shadow-xl border border-border overflow-hidden max-h-60 overflow-y-auto">
          {results.map((r, idx) => (
            <div 
              key={idx} 
              className="p-3 hover:bg-green-50 cursor-pointer text-sm border-b last:border-b-0 transition-colors"
              onClick={() => {
                onSelect(parseFloat(r.lat), parseFloat(r.lon));
                setQuery("");
                setResults([]);
              }}
            >
              Către: {r.display_name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function MapPolygonPicker({ onPolygonComplete, initialPolygon, baseLat, baseLng }: MapPolygonPickerProps) {
  const featureGroupRef = useRef<L.FeatureGroup>(null);
  const mapRef = useRef<any>(null);

  const handleSelectLocation = (lat: number, lng: number) => {
    if (mapRef.current) {
      mapRef.current.flyTo([lat, lng], 15);
    }
  };

  // Activare "Punct / Desen" auto-magică pentru fermier
  useEffect(() => {
    if (initialPolygon) return; // Dacă o edităm pe una existentă, o lăsăm în pace.
    
    const timer = setTimeout(() => {
      const btn = document.querySelector('.leaflet-draw-draw-polygon') as HTMLElement;
      if (btn) btn.click();
    }, 500);
    return () => clearTimeout(timer);
  }, [initialPolygon]);

  const onCreated = (e: any) => {
    const { layerType, layer } = e;
    if (layerType === "polygon") {
      const geoJson = layer.toGeoJSON();
      // Calculăm aria cu Turf.js (întoarce metri pătrați) -> convertim în Hectare
      const areaSqMeters = turf.area(geoJson);
      const areaHa = areaSqMeters / 10000;
      
      onPolygonComplete(geoJson, Number(areaHa.toFixed(2)));

      // Eliminăm poligoanele vechi dacă fermierul desenează unul nou
      if (featureGroupRef.current) {
        featureGroupRef.current.eachLayer((l) => {
          if (l !== layer && (l as any)._leaflet_id !== layer._leaflet_id) {
            featureGroupRef.current?.removeLayer(l);
          }
        });
      }
    }
  };

  const onEdited = (e: any) => {
    const layers = e.layers;
    let lastGeoJson = null;
    let lastAreaHa = 0;
    
    layers.eachLayer((layer: any) => {
      lastGeoJson = layer.toGeoJSON();
      const areaSqMeters = turf.area(lastGeoJson);
      lastAreaHa = areaSqMeters / 10000;
    });

    if (lastGeoJson) {
      onPolygonComplete(lastGeoJson, Number(lastAreaHa.toFixed(2)));
    }
  };

  const onDeleted = () => {
    onPolygonComplete(null, 0);
  };

  // Centrare inițială bazată pe baseLat/baseLng dacă există
  const initialCenter: [number, number] = (baseLat && baseLng) 
    ? [baseLat, baseLng] 
    : [45.9, 25.0]; // Centru România
  const initialZoom = (baseLat && baseLng) ? 14 : 6;

  return (
    <div className="space-y-2">
      <div className="bg-amber-50 text-amber-800 text-sm p-3 rounded-lg border border-amber-200">
        <strong>Cum se desenează o parcelă:</strong> Faceți click pe iconița ⬟ (Poligon) din dreapta-sus, apoi faceți click pe hartă pentru fiecare colț/pin al parcelei. Pentru a închide parcela, faceți dublu-click sau click pe primul punct.
      </div>
      <SearchOverlay onSelect={handleSelectLocation} />
      <div className="h-[400px] w-full rounded-xl overflow-hidden border-2 border-primary/20 relative z-0">
        <MapContainer
        center={initialCenter}
        zoom={initialZoom}
        className="h-full w-full z-0"
        ref={mapRef}
      >
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution="Tiles &copy; Esri &mdash; Sursa: Esri... și the GIS User Community"
        />
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
        />
        <FeatureGroup ref={featureGroupRef}>
          <EditControl
            position="topright"
            onCreated={onCreated}
            onEdited={onEdited}
            onDeleted={onDeleted}
            draw={{
              rectangle: false,
              circle: false,
              circlemarker: false,
              marker: false,
              polyline: false,
              polygon: {
                allowIntersection: false,
                drawError: {
                  color: "#ef4444",
                  message: "<strong>Eroare:</strong> marginile nu se pot intersecta!",
                },
                shapeOptions: {
                  color: "#16a34a",
                  fillOpacity: 0.4,
                  weight: 3,
                },
              },
            }}
          />
          {initialPolygon && <GeoJSON data={initialPolygon} />}
        </FeatureGroup>
      </MapContainer>
      </div>
    </div>
  );
}
