"use client";

import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, FeatureGroup, GeoJSON, useMap, Marker, Tooltip, WMSTileLayer, useMapEvents } from "react-leaflet";
import { EditControl } from "react-leaflet-draw";
import { Search, Loader2, Globe } from "lucide-react";
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

// Componentă specială pentru stratul ANCPI care gestionează corect cererile WMS prin proxy
function ANCPITileLayer() {
  const map = useMap();

  useEffect(() => {
    // Folosim WMS prin proxy. Parametrii (bbox, etc) vor fi adăugați automat de Leaflet.
    const layer = L.tileLayer.wms(
      '/api/ancpi/proxy?url=' + encodeURIComponent('https://geoportal.ancpi.ro/arcgis/services/eterra3_publish/MapServer/WMSServer'),
      {
        layers: '1',
        format: 'image/png',
        transparent: true,
        version: '1.1.1',
        opacity: 0.7,
        minZoom: 13,
        attribution: '&copy; ANCPI Romania',
      }
    );

    layer.addTo(map);
    return () => { layer.remove(); };
  }, [map]);

  return null;
}

interface MapPolygonPickerProps {
  onPolygonComplete: (geoJson: any, areaHa: number, metadata?: {
    cadastralNumber?: string;
    cfNumber?: string;
    uat?: string;
  }) => void;
  initialPolygon?: any;
  baseLat?: number | null;
  baseLng?: number | null;
  onParcelFound?: (geoJson: any, metadata: any) => void;
}

