"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CloudSun, 
  Newspaper, 
  ArrowUpRight, 
  Wind, 
  Droplets, 
  Plus, 
  Map as MapIcon, 
  ClipboardList, 
  Box, 
  Truck,
  ArrowRight
} from "lucide-react";
import Link from "next/link";
import { getWeatherDesc } from "@/lib/weather";
import { Sun, Cloud, CloudFog, CloudDrizzle, CloudRain, Snowflake, CloudLightning } from "lucide-react";
import { cn } from "@/lib/utils";

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
    <Card className="h-full border-none shadow-xl bg-gradient-to-br from-blue-500/10 via-white/50 to-white/80 backdrop-blur-md relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-500">
        <Icon className="w-32 h-32 text-blue-600" />
      </div>
      
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between relative z-10">
          <div>
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600/60 mb-1">Vremea locală</CardTitle>
            <CardDescription className="text-lg font-black text-foreground">{county}</CardDescription>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-600 shadow-inner">
            <Icon className="w-7 h-7" />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6 relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-6xl font-black tracking-tighter text-foreground tabular-nums">
              {Math.round(current.temperature_2m)}°
            </div>
            <p className="text-sm font-bold text-blue-600/80">{info.desc}</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/50 border border-blue-100/50 shadow-sm">
              <Wind className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-bold text-foreground">{current.wind_speed_10m} km/h</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/50 border border-blue-100/50 shadow-sm">
              <Droplets className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-bold text-foreground">{current.relative_humidity_2m}%</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {nextDays.map((day: any) => (
            <div key={day.name} className="flex flex-col items-center p-3 rounded-2xl bg-white/40 border border-white hover:border-blue-200 hover:bg-white/60 transition-all duration-300">
              <span className="text-[10px] font-black uppercase text-muted-foreground/60 mb-2">{day.name}</span>
              <day.Icon className="w-6 h-6 text-blue-500 mb-2" />
              <div className="text-sm font-black text-foreground">
                {day.max}°
              </div>
              <div className="text-[10px] font-bold text-muted-foreground/40">{day.min}°</div>
            </div>
          ))}
        </div>

        <Link 
          href="/vreme" 
          className="group/btn flex items-center justify-between px-4 py-3 w-full rounded-2xl bg-blue-600 text-white text-xs font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
        >
          PROGNOZĂ DETALIATĂ
          <ArrowUpRight className="w-4 h-4 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
        </Link>
      </CardContent>
    </Card>
  );
}

export function NewsWidget({ news }: { news: any[] }) {
  return (
    <Card className="h-full border-none shadow-xl bg-gradient-to-br from-amber-500/10 via-white/50 to-white/80 backdrop-blur-md relative overflow-hidden group">
      <CardHeader className="pb-3 px-6 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600/60 mb-1">Știri Agricole</CardTitle>
            <CardDescription className="text-lg font-black text-foreground">Flux Actualizat</CardDescription>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-600/10 flex items-center justify-center text-amber-600">
            <Newspaper className="w-6 h-6" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-6">
        <div className="space-y-2">
          {news.slice(0, 4).map((item) => (
            <Link 
              key={item.id} 
              href={item.url} 
              target="_blank"
              className="block p-4 rounded-2xl hover:bg-white transition-all border border-transparent hover:border-amber-100 hover:shadow-md group/item relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-2 relative z-10">
                <Badge variant="outline" className="text-[9px] font-black bg-amber-50 text-amber-700 border-amber-200/50 uppercase">
                  {item.source}
                </Badge>
                <span className="text-[10px] font-bold text-muted-foreground/50">
                  {new Date(item.date).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short' })}
                </span>
              </div>
              <div className="text-sm font-bold text-foreground line-clamp-2 leading-snug group-hover/item:text-amber-600 transition-colors relative z-10">
                {item.title}
              </div>
            </Link>
          ))}
        </div>
        
        <div className="mt-4 px-2">
          <Link href="/stiri" className="group/btn flex items-center justify-center gap-2 py-3.5 w-full rounded-2xl bg-white border border-amber-100 text-amber-600 text-[10px] font-black hover:bg-amber-600 hover:text-white transition-all shadow-sm hover:shadow-lg hover:shadow-amber-200">
            TOATE ȘTIRILE 
            <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export function QuickActionsWidget() {
  const actions = [
    { title: "Hartă Parcele", icon: MapIcon, href: "/parcele", color: "text-emerald-600", bg: "bg-emerald-50" },
    { title: "Operațiune Nouă", icon: Plus, href: "/operatiuni?new=true", color: "text-blue-600", bg: "bg-blue-50" },
    { title: "Gestiune Stoc", icon: Box, href: "/stocuri", color: "text-purple-600", bg: "bg-purple-50" },
    { title: "Flotă Utilaje", icon: Truck, href: "/utilaje", color: "text-orange-600", bg: "bg-orange-50" },
  ];

  return (
    <Card className="h-full border-none shadow-xl bg-white/50 backdrop-blur-md">
      <CardHeader className="pb-3 pt-6 px-6">
        <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 mb-1">Acces Rapid</CardTitle>
        <CardDescription className="text-lg font-black text-foreground">Comenzi Rapide</CardDescription>
      </CardHeader>
      <CardContent className="px-4 pb-6 grid grid-cols-2 gap-3">
        {actions.map((action) => (
          <Link 
            key={action.title} 
            href={action.href}
            className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white border border-transparent hover:border-primary/20 hover:shadow-lg transition-all group"
          >
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform", action.bg, action.color)}>
              <action.icon className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black text-center text-muted-foreground group-hover:text-foreground transition-colors uppercase leading-tight">
              {action.title}
            </span>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
