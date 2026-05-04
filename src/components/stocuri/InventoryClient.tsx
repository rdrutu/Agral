"use client";

import { useRouter } from "next/navigation";
import { cn, formatDate } from "@/lib/utils";
import toast from "react-hot-toast";
import { useState, useMemo, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  PackageSearch,
  Plus,
  Search,
  FlaskConical,
  Wheat,
  Droplets,
  Fuel,
  Edit2,
  Trash2,
  Loader2,
  ArrowUpRight,
  DollarSign,
  History,
  Calendar,
  ArrowDownCircle,
  ArrowUpCircle,
  FileText,
  Printer,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  Building2,
  Calculator,
  LayoutGrid,
  ListFilter,
  CheckCircle2,
  XCircle,
  PlusCircle
} from "lucide-react";
import { 
  createInventoryItem, 
  updateInventoryStock, 
  getInventoryItemHistory,
  deleteInventoryItem,
  recordSale,
  getSupplierSuggestions,
  getBuyerSuggestions,
  getProductSuggestions
} from "@/lib/actions/inventory";
import { getSaleDetails } from "@/lib/actions/finance";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import ProductFileModal from "./ProductFileModal";

const categoryConfig: Record<string, { icon: any, color: string, label: string, bg: string }> = {
  erbicid: { icon: FlaskConical, color: "text-red-600", bg: "bg-red-50", label: "Erbicid" },
  insecticid: { icon: FlaskConical, color: "text-orange-600", bg: "bg-orange-50", label: "Insecticid" },
  fungicid: { icon: FlaskConical, color: "text-blue-600", bg: "bg-blue-50", label: "Fungicid" },
  tratament_samanta: { icon: Droplets, color: "text-indigo-600", bg: "bg-indigo-50", label: "Tratament Sămânță" },
  ingrasamant: { icon: Droplets, color: "text-emerald-600", bg: "bg-emerald-50", label: "Îngrășăminte" },
  samanta: { icon: Wheat, color: "text-green-600", bg: "bg-green-50", label: "Semințe" },
  combustibil: { icon: Fuel, color: "text-slate-600", bg: "bg-slate-50", label: "Combustibil" },
  recolta: { icon: Wheat, color: "text-amber-700", bg: "bg-amber-50", label: "Recoltă / Cereale" },
  adjuvant: { icon: Droplets, color: "text-cyan-600", bg: "bg-cyan-50", label: "Adjuvant" },
  regulator_crestere: { icon: TrendingUp, color: "text-lime-600", bg: "bg-lime-50", label: "Regulator Creștere" },
  chimic: { icon: FlaskConical, color: "text-purple-600", bg: "bg-purple-50", label: "Protecție Plante (Altele)" },
};

const TVA_OPTIONS = [
  { label: "9% (Cereale/Semințe)", value: "0.09" },
  { label: "19% (Standard)", value: "0.19" },
  { label: "5% (Lemne/Altele)", value: "0.05" },
  { label: "0% (Scutit)", value: "0" },
];

