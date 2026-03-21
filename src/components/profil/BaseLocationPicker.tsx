"use client";

import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import { Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Reparare iconițe
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface BaseLocationPickerProps {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
}

function LocationMarker({ lat, lng, onChange }: BaseLocationPickerProps) {
  const map = useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
      // Nu facem flyTo cu zoom fix, lăsăm zoom-ul curent al utilizatorului
      map.panTo(e.latlng);
    },
  });

  return lat && lng ? (
    <Marker position={[lat, lng]} />
  ) : null;
}

function SetViewOnChange({ lat, lng }: { lat: number | null, lng: number | null }) {
  const map = useMap();
  const [hasSetInitial, setHasSetInitial] = useState(false);

  useEffect(() => {
    if (lat && lng && !hasSetInitial) {
      map.setView([lat, lng], 14);
      setHasSetInitial(true);
    }
  }, [lat, lng, map, hasSetInitial]);
  return null;
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

export default function BaseLocationPicker({ lat, lng, onChange }: BaseLocationPickerProps) {
  const mapRef = useRef<any>(null);

  const handleSelectLocation = (lat: number, lng: number) => {
    onChange(lat, lng);
    if (mapRef.current) {
      mapRef.current.flyTo([lat, lng], 14);
    }
  };

  return (
    <div className="space-y-2">
      <div className="bg-blue-50 text-blue-800 text-xs p-3 rounded-lg border border-blue-200">
        <strong>Setează locația fermei:</strong> Fă click pe hartă pentru a marca sediul sau punctul central al fermei tale. Această locație va fi folosită pentru datele meteo de pe dashboard.
      </div>
      <SearchOverlay onSelect={handleSelectLocation} />
      <div className="h-[300px] w-full rounded-xl overflow-hidden border-2 border-primary/20 relative z-0">
        <MapContainer
          center={[lat || 45.9, lng || 25.0]} // România centrat
          zoom={lat ? 13 : 6}
          className="h-full w-full z-0"
          ref={mapRef}
        >
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution="Esri"
          />
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
          />
          <LocationMarker lat={lat} lng={lng} onChange={onChange} />
          <SetViewOnChange lat={lat} lng={lng} />
        </MapContainer>
      </div>
      {lat && (
        <p className="text-[10px] text-muted-foreground italic">
          Coordonate selectate: {lat.toFixed(6)}, {lng?.toFixed(6)}
        </p>
      )}
    </div>
  );
}
