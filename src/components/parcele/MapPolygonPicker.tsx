"use client";

import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, FeatureGroup, GeoJSON, useMap, Marker, Tooltip, WMSTileLayer, useMapEvents, Popup, Polygon } from "react-leaflet";
import { EditControl } from "react-leaflet-draw";
import { Globe, Loader2, MousePointer2, Plus, Search, Layers, X } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import L from "leaflet";

// Leaflet plugins need to be imported only on the client
if (typeof window !== 'undefined') {
  require('leaflet.vectorgrid');
}

import * as turf from "@turf/turf";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import { getPhysicalBlockAt } from "@/lib/actions/lpis";

// Aranjăm iconițele de marker default pentru packagerele moderne
if (typeof L !== 'undefined' && L.Icon && L.Icon.Default) {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
}

// --- Componentă pentru stratul local LPIS (Vector Tiles) ---
function LPISTileLayer() {
  const map = useMap();
  useEffect(() => {
    if (!(L as any).vectorGrid) {
        console.warn("Leaflet VectorGrid not loaded");
        return;
    }
    const layer = (L as any).vectorGrid.protobuf('/api/tiles/{z}/{x}/{y}', {
      rendererFactory: (L as any).canvas.tile,
      vectorTileLayerName: 'lpis_blocks',
      interactive: true,
      maxZoom: 19,
      style: {
        lpis_blocks: {
          weight: 1.5,
          color: '#f59e0b', // Amber 500
          opacity: 0.8,
          fill: true,
          fillColor: '#f59e0b',
          fillOpacity: 0.1
        }
      }
    });

    layer.addTo(map);
    return () => {
      if (map.hasLayer(layer)) map.removeLayer(layer);
    };
  }, [map]);
  return null;
}

// --- Componentă pentru click în baza locală ---
function LocalClickHandler({ enabled, onParcelFound, loading, setLoading }: { 
  enabled: boolean, 
  onParcelFound: (f: any) => void,
  loading: boolean,
  setLoading: (l: boolean) => void
}) {
  useMapEvents({
    click: async (e) => {
      if (!enabled || loading) return;
      
      const { lat, lng } = e.latlng;
      setLoading(true);

      try {
        const feature = await getPhysicalBlockAt(lat, lng);
        if (feature) {
          onParcelFound(feature);
          toast.success("Bloc fizic LPIS identificat!");
        } else {
          toast.error("Nu s-a găsit niciun bloc fizic în baza locală.");
        }
      } catch (err) {
        console.error("Eroare local DB:", err);
        toast.error("Eroare la interogarea bazei de date locale.");
      } finally {
        setLoading(false);
      }
    }
  });
  return null;
}

function AncpiclickHandler({ 
  onParcelFound, 
  loading, 
  setLoading, 
  setSelectedParcel,
  enabled
}: { 
  onParcelFound: (feature: any) => void, 
  loading: boolean, 
  setLoading: (l: boolean) => void,
  setSelectedParcel: (p: any) => void,
  enabled: boolean
}) {
  useMapEvents({
    click: async (e) => {
      if (!enabled || loading) return;
      
      const { lat, lng } = e.latlng;
      setLoading(true);
      setSelectedParcel(null);

      try {
        // Query ANCPI la punct (Imobile MapServer)
        const ancpiUrl = `https://geoportal.ancpi.ro/maps/rest/services/imobile/Imobile/MapServer/1/query`
          + `?f=json&geometry=${lng},${lat}&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=*&returnGeometry=true&outSR=4326`;
        
        const response = await fetch(`/api/ancpi/proxy?url=${encodeURIComponent(ancpiUrl)}`);
        
        if (!response.ok) throw new Error("Eroare server ANCPI");
        
        const data = await response.json();

        if (data.features && data.features.length > 0) {
          const feature = data.features[0];
          // Conversie ArcGIS JSON → GeoJSON standard
          const geoJsonFeature = {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: feature.geometry.rings
            },
            properties: feature.attributes
          };
          onParcelFound(geoJsonFeature);
          toast.success("Parcelă identificată!");
        } else {
          toast.error("Nu s-a găsit nicio parcelă la această locație.");
        }
      } catch (err: any) {
        console.error("Eroare interogare ANCPI", err);
        toast.error("Eroare la interogarea serviciului ANCPI.");
      } finally {
        setLoading(false);
      }
    }
  });

  return null;
}

