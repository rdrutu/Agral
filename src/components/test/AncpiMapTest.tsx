"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { MapContainer, TileLayer, WMSTileLayer, GeoJSON, useMap, useMapEvents, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import {
  Layers, Search, MapPin, Eye, EyeOff, X, ChevronRight, ChevronLeft,
  Loader2, CheckCircle2, AlertTriangle, Wifi, WifiOff, Maximize2,
  Crosshair, Trash2, Download, Map as MapIcon
} from "lucide-react";
import toast from "react-hot-toast";

// Fix for default marker icons in Next.js/Leaflet
const fixLeafletIcons = () => {
  if (typeof L !== "undefined" && L.Icon && L.Icon.Default) {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });
  }
};
fixLeafletIcons();

// ─── TYPES ───────────────────────────────
interface SelectedParcel {
  id: string;
  feature: any;
  properties: {
    nrCadastral: string;
    uat: string;
    judet: string;
    localitate: string;
    siruta?: string;
    suprafata?: number;
    [key: string]: any;
  };
}

const COUNTIES = [
  { id: "AB", name: "Alba" }, { id: "AR", name: "Arad" }, { id: "AG", name: "Argeș" },
  { id: "BC", name: "Bacău" }, { id: "BH", name: "Bihor" }, { id: "BN", name: "Bistrița-Năsăud" },
  { id: "BT", name: "Botoșani" }, { id: "BR", name: "Brăila" }, { id: "BV", name: "Brașov" },
  { id: "BZ", name: "Buzău" }, { id: "CL", name: "Călărași" }, { id: "CS", name: "Caraș-Severin" },
  { id: "CJ", name: "Cluj" }, { id: "CT", name: "Constanța" }, { id: "CV", name: "Covasna" },
  { id: "DB", name: "Dâmbovița" }, { id: "DJ", name: "Dolj" }, { id: "GL", name: "Galați" },
  { id: "GR", name: "Giurgiu" }, { id: "GJ", name: "Gorj" }, { id: "HR", name: "Harghita" },
  { id: "HD", name: "Hunedoara" }, { id: "IL", name: "Ialomița" }, { id: "IS", name: "Iași" },
  { id: "IF", name: "Ilfov" }, { id: "MM", name: "Maramureș" }, { id: "MH", name: "Mehedinți" },
  { id: "MS", name: "Mureș" }, { id: "NT", name: "Neamț" }, { id: "OT", name: "Olt" },
  { id: "PH", name: "Prahova" }, { id: "SJ", name: "Sălaj" }, { id: "SM", name: "Satu Mare" },
  { id: "SB", name: "Sibiu" }, { id: "SV", name: "Suceava" }, { id: "TR", name: "Teleorman" },
  { id: "TM", name: "Timiș" }, { id: "TL", name: "Tulcea" }, { id: "VL", name: "Vâlcea" },
  { id: "VS", name: "Vaslui" }, { id: "VN", name: "Vrancea" }, { id: "B", name: "București" }
].sort((a, b) => a.name.localeCompare(b.name));

const JUDET_NUMERIC_MAP: Record<string, string> = {
  "AB": "1", "AR": "2", "AG": "3", "BC": "4", "BH": "5",
  "BN": "6", "BT": "7", "BV": "8", "BR": "9", "BZ": "10",
  "CL": "11", "CS": "12", "CJ": "13", "CT": "14", "CV": "15",
  "DB": "16", "DJ": "17", "GL": "18", "GR": "19", "GJ": "20",
  "HR": "21", "HD": "22", "IL": "23", "IS": "24", "IF": "25",
  "MM": "26", "MH": "27", "MS": "28", "NT": "29", "OT": "30",
  "PH": "31", "SJ": "32", "SM": "33", "SB": "34", "SV": "35",
  "TR": "36", "TM": "37", "TL": "38", "VL": "39", "VS": "40",
  "VN": "41", "B": "51"
};

const JUDET_STRING_MAP: Record<string, string> = {
  "1": "AB", "2": "AR", "3": "AG", "4": "BC", "5": "BH",
  "6": "BN", "7": "BT", "8": "BV", "9": "BR", "10": "BZ",
  "11": "CL", "12": "CS", "13": "CJ", "14": "CT", "15": "CV",
  "16": "DB", "17": "DJ", "18": "GL", "19": "GR", "20": "GJ",
  "21": "HR", "22": "HD", "23": "IL", "24": "IS", "25": "IF",
  "26": "MM", "27": "MH", "28": "MS", "29": "NT", "30": "OT",
  "31": "PH", "32": "SJ", "33": "SM", "34": "SB", "35": "SV",
  "36": "TR", "37": "TM", "38": "TL", "39": "VL", "40": "VS",
  "41": "VN", "51": "B"
};

interface LayerConfig {
  id: string;
  name: string;
  shortName: string;
  color: string;
  enabled: boolean;
  opacity: number;
  type: "wms" | "tile";
  url: string;
  wmsLayers?: string;
  queryUrl?: string;
  queryLayerId?: string;
  minZoom?: number;
  attribution?: string;
}

