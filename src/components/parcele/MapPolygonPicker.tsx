"use client";

import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, FeatureGroup, GeoJSON, useMap } from "react-leaflet";
import { EditControl } from "react-leaflet-draw";
import L from "leaflet";
import * as turf from "@turf/turf";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet-control-geocoder/dist/Control.Geocoder.css";
import "leaflet-control-geocoder";

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

export function MapPolygonPicker({ onPolygonComplete, initialPolygon }: MapPolygonPickerProps) {
  const featureGroupRef = useRef<L.FeatureGroup>(null);

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

  return (
    <div className="space-y-2">
      <div className="bg-amber-50 text-amber-800 text-sm p-3 rounded-lg border border-amber-200">
        <strong>Cum se desenează o parcelă:</strong> Faceți click pe iconița ⬟ (Poligon) din dreapta-sus, apoi faceți click pe hartă pentru fiecare colț/pin al parcelei. Pentru a închide parcela, faceți dublu-click sau click pe primul punct.
      </div>
      <div className="h-[400px] w-full rounded-xl overflow-hidden border-2 border-primary/20 relative z-0">
        <MapContainer
        center={[44.4268, 26.1025]} // Poziție generică (București/România)
        zoom={13}
        className="h-full w-full"
      >
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution="Tiles &copy; Esri &mdash; Sursa: Esri... și the GIS User Community"
        />
        <MapSearchControl />
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
