"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  CalendarDays, Plus, Loader2, Tractor, MapPin, ChevronDown,
  Settings2, CheckCircle2, TrendingUp, Sprout
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  createSeason, setActiveSeason, harvestCropPlan, deleteSeason,
} from "@/lib/actions/seasons";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import PlanWizard from "./PlanWizard";

const cropColors: Record<string, string> = {
  "Grâu": "bg-amber-500", "Porumb": "bg-yellow-500", "Floarea Soarelui": "bg-orange-400",
  "Rapiță": "bg-lime-500", "Orz": "bg-amber-600", "Soia": "bg-emerald-500",
  "Lucernă": "bg-green-600", "Mazăre": "bg-teal-500", "Sfeclă de zahăr": "bg-rose-500",
  "Fâneață": "bg-green-400", "Pârloagă": "bg-slate-400",
};

export default function SeasonsClient({
  initialSeasons, allParcels, initialPlans, previousPlans = [], currentSeasonId,
}: {
  initialSeasons: any[]; allParcels: any[]; initialPlans: any[];
  previousPlans?: any[]; currentSeasonId: string | null;
}) {
  const router = useRouter();
  const [seasons, setSeasons] = useState(initialSeasons);
  const [activeSeasonId, setActiveSeasonId] = useState<string | null>(currentSeasonId);
  const [plans, setPlans] = useState(initialPlans);

  const [view, setView] = useState<"dashboard" | "wizard">("dashboard");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNewSeason, setShowNewSeason] = useState(false);
  const [showHarvest, setShowHarvest] = useState<string | null>(null);
  const [harvestYield, setHarvestYield] = useState("");
  const [newSeason, setNewSeason] = useState({ name: "", startDate: "", endDate: "" });

  useEffect(() => { setPlans(initialPlans); }, [initialPlans]);
  useEffect(() => { setActiveSeasonId(currentSeasonId); }, [currentSeasonId]);
  useEffect(() => { setSeasons(initialSeasons); }, [initialSeasons]);

  const activeSeason = seasons.find((s) => s.id === activeSeasonId);
  const totalArea = allParcels.reduce((s, p) => s + Number(p.areaHa), 0);
  const plannedArea = plans.reduce((s, p) => s + Number(p.sownAreaHa), 0);

  const cropStats = useMemo(() => {
    const m: Record<string, { area: number; harvestedArea: number; yieldT: number; count: number; plans: any[] }> = {};
    plans.forEach((p) => {
      if (!m[p.cropType]) m[p.cropType] = { area: 0, harvestedArea: 0, yieldT: 0, count: 0, plans: [] };
      const a = Number(p.sownAreaHa);
      m[p.cropType].area += a;
      m[p.cropType].count++;
      m[p.cropType].plans.push(p);
      if (p.status === "harvested") {
        m[p.cropType].harvestedArea += a;
        m[p.cropType].yieldT += Number(p.actualYieldTha || 0) * a;
      }
    });
    return m;
  }, [plans]);

  async function handleCreateSeason() {
    if (!newSeason.name || !newSeason.startDate || !newSeason.endDate) return;
    setIsSubmitting(true);
    try {
      await createSeason(newSeason);
      setShowNewSeason(false);
      setNewSeason({ name: "", startDate: "", endDate: "" });
      router.refresh();
    } catch { alert("Eroare la creare."); }
    finally { setIsSubmitting(false); }
  }

  async function handleHarvest() {
    if (!showHarvest || !harvestYield) return;
    setIsSubmitting(true);
    try {
      await harvestCropPlan(showHarvest, Number(harvestYield));
      setShowHarvest(null); setHarvestYield("");
      router.refresh();
    } catch { alert("Eroare la recoltare."); }
    finally { setIsSubmitting(false); }
  }

  // WIZARD MODE
  if (view === "wizard" && activeSeasonId) {
    return <PlanWizard seasonId={activeSeasonId} allParcels={allParcels} existingPlans={plans} onClose={() => setView("dashboard")} />;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-primary font-black uppercase text-[10px] tracking-widest mb-1">
            <Sprout className="w-3.5 h-3.5" /> Registrul Culturilor
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            {activeSeason?.name || "Nicio campanie"}
            {activeSeason?.isActive && <Badge className="agral-gradient text-white border-none font-bold text-[10px]">ACTIVĂ</Badge>}
          </h1>
        </div>
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-border/50 shadow-sm">
          <div className="relative">
            <select className="appearance-none bg-transparent text-sm font-bold pl-3 pr-8 py-2 outline-none cursor-pointer min-w-[160px]"
              value={activeSeasonId || ""} onChange={(e) => router.push(`/campanii?seasonId=${e.target.value}`)}>
              {seasons.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
          <Button variant="ghost" size="icon" onClick={() => setShowNewSeason(true)} className="text-slate-400 hover:text-primary" title="Campanie Nouă">
            <Plus className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border/50 shadow-sm bg-white">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Total Arabil</p>
              <p className="text-2xl font-black text-slate-900">{totalArea.toFixed(1)} <span className="text-sm text-slate-400">ha</span></p>
            </div>
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300"><MapPin className="w-6 h-6" /></div>
          </CardContent>
        </Card>
        <Card className="border-primary/20 shadow-sm bg-white">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-1">Planificat</p>
              <p className="text-2xl font-black text-primary">{plannedArea.toFixed(1)} <span className="text-sm text-primary/60">ha</span></p>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary"><TrendingUp className="w-6 h-6" /></div>
          </CardContent>
        </Card>
        <Card className={cn("border-border/50 shadow-sm bg-white", totalArea - plannedArea > 0 && "border-amber-200")}>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-1">Neatribuit</p>
              <p className="text-2xl font-black text-amber-600">{(totalArea - plannedArea).toFixed(1)} <span className="text-sm text-amber-400">ha</span></p>
            </div>
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-400"><Sprout className="w-6 h-6" /></div>
          </CardContent>
        </Card>
      </div>

      {/* CTA: Planifică */}
      <Button onClick={() => setView("wizard")}
        className="w-full h-16 agral-gradient text-white font-black uppercase tracking-widest text-sm rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all group">
        <Settings2 className="w-5 h-5 mr-3 group-hover:rotate-90 transition-transform" />
        {plans.length > 0 ? "Modifică / Adaugă la Planul Campaniei" : "Planifică Campania"}
      </Button>

      {/* Crop Cards */}
      {Object.keys(cropStats).length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(cropStats).map(([crop, data]) => {
            const pct = data.area > 0 ? (data.harvestedArea / data.area) * 100 : 0;
            return (
              <Card key={crop} className="border-border/50 shadow-sm bg-white overflow-hidden group hover:shadow-xl hover:border-primary/30 transition-all">
                <div className="h-1.5 agral-gradient" />
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", cropColors[crop] || "bg-slate-300")}>
                        <Sprout className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="font-black text-slate-900 text-lg tracking-tight">{crop}</div>
                        <div className="text-[10px] text-muted-foreground font-black uppercase">{data.count} parcele • {data.area.toFixed(1)} ha</div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                      <span className="text-slate-400">Recoltare</span>
                      <span className="text-primary">{pct.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full agral-gradient transition-all duration-1000" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  {data.yieldT > 0 && (
                    <div className="text-xs text-muted-foreground font-bold">Producție: <span className="text-primary font-black">{data.yieldT.toFixed(1)} T</span></div>
                  )}
                  {/* Harvest buttons per parcel */}
                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                    {data.plans.filter((p) => p.status !== "harvested").map((p) => (
                      <div key={p.id} className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-600 truncate">{p.parcel?.name}</span>
                        <Button variant="ghost" size="sm" className="text-[10px] font-black text-primary uppercase h-7 px-2 rounded-lg hover:bg-primary/10" onClick={() => setShowHarvest(p.id)}>
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Recoltează
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
          <Sprout className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-400 font-bold">Nicio cultură planificată în această campanie.</p>
          <p className="text-xs text-slate-300 mt-1">Apasă butonul de sus pentru a începe planificarea.</p>
        </div>
      )}

      {/* New Season Modal */}
      <Dialog open={showNewSeason} onOpenChange={setShowNewSeason}>
        <DialogContent className="sm:max-w-[420px] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tight">Campanie Nouă</DialogTitle>
            <DialogDescription>Creează un nou sezon agricol.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Denumire</Label>
              <Input placeholder="Ex: Campania 2026" value={newSeason.name} onChange={(e) => setNewSeason({ ...newSeason, name: e.target.value })} className="rounded-xl h-12 font-bold" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Început</Label>
                <Input type="date" value={newSeason.startDate} onChange={(e) => setNewSeason({ ...newSeason, startDate: e.target.value })} className="rounded-xl font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Sfârșit</Label>
                <Input type="date" value={newSeason.endDate} onChange={(e) => setNewSeason({ ...newSeason, endDate: e.target.value })} className="rounded-xl font-bold" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreateSeason} disabled={isSubmitting} className="w-full h-12 rounded-xl agral-gradient text-white font-black uppercase">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Creează Campania"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Harvest Modal */}
      <Dialog open={!!showHarvest} onOpenChange={() => setShowHarvest(null)}>
        <DialogContent className="sm:max-w-[380px] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black tracking-tight flex items-center gap-2">
              <CheckCircle2 className="text-primary w-5 h-5" /> Recoltare
            </DialogTitle>
          </DialogHeader>
          <div className="py-6 text-center space-y-4">
            <p className="text-sm text-muted-foreground">Producția obținută (tone/ha):</p>
            <Input type="number" placeholder="Ex: 8.5" value={harvestYield} onChange={(e) => setHarvestYield(e.target.value)}
              className="rounded-2xl font-black text-2xl text-center h-16 w-40 mx-auto border-primary/30" />
          </div>
          <DialogFooter>
            <Button onClick={handleHarvest} disabled={isSubmitting || !harvestYield} className="w-full h-12 rounded-xl agral-gradient text-white font-black uppercase">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Finalizează"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
