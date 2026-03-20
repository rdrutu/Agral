"use client";

import { useState, Fragment, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  CalendarDays,
  Plus,
  Leaf,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Sprout,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Wheat,
  LayoutList,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  createSeason,
  setActiveSeason,
  allocateParcelsToCrop,
  deleteSeason,
  removeCropPlan,
  harvestCropPlan,
  harvestCropGroup,
  getParcelReport,
} from "@/lib/actions/seasons";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/utils";

const CROPS = [
  "Grâu", "Porumb", "Floarea Soarelui", "Rapiță", "Orz",
  "Soia", "Lucernă", "Mazăre", "Sfeclă de zahăr", "Fâneață", "Pârloagă"
];

const CROP_EMOJI: Record<string, string> = {
  "Grâu": "🌾", "Porumb": "🌽", "Floarea Soarelui": "🌻",
  "Rapiță": "🌿", "Orz": "🌾", "Soia": "🫘",
  "Lucernă": "🍀", "Mazăre": "🫛", "Sfeclă de zahăr": "🫚",
  "Fâneață": "🌱", "Pârloagă": "⬜",
};

const STATUS_COLORS: Record<string, string> = {
  planned: "bg-blue-100 text-blue-800 border-blue-200",
  sown: "bg-amber-100 text-amber-800 border-amber-200",
  growing: "bg-green-100 text-green-800 border-green-200",
  harvested: "bg-gray-100 text-gray-600 border-gray-300",
};

const STATUS_LABELS: Record<string, string> = {
  planned: "Planificat",
  sown: "Semănat",
  growing: "În creștere",
  harvested: "Recoltat ✓",
};