// ─── DEFAULT LAYERS ──────────────────────
const DEFAULT_LAYERS: LayerConfig[] = [
  {
    id: "satellite",
    name: "Imagine Satelitară",
    shortName: "Satelit",
    color: "#6366f1",
    enabled: true,
    opacity: 1,
    type: "tile",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles © Esri",
  },
  {
    id: "osm",
    name: "OpenStreetMap (Drumuri, Străzi)",
    shortName: "OSM",
    color: "#22c55e",
    enabled: false,
    opacity: 0.8,
    type: "tile",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "© OpenStreetMap contributors",
  },
  {
    id: "imobile",
    name: "Parcele Cadastrale (ANCPI Imobile)",
    shortName: "Imobile",
    color: "#f97316",
    enabled: true,
    opacity: 0.7,
    type: "tile",
    url: "/api/ancpi/tile?z={z}&x={x}&y={y}",
    queryUrl: "https://geoportal.ancpi.ro/maps/rest/services/eterra3_publish/MapServer/1/query",
    queryLayerId: "1",
    minZoom: 14,
    attribution: "© ANCPI",
  },
  {
    id: "imobile_alt",
    name: "Imobile (Sursă Alternativă)",
    shortName: "Imobile Alt",
    color: "#ea580c",
    enabled: false,
    opacity: 0.7,
    type: "wms",
    url: "https://geoportal.ancpi.ro/arcgis/rest/services/imobile/Imobile/MapServer/WMSServer",
    wmsLayers: "1", // Stratul de parcele este de obicei 1
    minZoom: 14,
    attribution: "© ANCPI",
  },
  {
    id: "cp_view",
    name: "Parcele INSPIRE (CP_View)",
    shortName: "INSPIRE",
    color: "#3b82f6",
    enabled: false,
    opacity: 0.7,
    type: "wms",
    url: "https://geoportal.ancpi.ro/inspireview/services/CP/CP_View/MapServer/WMSServer",
    wmsLayers: "CP.CadastralParcel",
    minZoom: 14,
    attribution: "© ANCPI INSPIRE",
  },
  {
    id: "apia",
    name: "Blocuri Fizice APIA 2024",
    shortName: "APIA",
    color: "#a855f7",
    enabled: false,
    opacity: 0.55,
    type: "wms",
    url: "https://inspire.apia.org.ro/network/rest/services/INSPIRE/LPIS_referinta_2024/MapServer/exts/InspireView/service",
    wmsLayers: "referinta_2024",
    queryUrl: "https://inspire.apia.org.ro/network/rest/services/INSPIRE/LPIS_referinta_2024/MapServer/0/query",
    queryLayerId: "0",
    attribution: "© APIA",
  },
];

// ─── HELPER: Build proxy URL ─────────────
function proxyUrl(baseUrl: string) {
  return `/api/ancpi/proxy?url=${encodeURIComponent(baseUrl)}`;
}

// ─── COMPONENT: Dynamic WMS Layer ────────
function DynamicWMSLayer({ layer }: { layer: LayerConfig }) {
  if (layer.type !== "wms" || !layer.enabled) return null;
  return (
    <WMSTileLayer
      url={`/api/ancpi/wms?url=${encodeURIComponent(layer.url)}`}
      layers={layer.wmsLayers || "0"}
      format="image/png"
      transparent={true}
      version="1.3.0"
      attribution={layer.attribution || ""}
      opacity={layer.opacity}
      minZoom={layer.minZoom || 0}
      maxZoom={20}
    />
  );
}

// ─── COMPONENT: Cursor Coordinates ───────
function CursorCoordinates() {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  useMapEvents({
    mousemove: (e) => {
      setCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });

  if (!coords) return null;
  return (
    <div className="absolute bottom-3 left-3 z-[1000] bg-black/70 text-white text-[10px] font-mono px-3 py-1.5 rounded-lg backdrop-blur-md select-none pointer-events-none">
      {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
    </div>
  );
}

// ─── COMPONENT: Fullscreen Toggle ────────
function FullscreenButton() {
  const map = useMap();
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggle = () => {
    const container = map.getContainer().parentElement;
    if (!container) return;
    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => {
        setIsFullscreen(true);
        setTimeout(() => map.invalidateSize(), 200);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
        setTimeout(() => map.invalidateSize(), 200);
      });
    }
  };

  return (
    <button
      onClick={toggle}
      className="absolute top-3 right-3 z-[1000] bg-white/90 backdrop-blur-md shadow-lg border border-white/40 rounded-xl p-2.5 hover:bg-white transition-all hover:scale-105 active:scale-95"
      title={isFullscreen ? "Ieși din fullscreen" : "Fullscreen"}
    >
      <Maximize2 className="w-4 h-4 text-slate-700" />
    </button>
  );
}

