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
import { cn, formatDate, formatWeekday } from "@/lib/utils";

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

  const nextDays = daily.time.slice(1, 4).map((dateStr: string, i: number) => {
    const dayIndex = i + 1;
    const dayInfo = getWeatherDesc(daily.weather_code[dayIndex]);
    const DayIcon = IconMap[dayInfo.icon] || Cloud;
    const date = new Date(dateStr);
    const dayName = formatWeekday(date);

    return {
      name: dayName,
      max: Math.round(daily.temperature_2m_max[dayIndex]),
      min: Math.round(daily.temperature_2m_min[dayIndex]),
      precip: daily.precipitation_sum[dayIndex],
      Icon: DayIcon
    };
  });

  return (
    <Card className="h-full border border-slate-800 shadow-xl relative overflow-hidden group rounded-2xl bg-slate-900 text-white">
      <div className="absolute inset-0 bg-slate-800/30" />
      
      <CardHeader className="pb-2 relative z-10 p-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
               <div className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
               <CardTitle className="text-xs font-black uppercase tracking-widest text-blue-400/80">Stație Meteo Locală</CardTitle>
            </div>
            <CardDescription className="text-2xl font-black text-white tracking-tight">{county}</CardDescription>
          </div>
          <div className="w-14 h-14 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center text-blue-400 shadow-xl transition-transform duration-700 group-hover:rotate-6">
            <Icon className="w-7 h-7" strokeWidth={1.5} />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-8 relative z-10 p-8 pt-0">
        <div className="flex items-end justify-between">
          <div className="space-y-1">
            <div className="text-7xl font-black tracking-tighter text-white tabular-nums leading-none">
              {Math.round(current.temperature_2m)}°
            </div>
            <p className="text-base font-bold text-blue-400/80 tracking-wide uppercase">{info.desc}</p>
          </div>
          
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md">
              <Wind className="w-4 h-4 text-blue-400" strokeWidth={1.5} />
              <span className="text-sm font-black text-white tabular-nums">{current.wind_speed_10m} <span className="text-xs text-white/40 ml-0.5">km/h</span></span>
            </div>
            <div className="flex items-center gap-3 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md">
              <Droplets className="w-4 h-4 text-blue-400" strokeWidth={1.5} />
              <span className="text-sm font-black text-white tabular-nums">{current.relative_humidity_2m}<span className="text-xs text-white/40 ml-0.5">%</span></span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
          {nextDays.map((day: any) => (
            <div key={day.name} className="flex flex-col items-center p-4 rounded-xl bg-white/5 border border-white/5 hover:border-blue-400/30 hover:bg-white/10 transition-all duration-500 group/day">
              <span className="text-xs font-black uppercase text-white/40 tracking-widest mb-3 group-hover/day:text-blue-400 transition-colors">{day.name}</span>
              <day.Icon className="w-6 h-6 text-white mb-3" strokeWidth={1.5} />
              <div className="text-lg font-black text-white tabular-nums">
                {day.max}°
              </div>
              <div className="text-xs font-bold text-white/30 tabular-nums">/{day.min}°</div>
            </div>
          ))}
        </div>

        <Link 
          href="/vreme" 
          className="group/btn relative flex items-center justify-center gap-3 px-6 py-4 w-full rounded-2xl bg-white text-slate-950 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-blue-400 hover:text-white transition-all duration-500 shadow-[0_20px_40px_rgba(0,0,0,0.3)] overflow-hidden"
        >
          <span className="relative z-10">Pronoză Detaliată</span>
          <ArrowRight className="w-4 h-4 relative z-10 group-hover/btn:translate-x-1 transition-transform" />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-500" />
        </Link>
      </CardContent>
    </Card>
  );
}

export function NewsWidget({ news }: { news: any[] }) {
  return (
    <Card className="h-full border border-slate-200 shadow-lg relative overflow-hidden group rounded-2xl bg-white">
      <CardHeader className="pb-4 p-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-emerald-600/60">Actualitate Agricolă</CardTitle>
            <CardDescription className="text-2xl font-black text-slate-900 tracking-tight">Flux Știri Agral</CardDescription>
          </div>
          <div className="w-14 h-14 rounded-xl bg-emerald-600/10 flex items-center justify-center text-emerald-600 border border-emerald-500/10 group-hover:scale-105 transition-transform duration-500">
            <Newspaper className="w-7 h-7" strokeWidth={1.5} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-8 space-y-2">
        {news.slice(0, 5).map((item, idx) => (
          <Link 
            key={item.id} 
            href={item.url} 
            target="_blank"
            className={cn(
              "block p-4 rounded-xl transition-all duration-500 border border-transparent hover:border-emerald-100 group/item relative overflow-hidden",
              idx === 0 ? "bg-white shadow-md scale-[1.01] z-10 border-emerald-100" : "bg-white/40 hover:bg-white hover:shadow-md"
            )}
          >
            <div className="flex justify-between items-center mb-3">
              <Badge variant="outline" className="text-xs font-black bg-emerald-50 text-emerald-700 border-emerald-200/50 uppercase tracking-widest px-2.5 py-1">
                {item.source}
              </Badge>
              <div className="flex items-center gap-1.5">
                 <div className="h-1 w-1 rounded-full bg-slate-300" />
                 <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                   {formatDate(item.date)}
                 </span>
              </div>
            </div>
            <div className="text-base font-black text-slate-900 line-clamp-2 leading-tight group-hover/item:text-emerald-600 transition-colors">
              {item.title}
            </div>
          </Link>
        ))}
        
        <div className="mt-6">
          <Link href="/stiri" className="group/btn flex items-center justify-center gap-3 py-5 w-full rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.25em] hover:bg-emerald-600 transition-all duration-500 shadow-xl shadow-slate-900/20">
            Vezi Toate Știrile 
            <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export function QuickActionsWidget() {
  const actions = [
    { title: "Parcele", icon: MapIcon, href: "/parcele", color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
    { title: "Operațiune", icon: Plus, href: "/operatiuni?new=true", color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
    { title: "Stocuri", icon: Box, href: "/stocuri", color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/20" },
    { title: "Utilaje", icon: Truck, href: "/utilaje", color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20" },
  ];

  return (
    <Card className="h-full border border-slate-200 shadow-lg relative overflow-hidden group rounded-2xl bg-white">
      <CardHeader className="pb-4 p-8">
        <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1">Productivitate</CardTitle>
        <CardDescription className="text-2xl font-black text-slate-900 tracking-tight">Comenzi Rapide</CardDescription>
      </CardHeader>
      <CardContent className="px-6 pb-8 grid grid-cols-2 gap-4">
        {actions.map((action) => (
          <Link 
            key={action.title} 
            href={action.href}
            className="flex flex-col items-center justify-center p-6 rounded-xl bg-white border border-slate-100 hover:border-slate-900 hover:shadow-xl transition-all duration-500 group/action relative overflow-hidden"
          >
            <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover/action:scale-105 transition-all duration-500 shadow-sm", action.bg, action.color, action.border, "border")}>
              <action.icon className="w-6 h-6" strokeWidth={1.5} />
            </div>
            <span className="text-xs font-black text-center text-slate-500 group-hover/action:text-slate-900 transition-colors uppercase tracking-widest leading-tight">
              {action.title}
            </span>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