export default function SeasonsClient({
  initialSeasons,
  allParcels,
  initialPlans,
  seedItems,
  currentSeasonId,
}: {
  initialSeasons: any[];
  allParcels: any[];
  initialPlans: any[];
  seedItems?: any[];
  currentSeasonId: string | null;
}) {
  const router = useRouter();
  const [seasons, setSeasons] = useState(initialSeasons);
  const [activeSeasonId, setActiveSeasonId] = useState<string | null>(currentSeasonId);
  const [plans, setPlans] = useState(initialPlans);
  const [seeds, setSeeds] = useState(seedItems || []);
  const [selectedSeedId, setSelectedSeedId] = useState<string>("none");

  // Sync state with props
  useEffect(() => { setPlans(initialPlans); }, [initialPlans]);
  useEffect(() => { setActiveSeasonId(currentSeasonId); }, [currentSeasonId]);
  useEffect(() => { setSeasons(initialSeasons); }, [initialSeasons]);

  // UI States
  const [showNewSeason, setShowNewSeason] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedParcels, setSelectedParcels] = useState<string[]>([]);
  const [bulkCrop, setBulkCrop] = useState(CROPS[0]);

  // Harvest modal state
  const [harvestPlanId, setHarvestPlanId] = useState<string | null>(null);
  const [harvestGroupData, setHarvestGroupData] = useState<{ cropType: string } | null>(null);
  const [harvestYield, setHarvestYield] = useState("");

  // Report state
  const [reportParcelId, setReportParcelId] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [loadingReport, setLoadingReport] = useState(false);

  // Form State for new season
  const [sName, setSName] = useState("");
  const [sStart, setSStart] = useState("");
  const [sEnd, setSEnd] = useState("");

  const activeSeasonData = seasons.find((s) => s.id === activeSeasonId);

  // Grouped Data Calculation
  const cropGroups = plans.reduce((acc: any, plan: any) => {
    const crop = plan.cropType;
    if (!acc[crop]) {
      acc[crop] = {
        cropType: crop,
        plans: [],
        totalArea: 0,
        totalCost: 0,
        totalYield: 0,
        status: "harvested"
      };
    }
    acc[crop].plans.push(plan);
    const area = Number(plan.sownAreaHa || plan.parcel.areaHa);
    acc[crop].totalArea += area;
    acc[crop].totalYield += Number(plan.actualYieldTha || 0) * area;
    
    if (activeSeasonData) {
      const seasonStart = new Date(activeSeasonData.startDate);
      const seasonEnd = new Date(activeSeasonData.endDate);
      plan.parcel.operationParcels?.forEach((opParcel: any) => {
        const opDate = new Date(opParcel.operation.date);
        if (opDate >= seasonStart && opDate <= seasonEnd) {
          const opTotalArea = Number(opParcel.operation.totalAreaHa);
          const share = Number(opParcel.operatedAreaHa) / opTotalArea;
          opParcel.operation.resources.forEach((res: any) => {
            const qty = res.totalConsumed ? Number(res.totalConsumed) : (Number(res.quantityPerHa) * opTotalArea);
            acc[crop].totalCost += (qty * share * Number(res.pricePerUnit));
          });
        }
      });
    }

    if (plan.status !== "harvested") acc[crop].status = plan.status;
    return acc;
  }, {});

  const [expandedCrop, setExpandedCrop] = useState<string | null>(null);

  // ─── Handlers ──────────────────────────────────────────────────
  async function handleCreateSeason() {
    if (!sName || !sStart || !sEnd) return alert("Completați toate datele!");
    setIsSubmitting(true);
    try {
      const newS = await createSeason({ name: sName, startDate: sStart, endDate: sEnd });
      setSeasons(p => [newS, ...p]);
      setActiveSeasonId(newS.id);
      setShowNewSeason(false);
      setSName(""); setSStart(""); setSEnd("");
      router.refresh();
    } catch { alert("Eroare la crearea campaniei."); }
    finally { setIsSubmitting(false); }
  }

  async function handleSetActive(id: string) {
    setIsSubmitting(true);
    try {
      await setActiveSeason(id);
      setSeasons(p => p.map(s => ({ ...s, isActive: s.id === id })));
      setActiveSeasonId(id);
      router.refresh();
    } catch { alert("Eroare la activare."); }
    finally { setIsSubmitting(false); }
  }

  async function handleAllocate() {
    if (selectedParcels.length === 0 || !activeSeasonId) return alert("Selectați parcele!");
    setIsSubmitting(true);
    try {
      await allocateParcelsToCrop({
        seasonId: activeSeasonId,
        parcelIds: selectedParcels,
        cropType: bulkCrop,
        inventoryItemId: selectedSeedId !== "none" ? selectedSeedId : undefined
      });
      setSelectedParcels([]);
      setSelectedSeedId("none");
      router.refresh();
    } catch { alert("Eroare la alocare."); }
    finally { setIsSubmitting(false); }
  }

  async function handleRemovePlan(planId: string) {
    if (confirm("Golești parcela?")) {
      await removeCropPlan(planId);
      setPlans(p => p.filter(item => item.id !== planId));
      router.refresh();
    }
  }

  async function handleDeleteSeason(id: string) {
    if (confirm("Stergi definitiv Campania?")) {
      await deleteSeason(id);
      window.location.reload();
    }
  }

  async function handleHarvestGroup() {
    if (!harvestGroupData || !activeSeasonId) return;
    const yieldTha = parseFloat(harvestYield);
    if (isNaN(yieldTha) || yieldTha < 0) return alert("Producție invalidă.");
    setIsSubmitting(true);
    try {
      await harvestCropGroup(activeSeasonId, harvestGroupData.cropType, yieldTha);
      setPlans(prev => prev.map(p => 
        p.cropType === harvestGroupData.cropType ? { ...p, status: "harvested", actualYieldTha: yieldTha } : p
      ));
      setHarvestGroupData(null);
      setHarvestYield("");
      router.refresh();
    } catch { alert("Eroare la recoltare grup."); }
    finally { setIsSubmitting(false); }
  }

  async function handleHarvest() {
    if (!harvestPlanId) return;
    const yieldTha = parseFloat(harvestYield);
    if (isNaN(yieldTha) || yieldTha < 0) return alert("Producție invalidă.");
    setIsSubmitting(true);
    try {
      await harvestCropPlan(harvestPlanId, yieldTha);
      setPlans(p => p.map(pi => pi.id === harvestPlanId ? { ...pi, status: "harvested", actualYieldTha: yieldTha } : pi));
      setHarvestPlanId(null);
      setHarvestYield("");
      router.refresh();
    } catch { alert("Eroare la recoltare."); }
    finally { setIsSubmitting(false); }
  }

  async function handleToggleReport(parcelId: string) {
    if (reportParcelId === parcelId) { setReportParcelId(null); setReportData(null); return; }
    setReportParcelId(parcelId);
    setLoadingReport(true);
    try {
      const data = await getParcelReport(parcelId, activeSeasonId!);
      setReportData(data);
    } catch { alert("Eroare raport."); }
    finally { setLoadingReport(false); }
  }

  // ─── Helpers ──────────────────────────────────────────────────
  const toggleSelection = (id: string) => {
    setSelectedParcels(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  };

  const isParcelOccupied = (id: string) => {
    const plan = plans.find(p => p.parcelId === id);
    return plan && plan.status !== "harvested";
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-foreground flex items-center gap-2">
            <CalendarDays className="w-7 h-7 text-primary" />
            Campanii Agricole
          </h2>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Organizează Rotația Culturilor și istoricizează Anii Agricoli.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* PANEL STÂNGA: Sezoane */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-lg">Campaniile Tale</h3>
            <Button size="sm" variant="outline" className="h-8 gap-1 border-primary/30 text-primary" onClick={() => setShowNewSeason(!showNewSeason)}>
              <Plus className="w-4 h-4" /> Nouă
            </Button>
          </div>

          {showNewSeason && (
            <Card className="border-primary/50 shadow-md bg-muted/20">
              <CardContent className="p-4 space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Nume</Label>
                  <Input className="h-8 text-sm" placeholder="ex: 2025" value={sName} onChange={(e) => setSName(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input type="date" className="h-8 text-sm" value={sStart} onChange={(e) => setSStart(e.target.value)} />
                  <Input type="date" className="h-8 text-sm" value={sEnd} onChange={(e) => setSEnd(e.target.value)} />
                </div>
                <Button className="w-full h-8 mt-2" size="sm" onClick={handleCreateSeason} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvează"}
                </Button>
              </CardContent>
            </Card>
          )}

          {seasons.map((s) => (
            <div
              key={s.id}
              className={cn(
                "p-3 rounded-xl border flex flex-col gap-2 cursor-pointer transition-all",
                activeSeasonId === s.id ? "bg-primary text-primary-foreground shadow-md border-primary" : "bg-card hover:border-primary/40"
              )}
              onClick={() => { if (activeSeasonId !== s.id) router.push(`/campanii?seasonId=${s.id}`); }}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold">{s.name}</span>
                {s.isActive && <Badge variant="secondary" className="bg-white/20 border-none text-xs"><CheckCircle2 className="w-3 h-3 mr-1" /> Activă</Badge>}
              </div>
              <div className="text-xs opacity-70">{formatDate(s.startDate)} — {formatDate(s.endDate)}</div>
              {activeSeasonId === s.id && (
                <div className="flex gap-2 mt-2 pt-2 border-t border-white/20">
                  {!s.isActive && <Button size="sm" variant="secondary" className="flex-1 h-7 text-xs" onClick={(e) => { e.stopPropagation(); handleSetActive(s.id); }}>Activare</Button>}
                  <Button size="icon" variant="destructive" className="h-7 w-7 opacity-80" onClick={(e) => { e.stopPropagation(); handleDeleteSeason(s.id); }}><Trash2 className="w-3 h-3" /></Button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* PANEL DREAPTA: Parcele & Alocări */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="shadow-lg border-border">
            <CardHeader className="bg-muted/10 pb-4 border-b">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-xl text-primary flex items-center gap-2">
                    <Sprout className="w-5 h-5" /> Plan de Culturi: {activeSeasonData?.name}
                  </CardTitle>
                  <CardDescription>Vizualizare grupată și analize pe cultură.</CardDescription>
                </div>

                {selectedParcels.length > 0 && (
                  <div className="p-2 md:p-3 bg-primary/10 border border-primary/20 rounded-xl flex flex-wrap items-center gap-2 animate-in fade-in">
                    <span className="text-sm font-semibold text-primary">{selectedParcels.length} alese</span>
                    <select className="h-9 rounded-md border bg-background px-2 text-sm" value={bulkCrop} onChange={(e) => setBulkCrop(e.target.value)}>
                      {CROPS.map(c => <option key={c} value={c}>{CROP_EMOJI[c] || "🌱"} {c}</option>)}
                    </select>
                    <select className="h-9 rounded-md border bg-background px-2 text-xs" value={selectedSeedId} onChange={(e) => setSelectedSeedId(e.target.value)}>
                      <option value="none">Sămânță (opțional)</option>
                      {seeds.map(sd => <option key={sd.id} value={sd.id}>{sd.name}</option>)}
                    </select>
                    <Button size="sm" className="h-9 agral-gradient text-white" onClick={handleAllocate} disabled={isSubmitting}>Aplică</Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              {Object.keys(cropGroups).length === 0 ? (
                <div className="text-center py-16 opacity-50">
                  <Leaf className="w-12 h-12 mx-auto mb-4" />
                  <p>Nicio cultură planificată în acest sezon.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.values(cropGroups).map((group: any) => {
                    const isExpanded = expandedCrop === group.cropType;
                    const isHarvested = group.status === "harvested";
                    
                    return (
                      <Card key={group.cropType} className={cn("overflow-hidden border", isExpanded && "ring-2 ring-primary/20 shadow-md")}>
                        <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer" onClick={() => setExpandedCrop(isExpanded ? null : group.cropType)}>
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-2xl">{CROP_EMOJI[group.cropType] || "🌱"}</div>
                            <div>
                               <div className="flex items-center gap-2">
                                 <h3 className="text-lg font-black">{group.cropType}</h3>
                                 <Badge className={cn("text-[10px]", STATUS_COLORS[group.status])}>{STATUS_LABELS[group.status]}</Badge>
                               </div>
                               <p className="text-xs text-muted-foreground">{group.plans.length} parcele • {group.totalArea.toFixed(2)} ha</p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-6">
                            <div className="text-right">
                              <p className="text-[10px] uppercase font-black opacity-50">Cost</p>
                              <p className="text-lg font-black">{group.totalCost.toLocaleString()} RON</p>
                            </div>
                            {isHarvested && (
                               <div className="text-right">
                                 <p className="text-[10px] uppercase font-black opacity-50">Recoltă</p>
                                 <p className="text-lg font-black text-green-600">{group.totalYield.toLocaleString()} tone</p>
                               </div>
                            )}
                            {!isHarvested && (
                               <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white font-bold" onClick={(e) => { e.stopPropagation(); setHarvestGroupData({ cropType: group.cropType }); setHarvestYield(""); }}>
                                 Recoltează Tot
                               </Button>
                            )}
                            <div className="p-1">{isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}</div>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="border-t bg-muted/5 p-4 space-y-4 animate-in slide-in-from-top-2">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                               <div className="bg-white p-3 rounded-lg border">
                                 <p className="text-[10px] font-black opacity-50 uppercase">Cost/ha</p>
                                 <p className="font-black text-orange-600">{(group.totalCost / group.totalArea).toFixed(0)} RON</p>
                               </div>
                               {isHarvested && (
                                 <div className="bg-white p-3 rounded-lg border">
                                   <p className="text-[10px] font-black opacity-50 uppercase">Medie t/ha</p>
                                   <p className="font-black text-green-600">{(group.totalYield / group.totalArea).toFixed(2)}</p>
                                 </div>
                               )}
                            </div>

                            <div className="bg-white rounded-lg border overflow-hidden">
                              <table className="w-full text-xs">
                                <thead className="bg-muted/50 border-b text-[10px] uppercase font-black">
                                  <tr>
                                    <th className="p-2 text-left">Parcelă</th>
                                    <th className="p-2 text-left">ha</th>
                                    <th className="p-2 text-left">Status</th>
                                    <th className="p-2 text-right">Acțiuni</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y">
                                  {group.plans.map((p: any) => (
                                    <tr key={p.id} className="hover:bg-muted/10">
                                      <td className="p-2 font-bold">{p.parcel.name}</td>
                                      <td className="p-2 text-muted-foreground">{p.parcel.areaHa}</td>
                                      <td className="p-2">
                                        <Badge variant="outline" className={cn("text-[9px]", STATUS_COLORS[p.status])}>{STATUS_LABELS[p.status]}</Badge>
                                      </td>
                                      <td className="p-2 text-right flex justify-end gap-1">
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-600" onClick={() => handleToggleReport(p.parcelId)}><TrendingUp className="w-4 h-4" /></Button>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleRemovePlan(p.id)}><Trash2 className="w-4 h-4" /></Button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            {reportParcelId && group.plans.some((p: any) => p.parcelId === reportParcelId) && reportData && (
                               <div className="p-4 bg-white rounded-lg border border-primary/20 shadow-sm animate-in fade-in">
                                  <div className="flex justify-between items-center mb-2">
                                    <h4 className="font-black text-sm">Analiză: {reportData.parcelName}</h4>
                                    <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => setReportParcelId(null)}>Închide</Button>
                                  </div>
                                  <div className="grid grid-cols-4 gap-2 text-center">
                                    <div className="p-2 bg-muted/20 rounded">
                                      <p className="text-[8px] uppercase opacity-50">Cost</p>
                                      <p className="text-xs font-bold">{reportData.totalCost} RON</p>
                                    </div>
                                    <div className="p-2 bg-muted/20 rounded">
                                      <p className="text-[8px] uppercase opacity-50">RON/ha</p>
                                      <p className="text-xs font-bold text-orange-600">{reportData.costPerHa}</p>
                                    </div>
                                    <div className="p-2 bg-muted/20 rounded">
                                      <p className="text-[8px] uppercase opacity-50">Lucrări</p>
                                      <p className="text-xs font-bold">{reportData.breakdown.length}</p>
                                    </div>
                                    <div className="p-2 bg-muted/20 rounded">
                                      <Link href={`/parcele/${reportParcelId}`} className="text-[8px] font-black text-primary uppercase">Detalii</Link>
                                    </div>
                                  </div>
                               </div>
                            )}
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* New Parcel List */}
          <div className="space-y-4">
             <h3 className="font-bold flex items-center gap-2"><LayoutList className="w-4 h-4" /> Parcele Disponibile</h3>
             <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30 border-b text-[10px] uppercase font-black text-muted-foreground">
                    <tr>
                      <th className="p-3 w-10">Select</th>
                      <th className="p-3">Parcelă</th>
                      <th className="p-3">Suprafață</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {allParcels.filter(p => !isParcelOccupied(p.id)).map(p => {
                       const isSelected = selectedParcels.includes(p.id);
                       return (
                         <tr key={p.id} className={cn("hover:bg-muted/20", isSelected && "bg-primary/5")}>
                           <td className="p-3"><input type="checkbox" checked={isSelected} onChange={() => toggleSelection(p.id)} className="w-4 h-4 accent-primary" /></td>
                           <td className="p-3 font-bold">{p.name}</td>
                           <td className="p-3">{p.areaHa} ha</td>
                           <td className="p-3"><Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Liberă</Badge></td>
                         </tr>
                       )
                    })}
                  </tbody>
                </table>
             </div>
          </div>
        </div>
      </div>

      {/* HARVEST MODAL */}
      {(harvestPlanId || harvestGroupData) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md shadow-2xl">
            <CardHeader className="bg-amber-50 border-b">
              <CardTitle className="text-amber-900 flex items-center gap-2"><Wheat className="w-5 h-5" /> Înregistrare Recoltă</CardTitle>
              <CardDescription>
                {harvestGroupData ? `Producea medie (t/ha) pentru tot grupul ${harvestGroupData?.cropType}` : "Introduceți producția reală (t/ha)."}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="space-y-2">
                <Label>Producție t/ha</Label>
                <Input type="number" step="0.1" value={harvestYield} onChange={(e) => setHarvestYield(e.target.value)} autoFocus className="text-lg font-bold h-12" />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => { setHarvestPlanId(null); setHarvestGroupData(null); setHarvestYield(""); }}>Anulează</Button>
                <Button className="flex-1 bg-amber-600 hover:bg-amber-700 text-white" onClick={harvestGroupData ? handleHarvestGroup : handleHarvest} disabled={isSubmitting}>
                   {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirmă"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