// ─── COMPONENT: Geocoder Search ──────────
function GeocoderSearch() {
  const map = useMap();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (query.length < 3) { setResults([]); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=ro&limit=5`
        );
        const data = await res.json();
        setResults(data || []);
      } catch { setResults([]); }
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="absolute top-3 left-3 z-[1000] w-72">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Caută localitate, adresă..."
          className="w-full h-10 pl-9 pr-8 bg-white/90 backdrop-blur-md border border-white/40 rounded-xl shadow-lg text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/40 transition-all"
        />
        {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-slate-400" />}
        {query && !loading && (
          <button onClick={() => { setQuery(""); setResults([]); }} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600" />
          </button>
        )}
      </div>
      {open && results.length > 0 && (
        <div className="mt-1.5 bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-slate-200 overflow-hidden max-h-60 overflow-y-auto">
          {results.map((r, i) => (
            <button
              key={i}
              className="w-full text-left px-3 py-2.5 hover:bg-green-50 text-sm border-b last:border-b-0 transition-colors flex items-center gap-2"
              onClick={() => {
                map.flyTo([parseFloat(r.lat), parseFloat(r.lon)], 16);
                setQuery(r.display_name.split(",")[0]);
                setOpen(false);
              }}
            >
              <MapPin className="w-3.5 h-3.5 text-green-500 shrink-0" />
              <span className="truncate text-slate-700">{r.display_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── HELPER: Resolve UAT Name from Code ──
async function resolveUatInfo(siruta: string | number) {
  if (!siruta) return null;
  try {
    const url = `https://geoportal.ancpi.ro/arcgis/rest/services/administrativ/UAT_Grupate/MapServer/0/query?where=SIRUTA=${siruta}&outFields=nume_uat,judet&f=json`;
    const res = await fetch(proxyUrl(url));
    if (!res.ok) return null;
    const data = await res.json();
    if (data.features && data.features.length > 0) {
      return {
        localitate: data.features[0].attributes.nume_uat,
        judet: data.features[0].attributes.judet
      };
    }
  } catch (e) {
    console.error("UAT Resolve error:", e);
  }
  return null;
}

// ─── COMPONENT: Parcel Click Handler ─────
function ParcelClickHandler({
  layers,
  selectedParcels,
  setSelectedParcels,
  loading,
  setLoading,
  uats,
}: {
  layers: LayerConfig[];
  selectedParcels: SelectedParcel[];
  setSelectedParcels: React.Dispatch<React.SetStateAction<SelectedParcel[]>>;
  loading: boolean;
  setLoading: (l: boolean) => void;
  uats: { name: string; siruta: string }[];
}) {
  useMapEvents({
    click: async (e) => {
      if (loading) return;

      const { lat, lng } = e.latlng;

      // Găsim primul layer activ cu queryUrl
      const queryableLayer = layers.find((l) => l.enabled && l.queryUrl);
      if (!queryableLayer) {
        toast.error("Activează un layer cadastral (Imobile sau APIA) pentru a selecta parcele.");
        return;
      }

      setLoading(true);
      try {
        const params = new URLSearchParams({
          f: "json",
          geometry: `${lng},${lat}`,
          geometryType: "esriGeometryPoint",
          inSR: "4326",
          spatialRel: "esriSpatialRelIntersects",
          outFields: "*",
          returnGeometry: "true",
          outSR: "4326",
          // Adăugăm o toleranță mică pentru click pe mobil/ecrane mici
          distance: "2",
          units: "esriSRUnit_Meter"
        });

        const queryUrl = `${queryableLayer.queryUrl}?${params.toString()}`;
        console.log("[ANCPI Click] Query:", queryUrl);

        const response = await fetch(proxyUrl(queryUrl));
        if (!response.ok) throw new Error("Server error");

        const data = await response.json();

        if (data.features && data.features.length > 0) {
          const feature = data.features[0];
          const attrs = feature.attributes || {};

          // Construim un ID unic din INSPIRE_ID sau coordonate
          const parcelId = attrs.INSPIRE_ID || `${lat.toFixed(6)}_${lng.toFixed(6)}`;

          // Verificăm dacă e deja selectat (toggle)
          const existing = selectedParcels.find((p) => p.id === parcelId);
          if (existing) {
            setSelectedParcels((prev) => prev.filter((p) => p.id !== parcelId));
            toast.success("Parcelă deselectată");
            return;
          }

          // Conversie ArcGIS → GeoJSON
          const geoJsonFeature = {
            type: "Feature" as const,
            geometry: {
              type: "Polygon" as const,
              // ArcGIS rings: [[[x,y], [x,y]]] -> GeoJSON coordinates: [[[lng,lat], [lng,lat]]]
              coordinates: feature.geometry.rings || [],
            },
            properties: attrs,
          };

          // Extragem datele cadastrale din INSPIRE_ID (format: RO.jud.siruta.nrCad)
          let nrCadastral = "N/A";
          let uat = attrs.uats || attrs.UATS || attrs.UAT || attrs.nume_com || attrs.localitate || "";
          let judet = attrs.judet || attrs.JUDET || attrs.county || "";
          let localitate = attrs.localitate || attrs.LOCALITATE || attrs.locality || attrs.nume_com || uat;
          let siruta = attrs.siruta || attrs.SIRUTA || attrs.uat_code || attrs.UAT_CODE || "";

          if (attrs.INSPIRE_ID) {
            const parts = attrs.INSPIRE_ID.split(".");
            if (parts.length >= 4) {
              const codJudNumeric = parts[1];
              siruta = parts[2];
              nrCadastral = parts[3];
              if (!judet && JUDET_STRING_MAP[codJudNumeric]) {
                judet = JUDET_STRING_MAP[codJudNumeric];
              }
            } else if (parts.length === 3 && parts[1] === "127") {
               // Fallback format
               siruta = parts[2];
            }
          }

          // REZOLVARE NUME DIN COD (Dacă avem doar cod de 5 cifre)
          if (siruta && (!localitate || !isNaN(Number(localitate)))) {
            // Căutăm în lista de UAT-uri deja încărcată (dacă e același județ)
            const foundUat = uats.find((u: any) => u.siruta === siruta);
            if (foundUat) {
              localitate = foundUat.name;
              uat = foundUat.name;
            } else {
               // Fallback: încercăm să aflăm numele județului din cod
               const JUDET_ETERRA_MAP: Record<string, string> = {
                  "AB": "10", "AR": "29", "AG": "38", "BC": "47", "BH": "56", "BN": "65", "BT": "74",
                  "BV": "83", "BR": "92", "BZ": "109", "CS": "118", "CL": "519", "CJ": "127", "CT": "136",
                  "CV": "145", "DB": "154", "DJ": "163", "GL": "172", "GR": "528", "GJ": "181", "HR": "190",
                  "HD": "207", "IL": "216", "IS": "225", "IF": "234", "MM": "243", "MH": "252", "MS": "261",
                  "NT": "270", "OT": "288", "PH": "297", "SM": "304", "SJ": "313", "SB": "322", "SV": "331",
                  "TR": "340", "TM": "359", "TL": "368", "VS": "377", "VL": "386", "VN": "395", "B": "402"
               };
               const REVERSE_MAP = Object.fromEntries(Object.entries(JUDET_ETERRA_MAP).map(([k, v]) => [v, k]));
               
               if (attrs.INSPIRE_ID) {
                 const code = attrs.INSPIRE_ID.split(".")[1];
                 const judId = REVERSE_MAP[code];
                 if (judId) {
                   const judName = COUNTIES.find(c => c.id === judId)?.name;
                   if (judName) judet = judName;
                 }
               }
            }
          }

          // Calculăm suprafața aproximativă din geometrie
          let suprafata: number | undefined;
          if (attrs.aria_neta) {
            suprafata = parseFloat(attrs.aria_neta);
          } else if (attrs.Shape_Area || attrs.SHAPE_Area) {
            suprafata = parseFloat(attrs.Shape_Area || attrs.SHAPE_Area);
          }

          const newParcel: SelectedParcel = {
            id: parcelId,
            feature: geoJsonFeature,
            properties: {
              nrCadastral,
              uat,
              judet,
              localitate,
              siruta,
              suprafata,
              ...attrs,
            },
          };

          setSelectedParcels((prev) => [...prev, newParcel]);
          toast.success(`Parcelă adăugată: ${nrCadastral}`);
        } else {
          toast.error("Nu s-a găsit nicio parcelă la acest punct.");
        }
      } catch (err: any) {
        console.error("Query error:", err);
        toast.error("Eroare la interogarea serverului cadastral.");
      } finally {
        setLoading(false);
      }
    },
  });

  return null;
}

