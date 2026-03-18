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
  History as HistoryIcon,
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

  // Sync state with props after initial mount (important for router.refresh() and navigation)
  useEffect(() => {
    setPlans(initialPlans);
  }, [initialPlans]);

  useEffect(() => {
    setActiveSeasonId(currentSeasonId);
  }, [currentSeasonId]);

  useEffect(() => {
    setSeasons(initialSeasons);
  }, [initialSeasons]);

  // UI States
  const [showNewSeason, setShowNewSeason] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedParcels, setSelectedParcels] = useState<string[]>([]);
  const [bulkCrop, setBulkCrop] = useState(CROPS[0]);

  // Harvest modal state
  const [harvestPlanId, setHarvestPlanId] = useState<string | null>(null);
  const [harvestYield, setHarvestYield] = useState("");

  // Report state
  const [reportParcelId, setReportParcelId] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);

  // Form State for new season
  const [sName, setSName] = useState("");
  const [sStart, setSStart] = useState("");
  const [sEnd, setSEnd] = useState("");

  const activeSeasonData = seasons.find((s) => s.id === activeSeasonId);

  // ─── Create Season ────────────────────────────────────────────
  async function handleCreateSeason() {
    if (!sName || !sStart || !sEnd) return alert("Completați toate datele sezonului!");
    setIsSubmitting(true);
    try {
      const newS = await createSeason({ name: sName, startDate: sStart, endDate: sEnd });
      setSeasons((prev) => [newS, ...prev]);
      setActiveSeasonId(newS.id);
      setShowNewSeason(false);
      setSName(""); setSStart(""); setSEnd("");
      router.refresh();
    } catch {
      alert("Eroare la crearea campaniei.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // ─── Set Active Season ────────────────────────────────────────
  async function handleSetActive(id: string) {
    setIsSubmitting(true);
    try {
      await setActiveSeason(id);
      setSeasons((prev) => prev.map((s) => ({ ...s, isActive: s.id === id })));
      setActiveSeasonId(id);
      router.refresh();
    } catch {
      alert("Eroare la activarea campaniei.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // ─── Allocate Parcels to Crop ─────────────────────────────────
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

      // Update local state for immediate feedback
      setPlans((prev) => [
        ...prev.filter((p) => !selectedParcels.includes(p.parcelId)),
        ...selectedParcels.map((pId: string) => ({
          id: Math.random().toString(),
          seasonId: activeSeasonId,
          parcelId: pId,
          cropType: bulkCrop,
          status: "planned",
          parcel: allParcels.find((ap) => ap.id === pId),
        })),
      ]);

      if (selectedSeedId !== "none") {
        // Logic for local stock deduction if needed
      }

      setSelectedParcels([]);
      setSelectedSeedId("none");
      router.refresh();
    } catch {
      alert("Eroare la alocarea culturii.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // ─── Remove Plan ──────────────────────────────────────────────
  async function handleRemovePlan(planId: string) {
    if (confirm("Golești parcela pentru această campanie? Acțiunea e ireversibilă.")) {
      await removeCropPlan(planId);
      setPlans((prev) => prev.filter((p) => p.id !== planId));
      router.refresh();
    }
  }

  // ─── Delete Season ────────────────────────────────────────────
  async function handleDeleteSeason(id: string) {
    if (confirm("Stergi definitiv Campania și tot istoricul planificat pe ea?")) {
      await deleteSeason(id);
      window.location.reload();
    }
  }

  // ─── Harvest Plan ─────────────────────────────────────────────
  async function handleHarvest() {
    if (!harvestPlanId) return;
    const yieldTha = parseFloat(harvestYield);
    if (isNaN(yieldTha) || yieldTha < 0) {
      alert("Introduceți o producție validă (t/ha).");
      return;
    }
    setIsSubmitting(true);
    try {
      await harvestCropPlan(harvestPlanId, yieldTha);
      setPlans((prev) =>
        prev.map((p) =>
          p.id === harvestPlanId ? { ...p, status: "harvested", actualYieldTha: yieldTha } : p
        )
      );
      setHarvestPlanId(null);
      setHarvestYield("");
      router.refresh();
    } catch {
      alert("Eroare la înregistrarea recoltei.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // ─── Parcel Report ────────────────────────────────────────────
  async function handleToggleReport(parcelId: string) {
    if (reportParcelId === parcelId) {
      setReportParcelId(null);
      setReportData(null);
      return;
    }
    setReportParcelId(parcelId);
    setLoadingReport(true);
    try {
      const data = await getParcelReport(parcelId, activeSeasonId!);
      setReportData(data);
    } catch {
      alert("Nu s-au putut încărca datele raportului.");
    } finally {
      setLoadingReport(false);
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────
  const toggleSelection = (parcelId: string) => {
    setSelectedParcels((prev) =>
      prev.includes(parcelId) ? prev.filter((p) => p !== parcelId) : [...prev, parcelId]
    );
  };

  const getPlanForParcel = (parcelId: string) =>
    plans.find((p) => p.parcelId === parcelId);

  // O parcelă e "ocupată" dacă are un plan activ (nu recoltat) în sezonul curent
  const isParcelOccupied = (parcelId: string) => {
    const plan = getPlanForParcel(parcelId);
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
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1 border-primary/30 text-primary"
              onClick={() => setShowNewSeason(!showNewSeason)}
            >
              <Plus className="w-4 h-4" /> Nouă
            </Button>
          </div>

          {showNewSeason && (
            <Card className="border-primary/50 shadow-md bg-muted/20">
              <CardContent className="p-4 space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Nume Campanie</Label>
                  <Input
                    className="h-8 text-sm"
                    placeholder="ex: Toamnă 25 - Primăvară 26"
                    value={sName}
                    onChange={(e) => setSName(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">Început</Label>
                    <Input type="date" className="h-8 text-sm" value={sStart} onChange={(e) => setSStart(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Sfârșit</Label>
                    <Input type="date" className="h-8 text-sm" value={sEnd} onChange={(e) => setSEnd(e.target.value)} />
                  </div>
                </div>
                <Button className="w-full h-8 mt-2" size="sm" onClick={handleCreateSeason} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvează Campanie"}
                </Button>
              </CardContent>
            </Card>
          )}

          {seasons.map((s) => (
            <div
              key={s.id}
              className={`p-3 rounded-xl border flex flex-col gap-2 cursor-pointer transition-all ${
                activeSeasonId === s.id
                  ? "bg-primary text-primary-foreground shadow-md scale-[1.02] border-primary"
                  : "bg-card hover:border-primary/40"
              }`}
              onClick={() => {
                if (activeSeasonId !== s.id) {
                  router.push(`/campanii?seasonId=${s.id}`);
                }
              }}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold">{s.name}</span>
                {s.isActive && (
                  <Badge variant="secondary" className="bg-white/20 hover:bg-white/20 border-none text-xs">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Activă
                  </Badge>
                )}
              </div>
              <div className={`text-xs ${activeSeasonId === s.id ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                {formatDate(s.startDate)} — {formatDate(s.endDate)}
              </div>

              {activeSeasonId === s.id && (
                <div className="flex gap-2 mt-2 pt-2 border-t border-white/20">
                  {!s.isActive && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="flex-1 h-7 text-xs"
                      onClick={(e) => { e.stopPropagation(); handleSetActive(s.id); }}
                    >
                      Setează ca Activă
                    </Button>
                  )}
                  {seasons.length > 1 && (
                    <Button
                      size="icon"
                      variant="destructive"
                      className="h-7 w-7 opacity-80"
                      onClick={(e) => { e.stopPropagation(); handleDeleteSeason(s.id); }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* PANEL DREAPTA: Parcele & Alocări */}
        <div className="lg:col-span-3">
          <Card className="shadow-lg border-border">
            <CardHeader className="bg-muted/10 pb-4 border-b">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-xl text-primary flex items-center gap-2">
                    <Sprout className="w-5 h-5" /> Plan de Culturi: {activeSeasonData?.name}
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Bifați parcelele <strong>libere sau recoltate</strong> și atribuiți grupat o cultură.
                  </CardDescription>
                </div>

                {selectedParcels.length > 0 && (
                  <div className="p-2 md:p-3 bg-primary/10 border border-primary/20 rounded-xl flex flex-wrap items-center gap-2 animate-in fade-in slide-in-from-right-4">
                    <span className="text-sm font-semibold text-primary px-1">{selectedParcels.length} alese</span>
                    <select
                      className="h-9 rounded-md border border-input bg-background px-2 text-sm flex-1 min-w-[120px]"
                      value={bulkCrop}
                      onChange={(e) => setBulkCrop(e.target.value)}
                    >
                      {CROPS.map((c) => (
                        <option key={c} value={c}>{CROP_EMOJI[c] || "🌱"} {c}</option>
                      ))}
                    </select>
                    
                    <select
                      className="h-9 rounded-md border border-input bg-background px-2 text-xs font-bold text-primary flex-1 min-w-[150px]"
                      value={selectedSeedId}
                      onChange={(e) => setSelectedSeedId(e.target.value)}
                    >
                      <option value="none">Sămânță din stoc (opțional)</option>
                      {seeds.map((s: any) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.stockQuantity} {s.unit})
                        </option>
                      ))}
                    </select>
 
                    <Button size="sm" className="h-9 px-4 gap-1 shadow-sm w-full sm:w-auto agral-gradient text-white" onClick={handleAllocate} disabled={isSubmitting}>
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      Aplică Alocarea
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                   <thead className="text-[10px] text-muted-foreground uppercase bg-muted/40 border-b font-black tracking-widest">
                    <tr>
                      <th className="px-3 md:px-4 py-3 w-8">Bifă</th>
                      <th className="px-3 md:px-4 py-3">Parcelă</th>
                      <th className="px-3 md:px-4 py-3 hidden md:table-cell">Suprafață</th>
                      <th className="px-3 md:px-4 py-3">Cultură & Status</th>
                      <th className="px-3 md:px-4 py-3 text-right">Acțiuni</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-xs md:text-sm">
                    {allParcels.map((p) => {
                      const plan = getPlanForParcel(p.id);
                      const occupied = isParcelOccupied(p.id);
                      const isSelected = selectedParcels.includes(p.id);
                      const isHarvested = plan?.status === "harvested";
                      const isReportOpen = reportParcelId === p.id;

                      return (
                        <Fragment key={p.id}>
                          <tr
                            className={`transition-colors ${
                              isSelected ? "bg-primary/5" : occupied ? "bg-amber-50/40" : "hover:bg-muted/20"
                            }`}
                          >
                            <td className="px-3 md:px-4 py-3">
                              <input
                                type="checkbox"
                                className="w-4 h-4 rounded border-gray-300 cursor-pointer accent-primary disabled:opacity-40 disabled:cursor-not-allowed"
                                checked={isSelected}
                                disabled={!!occupied}
                                onChange={() => toggleSelection(p.id)}
                                title={occupied ? `Parcelă ocupată cu ${plan?.cropType}` : "Selectează"}
                              />
                            </td>
                             <td className="px-3 md:px-4 py-3 font-bold text-foreground">
                              <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2">
                                <div className="flex items-center gap-1.5 truncate max-w-[120px] md:max-w-none">
                                  {occupied && !isHarvested ? (
                                    <span title="Parcelă cu cultură activă" className="text-xs">🔒</span>
                                  ) : (
                                    <MapPin className="w-3 h-3 md:w-4 md:h-4 text-muted-foreground" />
                                  )}
                                  <span className="text-xs md:text-sm truncate">{p.name}</span>
                                </div>
                                <span className="text-[10px] md:hidden text-muted-foreground font-medium italic">
                                  {p.areaHa?.toString()} ha
                                </span>
                              </div>
                            </td>
                            <td className="px-3 md:px-4 py-3 text-muted-foreground hidden md:table-cell">
                              {p.areaHa?.toString()} ha
                            </td>
                            <td className="px-3 md:px-4 py-3">
                              {plan ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-base md:text-lg">{CROP_EMOJI[plan.cropType] || "🌱"}</span>
                                  <div className="min-w-0">
                                    <div className="font-bold text-foreground text-[10px] md:text-sm truncate">{plan.cropType}</div>
                                    <Badge className={`text-[8px] md:text-[9px] border px-1 md:px-1.5 py-0 font-black uppercase ${STATUS_COLORS[plan.status]}`}>
                                      {STATUS_LABELS[plan.status] || plan.status}
                                    </Badge>
                                    {isHarvested && plan.actualYieldTha && (
                                      <span className="text-[9px] md:text-xs text-muted-foreground ml-1 font-bold">
                                        {Number(plan.actualYieldTha).toFixed(1)} t/ha
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-muted-foreground italic text-[10px] md:text-xs">Liberă</span>
                              )}
                            </td>
                            <td className="px-3 md:px-4 py-3">
                              <div className="flex items-center justify-end gap-1">
                                {plan && plan.status !== "harvested" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 px-2 text-[10px] md:text-xs gap-1 border-amber-300 text-amber-700 hover:bg-amber-50"
                                    onClick={() => { setHarvestPlanId(plan.id); setHarvestYield(""); }}
                                    title="Recoltează"
                                  >
                                    <Wheat className="w-3 h-3" /> <span className="hidden sm:inline">Recoltează</span>
                                  </Button>
                                )}
                                {plan && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-blue-600 hover:bg-blue-50"
                                    onClick={() => handleToggleReport(p.id)}
                                    title="Raport"
                                  >
                                    {isReportOpen ? <ChevronUp className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                                  </Button>
                                )}
                                {plan && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                    onClick={() => handleRemovePlan(plan.id)}
                                    title="Șterge"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>

                          {/* Report Panel (inline expansion) */}
                          {isReportOpen && (
                            <tr key={`report-${p.id}`}>
                              <td colSpan={5} className="px-3 md:px-4 py-3 bg-blue-50/60 border-b">
                                {loadingReport ? (
                                  <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground py-2">
                                    <Loader2 className="w-4 h-4 animate-spin" /> Se încarcă...
                                  </div>
                                ) : reportData ? (
                                  <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                      <TrendingUp className="w-4 h-4 text-blue-600" />
                                      <span className="font-bold text-blue-900 text-xs md:text-sm">Fișa Parcelei — {reportData.parcelName}</span>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                                      <div className="bg-white rounded-lg p-2 border text-center shadow-sm">
                                        <div className="text-sm md:text-lg font-extrabold text-primary">{reportData.totalCost} RON</div>
                                        <div className="text-[9px] md:text-[10px] text-muted-foreground">Cost total</div>
                                      </div>
                                      <div className="bg-white rounded-lg p-2 border text-center shadow-sm">
                                        <div className="text-sm md:text-lg font-extrabold text-orange-600">{reportData.costPerHa} RON</div>
                                        <div className="text-[9px] md:text-[10px] text-muted-foreground">Cost / Ha</div>
                                      </div>
                                      <div className="bg-white rounded-lg p-2 border text-center shadow-sm">
                                        <div className="text-sm md:text-lg font-extrabold text-green-600">
                                          {reportData.actualYieldTha ? `${reportData.actualYieldTha} t/ha` : "—"}
                                        </div>
                                        <div className="text-[9px] md:text-[10px] text-muted-foreground">Producție</div>
                                      </div>
                                      <div className="bg-white rounded-lg p-2 border text-center shadow-sm">
                                        <div className="text-sm md:text-lg font-extrabold text-gray-700">{reportData.areaHa} ha</div>
                                        <div className="text-[9px] md:text-[10px] text-muted-foreground">Suprafață</div>
                                      </div>
                                    </div>
                                    {reportData.breakdown.length > 0 && (
                                      <div className="bg-white rounded-lg border overflow-hidden shadow-sm">
                                        <div className="px-3 py-1.5 bg-muted/40 text-[9px] md:text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b">
                                          Detaliu costuri (sezon curent)
                                        </div>
                                        {reportData.breakdown.map((b: any) => (
                                          <div key={b.name} className="flex justify-between items-center px-3 py-1.5 text-[10px] md:text-xs border-t">
                                            <span className="text-foreground">{b.name}</span>
                                            <span className="font-semibold text-primary">{b.totalCost} RON</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    <div className="pt-4 border-t border-dashed">
                                      <p className="text-[10px] text-muted-foreground font-medium text-center italic">
                                        Pentru istoricul complet al culturilor și lucrărilor trecute, accesează pagina de 
                                        <Link href={`/parcele/${reportParcelId}`} className="text-primary hover:underline ml-1 font-bold">Detalii Parcelă</Link>.
                                      </p>
                                    </div>
                                  </div>
                                ) : null}
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>

                {allParcels.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <MapPin className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p>Nu ai parcele înregistrate.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* HARVEST MODAL */}
      {harvestPlanId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4 shadow-2xl">
            <CardHeader className="border-b bg-amber-50">
              <CardTitle className="flex items-center gap-2 text-amber-900">
                <Wheat className="w-5 h-5" /> Înregistrare Recoltă
              </CardTitle>
              <CardDescription>
                Introduceti producția obținută pentru a închide planul de cultură.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div>
                <Label htmlFor="yieldInput">Producție reală (tone / hectar)</Label>
                <Input
                  id="yieldInput"
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="ex: 5.5"
                  className="mt-1.5 h-11 text-lg font-bold"
                  value={harvestYield}
                  onChange={(e) => setHarvestYield(e.target.value)}
                  autoFocus
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Dacă nu cunoașteți exact, puneți 0 — îl puteți actualiza mai târziu.
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => { setHarvestPlanId(null); setHarvestYield(""); }}
                >
                  Anulează
                </Button>
                <Button
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white gap-2"
                  onClick={handleHarvest}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Confirmă Recolta
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
