"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CloudSun, Newspaper, ArrowUpRight, Thermometer, Wind, Droplets } from "lucide-react";
import Link from "next/link";
import { getWeatherDesc } from "@/lib/weather";
import { Sun, Cloud, CloudFog, CloudDrizzle, CloudRain, Snowflake, CloudLightning } from "lucide-react";

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

export function WeatherWidget({ weather, county }: { weather: any, county: string }) {
  const current = weather.current;
  const daily = weather.daily;
  const info = getWeatherDesc(current.weather_code);
  const Icon = IconMap[info.icon] || Cloud;

  // Next 3 days (excluding today)
  const nextDays = daily.time.slice(1, 4).map((dateStr: string, i: number) => {
    const dayIndex = i + 1;
    const dayInfo = getWeatherDesc(daily.weather_code[dayIndex]);
    const DayIcon = IconMap[dayInfo.icon] || Cloud;
    const date = new Date(dateStr);
    const dayName = date.toLocaleDateString('ro-RO', { weekday: 'short' });

    return {
      name: dayName.charAt(0).toUpperCase() + dayName.slice(1),
      max: Math.round(daily.temperature_2m_max[dayIndex]),
      min: Math.round(daily.temperature_2m_min[dayIndex]),
      precip: daily.precipitation_sum[dayIndex],
      Icon: DayIcon
    };
  });

  return (
    <Card className="overflow-hidden border-none shadow-md bg-white/50 backdrop-blur-sm group hover:shadow-xl transition-all duration-300 h-full flex flex-col">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground/60">Vremea locală</CardTitle>
          <CardDescription className="font-bold text-foreground">{county}</CardDescription>
        </div>
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
          <Icon className="w-6 h-6" />
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-5xl font-black text-foreground">{Math.round(current.temperature_2m)}°C</div>
            <p className="text-xs font-bold text-primary mt-1">{info.desc}</p>
          </div>
          <div className="flex flex-col items-end gap-1 text-[10px] font-bold text-muted-foreground uppercase">
            <div className="flex items-center gap-1"><Wind className="w-3.5 h-3.5"/> {current.wind_speed_10m} km/h</div>
            <div className="flex items-center gap-1"><Droplets className="w-3.5 h-3.5"/> {current.relative_humidity_2m}%</div>
          </div>
        </div>

        {/* 3-Day Forecast */}
        <div className="grid grid-cols-3 gap-2 pt-4 border-t border-primary/10">
          {nextDays.map((day: any) => (
            <div key={day.name} className="flex flex-col items-center p-2 rounded-xl bg-primary/5 border border-primary/5 hover:border-primary/20 transition-all">
              <span className="text-[10px] font-black uppercase text-muted-foreground mb-1">{day.name}</span>
              <day.Icon className="w-5 h-5 text-primary mb-1" />
              <div className="text-xs font-bold text-foreground">{day.max}° <span className="text-muted-foreground/50 font-medium">/{day.min}°</span></div>
              {day.precip > 0 && <div className="text-[8px] font-black text-blue-600 mt-0.5">{day.precip}mm</div>}
            </div>
          ))}
        </div>

        <Link href="/vreme" className="flex items-center justify-center gap-2 py-2 w-full rounded-xl bg-primary/5 text-primary text-xs font-bold hover:bg-primary hover:text-white transition-all mt-auto">
          Prognoză detaliată <ArrowUpRight className="w-3 h-3" />
        </Link>
      </CardContent>
    </Card>
  );
}

export function NewsWidget({ news }: { news: any[] }) {
  return (
    <Card className="overflow-hidden border-none shadow-md bg-white/50 backdrop-blur-sm group hover:shadow-xl transition-all duration-300 h-full flex flex-col">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground/60">Știri Agricole</CardTitle>
          <CardDescription className="font-bold text-foreground">Actualitate Flux RSS</CardDescription>
        </div>
        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 group-hover:rotate-12 transition-transform">
          <Newspaper className="w-5 h-5" />
        </div>
      </CardHeader>
      <CardContent className="space-y-1.5 flex-1 p-4 pt-0">
        {news.slice(0, 4).map((item) => (
          <Link 
            key={item.id} 
            href={item.url} 
            target="_blank"
            className="block p-3 rounded-xl hover:bg-white transition-all border border-transparent hover:border-amber-100 hover:shadow-sm group/item"
          >
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-black text-amber-700 uppercase tracking-tighter bg-amber-50 px-1.5 py-0.5 rounded leading-none">
                {item.source}
              </span>
              <span className="text-[9px] font-bold text-muted-foreground/50">
                {new Date(item.date).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short' })}
              </span>
            </div>
            <div className="text-xs font-bold text-foreground line-clamp-1 leading-tight group-hover/item:text-amber-600 transition-colors">
              {item.title}
            </div>
          </Link>
        ))}
        
        <div className="pt-3">
          <Link href="/stiri" className="flex items-center justify-center gap-2 py-2 w-full rounded-xl bg-amber-500 text-white text-xs font-black hover:bg-amber-600 transition-all shadow-sm hover:shadow-md">
            VEZI TOATE ȘTIRILE <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
