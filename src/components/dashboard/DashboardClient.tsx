"use client";

import React, { useState, use, Suspense } from "react";
import { 
  WeatherWidget, 
  NewsWidget, 
  QuickActionsWidget 
} from "@/components/dashboard/DashboardWidgets";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Sprout,
  AlertCircle,
  CheckCircle2,
  Zap,
  Settings2,
  X,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  Save,
  RotateCcw,
  ArrowRight,
  CloudSun,
  Newspaper
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { updateDashboardConfig } from "@/lib/actions/dashboard";

interface WidgetConfig {
  id: string;
  name: string;
  visible: boolean;
}

interface DashboardClientProps {
  weatherPromise: Promise<any>;
  county: string;
  newsPromise: Promise<any[]>;
  realAlerts: any[];
  todayTip: string;
  recentParcels: any[];
  statusColors: Record<string, string>;
  initialConfig?: WidgetConfig[];
}

const DEFAULT_CONFIG: WidgetConfig[] = [
  { id: "weather", name: "Vremea locală", visible: true },
  { id: "actions", name: "Acces Rapid", visible: true },
  { id: "alerts", name: "Alerte & Sfat", visible: true },
  { id: "news", name: "Știri Agricole", visible: true },
  { id: "parcele", name: "Parcele Recente", visible: true },
];