function SearchOverlay({ onSelect }: { onSelect: (lat: number, lng: number) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [cadastralResults, setCadastralResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.length < 3) {
      setResults([]);
      setCadastralResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        // 1. Căutare Geografică (Nominatim)
        const geoPromise = fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=ro&addressdetails=1&limit=3`)
          .then(r => r.json());

        // 2. Căutare Cadastrală (ANCPI ArcGIS REST GeoJSON)
        const ancpiUrl = `https://geoportal.ancpi.ro/arcgis/rest/services/eterra3_publish/MapServer/1/query?f=geojson&where=nr_cadastral%20LIKE%20%27%25${encodeURIComponent(query)}%25%27&outFields=*&resultRecordCount=5&outSR=4326`;
        const ancpiPromise = fetch(`/api/ancpi/proxy?url=${encodeURIComponent(ancpiUrl)}`)
          .then(r => r.json());

        const [geoData, ancpiData] = await Promise.all([geoPromise, ancpiPromise]);
        
        setResults(geoData || []);
        if (ancpiData && ancpiData.features) {
          setCadastralResults(ancpiData.features);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="relative z-[100] w-full mb-3 max-w-sm">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Caută loc sau Nr. Cadastral..."
          className="pl-9 h-11 bg-background shadow-sm border-input"
        />
        {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />}
      </div>
      
      {(results.length > 0 || cadastralResults.length > 0) && (
        <div className="absolute top-12 left-0 w-full bg-white/95 backdrop-blur rounded-xl shadow-xl border border-border overflow-hidden max-h-80 overflow-y-auto">
          {/* Rezultate ANCPI */}
          {cadastralResults.map((r, idx) => (
            <div 
              key={`cad-${idx}`} 
              className="p-3 hover:bg-blue-50 cursor-pointer text-sm border-b border-blue-100 transition-colors flex items-center gap-2"
              onClick={() => {
                const ring = r.geometry.rings[0];
                if (ring && ring.length > 0) {
                   onSelect(ring[0][1], ring[0][0]); // Folosim primul punct pentru a zbura acolo
                }
                setQuery("");
                setResults([]);
                setCadastralResults([]);
              }}
            >
              <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[10px] font-bold">CAD</span>
              <div className="flex-1 overflow-hidden" suppressHydrationWarning>
                <div className="font-bold" suppressHydrationWarning>NR: {r.attributes.nr_cadastral}</div>
                <div className="text-[10px] text-muted-foreground" suppressHydrationWarning>{r.attributes.uats}</div>
              </div>
            </div>
          ))}

          {/* Rezultate Nominatim */}
          {results.map((r, idx) => (
            <div 
              key={`geo-${idx}`} 
              className="p-3 hover:bg-green-50 cursor-pointer text-sm border-b last:border-b-0 transition-colors"
              onClick={() => {
                onSelect(parseFloat(r.lat), parseFloat(r.lon));
                setQuery("");
                setResults([]);
                setCadastralResults([]);
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

function AncpiclickHandler({ onParcelFound }: { onParcelFound: (geoJson: any, metadata: any) => void }) {
  const [loading, setLoading] = useState(false);
  
  useMapEvents({
    click: async (e) => {
      setLoading(true);
      const { lat, lng } = e.latlng;
      try {
        // Bounding box mic in jurul click-ului (envelope conform recomandării utilizatorului)
        const d = 0.00005;
        const envelope = `${lng-d},${lat-d},${lng+d},${lat+d}`;
        
        const ancpiUrl = `https://geoportal.ancpi.ro/arcgis/rest/services/eterra3_publish/MapServer/1/query`
          + `?f=geojson&geometry=${encodeURIComponent(envelope)}&geometryType=esriGeometryEnvelope&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=*&returnGeometry=true&outSR=4326`;
        
        const response = await fetch(`/api/ancpi/proxy?url=${encodeURIComponent(ancpiUrl)}`);
        const data = await response.json();

        if (data.features && data.features.length > 0) {
          const feature = data.features[0];
          
          // Calculăm aria cu Turf.js (f=geojson ne dă direct feature-ul valid)
          const areaSqMeters = turf.area(feature);
          const areaHa = areaSqMeters / 10000;

          onParcelFound(feature, {
             cadastralNumber: feature.properties.nr_cadastral,
             cfNumber: feature.properties.nr_cf,
             uat: feature.properties.uats,
             areaHa: Number(areaHa.toFixed(2))
          });
        }
      } catch (err) {
        console.error("Eroare interogare ANCPI", err);
      } finally {
        setLoading(false);
      }
    }
  });

  return null;
}

export function MapPolygonPicker({ onPolygonComplete, initialPolygon, baseLat, baseLng, onParcelFound }: MapPolygonPickerProps) {
  const featureGroupRef = useRef<L.FeatureGroup>(null);
  const mapRef = useRef<any>(null);
  const [ancpiStatus, setAncpiStatus] = useState<{ status: 'testing' | 'ok' | 'fail' | 'idle', message?: string }>({ status: 'idle' });

  // Verificare conectivitate ANCPI
  useEffect(() => {
    const checkConnection = async () => {
      setAncpiStatus({ status: 'testing' });
      try {
        // Folosim de lista de servicii ca test de "Online" fiindcă e mult mai stabilă decât serviciul eterra3_publish
        const testUrl = `https://geoportal.ancpi.ro/arcgis/rest/services?f=json`;
        const res = await fetch(`/api/ancpi/proxy?url=${encodeURIComponent(testUrl)}`);
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: 'Eroare necunoscută' }));
          setAncpiStatus({ status: 'fail', message: errorData.error || `Serverul a răspuns cu ${res.status}` });
          return;
        }

        const data = await res.json();
        if (data.error) {
          setAncpiStatus({ status: 'fail', message: data.error.message || 'Eroare ANCPI' });
        } else {
          setAncpiStatus({ status: 'ok' });
        }
      } catch (e: any) {
        setAncpiStatus({ status: 'fail', message: 'Eroare conexiune' });
      }
    };
    checkConnection();
  }, []);

  const handleSelectLocation = (lat: number, lng: number) => {
    if (mapRef.current) {
      mapRef.current.flyTo([lat, lng], 15);
    }
  };

  // Activare "Punct / Desen" auto-magică pentru fermier
  useEffect(() => {
    if (initialPolygon) return; 
    
    let isMounted = true;
    const timer = setTimeout(() => {
      if (!isMounted) return;
      const btn = document.querySelector('.leaflet-draw-draw-polygon') as HTMLElement;
      if (btn) btn.click();
    }, 500);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
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
    <div className="space-y-2" suppressHydrationWarning>
      <div className="bg-blue-50 text-blue-800 text-sm p-4 rounded-xl border border-blue-200" suppressHydrationWarning>
        <div className="font-bold flex items-center justify-between mb-1" suppressHydrationWarning>
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Mod Automat Cadastru (ANCPI):
          </div>
          <div className="flex items-center gap-2">
            {ancpiStatus.status === 'testing' && <Loader2 className="w-3 h-3 animate-spin" />}
            {ancpiStatus.status === 'ok' && <div className="flex items-center gap-1 text-green-600 text-[10px] bg-green-50 px-2 py-0.5 rounded-full border border-green-200"><div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Server Online</div>}
            {ancpiStatus.status === 'fail' && (
              <div className="flex flex-col items-end">
                <div className="text-red-600 text-[10px] bg-red-50 px-2 py-0.5 rounded-full border border-red-200">Server Offline</div>
                {ancpiStatus.message && <span className="text-[9px] text-red-400 mt-0.5">{ancpiStatus.message}</span>}
              </div>
            )}
          </div>
        </div>
        <div className="text-[11px] opacity-80" suppressHydrationWarning>
          Când este activ, poți căuta după Număr Cadastral sau poți da click direct pe hartă pentru a asocia geometria și datele ANCPI automat.
        </div>
      </div>
      
      <SearchOverlay onSelect={handleSelectLocation} />
      
      <div className="h-[450px] w-full rounded-xl overflow-hidden border-2 border-primary/20 relative z-0">
        <MapContainer
        center={initialCenter}
        zoom={initialZoom}
        className="h-full w-full z-0"
        ref={mapRef}
      >
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution="Tiles &copy; Esri"
          maxZoom={19}
        />
        
        {/* Stratul Cadastral ANCPI WMS - Serviciul eterra3_publish (Layer 1) */}
        <ANCPITileLayer />
        

        <AncpiclickHandler onParcelFound={(geoJson, meta) => {
          onPolygonComplete(geoJson, meta.areaHa, {
            cadastralNumber: meta.cadastralNumber,
            cfNumber: meta.cfNumber,
            uat: meta.uat
          });
          
          // Afișăm poligonul pe hartă (simulăm un eveniment de creare)
          if (featureGroupRef.current) {
            featureGroupRef.current.clearLayers();
            const layer = L.geoJSON(geoJson as any, {
              style: {
                color: "#16a34a",
                fillOpacity: 0.4,
                weight: 3,
              }
            });
            layer.addTo(featureGroupRef.current);
          }
        }} />

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
        </FeatureGroup>

        {baseLat && baseLng && (
          <Marker 
            position={[baseLat, baseLng]}
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
      </div>
    </div>
  );
}
