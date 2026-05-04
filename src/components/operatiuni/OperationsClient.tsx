"use client";

import { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Trash2, 
  Calendar, 
  MapPin, 
  Settings, 
  ChevronRight, 
  ArrowRight,
  TrendingUp,
  History,
  Info,
  Layers,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  Eye,
  FileText,
  Tractor,
  FlaskConical,
  Calculator,
  Search,
  Sprout,
  ChevronDown
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { cn, formatDate } from "@/lib/utils";
import dynamic from "next/dynamic";
import { createOperation, updateResourceConsumed, deleteOperation, updateOperation, getOperations } from "@/lib/actions/operations";
import { Edit } from "lucide-react";
import { generateTreatiesRegister, generateOperationDeviz } from "@/lib/reports";
import { OperationCard } from "./OperationCard";
import { CropGridSelector } from "./CropGridSelector";
import { buttonVariants } from "@/components/ui/button";

const MapSelector = dynamic(() => import("@/components/operatiuni/MultiParcelMapSelector"), { 
  ssr: false,
  loading: () => <div className="h-[400px] bg-muted/20 animate-pulse rounded-xl flex items-center justify-center text-muted-foreground">Se încarcă harta parcelelor...</div>
});

const OP_TEMPLATES = [
  { id: "semanat", label: "Semănat", defaultInput: "samanta", allowedCategories: ["samanta", "ingrasamant", "combustibil", "tratament_samanta"] },
  { id: "erbicidat", label: "Erbicidat", defaultInput: "erbicid", allowedCategories: ["erbicid", "adjuvant", "combustibil"] },
  { id: "recoltat", label: "Recoltat", defaultInput: "combustibil", allowedCategories: ["combustibil", "recolta"] },
  { id: "aratura", label: "Arătură / Pregătire sol", defaultInput: "combustibil", allowedCategories: ["combustibil", "ingrasamant"] },
  { id: "tratament", label: "Tratament Foliar / Fungicid", defaultInput: "fungicid", allowedCategories: ["fungicid", "insecticid", "adjuvant", "regulator_crestere", "ingrasamant"] },
];

const CROPS = ["Grâu", "Porumb", "Floarea Soarelui", "Rapiță", "Orz", "Soia", "Terenuri fără culturi", "Toate"];

const cropColors: Record<string, string> = {
  "Grâu": "bg-amber-500", "Porumb": "bg-yellow-500", "Floarea Soarelui": "bg-orange-400",
  "Rapiță": "bg-lime-500", "Orz": "bg-amber-600", "Soia": "bg-emerald-500",
  "Terenuri fără culturi": "bg-slate-500", "Toate": "bg-slate-800", 
  "Lucernă": "bg-green-600", "Mazăre": "bg-teal-500",
  "Sfeclă de zahăr": "bg-rose-500", "Fâneață": "bg-green-400", "Pârloagă": "bg-slate-400",
};

const TVA_OPTIONS = [
  { label: "21% (Standard Nou)", value: 0.21 },
  { label: "19% (Standard)", value: 0.19 },
  { label: "9% (Redus)", value: 0.09 },
  { label: "5% (Super-redus)", value: 0.05 },
  { label: "0% (Scutit)", value: 0 },
];

function getTvaLabel(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}

function getDefaultTvaForCategory(category: string): number {
  if (category === "samanta" || category === "ingrasamant" || category === "recolta" || category === "tratament_samanta") return 0.09;
  return 0.19; 
}

export default function OperationsClient({ 
  initialOperations, 
  parcels, 
  inventory = [],
  orgName = "Ferma Mea",
  hideHeader = false 
}: { 
  initialOperations: any[], 
  parcels: any[], 
  inventory?: any[],
  orgName?: string,
  hideHeader?: boolean 
}) {
  const [ops, setOps] = useState(initialOperations);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingRes, setEditingRes] = useState<{ id: string, val: string } | null>(null);
  const [editingOpId, setEditingOpId] = useState<string | null>(null);
  const [selectedFilterCrop, setSelectedFilterCrop] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialOperations.length >= 30);

  // Form State
  const [opTemplate, setOpTemplate] = useState("semanat");
  const [opCrop, setOpCrop] = useState("Toate");
  const [name, setName] = useState("Semănat");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");

  const [selectedParcels, setSelectedParcels] = useState<{ id: string; name: string; maxHa: number; usedHa: number }[]>([]);
  const [resources, setResources] = useState<{ id: number; inventoryItemId?: string; name: string; type: string; quantityPerHa: number; unit: string; pricePerUnit: number; tvaRate: number; isPriceInclTva: boolean }[]>([]);
  const [yieldPerHa, setYieldPerHa] = useState<number>(0);

  // Compute live totals
  const totalArea = useMemo(() => selectedParcels.reduce((sum, p) => sum + p.usedHa, 0), [selectedParcels]);
  
  const costBreakdown = useMemo(() => resources.reduce((acc, r) => {
    const totalQty = totalArea * r.quantityPerHa;
    const tvaRate = r.tvaRate;
    
    let netPrice: number, grossPrice: number;
    if (r.isPriceInclTva) {
      grossPrice = r.pricePerUnit;
      netPrice = grossPrice / (1 + tvaRate);
    } else {
      netPrice = r.pricePerUnit;
      grossPrice = netPrice * (1 + tvaRate);
    }
    
    const netTotal = totalQty * netPrice;
    const tvaTotal = totalQty * (grossPrice - netPrice);
    const grossTotal = totalQty * grossPrice;
    
    return {
      netTotal: acc.netTotal + netTotal,
      tvaTotal: acc.tvaTotal + tvaTotal,
      grossTotal: acc.grossTotal + grossTotal,
    };
  }, { netTotal: 0, tvaTotal: 0, grossTotal: 0 }), [resources, totalArea]);

  const filteredOps = useMemo(() => ops.filter(op => {
    const matchesSearch = op.name.toLowerCase().includes(search.toLowerCase());
    if (!selectedFilterCrop || selectedFilterCrop === "Toate") return matchesSearch;
    
    const isUnassignedRequest = selectedFilterCrop === "Terenuri fără culturi";

    const matchesCrop = op.name.toLowerCase().includes(selectedFilterCrop.toLowerCase()) ||
                       (op.parcels && op.parcels.some((p: any) => {
                         const pCrop = p.parcel?.cropPlans?.[0]?.cropType;
                         if (isUnassignedRequest) return !pCrop;
                         return pCrop?.toLowerCase() === selectedFilterCrop.toLowerCase();
                       }));
    return matchesSearch && matchesCrop;
  }), [ops, search, selectedFilterCrop]);

  const visibleParcels = useMemo(() => parcels.filter(p => {
    const pCrop = p.cropPlans?.[0]?.cropType?.toLowerCase();
    const isUnassignedRequest = opCrop === "Terenuri fără culturi";
    
    if (opTemplate === "semanat") {
      if (opCrop === "Toate") return !pCrop;
      if (isUnassignedRequest) return !pCrop;
      return !pCrop || pCrop === opCrop.toLowerCase();
    }
    
    if (opCrop === "Toate") return !!pCrop;
    if (isUnassignedRequest) return !pCrop;
    
    return pCrop === opCrop.toLowerCase();
  }), [parcels, opCrop, opTemplate]);

  // Handlers
  const toggleParcel = useCallback((p: any) => {
    setSelectedParcels(prev => {
      const exists = prev.find(x => x.id === p.id);
      if (exists) {
        return prev.filter(x => x.id !== p.id);
      } else {
        return [...prev, { id: p.id, name: p.name, maxHa: Number(p.areaHa), usedHa: Number(p.areaHa) }];
      }
    });
  }, []);

  const updateParcelArea = useCallback((id: string, val: string) => {
    const num = parseFloat(val) || 0;
    setSelectedParcels(prev => prev.map(x => x.id === id ? { ...x, usedHa: num } : x));
  }, []);

  const addResource = useCallback((typeOverride?: string) => {
    setResources(prev => {
      const template = OP_TEMPLATES.find(t => t.id === opTemplate);
      const defaultType = typeOverride || template?.defaultInput || "chimic";
      const defaultUnit = (opTemplate === "semanat" && defaultType === "samanta") ? "Kg" : "L";
      
      return [...prev, { 
        id: Date.now(), 
        name: typeOverride === "combustibil" ? "Motorină" : "", 
        type: defaultType, 
        quantityPerHa: 0, 
        unit: defaultUnit, 
        pricePerUnit: typeOverride === "combustibil" ? 7.5 : 0,
        tvaRate: getDefaultTvaForCategory(defaultType),
        isPriceInclTva: true,
        inventoryLotId: "fifo"
      }];
    });
  }, [opTemplate]);

  const updateResource = useCallback((id: number, field: string, val: any) => {
    setResources(prev => prev.map(r => r.id === id ? { ...r, [field]: val } : r));
  }, []);
  
  const applyInventoryItem = useCallback((id: number, invId: string) => {
    if (!invId) {
      setResources(prev => prev.map(r => r.id === id ? { ...r, inventoryItemId: undefined } : r));
      return;
    }
    const item = inventory.find(i => i.id === invId);
    if (item) {
      setResources(prev => prev.map(r => r.id === id ? {
        ...r,
        inventoryItemId: item.id,
        name: item.name,
        type: item.category,
        pricePerUnit: Number(item.pricePerUnit),
        unit: item.unit,
        tvaRate: (item as any).tvaRate ?? getDefaultTvaForCategory(item.category),
        isPriceInclTva: true
      } : r));
    }
  }, [inventory]);

  const removeResource = useCallback((id: number) => {
    setResources(prev => prev.filter(r => r.id !== id));
  }, []);

  const handleEditOp = useCallback((op: any) => {
    setEditingOpId(op.id);
    setName(op.name);
    const tmplMatch = OP_TEMPLATES.find(t => op.name.includes(t.label));
    if (tmplMatch) setOpTemplate(tmplMatch.id);
    
    setDate(new Date(op.date).toISOString().split("T")[0]);
    setNotes(op.notes || "");
    
    setSelectedParcels((op.parcels || []).map((p: any) => ({
      id: p.parcelId,
      name: p.parcel.name,
      maxHa: Number(p.parcel.areaHa),
      usedHa: Number(p.operatedAreaHa)
    })));

    setResources((op.resources || []).map((r: any) => ({
      ...r,
      pricePerUnit: Number(r.pricePerUnit),
      quantityPerHa: Number(r.quantityPerHa),
      totalConsumed: r.totalConsumed ? Number(r.totalConsumed) : undefined,
      tvaRate: r.tvaRate ?? getDefaultTvaForCategory(r.type),
      isPriceInclTva: true
    })));

    if (op.yieldPerHa) setYieldPerHa(Number(op.yieldPerHa));
    else if (op.totalYield && op.totalAreaHa) setYieldPerHa(Number(op.totalYield) / Number(op.totalAreaHa));
    else setYieldPerHa(0);

    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const moreOps = await getOperations({ skip: ops.length, take: 30 });
      if (moreOps.length < 30) setHasMore(false);
      setOps(prev => [...prev, ...moreOps]);
    } catch (e) {
      console.error("Error loading more ops:", e);
    } finally {
      setIsLoadingMore(false);
    }
  }, [ops.length, isLoadingMore]);

  async function handleSave() {
    if (!name || selectedParcels.length === 0) {
      alert("Completati numele și selectați cel puțin o parcelă!");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name,
        type: opTemplate,
        cropName: opCrop,
        date,
        notes,
        yieldPerHa: opTemplate === "recoltat" ? yieldPerHa : undefined,
        totalYield: opTemplate === "recoltat" ? yieldPerHa * totalArea : undefined,
        parcels: selectedParcels.map(p => ({ parcelId: p.id, operatedAreaHa: p.usedHa })),
        resources: resources.map(r => ({
          name: r.name,
          type: r.type,
          quantityPerHa: r.quantityPerHa,
          unit: r.unit,
          pricePerUnit: r.pricePerUnit,
          tvaRate: r.tvaRate,
          isPriceInclTva: r.isPriceInclTva,
          inventoryItemId: r.inventoryItemId
        }))
      };

      if (editingOpId) {
        const updatedOp = await updateOperation(editingOpId, payload);
        setOps(prev => prev.map(o => o.id === editingOpId ? updatedOp : o));
        setShowForm(false);
      } else {
        const newOp = await createOperation(payload);
        setOps(prev => [newOp, ...prev]);
        setShowForm(false);
      }
      
      setEditingOpId(null);
      setName("");
      setNotes("");
      setSelectedParcels([]);
      setResources([]);

    } catch (err: any) {
      console.error(err);
      alert("Eroare la înregistrarea lucrării: " + (err?.message || "Eroare necunoscută"));
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleUpdateTotalConsumed = useCallback(async (resId: string) => {
    if (!editingRes || !editingRes.val) return;
    try {
      await updateResourceConsumed(resId, parseFloat(editingRes.val));
      setOps(prev => prev.map(op => ({
        ...op,
        resources: op.resources.map((r: any) => r.id === resId ? { ...r, totalConsumed: parseFloat(editingRes.val) } : r)
      })));
      setEditingRes(null);
    } catch(e) {
      alert("Eroare ajustare.");
    }
  }, [editingRes]);

  const handleDeleteOp = useCallback(async (opId: string) => {
    if (confirm("Ești sigur că vrei să ștergi lucrarea? Toate materialele se vor returna în stoc.")) {
      try {
        await deleteOperation(opId);
        setOps(prev => prev.filter(o => o.id !== opId));
      } catch (e) {
        alert("Eroare stergere");
      }
    }
  }, []);

  const handleGenerateDeviz = useCallback((op: any, oName: string) => {
    generateOperationDeviz(op, oName);
  }, []);

  if (!selectedFilterCrop && !showForm) {
    return (
      <CropGridSelector 
        crops={CROPS}
        cropColors={cropColors}
        onSelect={setSelectedFilterCrop}
        onAddOperation={() => {
          setOpCrop("Toate");
          setShowForm(true);
        }}
      />
    );
  }

  return (
    <div className="space-y-8 max-w-7xl" suppressHydrationWarning>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center text-white shadow-xl", cropColors[selectedFilterCrop || ""] || "bg-emerald-600", selectedFilterCrop !== "Toate" && "shadow-emerald-600/20")}>
              {selectedFilterCrop === "Toate" ? <Tractor className="w-6 h-6" /> : <Sprout className="w-6 h-6" />}
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Lucrări: <span className="text-emerald-600">{selectedFilterCrop}</span></h1>
              <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em] ml-0.5">{filteredOps.length} operațiuni înregistrate</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                buttonVariants({ variant: "outline" }),
                "border-border/50 text-slate-600 font-black uppercase tracking-tight text-[10px] h-11 px-5 rounded-xl gap-2 hover:bg-slate-50 cursor-pointer"
              )}
            >
              <Layers className="w-4 h-4" /> Schimbă Cultura <ChevronDown className="w-3 h-3 ml-1 opacity-50" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl p-2 shadow-2xl border-primary/10">
              <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-2 py-1.5">Selectează Cultura</div>
              {CROPS.map((crop) => (
                <DropdownMenuItem 
                  key={crop}
                  className="rounded-lg font-bold text-sm cursor-pointer py-2.5 px-3 focus:bg-primary/5 focus:text-primary transition-colors"
                  onClick={() => setSelectedFilterCrop(crop)}
                >
                  <div className={cn("w-2.5 h-2.5 rounded-full mr-3", cropColors[crop] || "bg-slate-300")} />
                  {crop}
                </DropdownMenuItem>
              ))}
              <div className="h-px bg-slate-100 my-1" />
              <DropdownMenuItem 
                className="rounded-lg font-bold text-sm cursor-pointer py-2.5 px-3 text-slate-400 focus:bg-slate-50"
                onClick={() => setSelectedFilterCrop(null)}
              >
                Înapoi la ecranul principal
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            className="border-primary/20 text-primary font-black uppercase tracking-tight text-[10px] h-11 px-5 rounded-xl gap-2 hover:bg-primary/5"
            onClick={() => {
              // @ts-ignore
              import("@/lib/reports").then(m => m.generateTreatiesRegister(ops, orgName));
            }}
          >
            <FileText className="w-4 h-4" /> Export PDF
          </Button>
          <Button
            className="agral-gradient text-white font-black uppercase tracking-widest text-[11px] h-11 px-6 rounded-xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all gap-2"
            onClick={() => {
              if (showForm) {
                setShowForm(false);
                setEditingOpId(null);
              } else {
                setEditingOpId(null);
                setShowForm(true);
                setResources([]);
                setSelectedParcels([]);
                setName("Semănat");
              }
            }}
          >
            {showForm ? "Anulează" : <><Plus className="w-4 h-4" /> Nouă Lucrare</>}
          </Button>
        </div>
      </div>

      {showForm && (
        <div className="space-y-6 animate-in slide-in-from-top-4 duration-500">
          <Card className="border-primary/20 shadow-md">
            <CardHeader className="pb-3 border-b bg-muted/20">
              <CardTitle className="text-lg">{editingOpId ? `Modifică Lucrare #${editingOpId.slice(-4)}` : "1. Detalii Generale Lucrare"}</CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Tipul Lucrării</Label>
                  <select 
                    className="w-full h-12 rounded-2xl border border-input bg-background px-4 text-sm font-bold shadow-sm focus:ring-2 focus:ring-primary/20 transition-all"
                    value={opTemplate}
                    onChange={(e) => {
                      setOpTemplate(e.target.value);
                      const tmplName = OP_TEMPLATES.find(t => t.id === e.target.value)?.label || "";
                      setName(opCrop === "Toate" ? tmplName : `${tmplName} - ${opCrop}`);
                    }}
                  >
                    {OP_TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Cultura</Label>
                  <select 
                    className="w-full h-12 rounded-2xl border border-input bg-background px-4 text-sm font-bold shadow-sm focus:ring-2 focus:ring-primary/20 transition-all"
                    value={opCrop}
                    onChange={(e) => {
                      setOpCrop(e.target.value);
                      const tmplName = OP_TEMPLATES.find(t => t.id === opTemplate)?.label || "";
                      setName(e.target.value === "Toate" ? tmplName : `${tmplName} - ${e.target.value}`);
                      setSelectedParcels([]);
                    }}
                  >
                    {CROPS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Data Lucrării</Label>
                  <Input type="date" className="h-12 rounded-2xl font-bold shadow-sm" value={date} onChange={e => setDate(e.target.value)} />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Note / Observații</Label>
                  <Input 
                    placeholder="ex: Vânt moderat, sol umed..." 
                    className="h-12 rounded-2xl font-bold shadow-sm" 
                    value={notes} 
                    onChange={e => setNotes(e.target.value)} 
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20 shadow-md">
            <CardHeader className="pb-3 border-b bg-muted/20">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-black tracking-tight">2. Selectează Terenul Lucrat</CardTitle>
                  <CardDescription className="text-[10px] font-bold uppercase tracking-tight text-slate-500">Suprafața totală se calculează automat</CardDescription>
                </div>
                <Badge variant="outline" className="font-black text-primary border-primary/20 bg-primary/5 px-5 py-2.5 text-base rounded-2xl">
                  {totalArea.toFixed(2)} ha total
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-6">
              <div className="h-[350px] md:h-[450px] w-full rounded-2xl overflow-hidden border shadow-inner">
                <MapSelector 
                  parcels={parcels} 
                  availableIds={visibleParcels.map(p => p.id)}
                  selectedIds={selectedParcels.map(p => p.id)} 
                  onToggleParcel={(id) => {
                    const p = parcels.find(x => x.id === id);
                    const isAvailable = visibleParcels.some(x => x.id === id);
                    if (p && isAvailable) toggleParcel(p);
                  }} 
                />
              </div>

              {selectedParcels.length > 0 ? (
                <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl space-y-4 shadow-inner">
                  <h4 className="font-black text-xs uppercase tracking-widest text-slate-500 border-b pb-3">Ajustare Suprafețe Parțiale (ha)</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {selectedParcels.map(sp => (
                      <div key={sp.id} className="bg-white p-3 rounded-xl border shadow-sm flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-black uppercase truncate text-slate-700">{sp.name}</span>
                          <span className="text-[10px] font-bold text-slate-400">{sp.maxHa} ha max</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input 
                            type="number" 
                            step="0.01" 
                            className="h-9 rounded-lg font-black text-primary border-primary/20" 
                            value={sp.usedHa} 
                            onChange={(e) => updateParcelArea(sp.id, e.target.value)} 
                          />
                          <span className="text-xs font-bold text-slate-500">ha</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 bg-slate-50/50 border-2 border-dashed rounded-3xl text-slate-400 font-bold text-sm px-4">
                  Faceți click pe parcelele din hartă pentru a le adăuga în acest deviz.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-primary/20 shadow-lg bg-slate-50/30">
            <CardHeader className="pb-3 border-b bg-amber-50/50">
              <CardTitle className="text-lg flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-amber-600" />
                {opTemplate === "recoltat" ? "3. Detalii Recoltă & Consum" : "3. Input-uri / Tratamente"}
              </CardTitle>
              <CardDescription>Calculator automat normă/hectar</CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              {opTemplate === "recoltat" && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3 mb-4">
                  <h4 className="text-sm font-bold text-amber-800 flex items-center gap-2">
                    <Calculator className="w-4 h-4" /> Producție la Hectar
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Tone / Hectar</Label>
                      <Input type="number" step="0.01" className="h-9" value={yieldPerHa || ""} onChange={(e) => setYieldPerHa(parseFloat(e.target.value) || 0)} />
                    </div>
                    <div className="space-y-1.5 text-right">
                      <Label className="text-xs">Total Estimat</Label>
                      <div className="text-xl font-black text-amber-700">{(yieldPerHa * totalArea).toFixed(2)} Tone</div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="space-y-6">
                {resources.map((res) => {
                  const totalQty = totalArea * res.quantityPerHa;
                  return (
                    <div key={res.id} className="relative p-4 bg-white border rounded-2xl shadow-sm space-y-4">
                      <Button variant="destructive" size="icon" className="absolute -top-3 -right-3 w-8 h-8 rounded-full" onClick={() => removeResource(res.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-xs font-black uppercase text-slate-500">Sursă Produs</Label>
                          <select className="h-12 w-full rounded-2xl border bg-white px-4 text-sm font-black" value={res.inventoryItemId || ""} onChange={(e) => applyInventoryItem(res.id, e.target.value)}>
                            <option value="">Manual (Fără stoc)</option>
                            {inventory.filter(i => i.category === res.type).map(inv => (
                              <option key={inv.id} value={inv.id}>{inv.name} ({Number(inv.stockQuantity)} {inv.unit})</option>
                            ))}
                          </select>
                        </div>
                        {res.inventoryItemId && (
                          <div className="space-y-2">
                            <Label className="text-xs font-black uppercase text-slate-500">Lot Specific</Label>
                            <select 
                              className="h-12 w-full rounded-2xl border bg-slate-50 px-4 text-sm font-bold" 
                              value={res.inventoryLotId || "fifo"} 
                              onChange={(e) => updateResource(res.id, "inventoryLotId", e.target.value)}
                            >
                              <option value="fifo">FIFO (Cel mai vechi)</option>
                              {inventory.find(i => i.id === res.inventoryItemId)?.lots?.filter((l: any) => Number(l.quantity) > 0).map((lot: any) => (
                                <option key={lot.id} value={lot.id}>
                                  Lot: {lot.documentNumber || lot.id.slice(0,8)} ({Number(lot.quantity)} {res.unit})
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                        <div className="space-y-2">
                          <Label className="text-xs font-black uppercase text-slate-500">Nume Produs</Label>
                          <Input className="h-12 rounded-2xl font-black" value={res.name} onChange={(e) => updateResource(res.id, "name", e.target.value)} disabled={!!res.inventoryItemId} />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <Label className="text-xs font-black uppercase text-slate-500">Normă (Cant/Ha)</Label>
                          <Input type="number" step="0.1" className="h-12 rounded-2xl font-black text-lg" value={res.quantityPerHa || ""} onChange={(e) => updateResource(res.id, "quantityPerHa", parseFloat(e.target.value)||0)} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-black uppercase text-slate-500">Preț Unitar</Label>
                          <Input type="number" step="0.1" className="h-12 rounded-2xl font-black text-lg" value={res.pricePerUnit || ""} onChange={(e) => updateResource(res.id, "pricePerUnit", parseFloat(e.target.value)||0)} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-black uppercase text-slate-500">TVA (%)</Label>
                          <select className="h-12 w-full rounded-2xl border bg-white px-4 font-black" value={res.tvaRate} onChange={(e) => updateResource(res.id, "tvaRate", parseFloat(e.target.value))}>
                            {TVA_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {OP_TEMPLATES.find(t => t.id === opTemplate)?.allowedCategories.map(cat => (
                  <Button 
                    key={cat}
                    variant="outline" 
                    size="sm"
                    className="flex-1 min-w-[140px] border-dashed border-2 gap-2 h-10 rounded-xl font-black uppercase text-[9px] hover:bg-slate-50" 
                    onClick={() => addResource(cat)}
                  >
                    <Plus className="w-3 h-3" /> {cat.replace('_', ' ')}
                  </Button>
                ))}
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex-1 min-w-[140px] border-dashed border-2 gap-2 h-10 rounded-xl font-black uppercase text-[9px] hover:bg-slate-50" 
                  onClick={() => addResource()}
                >
                  <Plus className="w-3 h-3" /> Altul
                </Button>
              </div>

              <div className="bg-slate-900 text-white rounded-2xl p-6 mt-6 space-y-4">
                <div className="flex justify-between text-sm opacity-70">
                  <span>Subtotal (Net)</span>
                  <span>{costBreakdown.netTotal.toFixed(2)} Lei</span>
                </div>
                <div className="flex justify-between text-sm opacity-70">
                  <span>TVA Total</span>
                  <span className="text-amber-400">+{costBreakdown.tvaTotal.toFixed(2)} Lei</span>
                </div>
                <div className="h-px bg-white/10" />
                <div className="flex justify-between items-center">
                  <span className="font-black uppercase tracking-widest text-xs">Total de plată</span>
                  <span className="text-3xl font-black text-emerald-400">{costBreakdown.grossTotal.toFixed(2)} Lei</span>
                </div>
                <Button className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-widest rounded-xl text-md shadow-xl shadow-emerald-500/20" onClick={handleSave} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <CheckCircle2 className="w-6 h-6 mr-2" />}
                  {editingOpId ? "Actualizează Lucrarea" : "Finalizează Devizul"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {!showForm && !selectedFilterCrop && (
        <CropGridSelector 
          crops={CROPS}
          cropColors={cropColors}
          onSelect={setSelectedFilterCrop}
          onAddOperation={() => setShowForm(true)}
        />
      )}

      {!showForm && selectedFilterCrop && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input placeholder="Caută lucrare..." className="pl-12 h-12 rounded-2xl border-slate-200 font-bold" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Button 
              variant="ghost" 
              className="font-black uppercase text-[10px] tracking-widest text-slate-400 gap-2"
              onClick={() => setSelectedFilterCrop(null)}
            >
              <ArrowRight className="w-3 h-3 rotate-180" /> Înapoi la selecție
            </Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOps.map((op) => (
              <OperationCard 
                key={op.id}
                op={op}
                orgName={orgName}
                editingRes={editingRes}
                setEditingRes={setEditingRes}
                handleUpdateTotalConsumed={handleUpdateTotalConsumed}
                handleEditOp={handleEditOp}
                handleDeleteOp={handleDeleteOp}
                generateOperationDeviz={handleGenerateDeviz}
              />
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center pt-8">
              <Button 
                variant="outline" 
                className="h-12 px-10 rounded-2xl font-black uppercase tracking-widest text-[10px] border-slate-200 hover:bg-slate-50 gap-2 shadow-sm"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronDown className="w-4 h-4" />}
                {isLoadingMore ? "Se încarcă..." : "Încarcă mai multe lucrări"}
              </Button>
            </div>
          )}

          {filteredOps.length === 0 && (
            <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200">
              <Tractor className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <h3 className="text-lg font-black text-slate-900">Nicio lucrare găsită</h3>
              <p className="text-sm text-slate-400 font-bold">Încercați să schimbați cultura sau filtrul de căutare.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