export function DashboardClient({ 
  weatherPromise, 
  county, 
  newsPromise, 
  realAlerts, 
  todayTip, 
  recentParcels, 
  statusColors,
  initialConfig 
}: DashboardClientProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [config, setConfig] = useState<WidgetConfig[]>(initialConfig || DEFAULT_CONFIG);
  const [isSaving, setIsSaving] = useState(false);

  const toggleVisibility = (id: string) => {
    setConfig(prev => prev.map(w => w.id === id ? { ...w, visible: !w.visible } : w));
  };

  const moveWidget = (index: number, direction: 'up' | 'down') => {
    const newConfig = [...config];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newConfig.length) return;
    
    [newConfig[index], newConfig[targetIndex]] = [newConfig[targetIndex], newConfig[index]];
    setConfig(newConfig);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateDashboardConfig(config);
      setIsEditMode(false);
    } catch (error) {
      console.error("Failed to save config", error);
    } finally {
      setIsSaving(false);
    }
  };

  const resetConfig = () => {
    setConfig(DEFAULT_CONFIG);
  };

  const renderWidget = (id: string) => {
    switch (id) {
      case "weather":
        return (
          <div className="md:col-span-1 lg:col-span-4 h-full">
            <Suspense fallback={<WidgetSkeleton icon={CloudSun} title="Vremea" />}>
              <WeatherWrapper promise={weatherPromise} county={county} />
            </Suspense>
          </div>
        );
      case "actions":
        return <div className="md:col-span-1 lg:col-span-4 h-full"><QuickActionsWidget /></div>;
        case "alerts":
        return (
          <div className="md:col-span-2 lg:col-span-4 space-y-6">
            <Card className="bg-white border border-slate-200 shadow-lg rounded-2xl overflow-hidden">
              <CardHeader className="pb-4 pt-8 px-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-600 border border-orange-500/20 shadow-inner">
                    <Zap className="w-5 h-5" strokeWidth={1.5} />
                  </div>
                  <div>
                    <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1">Sistem Inteligent</CardTitle>
                    <CardDescription className="text-xl font-black text-slate-900">Alerte Smart</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-6 pb-8 space-y-3">
                {realAlerts.map((alert) => (
                  <Link
                    key={alert.text}
                    href={alert.href}
                    className={cn(
                      "flex items-center gap-4 p-5 rounded-xl border transition-all hover:scale-[1.01] active:scale-95 group/alert shadow-sm",
                      alert.type === "warning" ? "bg-amber-50/50 border-amber-100 text-amber-900" 
                      : alert.type === "success" ? "bg-emerald-50/50 border-emerald-100 text-emerald-900"
                      : "bg-sky-50/50 border-sky-100 text-sky-900"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm group-hover/alert:rotate-6 transition-transform duration-500",
                      alert.type === "warning" ? "bg-amber-400 text-white" : alert.type === "success" ? "bg-emerald-400 text-white" : "bg-sky-400 text-white"
                    )}>
                      {alert.type === "success" ? <CheckCircle2 className="w-5 h-5" strokeWidth={1.5} /> : <AlertCircle className="w-5 h-5" strokeWidth={1.5} />}
                    </div>
                    <p className="text-sm font-black uppercase tracking-tight leading-tight">{alert.text}</p>
                  </Link>
                ))}
              </CardContent>
            </Card>

            <div className="p-8 rounded-2xl bg-slate-950 text-white shadow-xl relative overflow-hidden group border border-white/10">
              <div className="absolute top-0 right-0 p-8 opacity-[0.05] group-hover:scale-110 transition-transform duration-[10s] ease-out">
                <Sprout className="w-48 h-48 rotate-12" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 backdrop-blur-xl border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Sprout className="w-5 h-5" strokeWidth={1.5} />
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest text-white/60">Sfatul Agronomului</span>
                </div>
                <p className="text-lg font-bold leading-relaxed text-slate-200 italic">"{todayTip}"</p>
                <div className="mt-6 flex items-center gap-2">
                  <div className="h-0.5 w-8 bg-emerald-500 rounded-full" />
                  <span className="text-xs font-black uppercase text-emerald-500 tracking-widest">Expert Insight</span>
                </div>
              </div>
            </div>
          </div>
        );
      case "news":
        return (
          <div className="md:col-span-2 lg:col-span-7 h-full">
            <Suspense fallback={<WidgetSkeleton icon={Newspaper} title="Știri Agricole" />}>
              <NewsWrapper promise={newsPromise} />
            </Suspense>
          </div>
        );
      case "parcele":
        return (
          <div className="md:col-span-2 lg:col-span-5">
            <Card className="h-full border border-slate-200 shadow-lg relative overflow-hidden group rounded-2xl bg-white">
              <CardHeader className="pb-4 p-8 flex flex-row items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 border border-indigo-500/20">
                    <MapPin className="w-6 h-6" strokeWidth={1.5} />
                  </div>
                  <div>
                    <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1">Geografie Activă</CardTitle>
                    <CardDescription className="text-xl font-black text-slate-900 tracking-tight">Parcele Recente</CardDescription>
                  </div>
                </div>
                <Link href="/parcele" className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-white transition-all duration-500 shadow-inner group/all">
                  <ArrowRight className="w-5 h-5 group-hover/all:translate-x-0.5 transition-transform" />
                </Link>
              </CardHeader>
              <CardContent className="px-6 pb-8 space-y-3">
                <div className="space-y-3">
                  {recentParcels.map((parcel) => (
                    <Link 
                      key={parcel.id} 
                      href={`/parcele/${parcel.id}`}
                      className="flex items-center justify-between p-5 rounded-xl bg-slate-50/50 border border-transparent hover:border-indigo-200 hover:bg-white hover:shadow-xl transition-all duration-500 group/parcel"
                    >
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-xl bg-white flex flex-col items-center justify-center text-indigo-600 border border-slate-100 shadow-sm group-hover/parcel:scale-105 transition-transform duration-500">
                          <span className="text-sm font-black leading-none">{Number(parcel.areaHa).toFixed(1)}</span>
                          <span className="text-[10px] font-black uppercase tracking-tighter opacity-60 mt-0.5">ha</span>
                        </div>
                        <div>
                          <div className="text-sm font-black text-slate-900 group-hover/parcel:text-indigo-600 transition-colors uppercase tracking-tight">{parcel.name}</div>
                          <div className="text-xs font-black text-slate-400 uppercase tracking-widest">{parcel.cropPlans?.[0]?.cropType || "Teren Liber"}</div>
                        </div>
                      </div>
                      <Badge className={cn("text-xs uppercase font-black px-3 py-1 rounded-lg border-none whitespace-nowrap shadow-sm", statusColors[parcel.cropPlans?.[0]?.status] || "bg-slate-200 text-slate-600")}>
                        {parcel.cropPlans?.[0]?.status === 'sown' ? 'Semănat' : 
                         parcel.cropPlans?.[0]?.status === 'growing' ? 'În curs' :
                         parcel.cropPlans?.[0]?.status === 'harvested' ? 'Recoltat' : 'Pregătit'}
                      </Badge>
                    </Link>
                  ))}
                  {recentParcels.length === 0 && (
                    <div className="py-12 flex flex-col items-center justify-center gap-4 text-slate-300">
                      <MapPin className="w-12 h-12 opacity-20" />
                      <span className="text-xs font-black uppercase tracking-widest">Nu există parcele definite</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-12" suppressHydrationWarning>
      {/* Controls */}
      <div className="flex justify-between items-center" suppressHydrationWarning>
        <div className="space-y-1">
           <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase">Bento Hub</h3>
           <div className="flex items-center gap-2">
              <div className="relative flex items-center justify-center">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <CheckCircle2 className="absolute w-3 h-3 text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Configurare Personalizată Activă</p>
           </div>
        </div>
        
        {isEditMode ? (
          <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-2xl">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={resetConfig}
              className="rounded-xl text-red-500 hover:bg-red-50 font-black text-[10px] tracking-widest uppercase"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-2" /> Reset
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsEditMode(false)}
              className="rounded-xl font-black text-[10px] tracking-widest uppercase"
            >
              Anulează
            </Button>
            <Button 
              size="sm" 
              onClick={handleSave} 
              disabled={isSaving}
              className="rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-black text-[10px] tracking-widest uppercase px-6"
            >
              <Save className="w-3.5 h-3.5 mr-2" /> {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        ) : (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsEditMode(true)}
            className="rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all shadow-sm font-black text-xs tracking-widest uppercase px-5 py-6 border-slate-200"
          >
            <Settings2 className="w-4 h-4 mr-2" strokeWidth={1.5} /> Customize
          </Button>
        )}
      </div>

      {isEditMode && (
        <Card className="glass-premium border-none shadow-2xl p-8 rounded-[2.5rem] animate-in zoom-in-95 duration-500">
          <CardHeader className="p-0 mb-8">
            <CardTitle className="text-2xl font-black text-slate-900 tracking-tighter">Layout Management</CardTitle>
            <CardDescription className="font-bold text-slate-400 uppercase text-[10px] tracking-widest">Ajustează prioritățile și vizibilitatea widget-urilor.</CardDescription>
          </CardHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {config.map((widget, index) => (
              <div 
                key={widget.id} 
                className={cn(
                  "flex items-center justify-between p-5 rounded-[2rem] border transition-all duration-500",
                  widget.visible ? "bg-white border-slate-200 shadow-xl shadow-slate-900/5" : "bg-slate-50 border-slate-100 opacity-40 grayscale"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-slate-50 text-slate-400 border border-slate-100">
                    <GripVertical className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-slate-900 uppercase tracking-tight">{widget.name}</div>
                    <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{widget.visible ? "Activ" : "Inactiv"}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    disabled={index === 0} 
                    onClick={() => moveWidget(index, 'up')}
                    className="h-9 w-9 rounded-xl hover:bg-slate-100"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    disabled={index === config.length - 1} 
                    onClick={() => moveWidget(index, 'down')}
                    className="h-9 w-9 rounded-xl hover:bg-slate-100"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant={widget.visible ? "secondary" : "outline"} 
                    size="sm"
                    onClick={() => toggleVisibility(widget.id)}
                    className="ml-4 rounded-xl font-black text-[9px] tracking-widest px-4"
                  >
                    {widget.visible ? <><EyeOff className="w-3.5 h-3.5 mr-2" /> HIDE</> : <><Eye className="w-3.5 h-3.5 mr-2" /> SHOW</>}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500" suppressHydrationWarning>
        {config.filter(w => w.visible).map(w => (
          <React.Fragment key={w.id}>
            {renderWidget(w.id)}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function WeatherWrapper({ promise, county }: { promise: Promise<any>, county: string }) {
  const weather = use(promise);
  return <WeatherWidget weather={weather} county={county} />;
}

function NewsWrapper({ promise }: { promise: Promise<any[]> }) {
  const news = use(promise);
  return <NewsWidget news={news} />;
}

function WidgetSkeleton({ icon: Icon, title }: { icon: any, title: string }) {
  return (
    <Card className="h-full border border-slate-100 shadow-md relative overflow-hidden rounded-2xl bg-white">
      <CardHeader className="pb-4 p-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-300">{title}</CardTitle>
            <div className="h-8 w-32 bg-slate-100 animate-pulse rounded-lg" />
          </div>
          <div className="w-14 h-14 rounded-xl bg-slate-50 flex items-center justify-center text-slate-200">
            <Icon className="w-7 h-7" strokeWidth={1} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-8 space-y-4">
        <div className="h-12 w-full bg-slate-50 animate-pulse rounded-xl" />
        <div className="h-12 w-full bg-slate-50 animate-pulse rounded-xl" />
        <div className="h-12 w-full bg-slate-50 animate-pulse rounded-xl" />
      </CardContent>
    </Card>
  );
}
