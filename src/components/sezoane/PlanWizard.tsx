"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ChevronRight, ChevronLeft, Search, Loader2, CheckCircle2, 
  AlertTriangle, History, MapPin, Sprout
} from "lucide-react";
import { cn } from "@/lib/utils";
import { allocateParcelsToCrop, getParcelHistory } from "@/lib/actions/seasons";
import { useRouter } from "next/navigation";

const SeasonMap = dynamic(() => import("./SeasonMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-100 animate-pulse rounded-2xl" />,
});

const CROPS = [
  "Grâu","Porumb","Floarea Soarelui","Rapiță","Orz",
  "Soia","Lucernă","Mazăre","Sfeclă de zahăr","Fâneață","Pârloagă",
];

const cropColors: Record<string, string> = {
  "Grâu": "bg-amber-500", "Porumb": "bg-yellow-500", "Floarea Soarelui": "bg-orange-400",
  "Rapiță": "bg-lime-500", "Orz": "bg-amber-600", "Soia": "bg-emerald-500",
  "Lucernă": "bg-green-600", "Mazăre": "bg-teal-500", "Sfeclă de zahăr": "bg-rose-500",
  "Fâneață": "bg-green-400", "Pârloagă": "bg-slate-400",
};

export default function PlanWizard({
  seasonId, allParcels, existingPlans, onClose,
}: {
  seasonId: string; allParcels: any[]; existingPlans: any[]; onClose: () => void;
}) {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1=alegeCultura, 2=selecteazaParcele, 3=confirm
  const [selectedCrop, setSelectedCrop] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [historyData, setHistoryData] = useState<Record<string, any[]>>({});
  const [loadingHistoryId, setLoadingHistoryId] = useState<string | null>(null);

  // Parcele care NU au deja planul setat pe cultura selectată
  const availableParcels = useMemo(() => {
    return allParcels.filter((p) => {
      const match = p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.cadastralCode?.toLowerCase().includes(search.toLowerCase());
      return match;
    });
  }, [allParcels, search]);

  const toggleParcel = async (id: string) => {
    const selecting = !selectedIds.includes(id);
    setSelectedIds((prev) => selecting ? [...prev, id] : prev.filter((i) => i !== id));
    if (selecting && !historyData[id]) {
      setLoadingHistoryId(id);
      try {
        const h = await getParcelHistory(id);
        setHistoryData((prev) => ({ ...prev, [id]: h }));
      } catch {} finally { setLoadingHistoryId(null); }
    }
  };

  const selectedArea = allParcels
    .filter((p) => selectedIds.includes(p.id))
    .reduce((s, p) => s + Number(p.areaHa), 0);

  async function handleConfirm() {
    if (!seasonId || selectedIds.length === 0 || !selectedCrop) return;
    setIsSubmitting(true);
    try {
      await allocateParcelsToCrop({ seasonId, parcelIds: selectedIds, cropType: selectedCrop });
      // Reset for next crop
      setSelectedIds([]);
      setSelectedCrop("");
      setStep(1);
      router.refresh();
    } catch { alert("Eroare la salvare."); }
    finally { setIsSubmitting(false); }
  }

  // Alerted parcels (same crop last year)
  const getRotationWarning = (parcelId: string) => {
    const h = historyData[parcelId];
    if (!h || h.length === 0) return false;
    return h[0]?.cropType === selectedCrop;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Progress Indicator */}
      <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-border/50 shadow-sm">
        <Button variant="ghost" size="sm" onClick={onClose} className="text-slate-400 hover:text-slate-900 font-bold text-xs uppercase">
          ✕ Închide
        </Button>
        <div className="h-6 w-px bg-slate-200" />
        {[
          { n: 1, label: "Alege Cultura" },
          { n: 2, label: "Selectează Parcele" },
          { n: 3, label: "Confirmă" },
        ].map((s) => (
          <div key={s.n} className="flex items-center gap-2">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all",
              step >= s.n ? "agral-gradient text-white shadow-lg" : "bg-slate-100 text-slate-400"
            )}>{s.n}</div>
            <span className={cn("text-xs font-black uppercase tracking-tight hidden md:inline",
              step >= s.n ? "text-slate-900" : "text-slate-300"
            )}>{s.label}</span>
            {s.n < 3 && <ChevronRight className="w-4 h-4 text-slate-200" />}
          </div>
        ))}
      </div>

      {/* STEP 1: Choose Crop */}
      {step === 1 && (
        <div className="bg-white rounded-3xl border border-border/50 shadow-sm p-8 animate-in slide-in-from-right-4 duration-500">
          <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Ce cultură vrei să planifici?</h3>
          <p className="text-sm text-muted-foreground mb-8">Selectează cultura, apoi vei alege parcelele pe care o plasezi.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {CROPS.map((crop) => {
              const existing = existingPlans.filter((p) => p.cropType === crop);
              const area = existing.reduce((s, p) => s + Number(p.sownAreaHa), 0);
              return (
                <button
                  key={crop}
                  onClick={() => { setSelectedCrop(crop); setStep(2); }}
                  className={cn(
                    "group p-5 rounded-2xl border-2 text-left transition-all hover:scale-[1.02] active:scale-95",
                    "border-slate-100 hover:border-primary hover:shadow-xl hover:shadow-primary/10 bg-white"
                  )}
                >
                  <div className={cn("w-10 h-10 rounded-xl mb-3 flex items-center justify-center", cropColors[crop] || "bg-slate-300")}>
                    <Sprout className="w-5 h-5 text-white" />
                  </div>
                  <div className="font-black text-slate-900 text-sm">{crop}</div>
                  {area > 0 && (
                    <div className="text-[10px] font-black text-primary mt-1 uppercase">
                      {area.toFixed(1)} ha deja planificate
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 2: Select Parcels */}
      {step === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in slide-in-from-right-4 duration-500" style={{ minHeight: "calc(100vh - 340px)" }}>
          {/* Left: Parcel List + History */}
          <div className="lg:col-span-5 bg-white rounded-3xl border border-border/50 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 space-y-3">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={() => setStep(1)} className="text-slate-400 font-bold text-xs">
                  <ChevronLeft className="w-4 h-4 mr-1" /> Înapoi
                </Button>
                <Badge className="agral-gradient text-white border-none font-black text-xs px-3">
                  {selectedCrop}
                </Badge>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input placeholder="Caută parcelă..." className="pl-10 rounded-xl border-slate-200 h-11" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
              {availableParcels.map((p) => {
                const isSel = selectedIds.includes(p.id);
                const existing = existingPlans.find((pl) => pl.parcelId === p.id);
                const warn = isSel && getRotationWarning(p.id);
                const history = historyData[p.id];
                const isLoadingThis = loadingHistoryId === p.id;

                return (
                  <div key={p.id} className={cn("p-4 cursor-pointer transition-colors hover:bg-slate-50/50", isSel && "bg-primary/5")} onClick={() => toggleParcel(p.id)}>
                    <div className="flex items-center gap-3">
                      <Checkbox checked={isSel} />
                      <div className="flex-1 min-w-0">
                        <div className="font-black text-slate-900 text-sm truncate">{p.name}</div>
                        <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                          {Number(p.areaHa).toFixed(2)} ha • {p.cadastralCode || "Fără cod"}
                        </div>
                      </div>
                      {existing && (
                        <Badge variant="outline" className="text-[9px] font-black border-primary/20 text-primary shrink-0">
                          {existing.cropType}
                        </Badge>
                      )}
                    </div>

                    {/* Istoric 5 ani - shown when selected */}
                    {isSel && (
                      <div className="mt-3 ml-9 space-y-2 animate-in slide-in-from-top-2 duration-300">
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                          <History className="w-3 h-3" /> Istoric Rotație
                        </div>
                        {isLoadingThis ? (
                          <div className="flex items-center gap-2 text-xs text-slate-400"><Loader2 className="w-3 h-3 animate-spin" /> Se încarcă...</div>
                        ) : history && history.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {history.slice(0, 5).map((h, i) => (
                              <div key={i} className="px-2 py-1 bg-slate-100 rounded-lg text-[10px] font-bold text-slate-600">
                                {h.seasonName?.split(" ").pop()}: <span className="text-slate-900">{h.cropType}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-300 italic">Fără istoric</div>
                        )}
                        {warn && (
                          <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-100 rounded-xl">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span className="text-[10px] text-amber-700 font-bold">Rotație riscantă! Aceeași cultură ca anul trecut.</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bottom Action */}
            {selectedIds.length > 0 && (
              <div className="p-4 bg-slate-950 text-white animate-in slide-in-from-bottom-4 duration-300">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                    {selectedIds.length} parcele • {selectedArea.toFixed(2)} ha
                  </span>
                </div>
                <Button className="w-full h-12 agral-gradient text-white font-black uppercase tracking-tight rounded-xl shadow-xl" onClick={() => setStep(3)}>
                  Continuă la Confirmare <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </div>

          {/* Right: Map */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-border/50 shadow-sm overflow-hidden">
            <SeasonMap parcels={allParcels} selectedIds={selectedIds} onToggleSelection={toggleParcel} plans={existingPlans} />
          </div>
        </div>
      )}

      {/* STEP 3: Confirm */}
      {step === 3 && (
        <div className="bg-white rounded-3xl border border-border/50 shadow-sm p-8 max-w-2xl mx-auto animate-in zoom-in-95 duration-500">
          <div className="text-center mb-8">
            <div className={cn("w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center", cropColors[selectedCrop] || "bg-slate-300")}>
              <Sprout className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Confirmă Planificarea</h3>
            <p className="text-muted-foreground text-sm">Vei aloca <strong>{selectedCrop}</strong> pe următoarele parcele:</p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-5 mb-6 space-y-2">
            {allParcels.filter((p) => selectedIds.includes(p.id)).map((p) => (
              <div key={p.id} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-none">
                <span className="font-bold text-slate-900 text-sm">{p.name}</span>
                <span className="text-xs text-muted-foreground font-bold">{Number(p.areaHa).toFixed(2)} ha</span>
              </div>
            ))}
            <div className="flex justify-between items-center pt-3 border-t-2 border-slate-200">
              <span className="font-black text-slate-900 uppercase text-xs tracking-widest">Total</span>
              <span className="font-black text-primary text-lg">{selectedArea.toFixed(2)} ha</span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 h-12 rounded-xl font-bold" onClick={() => setStep(2)}>
              <ChevronLeft className="w-4 h-4 mr-2" /> Înapoi
            </Button>
            <Button className="flex-1 h-12 rounded-xl agral-gradient text-white font-black uppercase shadow-xl shadow-primary/20" onClick={handleConfirm} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle2 className="w-4 h-4 mr-2" /> Salvează Planul</>}
            </Button>
          </div>

          <p className="text-center text-[10px] text-slate-400 mt-4 font-bold">
            După confirmare, poți adăuga altă cultură sau te poți întoarce la tabloul de bord.
          </p>
        </div>
      )}
    </div>
  );
}