// ─── COMPONENT: Zoom Handler ─────────────
function ZoomEndHandler({ onZoomChange }: { onZoomChange: (z: number) => void }) {
  useMapEvents({
    zoomend: (e) => onZoomChange(e.target.getZoom()),
    moveend: (e) => onZoomChange(e.target.getZoom()),
  });
  return null;
}

// ═══════════════════════════════════════════
// ─── MAIN COMPONENT ──────────────────────
// ═══════════════════════════════════════════
export default function AncpiMapTest() {
  const [isMounted, setIsMounted] = useState(false);
  const [layers, setLayers] = useState<LayerConfig[]>(DEFAULT_LAYERS);
  const [selectedParcels, setSelectedParcels] = useState<SelectedParcel[]>([]);
  const [loadingParcel, setLoadingParcel] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<"layers" | "search" | "parcels">("layers");
  const [currentZoom, setCurrentZoom] = useState(14);
  const mapRef = useRef<L.Map | null>(null);

  // State pentru căutare cadastru
  const [searchCounty, setSearchCounty] = useState("");
  const [searchUatName, setSearchUatName] = useState(""); // Numele scris manual sau ales
  const [searchUatSiruta, setSearchUatSiruta] = useState(""); // SIRUTA-ul detectat
  const [uats, setUats] = useState<{ name: string; siruta: string }[]>([]);
  const [isLoadingUats, setIsLoadingUats] = useState(false);
  const [searchNumber, setSearchNumber] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Status conectivitate ANCPI
  const [ancpiStatus, setAncpiStatus] = useState<"testing" | "ok" | "fail">("testing");

  // Fetch UATs when county changes
  useEffect(() => {
    if (!searchCounty) {
      setUats([]);
      setSearchUatName("");
      setSearchUatSiruta("");
      return;
    }

    const fetchUats = async () => {
      setIsLoadingUats(true);
      try {
        const JUDET_ETERRA_MAP: Record<string, string> = {
          "AB": "10", "AR": "29", "AG": "38", "BC": "47", "BH": "56", "BN": "65", "BT": "74",
          "BV": "83", "BR": "92", "BZ": "109", "CS": "118", "CL": "519", "CJ": "127", "CT": "136",
          "CV": "145", "DB": "154", "DJ": "163", "GL": "172", "GR": "528", "GJ": "181", "HR": "190",
          "HD": "207", "IL": "216", "IS": "225", "IF": "234", "MM": "243", "MH": "252", "MS": "261",
          "NT": "270", "OT": "288", "PH": "297", "SM": "304", "SJ": "313", "SB": "322", "SV": "331",
          "TR": "340", "TM": "359", "TL": "368", "VS": "377", "VL": "386", "VN": "395", "B": "402"
        };
        
        const countyWorkspaceId = JUDET_ETERRA_MAP[searchCounty];
        if (!countyWorkspaceId) throw new Error("Cod județ necunoscut");

        // Folosim Serviciul de Lookup oficial (Geoprocessing) descoperit în research
        const url = `https://geoportal.ancpi.ro/geoprocessing/rest/services/LOOKUP/UATLookup/GPServer/FastSelect/execute?Expression=WORKSPACEID%20%3D%20${countyWorkspaceId}&f=json`;

        const response = await fetch(proxyUrl(url));
        if (!response.ok) throw new Error("Eroare la serviciul de localități");
        
        const data = await response.json();
        const features = data.results?.[0]?.value?.features || [];
        
        if (features.length > 0) {
          const list = features.map((f: any) => ({
            name: (f.attributes.UAT || f.attributes.UAT_NAME || "").toString(),
            siruta: (f.attributes.ADMINISTRATIVEUNITID || "").toString()
          })).filter((u: any) => u.siruta);
          
          // Sortăm alfabetic
          list.sort((a: any, b: any) => a.name.localeCompare(b.name));
          setUats(list);
        } else {
          setUats([]);
        }
      } catch (err) {
        console.error("Failed to fetch UATs:", err);
        setUats([]);
      } finally {
        setIsLoadingUats(false);
      }
    };

    fetchUats();
  }, [searchCounty]);

  useEffect(() => {
    setIsMounted(true);
    // Testăm conectivitatea
    const img = new Image();
    img.onload = () => setAncpiStatus("ok");
    img.onerror = () => setAncpiStatus("fail");
    img.src = "https://geoportal.ancpi.ro/maps/rest/services/ANCPI/CP_Yellow_vt/MapServer/tile/10/14218/14227?blankTile=false";
  }, []);

  const toggleLayer = useCallback((id: string) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, enabled: !l.enabled } : l))
    );
  }, []);

  const setLayerOpacity = useCallback((id: string, opacity: number) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, opacity } : l))
    );
  }, []);

  const removeParcel = useCallback((id: string) => {
    setSelectedParcels((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const clearAllParcels = useCallback(() => {
    setSelectedParcels([]);
  }, []);

  const exportParcels = useCallback(() => {
    if (selectedParcels.length === 0) return;
    const data = selectedParcels.map((p) => ({
      nrCadastral: p.properties.nrCadastral,
      judet: p.properties.judet,
      localitate: p.properties.localitate,
      uat: p.properties.uat,
      suprafata: p.properties.suprafata,
    }));
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `parcele_selectate_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Export descărcat!");
  }, [selectedParcels]);

  const handleSearchResults = (features: any[]) => {
    // Pregătim datele pentru afișare conform interfeței SelectedParcel
    const processedFeatures: SelectedParcel[] = features.map((f: any) => {
      const geometry = f.geometry;
      const props = f.properties || f.attributes;
      
      const inspireId = props.INSPIRE_ID || "";
      const parts = inspireId.split(".");
      const judetCodeFromId = parts[1] || "";
      const sirutaCodeFromId = parts[2] || "";
      const parcelIdFromId = parts[3] || searchNumber;

      const judetId = searchCounty || judetCodeFromId;
      const judetName = COUNTIES.find(c => c.id === judetId)?.name || judetId;
      const localitateName = searchUatName || uats.find(u => u.siruta === sirutaCodeFromId)?.name || sirutaCodeFromId;

      return {
        id: inspireId || `${sirutaCodeFromId}-${parcelIdFromId}`,
        feature: f,
        properties: {
          nrCadastral: parcelIdFromId,
          judet: judetName,
          localitate: localitateName,
          uat: sirutaCodeFromId,
          siruta: sirutaCodeFromId,
          suprafata: props.MAP_AREA || props.area || props.surface || 0,
          adresa: props.address || "",
          ...props
        }
      };
    });

    setSelectedParcels(processedFeatures);
    
    // Zoom la prima parcelă găsită
    if (processedFeatures[0]?.feature?.geometry?.coordinates) {
      const coords = processedFeatures[0].feature.geometry.coordinates;
      let targetCoords: [number, number] | null = null;

      // GeoJSON Polygon coordinates are [[[lng, lat], ...]]
      if (processedFeatures[0].feature.geometry.type === "Polygon") {
        targetCoords = [coords[0][0][1], coords[0][0][0]];
      } else if (processedFeatures[0].feature.geometry.type === "MultiPolygon") {
        const firstPoly = coords[0];
        const firstRing = firstPoly[0];
        targetCoords = [firstRing[1], firstRing[0]];
      }

      if (targetCoords && mapRef.current) {
        mapRef.current.flyTo(targetCoords, 18);
        toast.success(`Am găsit parcela ${searchNumber}`);
      }
    }
  };

  const handleCadastralSearch = async () => {
    if (!searchNumber) {
      toast.error("Introdu numărul cadastral");
      return;
    }
    setIsSearching(true);
    try {
      // Coduri de județ specifice sistemului eTerra (SIRUTA județean)
      const JUDET_ETERRA_MAP: Record<string, string> = {
        "AB": "10", "AR": "29", "AG": "38", "BC": "47", "BH": "56", "BN": "65", "BT": "74",
        "BV": "83", "BR": "92", "BZ": "109", "CS": "118", "CL": "519", "CJ": "127", "CT": "136",
        "CV": "145", "DB": "154", "DJ": "163", "GL": "172", "GR": "528", "GJ": "181", "HR": "190",
        "HD": "207", "IL": "216", "IS": "225", "IF": "234", "MM": "243", "MH": "252", "MS": "261",
        "NT": "270", "OT": "288", "PH": "297", "SM": "304", "SJ": "313", "SB": "322", "SV": "331",
        "TR": "340", "TM": "359", "TL": "368", "VS": "377", "VL": "386", "VN": "395", "B": "402"
      };

      const countyCode = JUDET_ETERRA_MAP[searchCounty] || "%";
      let activeSiruta = searchUatSiruta || "%";

      // Detectăm SIRUTA dacă nu e setat dar avem localități încărcate
      if (activeSiruta === "%" && searchUatName && uats.length > 0) {
        const found = uats.find(u => u.name.toUpperCase() === searchUatName.toUpperCase());
        if (found) activeSiruta = found.siruta;
      }

      // Query-ul "Auriu" bazat pe link-ul tău: f=geojson, outSR=4326, where=INSPIRE_ID
      const inspireId = `RO.${countyCode}.${activeSiruta}.${searchNumber}`;
      const whereClause = inspireId.includes("%") 
        ? `INSPIRE_ID LIKE '${inspireId}'`
        : `INSPIRE_ID = '${inspireId}'`;
      
      const queryParams = new URLSearchParams({
        where: whereClause,
        outFields: "*",
        outSR: "4326",
        f: "geojson",
        returnGeometry: "true"
      });

      const url = `https://geoportal.ancpi.ro/maps/rest/services/eterra3_publish/MapServer/1/query?${queryParams.toString()}`;
      console.log("[ANCPI] Golden Link Query:", url);

      const response = await fetch(proxyUrl(url));
      if (!response.ok) throw new Error("Eroare server ANCPI");
      
      const data = await response.json();
      let features = data.features || [];
      
      if (features.length === 0) {
        // Fallback logic dacă ID-ul exact nu a returnat nimic (căutăm doar după număr)
        const fallbackWhere = `INSPIRE_ID LIKE '%.${searchNumber}'`;
        const fbParams = new URLSearchParams({ where: fallbackWhere, f: "geojson", outSR: "4326", outFields: "*" });
        const fbUrl = `https://geoportal.ancpi.ro/maps/rest/services/eterra3_publish/MapServer/1/query?${fbParams.toString()}`;
        const fbRes = await fetch(proxyUrl(fbUrl));
        const fbData = await fbRes.json();
        features = fbData.features || [];
      }

      if (features.length === 0) {
        toast.error(`Nu s-a găsit parcela ${searchNumber}`);
        return;
      }

      handleSearchResults(features);
    } catch (err: any) {
      console.error("Search error:", err);
      toast.error(`Eroare la căutare: ${err.message}`);
    } finally {
      setIsSearching(false);
    }
  };

  if (!isMounted) {
    return (
      <div className="h-[700px] w-full bg-slate-100 animate-pulse rounded-2xl flex items-center justify-center text-slate-400 font-bold">
        <Loader2 className="w-8 h-8 animate-spin mr-3" />
        Se inițializează harta...
      </div>
    );
  }

  return (
    <div className="relative flex rounded-2xl overflow-hidden border border-slate-200/80 shadow-2xl bg-white" style={{ height: "700px" }}>
      {/* ─── SIDEBAR ─── */}
      <div
        className={`relative z-10 flex flex-col bg-white/95 backdrop-blur-xl border-r border-slate-200 transition-all duration-300 ${
          sidebarOpen ? "w-80" : "w-0 overflow-hidden"
        }`}
      >
        {/* Sidebar Tabs */}
        <div className="flex border-b border-slate-100 shrink-0">
          <button
            onClick={() => setActiveTab("layers")}
            className={`flex-1 py-3 text-[10px] font-extrabold uppercase tracking-widest transition-all ${
              activeTab === "layers"
                ? "text-green-700 border-b-2 border-green-500 bg-green-50/50"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            Straturi
          </button>
          <button
            onClick={() => setActiveTab("search")}
            className={`flex-1 py-3 text-[10px] font-extrabold uppercase tracking-widest transition-all ${
              activeTab === "search"
                ? "text-blue-700 border-b-2 border-blue-500 bg-blue-50/50"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            Căutare
          </button>
          <button
            onClick={() => setActiveTab("parcels")}
            className={`flex-1 py-3 text-[10px] font-extrabold uppercase tracking-widest transition-all relative ${
              activeTab === "parcels"
                ? "text-orange-700 border-b-2 border-orange-500 bg-orange-50/50"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            Selectate
            {selectedParcels.length > 0 && (
              <span className="absolute -top-0.5 right-1.5 bg-orange-500 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                {selectedParcels.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === "layers" && (
            <div className="p-3 space-y-1">
              {/* Status Indicator */}
              <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-bold mb-3 ${
                ancpiStatus === "ok" ? "bg-green-50 text-green-700" :
                ancpiStatus === "fail" ? "bg-red-50 text-red-600" :
                "bg-yellow-50 text-yellow-700"
              }`}>
                {ancpiStatus === "ok" && <><Wifi className="w-3 h-3" /> ANCPI Online</>}
                {ancpiStatus === "fail" && <><WifiOff className="w-3 h-3" /> ANCPI Indisponibil</>}
                {ancpiStatus === "testing" && <><Loader2 className="w-3 h-3 animate-spin" /> Se verifică...</>}
              </div>

              {layers.map((layer) => (
                <div
                  key={layer.id}
                  className={`rounded-xl border transition-all ${
                    layer.enabled
                      ? "border-slate-200 bg-white shadow-sm"
                      : "border-transparent bg-slate-50/50"
                  }`}
                >
                  <div className="flex items-center gap-2.5 px-3 py-2.5">
                    <button
                      onClick={() => toggleLayer(layer.id)}
                      className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                        layer.enabled
                          ? "bg-green-500 text-white shadow-sm shadow-green-500/30"
                          : "bg-slate-100 text-slate-300 hover:bg-slate-200"
                      }`}
                    >
                      {layer.enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-700 truncate">{layer.shortName}</div>
                      <div className="text-[9px] text-slate-400 truncate">{layer.name}</div>
                    </div>
                    <div
                      className="w-3 h-3 rounded-full shrink-0 border border-white shadow-sm"
                      style={{ backgroundColor: layer.color }}
                    />
                  </div>
                  {layer.enabled && layer.type === "wms" && (
                    <div className="px-3 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-slate-400 shrink-0 w-6">{Math.round(layer.opacity * 100)}%</span>
                        <input
                          type="range"
                          min="0.1"
                          max="1"
                          step="0.05"
                          value={layer.opacity}
                          onChange={(e) => setLayerOpacity(layer.id, parseFloat(e.target.value))}
                          className="flex-1 h-1 accent-green-500"
                        />
                      </div>
                      {layer.minZoom && currentZoom < layer.minZoom && (
                        <div className="mt-1.5 text-[9px] text-amber-600 bg-amber-50 rounded-md px-2 py-1 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Apropie-te mai mult (zoom {layer.minZoom}+)
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* Instructions */}
              <div className="mt-4 p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                <div className="text-[10px] font-bold text-blue-800 mb-1">💡 Cum selectez parcele?</div>
                <p className="text-[10px] text-blue-600 leading-relaxed">
                  Activează un layer cadastral (Imobile sau APIA), apropiază harta (zoom 14+), apoi <strong>click pe o parcelă</strong> pentru a o selecta. Poți selecta mai multe parcele. Click din nou pe aceeași parcelă pentru a o deselecta.
                </p>
              </div>
            </div>
          )}

          {activeTab === "search" && (
            <div className="p-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Județ</label>
                <select
                  value={searchCounty}
                  onChange={(e) => setSearchCounty(e.target.value)}
                  className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none"
                >
                  <option value="">Alege județul...</option>
                  {COUNTIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest flex items-center justify-between">
                  Localitate
                  {isLoadingUats && <Loader2 className="w-3 h-3 animate-spin text-blue-500" />}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    list="uat-suggestions"
                    value={searchUatName}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSearchUatName(val);
                      const found = uats.find(u => u.name.toUpperCase() === val.toUpperCase());
                      if (found) setSearchUatSiruta(found.siruta);
                      else setSearchUatSiruta("");
                    }}
                    placeholder={isLoadingUats ? "Se încarcă..." : "ex: HORIA sau scrie manual"}
                    disabled={!searchCounty}
                    className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all disabled:opacity-50"
                  />
                  <datalist id="uat-suggestions">
                    {uats.map(u => <option key={u.siruta} value={u.name} />)}
                  </datalist>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Nr. Cadastral</label>
                <input
                  type="text"
                  placeholder="ex: 12345"
                  value={searchNumber}
                  onChange={(e) => setSearchNumber(e.target.value)}
                  className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3 text-sm font-bold text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>

              <button
                onClick={handleCadastralSearch}
                disabled={isSearching}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Caută Teren
              </button>

              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                <div className="text-[9px] font-bold text-blue-800 leading-relaxed">
                  NOTĂ: Căutarea funcționează optim cu numărul cadastral exact. 
                  Dacă parcela este în baza de date ANCPI, harta se va centra automat pe ea.
                </div>
              </div>
            </div>
          )}

          {activeTab === "parcels" && (
            <div className="p-3">
              {selectedParcels.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Crosshair className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <div className="text-sm font-bold">Nicio parcelă selectată</div>
                  <div className="text-[11px] mt-1">Click pe hartă pentru a selecta parcele cadastrale</div>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Actions */}
                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={exportParcels}
                      className="flex-1 h-8 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-colors"
                    >
                      <Download className="w-3 h-3" /> Export ({selectedParcels.length})
                    </button>
                    <button
                      onClick={clearAllParcels}
                      className="flex-1 h-8 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" /> Șterge Tot
                    </button>
                  </div>

                  {/* Parcels List */}
                  {selectedParcels.map((parcel, idx) => (
                    <div
                      key={parcel.id}
                      className="bg-white rounded-xl border border-orange-100 shadow-sm p-3 group hover:border-orange-300 transition-all"
                    >
                      <div className="flex items-start gap-2">
                        <div className="w-6 h-6 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-extrabold text-slate-800 truncate">
                            {parcel.properties.nrCadastral}
                          </div>
                          <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-1">
                            {parcel.properties.localitate && (
                              <div className="text-[10px] text-slate-600">
                                <span className="font-bold text-slate-400">Loc:</span> {parcel.properties.localitate}
                              </div>
                            )}
                            {parcel.properties.judet && (
                              <div className="text-[10px] text-slate-600">
                                <span className="font-bold text-slate-400">Jud:</span> {parcel.properties.judet}
                              </div>
                            )}
                            {parcel.properties.siruta && (
                              <div className="text-[9px] text-slate-400 font-mono">
                                #{parcel.properties.siruta}
                              </div>
                            )}
                          </div>
                          {parcel.properties.suprafata && (
                            <div className="mt-2 text-[11px] font-black text-green-700 bg-green-50/80 px-2.5 py-1.5 rounded-xl border border-green-100/50 inline-flex items-center gap-2 shadow-sm uppercase tracking-tighter">
                              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                              <span className="text-green-500/50 font-bold">SUPRAFAȚĂ:</span>
                              {Number(parcel.properties.suprafata) >= 1000 ? 
                                `${(Number(parcel.properties.suprafata) / 10000).toFixed(4)} Ha` : 
                                `${Number(parcel.properties.suprafata).toFixed(2)} mp`
                              }
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => removeParcel(parcel.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <X className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Summary */}
                  <div className="mt-3 p-3 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-100">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-orange-800">Total parcele:</span>
                      <span className="text-sm font-black text-orange-700">{selectedParcels.length}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─── SIDEBAR TOGGLE ─── */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="absolute left-[calc(var(--sb-width))] top-1/2 -translate-y-1/2 z-20 bg-white/90 backdrop-blur-md border border-slate-200 rounded-r-xl shadow-lg px-1 py-4 hover:bg-white transition-all"
        style={{ ["--sb-width" as any]: sidebarOpen ? "320px" : "0px", left: sidebarOpen ? "320px" : "0px" }}
      >
        {sidebarOpen ? <ChevronLeft className="w-3.5 h-3.5 text-slate-500" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
      </button>

      {/* ─── MAP ─── */}
      <div className="flex-1 relative">
        <MapContainer
          center={[46.7712, 23.5897] as [number, number]}
          zoom={14}
          className={`h-full w-full ${loadingParcel ? "cursor-wait" : "cursor-crosshair"}`}
          ref={mapRef}
        >
          {/* Base Layers */}
          {layers
            .filter((l) => l.type === "tile" && l.enabled)
            .map((layer) => (
              <TileLayer
                key={layer.id}
                url={layer.url}
                attribution={layer.attribution || ""}
                opacity={layer.opacity}
                maxZoom={20}
              />
            ))}

          {/* WMS Layers */}
          {layers
            .filter((l) => l.type === "wms" && l.enabled)
            .map((layer) => (
              <DynamicWMSLayer key={layer.id} layer={layer} />
            ))}

          {/* Selected Parcels Highlight */}
          {selectedParcels.map((parcel) => (
            <GeoJSON
              key={`sel-${parcel.id}`}
              data={parcel.feature}
              style={{
                color: "#f97316",
                weight: 3,
                fillOpacity: 0.25,
                fillColor: "#fb923c",
                dashArray: "6, 4",
              }}
            />
          ))}

          {/* Click Handler */}
          <ParcelClickHandler
            layers={layers}
            selectedParcels={selectedParcels}
            setSelectedParcels={setSelectedParcels}
            loading={loadingParcel}
            setLoading={setLoadingParcel}
            uats={uats}
          />

          {/* Zoom handler */}
          <ZoomEndHandler onZoomChange={setCurrentZoom} />

          {/* Geocoder */}
          <GeocoderSearch />

          {/* Fullscreen */}
          <FullscreenButton />

          {/* Cursor Coordinates */}
          <CursorCoordinates />
        </MapContainer>

        {/* Loading Overlay */}
        {loadingParcel && (
          <div className="absolute inset-0 z-[1001] flex items-center justify-center bg-white/10 backdrop-blur-[1px] pointer-events-none">
            <div className="bg-white/95 backdrop-blur-md px-5 py-3 rounded-2xl shadow-2xl border border-orange-100 flex items-center gap-3 animate-pulse">
              <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
              <span className="text-sm font-bold text-orange-700">Se caută parcele...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
