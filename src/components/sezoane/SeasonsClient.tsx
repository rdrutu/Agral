"use client";

import { useState } from "react";
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
  Sprout
} from "lucide-react";
import { createSeason, setActiveSeason, allocateParcelsToCrop, deleteSeason, removeCropPlan } from "@/lib/actions/seasons";
import { useRouter } from "next/navigation";

const CROPS = ["Grâu", "Porumb", "Floarea Soarelui", "Rapiță", "Orz", "Soia", "Lucernă", "Mazăre", "Sfeclă de zahăr", "Fâneață", "Pârloagă"];

export default function SeasonsClient({ 
  initialSeasons, 
  allParcels, 
  initialPlans 
}: { 
  initialSeasons: any[]; 
  allParcels: any[]; 
  initialPlans: any[] 
}) {
  const router = useRouter();
  const [seasons, setSeasons] = useState(initialSeasons);
  const [activeSeasonId, setActiveSeasonId] = useState<string | null>(initialSeasons.find(s => s.isActive)?.id || initialSeasons[0]?.id || null);
  const [plans, setPlans] = useState(initialPlans);

  // UI States
  const [showNewSeason, setShowNewSeason] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedParcels, setSelectedParcels] = useState<string[]>([]);
  const [bulkCrop, setBulkCrop] = useState(CROPS[0]);

  // Form State ptr Sezon nou
  const [sName, setSName] = useState("");
  const [sStart, setSStart] = useState("");
  const [sEnd, setSEnd] = useState("");

  const activeSeasonData = seasons.find(s => s.id === activeSeasonId);

  // Creare Campanie
  async function handleCreateSeason() {
    if (!sName || !sStart || !sEnd) return alert("Completați toate datele sezonului!");
    setIsSubmitting(true);
    try {
      const newS = await createSeason({ name: sName, startDate: sStart, endDate: sEnd });
      setSeasons(prev => [newS, ...prev]);
      setActiveSeasonId(newS.id);
      setShowNewSeason(false);
      setSName(""); setSStart(""); setSEnd("");
      router.refresh();
    } catch(e) {
      alert("Eroare creare");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Setare Campanie Curentă
  async function handleSetActive(id: string) {
    if (activeSeasonData?.isActive && id === activeSeasonId) return; // e deja activ oficial
    setIsSubmitting(true);
    try {
      await setActiveSeason(id);
      setSeasons(prev => prev.map(s => ({ ...s, isActive: s.id === id })));
      setActiveSeasonId(id);
      router.refresh(); 
    } catch(e) {
      alert("Eroare");
    } finally {
        setIsSubmitting(false);
    }
  }

  // Alocare Culturi
  async function handleAllocate() {
    if (selectedParcels.length === 0 || !activeSeasonId) return alert("Selectați parcele!");
    setIsSubmitting(true);
    try {
      await allocateParcelsToCrop({
        seasonId: activeSeasonId,
        parcelIds: selectedParcels,
        cropType: bulkCrop
      });

      setPlans(prev => [
        ...prev.filter(p => !selectedParcels.includes(p.parcelId)),
        ...selectedParcels.map((pId: string) => ({
            id: Math.random().toString(), // fallback temporary id
            seasonId: activeSeasonId,
            parcelId: pId,
            cropType: bulkCrop,
            status: "planned",
            parcel: allParcels.find(ap => ap.id === pId)
        }))
      ]);

      setSelectedParcels([]);
      router.refresh();
    } catch (e) {
      alert("Eroare alocare");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Stergere Plan dintr-o parcela pe sezonul curent
  async function handleRemovePlan(planId: string) {
    if (confirm("Golești parcela pentru această campanie?")) {
      await removeCropPlan(planId);
      setPlans(prev => prev.filter(p => p.id !== planId));
      router.refresh();
    }
  }

  async function handleDeleteSeason(id: string) {
    if (confirm("Stergi definitv Campania si tot istoricul planificat pe ea?")) {
        await deleteSeason(id);
        window.location.reload();
    }
  }

  // Helpe ptr a bifa/debifa randul in tabel
  const toggleSelection = (parcelId: string) => {
    if (selectedParcels.includes(parcelId)) {
      setSelectedParcels(prev => prev.filter(p => p !== parcelId));
    } else {
      setSelectedParcels(prev => [...prev, parcelId]);
    }
  };

  const getPlanForParcel = (parcelId: string) => {
    return plans.find(p => p.parcelId === parcelId);
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-foreground flex items-center gap-2">
            <CalendarDays className="w-7 h-7 text-primary" />
            Campanii Agricole (Plan Culturi)
          </h2>
          <p className="text-muted-foreground mt-1">Organizează Rotația Culturilor și istoricizează Anii Agricoli pentru fiecare sol în parte.</p>
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
                  <Label className="text-xs text-muted-foreground">Nume Campanie</Label>
                  <Input className="h-8 text-sm placeholder:text-muted-foreground/50" placeholder="ex: Toamnă 25 - Primăvară 26" value={sName} onChange={e => setSName(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">Început</Label>
                    <Input type="date" className="h-8 text-sm" value={sStart} onChange={e => setSStart(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Sfârșit</Label>
                    <Input type="date" className="h-8 text-sm" value={sEnd} onChange={e => setSEnd(e.target.value)} />
                  </div>
                </div>
                <Button className="w-full h-8 mt-2" size="sm" onClick={handleCreateSeason} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvează Campanie"}
                </Button>
              </CardContent>
            </Card>
          )}

          {seasons.map(s => (
            <div 
              key={s.id} 
              className={`p-3 rounded-xl border flex flex-col gap-2 cursor-pointer transition-all ${activeSeasonId === s.id ? "bg-primary text-primary-foreground shadow-md scale-[1.02] border-primary" : "bg-card hover:border-primary/40"}`}
              onClick={() => { if (activeSeasonId !== s.id) { setActiveSeasonId(s.id); window.location.href = '?season=' + s.id; } }}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold">{s.name}</span>
                {s.isActive && <Badge variant="secondary" className="bg-white/20 hover:bg-white/20 border-none text-xs"><CheckCircle2 className="w-3 h-3 mr-1"/> Activă</Badge>}
              </div>
              <div className={`text-xs flex items-center justify-between ${activeSeasonId === s.id ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                <span>{new Date(s.startDate).toLocaleDateString('ro')} - {new Date(s.endDate).toLocaleDateString('ro')}</span>
              </div>
              
              {activeSeasonId === s.id && (
                  <div className="flex gap-2 mt-2 pt-2 border-t border-white/20">
                      {!s.isActive && (
                        <Button size="sm" variant="secondary" className="flex-1 h-7 text-xs" onClick={(e) => { e.stopPropagation(); handleSetActive(s.id); }}>
                            Setează ca Activă 
                        </Button>
                      )}
                      {seasons.length > 1 && (
                         <Button size="icon" variant="destructive" className="h-7 w-7 opacity-80" onClick={(e) => { e.stopPropagation(); handleDeleteSeason(s.id); }}>
                             <Trash2 className="w-3 h-3" />
                         </Button>
                      )}
                  </div>
              )}
            </div>
          ))}
        </div>

        {/* PANEL DREAPTA: Parcele & Alocări ptr Sezonul Activ în UI */}
        <div className="lg:col-span-3">
          <Card className="shadow-lg border-border">
            <CardHeader className="bg-muted/10 pb-4 border-b">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-xl text-primary flex items-center gap-2">
                    <Sprout className="w-5 h-5"/> Plan de Culturi: {activeSeasonData?.name}
                  </CardTitle>
                  <CardDescription>Bifați parcelele libere și atribuiți grupat o cultură.</CardDescription>
                </div>
                
                {selectedParcels.length > 0 && (
                  <div className="p-2 bg-primary/10 border border-primary/20 rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-right-4">
                    <span className="text-sm font-semibold text-primary">{selectedParcels.length} parcele alese</span>
                    <select 
                      className="h-8 rounded-md border border-input bg-background px-2 text-sm"
                      value={bulkCrop}
                      onChange={e => setBulkCrop(e.target.value)}
                    >
                      {CROPS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <Button size="sm" className="h-8 gap-1 shadow-sm" onClick={handleAllocate} disabled={isSubmitting}>
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin"/> : <CheckCircle2 className="w-4 h-4" />} Aplică 
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-muted/40 border-b">
                    <tr>
                      <th className="px-4 py-3 w-10">Bifă</th>
                      <th className="px-4 py-3">Nume Parcelă</th>
                      <th className="px-4 py-3">Suprafață (Ha)</th>
                      <th className="px-4 py-3">Cultură Curentă</th>
                      <th className="px-4 py-3 text-right">Acțiuni</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {allParcels.map(p => {
                      const plan = getPlanForParcel(p.id);
                      const isSelected = selectedParcels.includes(p.id);
                      
                      return (
                        <tr key={p.id} className={`hover:bg-muted/20 transition-colors ${isSelected ? "bg-primary/5" : ""}`}>
                          <td className="px-4 py-3">
                            <input 
                              type="checkbox" 
                              className="w-4 h-4 rounded border-gray-300 text-primary cursor-pointer accent-primary"
                              checked={isSelected}
                              onChange={() => toggleSelection(p.id)}
                            />
                          </td>
                          <td className="px-4 py-3 font-semibold text-foreground flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-muted-foreground" /> {p.name}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{p.areaHa?.toString()} ha</td>
                          <td className="px-4 py-3">
                            {plan ? (
                              <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200 gap-1 rounded-sm px-2">
                                <Leaf className="w-3 h-3" /> {plan.cropType}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground italic text-xs">Neocupat (Liber)</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {plan && (
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => handleRemovePlan(plan.id)} title="Golește cultura">
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