export default function InventoryClient({ 
  initialInventory,
  orgName = "Ferma Mea",
  hideHeader = false 
}: { 
  initialInventory: any[],
  orgName?: string,
  hideHeader?: boolean
}) {
  const [items, setItems] = useState(initialInventory);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"inputs" | "harvests">("inputs");
  
  // Suggestions State
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [supplierSuggestions, setSupplierSuggestions] = useState<string[]>([]);
  const [buyerSuggestions, setBuyerSuggestions] = useState<string[]>([]);
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    category: "chimic",
    unit: "L",
    quantity: "",
    pricePerUnit: "",
    isPriceInclTva: true,
    tvaRate: "0.19",
    supplierName: "",
    documentNumber: "",
    bagWeight: "",
    pricePerBag: "",
    notes: "",
    cropType: "",
    minStockThreshold: "",
    expiryDate: "",
    lotNumber: "",
    packagingType: "Direct", // Direct, Bidon, Sac, Flacon
    packagingQuantity: "1", // Unități per ambalaj
  });
  
  // Sale Modal State
  const [sellingItem, setSellingItem] = useState<any | null>(null);
  const [isSelling, setIsSelling] = useState(false);
  const [saleData, setSaleData] = useState({ 
    quantity: 0, 
    price: 0, 
    isPriceInclTva: true, 
    tvaRate: 0.09, 
    buyer: "", 
    documentNumber: "",
    selectedLotId: "fifo", // default fifo
    humidity: "",
    impurities: "",
    notes: "",
    type: "sale" // sale or return
  });
  const [stagedTransactions, setStagedTransactions] = useState<any[]>([]);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);

  // History State
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<any | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyData, setHistoryData] = useState<any | null>(null);

  // KPIs
  const kpis = useMemo(() => {
    const totalInputsValue = items
      .filter(i => i.category !== "recolta")
      .reduce((sum, i) => sum + (Number(i.stockQuantity) * Number(i.pricePerUnit)), 0);
    
    const totalHarvestsValue = items
      .filter(i => i.category === "recolta")
      .reduce((sum, i) => sum + (Number(i.stockQuantity) * Number(i.pricePerUnit)), 0);

    const lowStockCount = items.filter(i => 
      i.minStockThreshold && Number(i.stockQuantity) < Number(i.minStockThreshold)
    ).length;

    return { totalInputsValue, totalHarvestsValue, lowStockCount };
  }, [items]);

  const filtered = items.filter(i => {
    const matchesSearch = i.name.toLowerCase().includes(search.toLowerCase());
    const isHarvest = i.category === "recolta";
    
    if (activeTab === "harvests") return isHarvest && matchesSearch;
    return !isHarvest && matchesSearch;
  });

  const handleNameChange = async (val: string) => {
    setFormData(prev => ({ ...prev, name: val }));
    if (val.length > 2) {
      setSuggestionLoading(true);
      const res = await getProductSuggestions(val);
      setSuggestions(res);
      setSuggestionLoading(false);
    } else {
      setSuggestions([]);
    }
  };

  const handleSelectSuggestion = (s: any) => {
    setFormData(prev => ({
      ...prev,
      name: s.name,
      category: s.category,
      unit: s.unit,
      pricePerUnit: s.pricePerUnit?.toString() || ""
    }));
    setSuggestions([]);
  };

  const handleSupplierChange = async (val: string) => {
    setFormData(prev => ({ ...prev, supplierName: val }));
    if (val.length > 1) {
      const res = await getSupplierSuggestions(val);
      setSupplierSuggestions(res);
    } else {
      setSupplierSuggestions([]);
    }
  };

  const handleBuyerChange = async (val: string) => {
    setSaleData(prev => ({ ...prev, buyer: val }));
    if (val.length > 1) {
      const res = await getBuyerSuggestions(val);
      setBuyerSuggestions(res);
    } else {
      setBuyerSuggestions([]);
    }
  };

  const addToStaged = () => {
    if (!formData.name || !formData.quantity) {
      toast.error("Completati numele și cantitatea!");
      return;
    }
    const calculatedQty = formData.packagingType !== "Direct" 
      ? (Number(formData.packagingQuantity) * Number(formData.bagWeight)) || Number(formData.quantity) 
      : Number(formData.quantity);

    setStagedItems(prev => [...prev, { ...formData, quantity: calculatedQty, id: Date.now() }]);
    setFormData(prev => ({ ...prev, name: "", quantity: "", lotNumber: "", expiryDate: "" }));
    toast.success("Produs adăugat în lista de așteptare");
  };

  const removeFromStaged = (id: number) => {
    setStagedItems(prev => prev.filter(item => item.id !== id));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    const itemsToSave = stagedItems.length > 0 ? stagedItems : [formData];
    
    if (itemsToSave.length === 0 || !itemsToSave[0].name) {
       toast.error("Nu există produse de salvat!");
       return;
    }

    setIsSubmitting(true);
    try {
      for (const item of itemsToSave) {
        const fData = new FormData();
        Object.entries(item).forEach(([k, v]) => fData.append(k, String(v)));
        if (item.category === 'recolta') {
          fData.append("source", "harvest");
        }
        
        const newItem = await createInventoryItem(fData);
        setItems(prev => {
          const exists = prev.find(i => i.id === newItem.id);
          if (exists) return prev.map(i => i.id === newItem.id ? newItem : i);
          return [...prev, newItem].sort((a,b) => a.name.localeCompare(b.name));
        });
      }
      
      setStagedItems([]);
      setShowForm(false);
      toast.success(itemsToSave.length > 1 ? `${itemsToSave.length} produse adăugate!` : "Produs adăugat în stoc!");
    } catch (e: any) {
      toast.error(e.message || "Eroare la adăugare");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkSell = async () => {
    if (stagedTransactions.length === 0) return;
    setIsSelling(true);
    try {
      for (const trans of stagedTransactions) {
        const fData = new FormData();
        fData.append("itemId", trans.item.id);
        fData.append("quantity", String(trans.quantity));
        fData.append("pricePerUnit", String(trans.price));
        fData.append("tvaRate", String(trans.tvaRate));
        fData.append("isPriceInclTva", String(trans.isPriceInclTva));
        fData.append("buyer", trans.buyer);
        fData.append("documentNumber", trans.documentNumber);
        fData.append("lotId", trans.selectedLotId);
        fData.append("humidity", trans.humidity);
        fData.append("impurities", trans.impurities);
        fData.append("notes", trans.notes);
        fData.append("type", trans.type);

        await recordSale(fData);
      }
      
      toast.success("Tranzacții finalizate cu succes!");
      setIsTransactionModalOpen(false);
      setStagedTransactions([]);
      // Refresh items
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "Eroare la tranzacție");
    } finally {
      setIsSelling(false);
    }
  };

  const addToStagedTransactions = () => {
    if (!sellingItem || saleData.quantity <= 0) {
      toast.error("Completati toate datele!");
      return;
    }
    setStagedTransactions(prev => [...prev, { 
      item: sellingItem, 
      ...saleData, 
      id: Date.now() 
    }]);
    setSellingItem(null);
    toast.success("Produs adăugat în listă");
  };

  const handleViewHistory = async (item: any) => {
    setHistoryData(null);
    setSelectedHistoryItem(item);
    setHistoryLoading(true);
    try {
      const data = await getInventoryItemHistory(item.id);
      setHistoryData(data);
    } catch (e) {
      toast.error("Eroare la încărcarea fișei produsului");
    } finally {
      setHistoryLoading(false);
    }
  };

  const onRefreshHistory = useCallback(async () => {
    if (!selectedHistoryItem) return;
    try {
      const data = await getInventoryItemHistory(selectedHistoryItem.id);
      setHistoryData(data);
      // Update the main items list too
      setItems(prev => prev.map(i => i.id === selectedHistoryItem.id ? { ...i, stockQuantity: data.stockQuantity } : i));
    } catch (e) {
      console.error(e);
    }
  }, [selectedHistoryItem]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      {/* Premium Header */}
      {!hideHeader && (
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
             <div className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-[10px]">
                <LayoutGrid className="w-3 h-3" /> Dashboard Gestiune
             </div>
             <h1 className="text-4xl font-black tracking-tight text-slate-900">Magazia Centrală</h1>
             <p className="text-slate-500 font-bold max-w-md">Monitorizare în timp real a intrărilor, consumurilor și vânzărilor de produse.</p>
          </div>
          <div className="flex flex-wrap gap-3">
              <Button 
                 variant="outline" 
                 className="h-12 px-6 rounded-2xl font-black uppercase tracking-widest text-[10px] border-slate-200 hover:bg-white shadow-sm gap-2"
                 onClick={() => {
                   import("@/lib/reports").then(m => m.generateWarehouseReport(items, orgName));
                 }}
              >
                 <FileText className="w-4 h-4" /> Exportă
              </Button>

              {activeTab === 'inputs' ? (
                <>
                  <Button 
                    variant="outline"
                    className="h-12 px-6 rounded-2xl font-black uppercase tracking-widest text-[10px] border-emerald-200 text-emerald-700 hover:bg-emerald-50 shadow-sm gap-2"
                    onClick={() => {
                      setSellingItem(null);
                      setSaleData(prev => ({ ...prev, type: 'sale', quantity: 0 }));
                      setIsTransactionModalOpen(true);
                      setStagedTransactions([]);
                    }}
                  >
                    <DollarSign className="w-4 h-4" /> Vinde Marfă
                  </Button>
                  <Button 
                    variant="outline"
                    className="h-12 px-6 rounded-2xl font-black uppercase tracking-widest text-[10px] border-indigo-200 text-indigo-700 hover:bg-indigo-50 shadow-sm gap-2"
                    onClick={() => {
                      setSellingItem(null);
                      setSaleData(prev => ({ ...prev, type: 'return', quantity: 0 }));
                      setIsTransactionModalOpen(true);
                      setStagedTransactions([]);
                    }}
                  >
                    <ArrowUpRight className="w-4 h-4" /> Retur Furnizor
                  </Button>
                  <Button 
                    className="h-12 px-8 rounded-2xl font-black uppercase tracking-widest text-[10px] agral-gradient text-white shadow-lg shadow-primary/20 gap-2"
                    onClick={() => { setShowForm(true); setFormData(prev => ({ ...prev, category: 'chimic' })); }}
                  >
                    <Plus className="w-4 h-4" /> Intrare Marfă
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    variant="outline"
                    className="h-12 px-6 rounded-2xl font-black uppercase tracking-widest text-[10px] border-amber-200 text-amber-700 hover:bg-amber-50 shadow-sm gap-2"
                    onClick={() => {
                      setSellingItem(null);
                      setSaleData(prev => ({ ...prev, type: 'sale', quantity: 0 }));
                      setIsTransactionModalOpen(true);
                      setStagedTransactions([]);
                    }}
                  >
                    <Wheat className="w-4 h-4" /> Vinde Recoltă
                  </Button>
                  <Button 
                    className="h-12 px-8 rounded-2xl font-black uppercase tracking-widest text-[10px] bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-600/20 gap-2"
                    onClick={() => { setShowForm(true); setFormData(prev => ({ ...prev, category: 'recolta' })); }}
                  >
                    <Plus className="w-4 h-4" /> Adaugă Recoltă
                  </Button>
                </>
              )}
          </div>
        </div>
      )}

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-[32px] border-none shadow-sm bg-white overflow-hidden group">
          <CardContent className="p-8 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Valoare Inputuri</p>
              <p className="text-3xl font-black text-slate-900">{kpis.totalInputsValue.toLocaleString('ro-RO', { style: 'currency', currency: 'RON', maximumFractionDigits: 0 })}</p>
            </div>
            <div className="p-4 bg-primary/5 rounded-3xl group-hover:bg-primary/10 transition-colors">
              <TrendingUp className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[32px] border-none shadow-sm bg-white overflow-hidden group">
          <CardContent className="p-8 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Valoare Producție</p>
              <p className="text-3xl font-black text-amber-700">{kpis.totalHarvestsValue.toLocaleString('ro-RO', { style: 'currency', currency: 'RON', maximumFractionDigits: 0 })}</p>
            </div>
            <div className="p-4 bg-amber-50 rounded-3xl group-hover:bg-amber-100 transition-colors">
              <Wheat className="w-8 h-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[32px] border-none shadow-sm bg-white overflow-hidden group border-2 border-transparent hover:border-amber-200 transition-all">
          <CardContent className="p-8 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Stocuri Critice</p>
              <p className={cn("text-3xl font-black", kpis.lowStockCount > 0 ? "text-red-600" : "text-emerald-600")}>
                {kpis.lowStockCount} <span className="text-xs font-bold text-slate-400">Produse</span>
              </p>
            </div>
            <div className={cn("p-4 rounded-3xl transition-colors", kpis.lowStockCount > 0 ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600")}>
              {kpis.lowStockCount > 0 ? <AlertTriangle className="w-8 h-8" /> : <CheckCircle2 className="w-8 h-8" />}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs & Search */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit border shadow-inner">
            <button 
              className={cn("px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all", activeTab === 'inputs' ? "bg-white shadow-sm text-primary" : "text-slate-500 hover:text-slate-700")}
              onClick={() => setActiveTab('inputs')}
            >
              Inputuri Fermă
            </button>
            <button 
              className={cn("px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all", activeTab === 'harvests' ? "bg-white shadow-sm text-amber-700" : "text-slate-500 hover:text-slate-700")}
              onClick={() => setActiveTab('harvests')}
            >
              Magazie Cereale
            </button>
          </div>

          <div className="relative w-full md:w-80">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
             <Input 
                placeholder="Caută în magazie..." 
                className="h-12 pl-12 rounded-2xl border-slate-200 bg-white focus:ring-primary/20 font-bold"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
             />
          </div>
        </div>
        {showForm && (
            <Card className="rounded-[40px] border-none shadow-2xl bg-white overflow-hidden animate-in slide-in-from-top-8 duration-500 mb-12">
               <CardHeader className="p-10 bg-slate-50/50 border-b flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-black flex items-center gap-3">
                       <PlusCircle className="w-8 h-8 text-primary" />
                       {activeTab === "inputs" ? "Intrare Nouă Magazie" : "Înregistrare Recoltă Nouă"}
                    </CardTitle>
                    <p className="text-slate-500 font-bold mt-1 text-sm">Adaugă unul sau mai multe produse în stoc simultan.</p>
                  </div>
                  <Button variant="ghost" onClick={() => setShowForm(false)} className="rounded-full w-12 h-12 p-0 hover:bg-white hover:shadow-md">
                     <XCircle className="w-6 h-6 text-slate-300" />
                  </Button>
               </CardHeader>
               <CardContent className="p-10 space-y-10">
                  <form onSubmit={(e) => { e.preventDefault(); addToStaged(); }} className="space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                       <div className="md:col-span-2 space-y-2 relative">
                          <Label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Nume Produs *</Label>
                          <Input 
                            value={formData.name} 
                            required 
                            placeholder="ex: Adengo SC / Azotat / Motorină" 
                            className="h-14 font-black text-lg rounded-2xl" 
                            onChange={(e) => handleNameChange(e.target.value)}
                          />
                          {suggestions.length > 0 && (
                            <div className="absolute top-[84px] left-0 w-full bg-white border border-slate-200 rounded-2xl shadow-2xl z-20 py-2 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                              {suggestions.map((s, idx) => (
                                <button 
                                  key={idx} 
                                  type="button" 
                                  className="w-full text-left px-5 py-3 hover:bg-slate-50 transition-colors flex items-center justify-between border-b last:border-0"
                                  onClick={() => handleSelectSuggestion(s)}
                                >
                                  <div>
                                    <p className="font-black text-sm text-slate-900">{s.name}</p>
                                    <p className="text-[10px] uppercase text-slate-400 font-black">{categoryConfig[s.category]?.label || s.category}</p>
                                  </div>
                                  <Badge variant="outline" className="text-[10px] rounded-lg bg-slate-50 font-black">{s.unit}</Badge>
                                </button>
                              ))}
                            </div>
                          )}
                       </div>
                       <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Categorie</Label>
                          <select 
                            className="w-full h-14 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black focus:ring-primary/20 appearance-none"
                            value={formData.category}
                            onChange={(e) => {
                               const cat = e.target.value;
                               setFormData(prev => ({ 
                                 ...prev, 
                                 category: cat,
                                 supplierName: cat === 'recolta' ? "Producție Proprie" : prev.supplierName,
                                 tvaRate: cat === 'recolta' ? "0.09" : prev.tvaRate
                               }));
                             }}
                          >
                            {Object.entries(categoryConfig).map(([key, config]) => (
                              <option key={key} value={key}>{config.label}</option>
                            ))}
                          </select>
                       </div>
                    </div>

                    {/* Contextual Fields */}
                    {formData.category === 'recolta' ? (
                      <div className="space-y-10">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                           <div className="space-y-2">
                              <Label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Cantitate (Tone)</Label>
                              <Input 
                                type="number" step="0.001" required 
                                className="h-14 font-black text-xl rounded-2xl" 
                                value={formData.quantity}
                                onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value, unit: 'Tone' }))}
                              />
                           </div>
                           <div className="space-y-2">
                              <Label className="text-[10px] font-black uppercase text-amber-600 ml-1 tracking-widest">Umiditate (%)</Label>
                              <Input 
                                type="number" step="0.1" 
                                className="h-14 font-black rounded-2xl border-amber-200 bg-amber-50/30" 
                                placeholder="ex: 14.5"
                                value={formData.cropType} // reusing cropType or notes for now if no dedicated quality fields in state
                                onChange={(e) => setFormData(prev => ({ ...prev, cropType: e.target.value }))}
                              />
                           </div>
                           <div className="space-y-2">
                              <Label className="text-[10px] font-black uppercase text-amber-600 ml-1 tracking-widest">Impurități (%)</Label>
                              <Input 
                                type="number" step="0.1" 
                                className="h-14 font-black rounded-2xl border-amber-200 bg-amber-50/30" 
                                placeholder="ex: 2.0"
                                value={formData.notes} // reusing notes
                                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                              />
                           </div>
                           <div className="space-y-2">
                              <Label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Tip Cultură</Label>
                              <select 
                                className="w-full h-14 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black"
                                value={formData.unit} // reusing state as needed
                                onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                              >
                                 <option value="Tone">Tone</option>
                                 <option value="Kg">Kg</option>
                              </select>
                           </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                           <div className="space-y-2">
                              <Label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Proveniență / Parcela</Label>
                              <Input 
                                className="h-14 font-bold rounded-2xl" 
                                placeholder="ex: Parcela Nord / Siloz 1"
                                value={formData.supplierName}
                                onChange={(e) => setFormData(prev => ({ ...prev, supplierName: e.target.value }))}
                              />
                           </div>
                           <div className="space-y-2">
                              <Label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Preț Estimativ (Lei/Tonă)</Label>
                              <Input 
                                type="number" 
                                className="h-14 font-black text-xl rounded-2xl" 
                                value={formData.pricePerUnit}
                                onChange={(e) => setFormData(prev => ({ ...prev, pricePerUnit: e.target.value }))}
                              />
                           </div>
                           <div className="space-y-2">
                              <Label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Document Intrare</Label>
                              <Input 
                                className="h-14 font-bold rounded-2xl" 
                                placeholder="ex: NIR 2024-01"
                                value={formData.documentNumber}
                                onChange={(e) => setFormData(prev => ({ ...prev, documentNumber: e.target.value }))}
                              />
                           </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-10">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                            <div className="space-y-2">
                               <Label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Tip Ambalaj</Label>
                               <select 
                                 className="w-full h-14 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black focus:ring-primary/20"
                                 value={formData.packagingType}
                                 onChange={(e) => setFormData(prev => ({ ...prev, packagingType: e.target.value }))}
                               >
                                  <option value="Direct">Fără ambalaj (Vrac)</option>
                                  <option value="Bidon">Bidon</option>
                                  <option value="Sac">Sac</option>
                                  <option value="Flacon">Flacon / Sticlă</option>
                                  <option value="BigBag">Big-Bag</option>
                               </select>
                            </div>
                            <div className="space-y-2">
                               <Label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Unități / Capacitate</Label>
                               <div className="flex gap-2">
                                  <Input 
                                    type="number" placeholder="Nr"
                                    className="h-14 font-black text-center w-20 rounded-2xl" 
                                    value={formData.packagingQuantity}
                                    onChange={(e) => setFormData(prev => ({ ...prev, packagingQuantity: e.target.value }))}
                                  />
                                  <div className="flex items-center text-slate-300 font-black">×</div>
                                  <Input 
                                    type="number" placeholder="Mărime"
                                    className="h-14 font-black flex-1 rounded-2xl" 
                                    value={formData.bagWeight}
                                    onChange={(e) => setFormData(prev => ({ ...prev, bagWeight: e.target.value }))}
                                  />
                               </div>
                            </div>
                            <div className="space-y-2">
                               <Label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Cantitate Totală</Label>
                               <Input 
                                 type="number" step="0.01" required 
                                 className="h-14 font-black text-xl rounded-2xl bg-slate-50 border-dashed" 
                                 value={formData.packagingType !== "Direct" ? (Number(formData.packagingQuantity) * Number(formData.bagWeight)) || formData.quantity : formData.quantity}
                                 onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                               />
                            </div>
                            <div className="space-y-2">
                               <Label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">U.M.</Label>
                               <select 
                                 className="w-full h-14 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black focus:ring-primary/20"
                                 value={formData.unit}
                                 onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                               >
                                  <option value="L">Litri (L)</option>
                                  <option value="Kg">Kilograme (Kg)</option>
                                  <option value="Tone">Tone</option>
                                  <option value="Doze">Doze</option>
                                  <option value="Sac">Bucăți / Saci</option>
                               </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="space-y-2">
                               <Label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Număr Lot (Lot ID)</Label>
                               <Input 
                                 placeholder="ex: L2024-001" 
                                 className="h-14 font-black rounded-2xl" 
                                 value={formData.lotNumber}
                                 onChange={(e) => setFormData(prev => ({ ...prev, lotNumber: e.target.value }))}
                               />
                            </div>
                            <div className="space-y-2">
                               <Label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Dată Expirare</Label>
                               <Input 
                                 type="date" 
                                 className="h-14 font-bold rounded-2xl" 
                                 value={formData.expiryDate}
                                 onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
                               />
                            </div>
                            <div className="space-y-2">
                               <Label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Preț Unitar ({formData.isPriceInclTva ? "Brut" : "Net"})</Label>
                               <div className="flex gap-2">
                                 <Input 
                                   type="number" step="0.01" required 
                                   className="h-14 font-black text-xl rounded-2xl flex-1" 
                                   value={formData.pricePerUnit}
                                   onChange={(e) => setFormData(prev => ({ ...prev, pricePerUnit: e.target.value }))}
                                 />
                                 <div className="flex bg-slate-100 p-1.5 rounded-2xl border shrink-0">
                                    <button 
                                      type="button"
                                      className={cn("px-4 rounded-xl text-[10px] font-black uppercase transition-all", formData.isPriceInclTva ? "bg-white shadow-sm text-primary" : "text-slate-400")}
                                      onClick={() => setFormData(prev => ({ ...prev, isPriceInclTva: true }))}
                                    >Brut</button>
                                    <button 
                                      type="button"
                                      className={cn("px-4 rounded-xl text-[10px] font-black uppercase transition-all", !formData.isPriceInclTva ? "bg-white shadow-sm text-primary" : "text-slate-400")}
                                      onClick={() => setFormData(prev => ({ ...prev, isPriceInclTva: false }))}
                                    >Net</button>
                                 </div>
                               </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                           <div className="space-y-2 relative">
                               <Label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Furnizor</Label>
                               <Input 
                                 value={formData.supplierName} 
                                 placeholder="ex: Agricover / Alcedo"
                                 className="h-14 font-bold rounded-2xl" 
                                 onChange={(e) => handleSupplierChange(e.target.value)}
                               />
                               {supplierSuggestions.length > 0 && (
                                 <div className="absolute top-[84px] left-0 w-full bg-white border border-slate-200 rounded-2xl shadow-2xl z-20 py-2 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                   {supplierSuggestions.map((s, idx) => (
                                     <button 
                                       key={idx} 
                                       type="button" 
                                       className="w-full text-left px-5 py-3 hover:bg-slate-50 transition-colors font-bold text-sm border-b last:border-0"
                                       onClick={() => { setFormData(prev => ({ ...prev, supplierName: s })); setSupplierSuggestions([]); }}
                                     >
                                       {s}
                                     </button>
                                   ))}
                                 </div>
                               )}
                            </div>
                           <div className="space-y-2">
                              <Label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Document (NIR / Factură)</Label>
                              <Input 
                                className="h-14 font-bold rounded-2xl" 
                                placeholder="ex: FACT 1234"
                                value={formData.documentNumber}
                                onChange={(e) => setFormData(prev => ({ ...prev, documentNumber: e.target.value }))}
                              />
                           </div>
                           <div className="space-y-2">
                              <Label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Cota TVA</Label>
                              <select 
                                className="w-full h-14 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black"
                                value={formData.tvaRate}
                                onChange={(e) => setFormData(prev => ({ ...prev, tvaRate: e.target.value }))}
                              >
                                {TVA_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                              </select>
                           </div>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col md:flex-row justify-between gap-6 pt-6 border-t">
                       <Button 
                         type="button" 
                         variant="outline"
                         onClick={addToStaged}
                         className="h-14 px-12 rounded-2xl border-primary text-primary font-black uppercase tracking-widest text-[11px] hover:bg-primary/5 shadow-lg shadow-primary/5"
                       >
                          <Plus className="w-5 h-5 mr-2" />
                          Adaugă în listă
                       </Button>
                       
                       <Button 
                         type="button" 
                         disabled={isSubmitting || (stagedItems.length === 0 && !formData.name)} 
                         className="h-14 px-12 rounded-2xl agral-gradient text-white font-black uppercase tracking-widest text-[11px] shadow-xl shadow-primary/20"
                         onClick={() => handleSubmit()}
                       >
                          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5 mr-2" />}
                          {stagedItems.length > 1 ? `Finalizează ${stagedItems.length} intrări` : "Finalizează intrarea"}
                       </Button>
                    </div>
                 </form>

                 {stagedItems.length > 0 && (
                   <div className="mt-12 bg-slate-50 p-8 rounded-[32px] border-2 border-dashed border-slate-200 animate-in fade-in duration-500">
                     <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-6 flex items-center gap-2">
                       <LayoutGrid className="w-4 h-4" /> Produse pregătite pentru intrare ({stagedItems.length})
                     </h4>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                       {stagedItems.map(item => (
                         <div key={item.id} className="bg-white p-5 rounded-2xl border shadow-sm flex items-center justify-between group">
                           <div className="space-y-1">
                             <p className="font-black text-slate-900">{item.name}</p>
                             <p className="text-xs font-bold text-slate-400">
                               {item.quantity} {item.unit} @ {item.pricePerUnit} Lei
                             </p>
                           </div>
                           <Button 
                             variant="ghost" 
                             size="icon" 
                             onClick={() => removeFromStaged(item.id)}
                             className="text-slate-300 hover:text-destructive hover:bg-destructive/5 rounded-xl transition-all"
                           >
                             <Trash2 className="w-4 h-4" />
                           </Button>
                         </div>
                       ))}
                     </div>
                   </div>
                 )}
              </CardContent>
           </Card>
        )}

        {/* Data Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
           <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                    <thead>
                       <tr className="bg-slate-50/50 border-b">
                          <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Produs / Detalii</th>
                          <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Stoc Curent</th>
                          <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Preț Ref.</th>
                          <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Valoare Totală</th>
                          <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Acțiuni</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                       {filtered.map(item => {
                          const config = categoryConfig[item.category] || categoryConfig["chimic"];
                          const Icon = config.icon;
                          const isLow = item.minStockThreshold && Number(item.stockQuantity) < Number(item.minStockThreshold);

                          return (
                             <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                                <td className="p-6">
                                   <div className="flex items-center gap-4 cursor-pointer" onClick={() => handleViewHistory(item)}>
                                      <div className={cn("p-4 rounded-2xl transition-all group-hover:scale-110", config.bg, config.color)}>
                                         <Icon className="w-6 h-6" />
                                      </div>
                                      <div className="space-y-1">
                                         <p className="font-black text-slate-900 group-hover:text-primary transition-colors flex items-center gap-2">
                                            {item.name}
                                            <History className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                         </p>
                                         <p className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">{config.label}</p>
                                      </div>
                                   </div>
                                </td>
                                <td className="p-6 text-right">
                                   <div className="space-y-1">
                                      <p className={cn("text-lg font-black", isLow ? "text-red-600" : "text-slate-900")}>
                                         {Number(item.stockQuantity).toLocaleString()} <span className="text-[10px] font-normal text-slate-400 uppercase tracking-widest ml-1">{item.unit}</span>
                                      </p>
                                      {isLow && <p className="text-[9px] font-black text-red-500 uppercase tracking-tighter">Stoc Critic!</p>}
                                   </div>
                                </td>
                                <td className="p-6 text-right">
                                   <p className="font-black text-slate-500 text-sm">
                                      {Number(item.pricePerUnit).toFixed(2)} <span className="text-[9px] font-normal uppercase tracking-widest ml-1">RON</span>
                                   </p>
                                </td>
                                <td className="p-6 text-right">
                                   <div className="font-black text-slate-900 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100 inline-block">
                                      {(Number(item.stockQuantity) * Number(item.pricePerUnit)).toLocaleString('ro-RO', { minimumFractionDigits: 2 })}
                                   </div>
                                </td>
                                <td className="p-6">
                                   <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <div className="flex flex-col gap-1">
                                        <Button 
                                          variant="outline" 
                                          size="sm" 
                                          className="h-8 px-3 rounded-lg text-emerald-600 border-emerald-100 hover:bg-emerald-50 font-black uppercase text-[8px] tracking-widest gap-2"
                                          onClick={() => {
                                            setSellingItem(item);
                                            setSaleData({ 
                                              quantity: Number(item.stockQuantity), 
                                              price: Number(item.pricePerUnit) || 0, 
                                              isPriceInclTva: false, 
                                              tvaRate: item.category === 'recolta' ? 0.09 : 0.19, 
                                              buyer: "", 
                                              documentNumber: "",
                                              selectedLotId: "fifo",
                                              humidity: "",
                                              impurities: "",
                                              notes: "",
                                              type: "sale"
                                            });
                                          }}
                                        >
                                           <DollarSign className="w-3 h-3" /> Vinde
                                        </Button>
                                        {item.category !== 'recolta' && (
                                          <Button 
                                            variant="outline" 
                                            size="sm" 
                                            className="h-8 px-3 rounded-lg text-indigo-600 border-indigo-100 hover:bg-indigo-50 font-black uppercase text-[8px] tracking-widest gap-2"
                                            onClick={() => {
                                              setSellingItem(item);
                                              setSaleData({ 
                                                quantity: 0, 
                                                price: Number(item.pricePerUnit) || 0, 
                                                isPriceInclTva: false, 
                                                tvaRate: 0.19, 
                                                buyer: item.lastSupplier || "", 
                                                documentNumber: "",
                                                selectedLotId: "fifo",
                                                humidity: "",
                                                impurities: "",
                                                notes: "",
                                                type: "return"
                                              });
                                            }}
                                          >
                                             <ArrowUpRight className="w-3 h-3" /> Retur
                                          </Button>
                                        )}
                                      </div>
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-9 w-9 rounded-xl text-slate-400 hover:text-primary hover:bg-primary/5"
                                        onClick={() => handleViewHistory(item)}
                                      >
                                         <History className="w-4 h-4" />
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-9 w-9 rounded-xl text-slate-400 hover:text-destructive hover:bg-destructive/5"
                                        onClick={() => { if(confirm("Ștergi produsul?")) deleteInventoryItem(item.id).then(() => setItems(items.filter(i => i.id !== item.id))); }}
                                      >
                                         <Trash2 className="w-4 h-4" />
                                      </Button>
                                   </div>
                                </td>
                             </tr>
                          )
                       })}

                       {filtered.length === 0 && (
                          <tr>
                             <td colSpan={5} className="p-24 text-center">
                                <div className="max-w-xs mx-auto space-y-4">
                                   <div className="w-20 h-20 bg-slate-50 rounded-[32px] flex items-center justify-center mx-auto border-2 border-dashed">
                                      <PackageSearch className="w-10 h-10 text-slate-200" />
                                   </div>
                                   <div className="space-y-1">
                                      <p className="font-black text-slate-900">Magazie goală</p>
                                      <p className="text-xs text-slate-400 font-bold">Nu am găsit produse care să corespundă filtrului sau căutării tale.</p>
                                   </div>
                                </div>
                             </td>
                          </tr>
                       )}
                    </tbody>
                 </table>
              </div>
           </div>
      </div>
         </div>

      {/* Fișa Produsului Modal */}
      <ProductFileModal 
        isOpen={!!selectedHistoryItem}
        onClose={() => setSelectedHistoryItem(null)}
        item={selectedHistoryItem}
        history={historyData?.history || []}
        onRefresh={onRefreshHistory}
      />

      <Dialog open={isTransactionModalOpen} onOpenChange={(open) => setIsTransactionModalOpen(open)}>
           <DialogContent className="max-w-5xl p-0 border-none rounded-[40px] overflow-hidden shadow-2xl bg-white">
              <DialogHeader className="p-8 bg-slate-50/50 border-b flex flex-row items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className={cn("p-4 rounded-2xl", saleData.type === 'return' ? "bg-indigo-50 text-indigo-600" : "bg-emerald-50 text-emerald-600")}>
                       {saleData.type === 'return' ? <ArrowUpRight className="w-6 h-6" /> : <DollarSign className="w-6 h-6" />}
                    </div>
                    <div>
                       <DialogTitle className="text-2xl font-black">
                          {saleData.type === 'return' ? "Portal Retur Furnizori" : "Terminal Vânzări Magazie"}
                       </DialogTitle>
                       <p className="text-slate-500 font-bold text-sm">Adaugă unul sau mai multe produse în lista de tranzacție.</p>
                    </div>
                 </div>
                 <Button variant="ghost" onClick={() => setIsTransactionModalOpen(false)} className="rounded-full w-12 h-12">
                    <XCircle className="w-6 h-6 text-slate-300" />
                 </Button>
              </DialogHeader>

              <div className="p-10 space-y-10 max-h-[80vh] overflow-y-auto">
                 {/* Step 1: Search / Pick Product */}
                 <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">
                       {sellingItem ? "Produs Selectat" : "Pasul 1: Caută Produsul"}
                    </Label>
                    {!sellingItem ? (
                       <div className="relative">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                          <Input 
                            placeholder="Introduceți numele produsului..." 
                            className="h-16 pl-14 font-black text-lg rounded-2xl border-2 focus:border-primary/50 shadow-sm"
                            onChange={(e) => {
                               const val = e.target.value;
                               if (val.length > 1) {
                                  setSuggestions(items.filter(i => i.name.toLowerCase().includes(val.toLowerCase())));
                               } else setSuggestions([]);
                            }}
                          />
                          {suggestions.length > 0 && (
                             <div className="absolute top-[72px] left-0 w-full bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 py-2 animate-in fade-in slide-in-from-top-2">
                                {suggestions.map((s, idx) => (
                                   <button 
                                      key={idx} 
                                      className="w-full text-left px-6 py-4 hover:bg-slate-50 flex items-center justify-between border-b last:border-0"
                                      onClick={() => {
                                         setSellingItem(s);
                                         setSaleData(prev => ({ ...prev, price: Number(s.pricePerUnit) }));
                                         setSuggestions([]);
                                      }}
                                   >
                                      <div>
                                         <p className="font-black text-slate-900">{s.name}</p>
                                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{categoryConfig[s.category]?.label}</p>
                                      </div>
                                      <div className="text-right">
                                         <p className="font-black text-slate-900">{Number(s.stockQuantity).toLocaleString()} {s.unit}</p>
                                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Disponibil</p>
                                      </div>
                                   </button>
                                ))}
                             </div>
                          )}
                       </div>
                    ) : (
                       <div className="bg-slate-50 p-6 rounded-2xl border-2 border-primary/10 flex items-center justify-between group animate-in zoom-in-95 duration-200">
                          <div className="flex items-center gap-4">
                             <div className={cn("p-3 rounded-xl", categoryConfig[sellingItem.category]?.bg)}>
                                {(() => {
                                  const config = categoryConfig[sellingItem.category];
                                  if (!config) return null;
                                  const Icon = config.icon;
                                  return <Icon className="w-5 h-5" />;
                                })()}
                             </div>
                             <div>
                                <p className="font-black text-slate-900">{sellingItem.name}</p>
                                <p className="text-xs font-bold text-slate-400">Unitate: {sellingItem.unit} | Stoc: {Number(sellingItem.stockQuantity).toLocaleString()}</p>
                             </div>
                          </div>
                          <Button variant="ghost" onClick={() => setSellingItem(null)} className="text-slate-400 hover:text-destructive font-black uppercase text-[10px]">
                             Schimbă Produsul
                          </Button>
                       </div>
                    )}
                 </div>

                 {/* Step 2: Transaction Details */}
                 {sellingItem && (
                    <div className="space-y-8 animate-in slide-in-from-top-4 duration-300">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-6">
                             <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                   <Label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Cantitate</Label>
                                   <Input 
                                      type="number" 
                                      value={saleData.quantity} 
                                      onChange={e => setSaleData(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                                      className="h-14 font-black text-xl rounded-2xl"
                                   />
                                </div>
                                <div className="space-y-2">
                                   <Label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Preț Unitar</Label>
                                   <Input 
                                      type="number" 
                                      value={saleData.price} 
                                      onChange={e => setSaleData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                                      className="h-14 font-black text-xl rounded-2xl"
                                   />
                                </div>
                             </div>
                             <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Lot Sursă</Label>
                                <select 
                                  className="w-full h-14 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black"
                                  value={saleData.selectedLotId}
                                  onChange={e => setSaleData(prev => ({ ...prev, selectedLotId: e.target.value }))}
                                >
                                   <option value="fifo">FIFO (Cele mai vechi)</option>
                                   {sellingItem.lots?.map((l: any) => (
                                      <option key={l.id} value={l.id}>Lot {l.documentNumber || l.id.slice(0,6)} ({l.quantity} {sellingItem.unit})</option>
                                   ))}
                                </select>
                             </div>
                          </div>
                          <div className="space-y-6">
                             <div className="space-y-2 relative">
                                <Label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">
                                   {saleData.type === 'return' ? "Furnizor" : "Cumpărător / Client"}
                                </Label>
                                <Input 
                                  placeholder="Introduceți numele..." 
                                  className="h-14 font-bold rounded-2xl"
                                  value={saleData.buyer}
                                  onChange={e => handleBuyerChange(e.target.value)}
                                />
                                {buyerSuggestions.length > 0 && (
                                   <div className="absolute top-[84px] left-0 w-full bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 py-2">
                                      {buyerSuggestions.map((s, idx) => (
                                         <button key={idx} className="w-full text-left px-5 py-3 hover:bg-slate-50 font-bold text-sm" onClick={() => { setSaleData(prev => ({ ...prev, buyer: s })); setBuyerSuggestions([]); }}>{s}</button>
                                      ))}
                                   </div>
                                )}
                             </div>
                             <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Document (Factură / NIR)</Label>
                                <Input 
                                  placeholder="ex: F-1234" 
                                  className="h-14 font-bold rounded-2xl"
                                  value={saleData.documentNumber}
                                  onChange={e => setSaleData(prev => ({ ...prev, documentNumber: e.target.value }))}
                                />
                             </div>
                          </div>
                       </div>
                       <Button 
                         className="w-full h-14 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-widest text-[11px] shadow-xl hover:bg-slate-800"
                         onClick={addToStagedTransactions}
                       >
                          Adaugă în listă
                       </Button>
                    </div>
                 )}

                 {/* Step 3: Staged List */}
                 {stagedTransactions.length > 0 && (
                    <div className="space-y-6 pt-10 border-t">
                       <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Produse pregătite pentru tranzacție ({stagedTransactions.length})</h4>
                       <div className="space-y-4">
                          {stagedTransactions.map((trans, idx) => (
                             <div key={idx} className="bg-white p-5 rounded-2xl border flex items-center justify-between shadow-sm group">
                                <div className="flex items-center gap-4">
                                   <div className={cn("p-3 rounded-xl bg-slate-50", trans.type === 'return' ? "text-indigo-600" : "text-emerald-600")}>
                                      {trans.type === 'return' ? <ArrowUpRight className="w-4 h-4" /> : <DollarSign className="w-4 h-4" />}
                                   </div>
                                   <div>
                                      <p className="font-black text-slate-900">{trans.item.name}</p>
                                      <p className="text-xs font-bold text-slate-400">{trans.quantity} {trans.item.unit} × {trans.price} Lei</p>
                                   </div>
                                </div>
                                <div className="flex items-center gap-4">
                                   <div className="text-right">
                                      <p className="font-black text-slate-900">{(trans.quantity * trans.price).toLocaleString()} Lei</p>
                                      <p className="text-[10px] font-black text-slate-400 uppercase">{trans.buyer || "Fără Client"}</p>
                                   </div>
                                   <Button variant="ghost" size="icon" className="rounded-xl text-slate-300 hover:text-destructive" onClick={() => setStagedTransactions(prev => prev.filter((_, i) => i !== idx))}>
                                      <Trash2 className="w-4 h-4" />
                                   </Button>
                                </div>
                             </div>
                          ))}
                       </div>

                       <div className="bg-slate-900 p-8 rounded-[32px] flex items-center justify-between shadow-2xl mt-10">
                          <div>
                             <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Total Tranzacție</p>
                             <p className="text-4xl font-black text-emerald-400">
                                {stagedTransactions.reduce((sum, t) => sum + (t.quantity * t.price), 0).toLocaleString()} <span className="text-xl">Lei</span>
                             </p>
                          </div>
                          <Button 
                            className="h-14 px-12 rounded-2xl agral-gradient text-white font-black uppercase tracking-widest text-[11px] shadow-xl"
                            disabled={isSelling}
                            onClick={handleBulkSell}
                          >
                             {isSelling ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5 mr-2" />}
                             Finalizează tot
                          </Button>
                       </div>
                    </div>
                 )}
              </div>
           </DialogContent>
        </Dialog>
    </div>
  );
}
