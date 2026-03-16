"use client";

import { useEffect, useState } from "react";
import { CloudSun, Cloud, CloudRain, Snowflake, Wind, Droplets, Thermometer, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface WeatherData {
  temperature: number;
  windspeed: number;
  weathercode: number;
  time: string;
}

interface Forecast {
  date: string;
  maxTemp: number;
  minTemp: number;
  weathercode: number;
}

function getWeatherIcon(code: number, size = 6) {
  const cls = `w-${size} h-${size}`;
  if (code === 0) return <CloudSun className={`${cls} text-amber-400`} />;
  if (code <= 3) return <Cloud className={`${cls} text-gray-400`} />;
  if (code <= 67) return <CloudRain className={`${cls} text-blue-400`} />;
  if (code <= 77) return <Snowflake className={`${cls} text-blue-200`} />;
  return <CloudRain className={`${cls} text-blue-600`} />;
}

function getWeatherDesc(code: number): string {
  if (code === 0) return "Cer senin";
  if (code <= 1) return "Predominant senin";
  if (code <= 3) return "Parțial noros";
  if (code <= 48) return "Ceață";
  if (code <= 57) return "Burniță";
  if (code <= 67) return "Ploaie";
  if (code <= 77) return "Ninsoare";
  if (code <= 82) return "Averse";
  return "Furtună";
}

function getDayName(dateStr: string, index: number): string {
  if (index === 0) return "Azi";
  if (index === 1) return "Mâine";
  const date = new Date(dateStr);
  return date.toLocaleDateString("ro-RO", { weekday: "short" });
}

// Locație default: București
const DEFAULT_LAT = 44.4268;
const DEFAULT_LNG = 26.1025;

export function WeatherWidget() {
  const [current, setCurrent] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<Forecast[]>([]);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState("București");

  useEffect(() => {
    async function fetchWeather(lat: number, lng: number) {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=Europe/Bucharest&forecast_days=7`;
        const res = await fetch(url);
        const data = await res.json();

        setCurrent({
          temperature: Math.round(data.current_weather.temperature),
          windspeed: Math.round(data.current_weather.windspeed),
          weathercode: data.current_weather.weathercode,
          time: data.current_weather.time,
        });

        const days: Forecast[] = data.daily.time.map((d: string, i: number) => ({
          date: d,
          maxTemp: Math.round(data.daily.temperature_2m_max[i]),
          minTemp: Math.round(data.daily.temperature_2m_min[i]),
          weathercode: data.daily.weathercode[i],
        }));
        setForecast(days);
      } catch (err) {
        console.error("Weather fetch error:", err);
      } finally {
        setLoading(false);
      }
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          fetchWeather(pos.coords.latitude, pos.coords.longitude);
          setLocation("Locația mea");
        },
        () => {
          fetchWeather(DEFAULT_LAT, DEFAULT_LNG);
        }
      );
    } else {
      fetchWeather(DEFAULT_LAT, DEFAULT_LNG);
    }
  }, []);

  if (loading) {
    return (
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CloudSun className="w-5 h-5 text-amber-400" />
            Vreme
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!current) return null;

  return (
    <Card className="col-span-2">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CloudSun className="w-5 h-5 text-amber-400" />
            Vreme — {location}
          </span>
          <span className="text-xs text-muted-foreground font-normal">Open-Meteo</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Current weather */}
        <div className="flex items-center gap-6 mb-6 p-4 bg-gradient-to-r from-primary/5 to-amber-50 rounded-xl">
          <div>{getWeatherIcon(current.weathercode, 12)}</div>
          <div>
            <div className="text-5xl font-extrabold text-foreground">{current.temperature}°C</div>
            <div className="text-muted-foreground font-medium">{getWeatherDesc(current.weathercode)}</div>
          </div>
          <div className="ml-auto grid grid-cols-1 gap-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Wind className="w-4 h-4" />
              <span>{current.windspeed} km/h vânt</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Thermometer className="w-4 h-4" />
              <span>Resimțit ca {current.temperature - 2}°C</span>
            </div>
          </div>
        </div>

        {/* 7-day forecast */}
        <div className="grid grid-cols-7 gap-1">
          {forecast.map((day, i) => (
            <div
              key={day.date}
              className="flex flex-col items-center p-2 rounded-xl hover:bg-accent transition-colors"
            >
              <span className="text-xs font-semibold text-muted-foreground mb-1">
                {getDayName(day.date, i)}
              </span>
              {getWeatherIcon(day.weathercode, 5)}
              <span className="text-sm font-bold mt-1">{day.maxTemp}°</span>
              <span className="text-xs text-muted-foreground">{day.minTemp}°</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
