"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CloudSun, CloudDrizzle, Sun, CloudRain, Snowflake, Wind, Droplets } from "lucide-react";

interface WeatherData {
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    weather_code: number;
  };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    weather_code: number[];
  };
}

// Coduri WMO pentru vreme (simplificat)
const getWeatherIcon = (code: number, className = "w-6 h-6") => {
  if (code === 0) return <Sun className={`${className} text-amber-500`} />;
  if (code >= 1 && code <= 3) return <CloudSun className={`${className} text-amber-400`} />;
  if (code >= 51 && code <= 67) return <CloudDrizzle className={`${className} text-blue-400`} />;
  if (code >= 80 && code <= 82) return <CloudRain className={`${className} text-blue-500`} />;
  if (code >= 71 && code <= 77) return <Snowflake className={`${className} text-sky-300`} />;
  return <CloudSun className={`${className} text-gray-500`} />;
};

const getWeatherDesc = (code: number) => {
  if (code === 0) return "Senin";
  if (code === 1 || code === 2) return "Parțial Noros";
  if (code === 3) return "Noros";
  if (code >= 51 && code <= 67) return "Ploaie Ușoară / Burniță";
  if (code >= 80 && code <= 82) return "Averse de Ploaie";
  if (code >= 71 && code <= 77) return "Ninsoare";
  return "Variabil";
};

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Coordonate pentru test (București/Ilfov, zona agricolă)
    const lat = 44.4268;
    const lon = 26.1025;

    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`
    )
      .then((res) => {
        if (!res.ok) throw new Error("Weather fetch failed");
        return res.json();
      })
      .then((data) => {
        setWeather(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(true);
        setLoading(false);
      });
  }, []);

  return (
    <Card className="h-full overflow-hidden relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-50 rounded-full blur-3xl -mr-20 -mt-20 opacity-60 pointer-events-none" />
      
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CloudSun className="w-5 h-5 text-amber-500" />
            Condiții Meteo Live
          </span>
          <span className="text-sm font-normal text-muted-foreground">Ferma Sud (București-Ilfov)</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="animate-pulse space-y-4 py-4">
            <div className="h-12 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-16 bg-gray-200 rounded w-full"></div>
          </div>
        ) : error || !weather ? (
          <div className="py-8 text-center text-sm text-destructive">
            Nu am putut încărca datele meteo.
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-6 lg:gap-8 mt-2 items-center">
            {/* Current Weather */}
            <div className="flex items-center gap-6">
              <div className="relative">
                {getWeatherIcon(weather.current.weather_code, "w-16 h-16")}
              </div>
              <div>
                <div className="text-4xl font-extrabold text-foreground tracking-tighter">
                  {Math.round(weather.current.temperature_2m)}°
                </div>
                <div className="text-sm font-medium text-muted-foreground">
                  {getWeatherDesc(weather.current.weather_code)}
                </div>
              </div>
            </div>

            {/* Current Details */}
            <div className="flex gap-4 md:border-l md:border-border md:pl-6">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Wind className="w-3.5 h-3.5" /> Vânt
                </div>
                <div className="font-semibold text-sm">{weather.current.wind_speed_10m} km/h</div>
              </div>
              <div className="flex flex-col gap-1 ml-4">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Droplets className="w-3.5 h-3.5" /> Umiditate
                </div>
                <div className="font-semibold text-sm">{Math.round(weather.current.relative_humidity_2m)}%</div>
              </div>
            </div>

            {/* Forecast 3 Days */}
            <div className="flex-1 w-full grid grid-cols-3 gap-2 md:border-l md:border-border md:pl-6 mt-4 md:mt-0">
              {[1, 2, 3].map((dayOffset) => {
                const date = new Date(weather.daily.time[dayOffset]);
                const dayName = new Intl.DateTimeFormat('ro-RO', { weekday: 'short' }).format(date);
                
                return (
                  <div key={dayOffset} className="flex flex-col items-center justify-center p-2 rounded-xl bg-accent/30">
                    <span className="text-xs font-medium text-muted-foreground capitalize mb-1">
                      {dayName}
                    </span>
                    {getWeatherIcon(weather.daily.weather_code[dayOffset], "w-6 h-6 mb-1")}
                    <div className="text-xs font-bold text-foreground">
                      {Math.round(weather.daily.temperature_2m_max[dayOffset])}° 
                      <span className="text-muted-foreground font-normal ml-1">
                        {Math.round(weather.daily.temperature_2m_min[dayOffset])}°
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
