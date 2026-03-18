"use client";

import React, { useState } from "react";
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
  RotateCcw
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
  weather: any;
  county: string;
  news: any[];
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
  weather, 
  county, 
  news, 
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
        return <div className="md:col-span-1 lg:col-span-4 h-full"><WeatherWidget weather={weather} county={county} /></div>;
      case "actions":
        return <div className="md:col-span-1 lg:col-span-4 h-full"><QuickActionsWidget /></div>;
      case "alerts":
        return (
          <div className="md:col-span-2 lg:col-span-4 space-y-6">
            <Card className="border-none shadow-xl bg-white/50 backdrop-blur-md">
              <CardHeader className="pb-3 pt-6 px-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 mb-0.5">Sistem</CardTitle>
                    <CardDescription className="text-lg font-black text-foreground">Alerte Smart</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-6 pb-6 space-y-3">
                {realAlerts.map((alert, i) => (
                  <Link
                    key={i}
                    href={alert.href}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-2xl border transition-all hover:translate-x-1",
                      alert.type === "warning" ? "bg-amber-50 shadow-sm border-amber-100 text-amber-900" 
                      : alert.type === "success" ? "bg-emerald-50 shadow-sm border-emerald-100 text-emerald-900"
                      : "bg-sky-50 shadow-sm border-sky-100 text-sky-900"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm",
                      alert.type === "warning" ? "bg-amber-200" : alert.type === "success" ? "bg-emerald-200" : "bg-sky-200"
                    )}>
                      {alert.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    </div>
                    <p className="text-xs font-black uppercase tracking-tighter leading-tight">{alert.text}</p>
                  </Link>
                ))}
              </CardContent>
            </Card>

            <div className="p-6 rounded-[2rem] bg-gradient-to-br from-primary via-primary/90 to-emerald-600 text-white shadow-xl shadow-primary/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform duration-700">
                <Sprout className="w-20 h-20" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                    <Sprout className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">Sfatul Agronomului</span>
                </div>
                <p className="text-sm font-bold leading-relaxed">{todayTip}</p>
              </div>
            </div>
          </div>
        );
      case "news":
        return <div className="md:col-span-2 lg:col-span-7 h-full"><NewsWidget news={news} /></div>;
      case "parcele":
        return (
          <div className="md:col-span-2 lg:col-span-5">
            <Card className="h-full border-none shadow-xl bg-white/50 backdrop-blur-md overflow-hidden">
              <CardHeader className="pb-3 pt-6 px-6 flex flex-row items-center justify-between font-black">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Geografie</CardTitle>
                    <CardDescription className="text-lg font-black text-foreground">Parcele Recente</CardDescription>
                  </div>
                </div>
                <Link href="/parcele" className="text-[10px] font-black text-primary hover:underline underline-offset-4 tracking-widest uppercase">
                  Toate
                </Link>
              </CardHeader>
              <CardContent className="px-4 pb-6 mt-2">
                <div className="space-y-2">
                  {recentParcels.map((parcel) => (
                    <Link 
                      key={parcel.id} 
                      href={`/parcele/${parcel.id}`}
                      className="flex items-center justify-between p-4 rounded-2xl bg-white border border-transparent hover:border-emerald-100 hover:shadow-lg transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex flex-col items-center justify-center text-emerald-600 border border-emerald-100/50">
                          <span className="text-[10px] font-black leading-none">{Number(parcel.areaHa).toFixed(1)}</span>
                          <span className="text-[7px] font-bold uppercase">ha</span>
                        </div>
                        <div>
                          <div className="text-sm font-black text-foreground group-hover:text-emerald-600 transition-colors uppercase tracking-tight">{parcel.name}</div>
                          <div className="text-[10px] font-bold text-muted-foreground/60 uppercase">{parcel.cropPlans?.[0]?.cropType || "Niciun plan activ"}</div>
                        </div>
                      </div>
                      <Badge className={cn("text-[9px] uppercase font-black px-2 py-0.5 rounded-lg border-none whitespace-nowrap", statusColors[parcel.cropPlans?.[0]?.status] || "bg-slate-100 text-slate-600")}>
                        {parcel.cropPlans?.[0]?.status === 'sown' ? 'Semănat' : 
                         parcel.cropPlans?.[0]?.status === 'growing' ? 'În curs' :
                         parcel.cropPlans?.[0]?.status === 'harvested' ? 'Recoltat' : 'Planificat'}
                      </Badge>
                    </Link>
                  ))}
                  {recentParcels.length === 0 && (
                    <div className="py-10 text-center text-muted-foreground italic text-xs font-bold uppercase tracking-widest">
                      Nu există parcele definite
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
    <div className="space-y-8">
      {/* Controls */}
      <div className="flex justify-end items-center gap-4">
        {isEditMode ? (
          <>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={resetConfig}
              className="rounded-xl border-dashed border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <RotateCcw className="w-4 h-4 mr-2" /> Resetare
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsEditMode(false)}
              className="rounded-xl"
            >
              Anulează
            </Button>
            <Button 
              size="sm" 
              onClick={handleSave} 
              disabled={isSaving}
              className="rounded-xl bg-primary shadow-lg shadow-primary/20"
            >
              <Save className="w-4 h-4 mr-2" /> {isSaving ? "Se salvează..." : "Salvează"}
            </Button>
          </>
        ) : (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsEditMode(true)}
            className="rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/50 shadow-sm"
          >
            <Settings2 className="w-4 h-4 mr-2" /> Editează Dashboard
          </Button>
        )}
      </div>

      {isEditMode && (
        <Card className="border-none shadow-xl bg-white/80 backdrop-blur-md p-6">
          <CardHeader className="p-0 mb-6">
            <CardTitle className="text-xl font-black">Configurare Widget-uri</CardTitle>
            <CardDescription className="font-bold">Alege ordinea și vizibilitatea elementelor de pe dashboard.</CardDescription>
          </CardHeader>
          <div className="space-y-3">
            {config.map((widget, index) => (
              <div 
                key={widget.id} 
                className={cn(
                  "flex items-center justify-between p-4 rounded-2xl border transition-all",
                  widget.visible ? "bg-white border-primary/20 shadow-sm" : "bg-slate-50 border-slate-200 opacity-60"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-slate-100 text-slate-400">
                    <GripVertical className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-black text-foreground uppercase tracking-tight">{widget.name}</div>
                    <div className="text-[10px] font-bold text-muted-foreground uppercase">{widget.visible ? "Vizibil" : "Ascuns"}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    disabled={index === 0} 
                    onClick={() => moveWidget(index, 'up')}
                    className="h-8 w-8 rounded-lg"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    disabled={index === config.length - 1} 
                    onClick={() => moveWidget(index, 'down')}
                    className="h-8 w-8 rounded-lg"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant={widget.visible ? "secondary" : "outline"} 
                    size="sm"
                    onClick={() => toggleVisibility(widget.id)}
                    className="ml-4 rounded-xl font-black text-[10px]"
                  >
                    {widget.visible ? <><EyeOff className="w-3.5 h-3.5 mr-2" /> ASCUNDE</> : <><Eye className="w-3.5 h-3.5 mr-2" /> AFIȘEAZĂ</>}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
        {config.filter(w => w.visible).map(w => (
          <React.Fragment key={w.id}>
            {renderWidget(w.id)}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