function ANCPITileLayer() {
  const map = useMap();

  useEffect(() => {
    if (!(L as any).vectorGrid) {
      console.error('leaflet.vectorgrid nu e disponibil');
      return;
    }

    // @ts-ignore - plugin-ul extinde obiectul L
    const layer = (L as any).vectorGrid.protobuf(
      'https://geoportal.ancpi.ro/hosted_services/rest/services/Hosted/Grile_VT_2025/VectorTileServer/tile/{z}/{y}/{x}.pbf',
      {
        vectorTileLayerStyles: {
          '*': {
            fill: true,
            fillColor: '#ffff00',
            fillOpacity: 0.1,
            color: '#ff7800',
            weight: 1,
            opacity: 0.8,
          }
        },
        minZoom: 9,
        maxZoom: 20,
        attribution: '© ANCPI',
        // Override getTileUrl să limiteze zoom-ul la 11
        getTileUrl: (coords: any) => {
          const z = Math.min(coords.z, 11); // ← max zoom 11
          return `https://geoportal.ancpi.ro/hosted_services/rest/services/Hosted/Grile_VT_2025/VectorTileServer/tile/${z}/${coords.y}/${coords.x}.pbf`;
        }
      }
    );

    layer.addTo(map);

    return () => {
      // Curățare straturi vectoriale la demontare
      map.eachLayer((l: any) => {
        if (l._vectorTiles) map.removeLayer(l);
      });
    };
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
  parcels?: any[];
}

function SearchOverlay({ 
  onSelect, 
  onParcelSelect 
}: { 
  onSelect: (lat: number, lng: number) => void,
  onParcelSelect?: (feature: any) => void
}) {
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

        // 2. Căutare Cadastrală (ANCPI ArcGIS REST GeoJSON) prin PROXY
        // Îmbunătățire logică: căutăm după număr și localitate dacă există spațiu
        const cleanQuery = query.trim();
        const parts = cleanQuery.split(/\s+/);
        let whereClause = "";
        
        if (parts.length > 1) {
          // Ex: "12345 Oradea" -> căutăm număr și UAT
          // Încercăm ambele variante (nr-uat și uat-nr) pentru flexibilitate
          whereClause = `(nr_cadastral LIKE '%${parts[0]}%' AND uats LIKE '%${parts[1]}%') OR (nr_cadastral LIKE '%${parts[1]}%' AND uats LIKE '%${parts[0]}%')`;
        } else {
          whereClause = `nr_cadastral LIKE '%${cleanQuery}%' OR uats LIKE '%${cleanQuery}%'`;
        }

        const ancpiUrl = `https://geoportal.ancpi.ro/arcgis/rest/services/eterra3_publish/MapServer/1/query?f=geojson&where=${encodeURIComponent(whereClause)}&outFields=*&resultRecordCount=5&outSR=4326`;
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
          placeholder="Ex: 12345 Oradea..."
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
                if (onParcelSelect) {
                  onParcelSelect(r);
                } else {
                  const ring = r.geometry.rings?.[0] || r.geometry.coordinates?.[0];
                  if (ring && ring.length > 0) {
                     // Nominatim/GeoJSON format varies
                     const lat = Array.isArray(ring[0]) ? ring[0][1] : ring[1];
                     const lng = Array.isArray(ring[0]) ? ring[0][0] : ring[0];
                     onSelect(lat, lng);
                  }
                }
                setQuery("");
                setResults([]);
                setCadastralResults([]);
              }}
            >
              <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[10px] font-bold">CAD</span>
              <div className="flex-1 overflow-hidden" suppressHydrationWarning>
                <div className="font-bold" suppressHydrationWarning>NR: {r.properties?.nr_cadastral || r.attributes?.nr_cadastral}</div>
                <div className="text-[10px] text-muted-foreground" suppressHydrationWarning>{r.properties?.uats || r.attributes?.uats}</div>
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


export function MapPolygonPicker({ 
  onPolygonComplete, 
  initialPolygon, 
  baseLat, 
  baseLng, 
  onParcelFound,
  parcels = []
}: MapPolygonPickerProps) {
  const mapRef = useRef<L.Map | null>(null);
  const featureGroupRef = useRef<L.FeatureGroup | null>(null);
  const [selectedParcel, setSelectedParcel] = useState<any>(null);
  const [loadingParcel, setLoadingParcel] = useState(false);
  const [selectionMode, setSelectionMode] = useState<'auto' | 'manual' | 'local'>('local'); // Default local acum că avem date
  const [ancpiStatus, setAncpiStatus] = useState<{status: 'testing' | 'ok' | 'fail'}>({status: 'testing'});

  // Verificare conectivitate ANCPI via Tile direct
  useEffect(() => {
    setAncpiStatus({ status: 'testing' });
    const img = new Image();
    img.onload = () => setAncpiStatus({ status: 'ok' });
    img.onerror = () => setAncpiStatus({ status: 'fail' });
    img.src = 'https://geoportal.ancpi.ro/maps/rest/services/ANCPI/CP_Yellow_vt/MapServer/tile/10/14218/14227?blankTile=false';
  }, []);

  const handleSelectLocation = (lat: number, lng: number) => {
    if (mapRef.current) {
      mapRef.current.flyTo([lat, lng], 15);
    }
  };

  const handleParcelSelect = (feature: any) => {
    // Dacă e format GeoJSON (din căutare f=geojson) trebuie să normalizăm proprietățile
    // pentru a se potrivi cu ce așteaptă restul aplicației (care primește ArcGIS JSON convertit)
    const normalizedFeature = {
      ...feature,
      properties: {
        ...feature.properties,
        NATIONAL_CADASTRAL_REFERENCE: feature.properties?.nr_cadastral || feature.properties?.NATIONAL_CADASTRAL_REFERENCE,
        UATS: feature.properties?.uats || feature.properties?.UATS,
        // Aliniem câmpurile pentru componenta de adăugare
        uat: feature.properties?.uats || feature.properties?.UATS,
        cadastralNumber: feature.properties?.nr_cadastral || feature.properties?.NATIONAL_CADASTRAL_REFERENCE
      }
    };

    setSelectedParcel(normalizedFeature);
    
    // Zoom la parcelă
    if (mapRef.current) {
      const leafletGeoJson = L.geoJSON(feature);
      const bounds = leafletGeoJson.getBounds();
      mapRef.current.flyToBounds(bounds, { padding: [50, 50] });
    }
  };

  // Activare "Punct / Desen" manuală
  const handleManualDrawActivate = () => {
    setSelectedParcel(null);
    setSelectionMode('manual');
    // Mic delay pentru a ne asigura că re-render-ul s-a produs (optional, dar mai sigur)
    setTimeout(() => {
      const btn = document.querySelector('.leaflet-draw-draw-polygon') as HTMLElement;
      if (btn) btn.click();
    }, 50);
  };

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
            {ancpiStatus.status === 'fail' && (
              <span className="text-[10px] text-red-400 font-normal">Indisponibil</span>
            )}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-[11px] opacity-80" suppressHydrationWarning>
            {selectionMode === 'auto' && "Modul Automat (ANCPI): Identificare direct din serverele naționale."}
            {selectionMode === 'local' && "Modul Bază Locală (LPIS): Identificare instantanee din datele noastre 2025."}
            {selectionMode === 'manual' && "Modul Manual: Desenează parcela punct cu punct pe hartă."}
          </div>
          <div className="flex bg-white/20 p-1 rounded-lg self-start">
            <Button
              type="button"
              size="sm"
              variant={selectionMode === 'local' ? 'secondary' : 'ghost'}
              className={`h-7 text-[10px] px-3 font-bold ${selectionMode === 'local' ? 'bg-white text-blue-800' : 'text-white hover:bg-white/10'}`}
              onClick={() => {
                setSelectionMode('local');
                const cancelBtn = document.querySelector('.leaflet-draw-actions a[title="Cancel drawing"]') as HTMLElement;
                if (cancelBtn) cancelBtn.click();
              }}
            >
              <Layers className="w-3 h-3 mr-1" /> Bază Locală
            </Button>
            <Button
              type="button"
              size="sm"
              variant={selectionMode === 'auto' ? 'secondary' : 'ghost'}
              className={`h-7 text-[10px] px-3 font-bold ${selectionMode === 'auto' ? 'bg-white text-blue-800' : 'text-white hover:bg-white/10'}`}
              onClick={() => {
                setSelectionMode('auto');
                const cancelBtn = document.querySelector('.leaflet-draw-actions a[title="Cancel drawing"]') as HTMLElement;
                if (cancelBtn) cancelBtn.click();
              }}
            >
              <MousePointer2 className="w-3 h-3 mr-1" /> ANCPI
            </Button>
            <Button
              type="button"
              size="sm"
              variant={selectionMode === 'manual' ? 'secondary' : 'ghost'}
              className={`h-7 text-[10px] px-3 font-bold ${selectionMode === 'manual' ? 'bg-white text-blue-800' : 'text-white hover:bg-white/10'}`}
              onClick={handleManualDrawActivate}
            >
              <Plus className="w-3 h-3 mr-1" /> Manual
            </Button>
          </div>
        </div>
      </div>
      
      <SearchOverlay onSelect={handleSelectLocation} onParcelSelect={handleParcelSelect} />
      
      <div className="h-[450px] w-full rounded-xl overflow-hidden border-2 border-primary/20 relative z-0">
        <MapContainer
        center={initialCenter}
        zoom={initialZoom}
        className={`h-full w-full z-0 ${loadingParcel ? 'cursor-wait' : 'cursor-crosshair'}`}
        ref={mapRef}
      >
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution="Tiles &copy; Esri"
          maxZoom={19}
        />
        <ANCPITileLayer />
        
        {selectionMode === 'local' && (
          <>
            <LPISTileLayer />
            <LocalClickHandler 
              enabled={selectionMode === 'local'} 
              onParcelFound={handleParcelSelect}
              loading={loadingParcel}
              setLoading={setLoadingParcel}
            />
          </>
        )}
        
        <AncpiclickHandler 
          loading={loadingParcel}
          setLoading={setLoadingParcel}
          setSelectedParcel={setSelectedParcel}
          enabled={selectionMode === 'auto'}
          onParcelFound={(feature) => {
            setSelectedParcel(feature);
          }} 
        />

        {selectedParcel && (
          <>
            <GeoJSON
              key={`highlight-${selectedParcel.properties.INSPIRE_ID}`}
              data={selectedParcel}
              style={{
                color: "#f97316", // portocaliu
                fillOpacity: 0.3,
                weight: 4,
                dashArray: "5, 5"
              }}
            />
            <Popup position={L.geoJSON(selectedParcel).getBounds().getCenter()}>
              <div className="p-2 space-y-2 min-w-[200px]">
                <div className="border-b pb-2">
                  <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Parcelă Identificată</div>
                  <div className="font-bold text-sm">{selectedParcel.properties.NATIONAL_CADASTRAL_REFERENCE || 'Fără număr'}</div>
                  <div className="text-[10px] opacity-70">INSPIRE: {selectedParcel.properties.INSPIRE_ID}</div>
                </div>
                
                <div className="flex gap-2 pt-1">
                  <Button 
                    size="sm" 
                    className="flex-1 h-8 text-[11px] bg-orange-600 hover:bg-orange-700"
                    onClick={() => {
                      // Calculăm aria cu Turf.js
                      const areaSqMeters = turf.area(selectedParcel);
                      const areaHa = areaSqMeters / 10000;
                      
                      onPolygonComplete(selectedParcel, Number(areaHa.toFixed(2)), {
                        cadastralNumber: selectedParcel.properties.NATIONAL_CADASTRAL_REFERENCE,
                        uat: selectedParcel.properties.UATS // Verifică dacă acest câmp există în imobile/Imobile
                      });

                      // Adăugăm la FeatureGroup pentru vizualizare permanentă
                      if (featureGroupRef.current) {
                        featureGroupRef.current.clearLayers();
                        L.geoJSON(selectedParcel, {
                          style: { color: "#16a34a", fillOpacity: 0.4, weight: 3 }
                        }).addTo(featureGroupRef.current);
                      }
                      setSelectedParcel(null);
                    }}
                  >
                    <Plus className="w-3 h-3 mr-1" /> Adaugă
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1 h-8 text-[11px]"
                    onClick={() => setSelectedParcel(null)}
                  >
                    <X className="w-3 h-3 mr-1" /> Anulează
                  </Button>
                </div>
              </div>
            </Popup>
          </>
        )}

        {loadingParcel && (
          <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-white/20 backdrop-blur-[1px]">
             <div className="bg-white p-4 rounded-full shadow-2xl border border-orange-100 flex items-center gap-3 animate-bounce">
                <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                <span className="text-sm font-bold text-orange-700">Se caută în cadastru...</span>
             </div>
          </div>
        )}

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
        
        {/* Vizualizare Parcele Existente */}
        {parcels.map((p: any) => {
          if (!p.coordinates?.geometry?.coordinates) return null;
          const ring = p.coordinates.geometry.coordinates[0];
          const positions: [number, number][] = ring.map((coord: [number, number]) => [coord[1], coord[0]]);
          
          return (
            <Polygon
              key={`existing-${p.id}`}
              positions={positions}
              pathOptions={{
                color: "#94a3b8", // slate-400
                fillColor: "#94a3b8",
                fillOpacity: 0.2,
                weight: 1,
                dashArray: "3, 3"
              }}
            >
              <Tooltip sticky>
                <div className="text-[10px] font-bold">{p.name} (Existentă)</div>
              </Tooltip>
            </Polygon>
          );
        })}

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
