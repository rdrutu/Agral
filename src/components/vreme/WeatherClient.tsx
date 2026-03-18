"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CloudSun, 
  Droplets, 
  Wind, 
  Thermometer, 
  CloudRain, 
  Sun, 
  Cloud,
  CloudFog,
  CloudDrizzle,
  Snowflake,
  CloudLightning,
  CalendarDays,
  Plus,
  MapPin,
  Trash2,
  Loader2,
  Check
} from "lucide-react";
import { getWeatherDesc } from "@/lib/weather";
import { cn } from "@/lib/utils";
import { fetchWeatherData, addWeatherPOI, deleteWeatherPOI } from "@/lib/actions/weather";
import dynamic from "next/dynamic";
import toast from "react-hot-toast";

const BaseLocationPicker = dynamic(() => import("../profil/BaseLocationPicker"), { ssr: false });

interface WeatherLocation {
  id?: string;
  name: string;
  lat: number;
  lon: number;
}

interface WeatherClientProps {
  initialWeather: any;
  mainLocation: WeatherLocation;
  pois: WeatherLocation[];
}

const IconMap: Record<string, any> = {
  Sun,
  CloudSun,
  Cloud,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  Snowflake,
  CloudLightning
};

export default function WeatherClient({ initialWeather, mainLocation, pois: initialPois }: WeatherClientProps) {
  const [activeLocation, setActiveLocation] = useState<WeatherLocation>(mainLocation);
  const [weather, setWeather] = useState(initialWeather);
  const [pois, setPois] = useState<WeatherLocation[]>(initialPois);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddPoi, setShowAddPoi] = useState(false);
  
  // New POI state
  const [newPoiName, setNewPoiName] = useState("");
  const [newPoiLat, setNewPoiLat] = useState<number | null>(null);
  const [newPoiLon, setNewPoiLon] = useState<number | null>(null);

  const current = weather.current;
  const currentInfo = getWeatherDesc(current.weather_code);
  const CurrentIcon = IconMap[currentInfo.icon] || Cloud;

  const daily = weather.daily;
  const forecast = daily.time.map((time: string, i: number) => {
    const info = getWeatherDesc(daily.weather_code[i]);
    return {
      date: new Date(time).toLocaleDateString("ro-RO", { weekday: 'short', day: 'numeric', month: 'short' }),
      maxTemp: Math.round(daily.temperature_2m_max[i]),
      minTemp: Math.round(daily.temperature_2m_min[i]),
      precip: daily.precipitation_sum[i],
      icon: IconMap[info.icon] || Cloud,
      desc: info.desc
    };
  });

  async function handleLocationChange(loc: WeatherLocation) {
    if (loc.lat === activeLocation.lat && loc.lon === activeLocation.lon) return;
    setIsLoading(true);
    try {
      const data = await fetchWeatherData(loc.lat, loc.lon);
      setWeather(data);
      setActiveLocation(loc);
    } catch (err: any) {
      toast.error("Eroare la schimbarea locației: " + err.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAddPoi() {
    if (!newPoiName || !newPoiLat || !newPoiLon) {
      toast.error("Numele și locația sunt obligatorii.");
      return;
    }
    setIsLoading(true);
    try {
      const newPoi = await addWeatherPOI(newPoiName, newPoiLat, newPoiLon) as any;
      const formattedPoi = {
          id: newPoi.id,
          name: newPoi.name,
          lat: Number(newPoi.lat),
          lon: Number(newPoi.lng)
      };
      setPois([...pois, formattedPoi]);
      setNewPoiName("");
      setNewPoiLat(null);
      setNewPoiLon(null);
      setShowAddPoi(false);
      toast.success("Locație adăugată!");
      handleLocationChange(formattedPoi);
    } catch (err: any) {
      toast.error("Eroare la adăugare: " + err.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDeletePoi(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Sigur ștergi această locație?")) return;
    try {
      await deleteWeatherPOI(id);
      setPois(pois.filter(p => p.id !== id));
      if (activeLocation.id === id) {
        handleLocationChange(mainLocation);
      }
      toast.success("Locație ștearsă.");
    } catch (err: any) {
      toast.error("Eroare la ștergere: " + err.message);
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Sidebar/Location Selector */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handleLocationChange(mainLocation)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all font-bold text-sm shadow-sm",
            activeLocation.lat === mainLocation.lat && activeLocation.lon === mainLocation.lon
              ? "bg-primary border-primary text-white shadow-primary/20 scale-105"
              : "bg-white border-transparent text-muted-foreground hover:border-primary/20 hover:text-primary"
          )}
        >
          <MapPin className="w-4 h-4" />
          {mainLocation.name}
        </button>

        {pois.map((poi) => (
          <button
            key={poi.id}
            onClick={() => handleLocationChange(poi)}
            className={cn(
              "group flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all font-bold text-sm shadow-sm",
              activeLocation.id === poi.id
                ? "bg-primary border-primary text-white shadow-primary/20 scale-105"
                : "bg-white border-transparent text-muted-foreground hover:border-primary/20 hover:text-primary"
            )}
          >
            <CloudSun className="w-4 h-4" />
            {poi.name}
            <Trash2 
               className="w-3.5 h-3.5 ml-1 opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive" 
               onClick={(e) => handleDeletePoi(poi.id!, e)}
            />
          </button>
        ))}

        <button
          onClick={() => setShowAddPoi(!showAddPoi)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-dashed border-primary/40 text-primary font-bold text-sm bg-primary/5 hover:bg-primary/10 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Adaugă Locație
        </button>
      </div>

      {/* Add POI Form */}
      {showAddPoi && (
        <Card className="animate-in slide-in-from-top-4 duration-300 border-primary/20 shadow-xl overflow-hidden">
          <CardHeader className="bg-primary/5 border-b py-4">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> Configurare punct meteo nou
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Numele Locației</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Parcela din Vale, Depozit Sud..."
                    className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm shadow-sm focus:ring-2 focus:ring-primary/20"
                    value={newPoiName}
                    onChange={(e) => setNewPoiName(e.target.value)}
                  />
                </div>
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-amber-900 text-xs space-y-2">
                  <p className="font-bold flex items-center gap-1.5"><Thermometer className="w-3.5 h-3.5"/> De ce e util?</p>
                  <p className="opacity-80">Poți monitoriza condițiile meteo locale pentru zonele unde ai parcele sau depozite, chiar dacă sunt în alte localități.</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setShowAddPoi(false)}
                    className="flex-1 h-10 rounded-lg text-sm font-bold border border-input hover:bg-muted"
                  >
                    Anulează
                  </button>
                  <button 
                    onClick={handleAddPoi}
                    disabled={isLoading || !newPoiName || !newPoiLat}
                    className="flex-1 h-10 rounded-lg text-sm font-bold bg-primary text-white hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Check className="w-4 h-4"/>}
                    Salvează Locația
                  </button>
                </div>
              </div>
              <div className="h-[300px] rounded-xl overflow-hidden border-2 border-primary/10">
                <BaseLocationPicker 
                   lat={newPoiLat} 
                   lng={newPoiLon} 
                   onChange={(lat, lng) => {
                     setNewPoiLat(lat);
                     setNewPoiLon(lng);
                   }} 
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Weather Card */}
      <div className={cn("space-y-6 transition-opacity duration-300", isLoading && "opacity-50 pointer-events-none")}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/50 p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-white/20 backdrop-blur-md shadow-2xl relative overflow-hidden">
          {/* Subtle bg icon */}
          <div className="absolute -right-8 -bottom-8 opacity-[0.03] scale-[4]">
            <CurrentIcon className="w-24 h-24" />
          </div>

          <div className="flex items-center gap-6 relative z-10">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-[1.5rem] md:rounded-[2rem] agral-gradient flex items-center justify-center text-white shadow-2xl shrink-0 transform hover:scale-105 transition-transform">
              <CurrentIcon className="w-10 h-10 md:w-14 md:h-14" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge className="bg-primary/10 text-primary border-none text-[9px] md:text-[10px] font-black uppercase tracking-wider">{activeLocation.name}</Badge>
                {isLoading && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tighter leading-none">{Math.round(current.temperature_2m)}°C</h1>
              <p className="text-base md:text-lg font-bold text-muted-foreground mt-2">
                {currentInfo.desc}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-8 shrink-0 relative z-10 border-t md:border-t-0 pt-6 md:pt-0 border-white/20">
            <div className="flex flex-col items-center">
              <span className="text-[9px] md:text-[10px] uppercase font-bold text-muted-foreground mb-1 tracking-widest">Resimțită</span>
              <div className="flex items-center gap-2 font-black text-lg md:text-xl">
                <Thermometer className="w-4 h-4 md:w-5 md:h-5 text-amber-500" /> {Math.round(current.temperature_2m)}°
              </div>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[9px] md:text-[10px] uppercase font-bold text-muted-foreground mb-1 tracking-widest">Umiditate</span>
              <div className="flex items-center gap-2 font-black text-lg md:text-xl">
                <Droplets className="w-4 h-4 md:w-5 md:h-5 text-blue-500" /> {current.relative_humidity_2m}%
              </div>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[9px] md:text-[10px] uppercase font-bold text-muted-foreground mb-1 tracking-widest">Rafale</span>
              <div className="flex items-center gap-2 font-black text-lg md:text-xl">
                <Wind className="w-4 h-4 md:w-5 md:h-5 text-slate-500" /> {current.wind_speed_10m} <span className="text-[9px] md:text-[10px] font-black ml-0.5">km/h</span>
              </div>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[9px] md:text-[10px] uppercase font-bold text-muted-foreground mb-1 tracking-widest">Apă</span>
              <div className="flex items-center gap-2 font-black text-lg md:text-xl">
                <CloudRain className="w-4 h-4 md:w-5 md:h-5 text-primary" /> {daily.precipitation_sum[0]} <span className="text-[9px] md:text-[10px] font-black ml-0.5">mm</span>
              </div>
            </div>
          </div>
        </div>

        {/* Forecast Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4">
          {forecast.map((day: any, i: number) => (
            <Card key={i} className={cn(
              "border-none shadow-xl overflow-hidden transition-all hover:-translate-y-2 duration-300 group rounded-2xl",
              i === 0 ? "bg-primary text-white ring-8 ring-primary/10" : "bg-white/80 hover:bg-white"
            )}>
              <div className={cn(
                "p-5 flex flex-col items-center text-center space-y-4",
                i === 0 ? "text-white" : "text-foreground"
              )}>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">{day.date}</span>
                <day.icon className={cn("w-12 h-12 drop-shadow-xl", i === 0 ? "text-white" : "text-primary group-hover:scale-110 transition-transform")} />
                <div className="flex flex-col">
                  <span className="text-3xl font-black tracking-tighter">{day.maxTemp}°</span>
                  <span className="text-xs opacity-60 font-black">{day.minTemp}°</span>
                </div>
                <p className="text-[10px] font-bold leading-tight h-8 flex items-center justify-center italic px-2">
                  {day.desc}
                </p>
                {day.precip > 0 ? (
                  <Badge className={cn(
                    "mt-2 text-[10px] font-black px-3 py-1 rounded-full",
                    i === 0 ? "bg-white/20 text-white" : "bg-blue-100 text-blue-600"
                  )}>
                    {day.precip} mm apă
                  </Badge>
                ) : (
                  <div className="h-6" /> // spacer
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
      
      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 flex items-start gap-4">
         <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-primary shadow-sm shrink-0">
           <CalendarDays className="w-6 h-6" />
         </div>
         <div>
           <h4 className="font-black text-foreground uppercase tracking-tight text-sm">Sfat Agronomic · {forecast[0].date}</h4>
           <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
             {current.temperature_2m > 5 && daily.precipitation_sum[0] < 2 
               ? "Condiții bune pentru fertilizarea de primăvară. Vântul este moderat, riscul de derivă este scăzut." 
               : "Evitați tratamentele fitosanitare astăzi din cauza umidității ridicate sau a temperaturilor instabile."}
           </p>
         </div>
      </div>
    </div>
  );
}
