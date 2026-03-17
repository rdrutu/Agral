"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-control-geocoder/dist/Control.Geocoder.css";
import "leaflet-control-geocoder";

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

function MapSearchControl() {
  const map = useMap();

  useEffect(() => {
    if (!(L.Control as any).geocoder) return;

    const geocoder = (L.Control as any).geocoder({
      defaultMarkGeocode: false,
      placeholder: "Caută localitate/zonă...",
      position: "topleft"
    })
      .on("markgeocode", function (e: any) {
        const bbox = e.geocode.bbox;
        map.fitBounds(bbox);
      })
      .addTo(map);

    return () => {
      map.removeControl(geocoder);
    };
  }, [map]);

  return null;
}

function LocationMarker({ lat, lng, onChange }: BaseLocationPickerProps) {
  const map = useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  return lat && lng ? (
    <Marker position={[lat, lng]} />
  ) : null;
}

function SetViewOnChange({ lat, lng }: { lat: number | null, lng: number | null }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      map.setView([lat, lng], 13);
    }
  }, [lat, lng, map]);
  return null;
}

export default function BaseLocationPicker({ lat, lng, onChange }: BaseLocationPickerProps) {
  return (
    <div className="space-y-2">
      <div className="bg-blue-50 text-blue-800 text-xs p-3 rounded-lg border border-blue-200">
        <strong>Setează locația fermei:</strong> Fă click pe hartă pentru a marca sediul sau punctul central al fermei tale. Această locație va fi folosită pentru datele meteo de pe dashboard.
      </div>
      <div className="h-[300px] w-full rounded-xl overflow-hidden border-2 border-primary/20 relative z-0">
        <MapContainer
          center={[lat || 44.4268, lng || 26.1025]}
          zoom={lat ? 13 : 6}
          className="h-full w-full"
        >
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution="Esri"
          />
          <MapSearchControl />
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
