"use client";

import { useRouter } from "next/navigation";
import { cn, formatDate } from "@/lib/utils";
import toast from "react-hot-toast";
import { useState } from "react";
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
  Printer
} from "lucide-react";
import { 
  createInventoryItem, 
  updateInventoryStock, 
  getProductSuggestions, 
  getInventoryItemHistory,
  deleteInventoryItem
} from "@/lib/actions/inventory";
import { sellCrop, getSaleDetails } from "@/lib/actions/finance";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";

const categoryConfig: Record<string, { icon: any, color: string, label: string }> = {
  chimic: { icon: FlaskConical, color: "text-purple-600 bg-purple-100", label: "Erbicid/Tratament" },
  ingrasamant: { icon: Droplets, color: "text-blue-600 bg-blue-100", label: "Îngrășământ" },
  samanta: { icon: Wheat, color: "text-green-600 bg-green-100", label: "Sămânță" },
  combustibil: { icon: Fuel, color: "text-amber-600 bg-amber-100", label: "Motorină/Combustibil" },
  recolta: { icon: Wheat, color: "text-amber-700 bg-amber-50", label: "Recoltă Fermă" },
};

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
  const [activeTab, setActiveTab] = useState<"purchased" | "produced">("purchased");
  
  // Suggestions State
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    category: "chimic",
    unit: "L",
    quantity: "",
    pricePerUnit: "",
    bagWeight: "", // Greutatea sacului
    pricePerBag: "", // Prețul pe sac
    notes: "",
    cropType: "",
    minStockThreshold: ""
  });
  
  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editVal, setEditVal] = useState<string>("");

  // Sale Modal State
  const [sellingItem, setSellingItem] = useState<any | null>(null);
  const [isSelling, setIsSelling] = useState(false);
  const [saleData, setSaleData] = useState({ quantity: 0, price: 0, buyer: "" });

  // History State
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<any | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyData, setHistoryData] = useState<any | null>(null);
  
  // Document State
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [docLoading, setDocLoading] = useState(false);
  const [docType, setDocType] = useState<"sale" | "intake">("sale");

  const totalValue = items.reduce((sum, item) => sum + (Number(item.stockQuantity) * Number(item.pricePerUnit)), 0);

  const filtered = items.filter(i => {
    const matchesSearch = i.name.toLowerCase().includes(search.toLowerCase());
    const isProduced = i.category === "recolta" || i.source === "harvest";
    
    if (activeTab === "produced") return isProduced && matchesSearch;
    return !isProduced && matchesSearch;
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const fData = new FormData();
      Object.entries(formData).forEach(([k, v]) => fData.append(k, v));
      
      const newItem = await createInventoryItem(fData);
      setItems(prev => {
        const exists = prev.find(i => i.id === newItem.id);
        if (exists) return prev.map(i => i.id === newItem.id ? newItem : i);
        return [...prev, newItem].sort((a,b) => a.name.localeCompare(b.name));
      });
      setShowForm(false);
      setFormData({ 
        name: "", 
        category: "chimic", 
        unit: "L", 
        quantity: "", 
        pricePerUnit: "", 
        bagWeight: "", 
        pricePerBag: "", 
        notes: "",
        cropType: "",
        minStockThreshold: ""
      });
    } catch (e) {
      console.error(e);
      alert("Eroare la adăugarea în stoc.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleQuickUpdate(id: string) {
    if (!editVal || isNaN(Number(editVal))) return;
    
    const qty = Number(editVal);
    try {
      await updateInventoryStock(id, qty);
      setItems(prev => prev.map(i => i.id === id ? { ...i, stockQuantity: qty } : i));
      setEditingId(null);
    } catch (e) {
      alert("Eroare la actualizarea stocului");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Sigur vrei să ștergi acest produs din stoc? Această acțiune este ireversibilă.")) return;
    try {
      await deleteInventoryItem(id);
      setItems(prev => prev.filter(i => i.id !== id));
    } catch (e) {
      alert("Eroare la ștergerea produsului");
    }
  }

  async function handleSell() {
    if (!sellingItem || saleData.quantity <= 0 || saleData.price <= 0) return;
    
    setIsSelling(true);
    try {
      await sellCrop({
        inventoryItemId: sellingItem.id,
        quantity: saleData.quantity,
        pricePerUnit: saleData.price,
        buyer: saleData.buyer
      });
      
      setItems(prev => prev.map(i => i.id === sellingItem.id ? { ...i, stockQuantity: Number(i.stockQuantity) - saleData.quantity } : i));
      setSellingItem(null);
      setSaleData({ quantity: 0, price: 0, buyer: "" });
    } catch (e: any) {
      alert(e.message || "Eroare la vânzare");
    } finally {
      setIsSelling(false);
    }
  }

  async function handleViewHistory(item: any) {
    setSelectedHistoryItem(item);
    setHistoryLoading(true);
    setHistoryData(null);
    try {
      const data = await getInventoryItemHistory(item.id);
      setHistoryData(data);
    } catch (e) {
      alert("Eroare la încărcarea istoricului");
    } finally {
      setHistoryLoading(false);
    }
  }

  async function handleViewDocument(referenceId: string, type: string) {
    if (!referenceId) return;
    setDocLoading(true);
    setDocType(type === 'sale' ? 'sale' : 'intake');
    try {
      if (type === 'sale') {
        const data = await getSaleDetails(referenceId);
        setSelectedDoc(data);
      } else {
        setSelectedDoc({ id: referenceId, type: 'intake' });
      }
    } catch (e) {
      alert("Eroare la încărcarea documentului");
    } finally {
      setDocLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      {!hideHeader ? (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-foreground flex items-center gap-2">
              <PackageSearch className="w-7 h-7 text-primary" />
              Magazia Fermei
            </h2>
            <p className="text-muted-foreground mt-1">Gestionează input-urile agricole, cantitățile și prețurile de achiziție.</p>
          </div>
          <div className="flex gap-2">
            {activeTab === 'purchased' ? (
              <Button
                variant="outline"
                className="border-primary/20 text-primary font-semibold gap-2"
                onClick={() => {
                  const warehouseItems = items.filter(i => i.category !== "recolta" && i.source !== "harvest");
                  import("@/lib/reports").then(m => m.generateWarehouseReport(warehouseItems, orgName));
                }}
              >
                <FileText className="w-4 h-4" /> Exportă Fișă Magazie (PDF)
              </Button>
            ) : (
              <Button
                variant="outline"
                className="border-primary/20 text-primary font-semibold gap-2"
                onClick={() => {
                  const harvestItems = items.filter(i => i.category === "recolta" || i.source === "harvest");
                  import("@/lib/reports").then(m => m.generateHarvestReport(harvestItems, orgName));
                }}
              >
                <Wheat className="w-4 h-4" /> Exportă Stoc Recoltă (PDF)
              </Button>
            )}
            <Button
              className="agral-gradient text-white font-semibold gap-2"
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? "Anulează" : <><Plus className="w-4 h-4" /> Adaugă în Stoc</>}
            </Button>
          </div>
        </div>
      ) : (
        /* Versiune Minimalistă (pt când hideHeader e true) */
        <div className="flex justify-end gap-2">
          {activeTab === 'purchased' ? (
            <Button
              variant="outline"
              className="border-primary/20 text-primary font-semibold gap-2"
              onClick={() => {
                const warehouseItems = items.filter(i => i.category !== "recolta" && i.source !== "harvest");
                import("@/lib/reports").then(m => m.generateWarehouseReport(warehouseItems, orgName));
              }}
            >
              <FileText className="w-4 h-4" /> Exportă Fișă Magazie (PDF)
            </Button>
          ) : (
            <Button
              variant="outline"
              className="border-primary/20 text-primary font-semibold gap-2"
              onClick={() => {
                const harvestItems = items.filter(i => i.category === "recolta" || i.source === "harvest");
                import("@/lib/reports").then(m => m.generateHarvestReport(harvestItems, orgName));
              }}
            >
              <Wheat className="w-4 h-4" /> Exportă Stoc Recoltă (PDF)
            </Button>
          )}
          <Button
            className="agral-gradient text-white font-semibold gap-2"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? "Anulează" : <><Plus className="w-4 h-4" /> Adaugă în Stoc</>}
          </Button>
        </div>
      )}

      {/* KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-card border rounded-xl flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground font-medium mb-1">Valoare Totală Stocuri</p>
            <p className="text-2xl font-bold text-foreground">{totalValue.toLocaleString('ro-RO', { style: 'currency', currency: 'RON' })}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="font-bold text-primary text-lg">€</span>
          </div>
        </div>
      </div>

      {/* Taburi */}
      <div className="flex border-b border-border mb-4">
        <button 
          className={`px-6 py-3 font-bold text-sm transition-all border-b-2 ${activeTab === 'purchased' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
          onClick={() => setActiveTab('purchased')}
        >
          Intrări Achiziționate
        </button>
        <button 
          className={`px-6 py-3 font-bold text-sm transition-all border-b-2 ${activeTab === 'produced' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
          onClick={() => setActiveTab('produced')}
        >
          Producție Fermă
        </button>
      </div>

      {/* Adaugare Form */}
      {showForm && (
        <Card className="border-2 border-primary/20 animate-in slide-in-from-top-4 duration-300">
          <CardContent className="p-6">
            <h3 className="font-bold text-lg mb-4">Intrare nouă în magazie</h3>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1.5 md:col-span-2 relative">
                  <Label htmlFor="name">Denumire Produs *</Label>
                  <Input 
                    id="name" 
                    value={formData.name} 
                    required 
                    placeholder="ex: Adengo 465 SC / Uree / Motorină" 
                    className="h-11" 
                    onChange={(e) => handleNameChange(e.target.value)}
                  />
                  {suggestions.length > 0 && (
                    <div className="absolute top-20 left-0 w-full bg-white border rounded-xl shadow-xl z-20 py-2 divide-y">
                      {suggestions.map((s, idx) => (
                        <button 
                          key={idx} 
                          type="button" 
                          className="w-full text-left px-4 py-2 hover:bg-muted/50 transition-colors flex items-center justify-between"
                          onClick={() => handleSelectSuggestion(s)}
                        >
                          <div>
                            <p className="font-bold text-sm">{s.name}</p>
                            <p className="text-[10px] uppercase text-muted-foreground">{categoryConfig[s.category]?.label || s.category}</p>
                          </div>
                          <Badge variant="outline" className="text-[10px]">{s.unit}</Badge>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="category">Categorie</Label>
                  <select 
                    id="category" 
                    className="w-full h-11 rounded-lg border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-primary/20"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value, cropType: "" }))}
                  >
                    {Object.entries(categoryConfig).map(([key, config]) => (
                      <option key={key} value={key}>{config.label}</option>
                    ))}
                  </select>
                </div>

                {(formData.category === 'samanta' || formData.category === 'recolta') && (
                  <div className="space-y-1.5 animate-in fade-in zoom-in duration-200">
                    <Label htmlFor="cropType">Cultură Specifică</Label>
                    <select 
                      id="cropType" 
                      className="w-full h-11 rounded-lg border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-primary/20"
                      value={formData.cropType}
                      onChange={(e) => setFormData(prev => ({ ...prev, cropType: e.target.value }))}
                    >
                      <option value="">Alege cultura...</option>
                      <option value="Grâu">Grâu</option>
                      <option value="Porumb">Porumb</option>
                      <option value="Floarea Soarelui">Floarea Soarelui</option>
                      <option value="Rapiță">Rapiță</option>
                      <option value="Orz">Orz</option>
                      <option value="Soia">Soia</option>
                    </select>
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="unit">Unitate de măsură</Label>
                  <select 
                    id="unit" 
                    className="w-full h-11 rounded-lg border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-primary/20"
                    value={formData.unit}
                    onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                  >
                    <option value="L">Litri (L)</option>
                    <option value="Kg">Kilograme (Kg)</option>
                    <option value="Tone">Tone</option>
                    <option value="Doze">Doze</option>
                    <option value="Sac">Sac</option>
                  </select>
                </div>

                {formData.unit === "Sac" ? (
                  <>
                    <div className="space-y-1.5 md:col-span-1">
                      <Label htmlFor="bagWeight">Greutate Sac (Kg) *</Label>
                      <Input 
                        id="bagWeight" 
                        type="number" step="0.1" 
                        required 
                        placeholder="ex: 25" 
                        className="h-11" 
                        value={formData.bagWeight}
                        onChange={(e) => setFormData(prev => {
                          const weight = parseFloat(e.target.value) || 0;
                          const pricePerBag = parseFloat(prev.pricePerBag) || 0;
                          const pricePerKg = weight > 0 ? (pricePerBag / weight) : 0;
                          return { ...prev, bagWeight: e.target.value, pricePerUnit: pricePerKg > 0 ? pricePerKg.toFixed(2) : "" };
                        })}
                      />
                    </div>
                    <div className="space-y-1.5 md:col-span-1">
                      <Label htmlFor="quantity">Număr Saci *</Label>
                      <Input 
                        id="quantity" 
                        type="number" step="1" 
                        required 
                        placeholder="0" 
                        className="h-11" 
                        value={formData.quantity}
                        onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <Label htmlFor="pricePerBag">Preț per Sac (RON) *</Label>
                      <Input 
                        id="pricePerBag" 
                        type="number" step="0.01" 
                        required 
                        placeholder="Ex: 500" 
                        className="h-11" 
                        value={formData.pricePerBag}
                        onChange={(e) => setFormData(prev => {
                          const pricePerBag = parseFloat(e.target.value) || 0;
                          const weight = parseFloat(prev.bagWeight) || 0;
                          const pricePerKg = weight > 0 ? (pricePerBag / weight) : 0;
                          return { ...prev, pricePerBag: e.target.value, pricePerUnit: pricePerKg > 0 ? pricePerKg.toFixed(2) : "" };
                        })}
                      />
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Rezultă {parseFloat(formData.bagWeight || "0") * parseFloat(formData.quantity || "0")} Kg în total la <strong>{formData.pricePerUnit} RON/Kg</strong>
                      </p>
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <Label htmlFor="minStockThreshold" className="text-primary font-bold">Prag Minim Stoc (Alertă - Kg)</Label>
                      <Input 
                        id="minStockThreshold" 
                        type="number" step="0.1" 
                        placeholder="ex: 100" 
                        className="h-11 border-primary/20 focus:ring-primary/30" 
                        value={formData.minStockThreshold}
                        onChange={(e) => setFormData(prev => ({ ...prev, minStockThreshold: e.target.value }))}
                      />
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Vei fi notificat când stocul total (în Kg) scade sub acest prag.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-1.5 md:col-span-2">
                      <Label htmlFor="quantity">Cantitate Achiziționată *</Label>
                      <Input 
                        id="quantity" 
                        type="number" step="0.01" 
                        required 
                        placeholder="0.00" 
                        className="h-11" 
                        value={formData.quantity}
                        onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <Label htmlFor="pricePerUnit">Preț per Unitate (RON) *</Label>
                      <Input 
                        id="pricePerUnit" 
                        type="number" step="0.01" 
                        required 
                        placeholder="ex: 6.50 pentru Motorină" 
                        className="h-11" 
                        value={formData.pricePerUnit}
                        onChange={(e) => setFormData(prev => ({ ...prev, pricePerUnit: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <Label htmlFor="minStockThreshold" className="text-primary font-bold">Prag Minim Stoc (Alertă)</Label>
                      <Input 
                        id="minStockThreshold" 
                        type="number" step="0.1" 
                        placeholder="ex: 100" 
                        className="h-11 border-primary/20 focus:ring-primary/30" 
                        value={formData.minStockThreshold}
                        onChange={(e) => setFormData(prev => ({ ...prev, minStockThreshold: e.target.value }))}
                      />
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Sistemul te va notifica automat când cantitatea scade sub acest prag.
                      </p>
                    </div>
                  </>
                )}
              </div>
              <div className="flex gap-3 mt-6">
                <Button type="submit" disabled={isSubmitting} className="agral-gradient text-white font-semibold flex-1 md:flex-none md:w-48">
                  {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Salvează în Stoc
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Căutare */}
      <div className="relative max-w-md mt-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Caută input-uri agricole..." className="pl-9 h-11" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Tabela de Stocuri */}
      <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] md:text-xs font-semibold">
              <tr>
                <th className="px-3 md:px-5 py-3 md:py-4">Produs</th>
                <th className="px-3 md:px-5 py-3 md:py-4 hidden md:table-cell">Categorie</th>
                <th className="px-3 md:px-5 py-3 md:py-4 text-right hidden lg:table-cell">Preț Unitar</th>
                <th className="px-3 md:px-5 py-3 md:py-4 text-right">Stoc</th>
                <th className="px-3 md:px-5 py-3 md:py-4 text-right hidden sm:table-cell">Valoare</th>
                <th className="px-3 md:px-5 py-3 md:py-4 text-center">Acțiuni</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map(item => {
                const conf = categoryConfig[item.category] || categoryConfig["chimic"];
                const Icon = conf.icon;
                const totalLei = Number(item.stockQuantity) * Number(item.pricePerUnit);

                return (
                  <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-3 md:px-5 py-4 font-medium text-foreground">
                      <div 
                        className="flex items-center gap-2 md:gap-3 cursor-pointer hover:text-primary transition-colors group"
                        onClick={() => handleViewHistory(item)}
                      >
                        <div className={`p-1.5 md:p-2 rounded-lg ${conf.color} shrink-0`}>
                          <Icon className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="flex items-center gap-1.5 font-bold text-xs md:text-sm truncate">
                            {item.name}
                            <History className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-primary hidden md:block" />
                          </span>
                          <span className="text-[9px] md:text-[10px] uppercase text-muted-foreground truncate">{conf.label}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 md:px-5 py-4 hidden md:table-cell">
                      <Badge variant="outline" className="font-normal text-[10px]">{item.unit}</Badge>
                    </td>
                    <td className="px-3 md:px-5 py-4 text-right text-muted-foreground hidden lg:table-cell text-xs">
                      {Number(item.pricePerUnit).toFixed(2)} Lei / {item.unit}
                    </td>
                    <td className="px-3 md:px-5 py-4 text-right">
                      {editingId === item.id ? (
                        <div className="flex items-center justify-end gap-1 md:gap-2">
                          <Input 
                            type="number" step="0.1" 
                            className="h-7 md:h-8 w-16 md:w-24 text-right px-1 md:px-2 text-xs" 
                            value={editVal} 
                            onChange={(e) => setEditVal(e.target.value)} 
                            autoFocus
                          />
                          <Button size="xs" onClick={() => handleQuickUpdate(item.id)} className="h-7 md:h-8 px-2 text-[10px]">Ok</Button>
                        </div>
                      ) : (
                        <div className="font-bold text-foreground text-xs md:text-sm">
                          {Number(item.stockQuantity).toLocaleString('ro-RO')} <span className="text-[10px] font-normal text-muted-foreground">{item.unit}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-3 md:px-5 py-4 text-right font-bold text-xs md:text-sm hidden sm:table-cell">
                      {totalLei.toLocaleString('ro-RO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </td>
                    <td className="px-5 py-4 text-right w-24">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => {
                            setSellingItem(item);
                            setSaleData({ quantity: Number(item.stockQuantity), price: Number(item.pricePerUnit) || 0, buyer: "" });
                          }}
                          title="Vinde din stoc"
                        >
                          <DollarSign className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-primary"
                          onClick={() => {
                            setEditingId(item.id);
                            setEditVal(item.stockQuantity.toString());
                          }}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDelete(item.id)}
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
                  <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">
                    Nu s-au găsit produse în magazie.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Modal Vânzare */}
      {sellingItem && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-in zoom-in-95 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md shadow-2xl border-none">
            <CardHeader className="bg-muted/20 border-b">
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                Vânzare: {sellingItem.name}
              </CardTitle>
              <CardDescription>Înregistrează o vânzare din stocul de {sellingItem.category === 'recolta' ? 'recoltă' : 'magazie'}.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold text-muted-foreground">Cantitate ({sellingItem.unit})</Label>
                <Input 
                  type="number" 
                  value={saleData.quantity} 
                  onChange={e => setSaleData(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))} 
                  className="font-bold h-12 text-lg"
                  max={Number(sellingItem.stockQuantity)}
                />
                <p className="text-[10px] text-muted-foreground italic">Disponibil: {Number(sellingItem.stockQuantity).toLocaleString()} {sellingItem.unit}</p>
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold text-muted-foreground">Preț per {sellingItem.unit} (RON)</Label>
                <Input 
                  type="number" 
                  value={saleData.price} 
                  onChange={e => setSaleData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))} 
                  className="font-bold h-12 text-lg text-green-600"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold text-muted-foreground">Cumpărător (Opțional)</Label>
                <Input 
                  value={saleData.buyer} 
                  onChange={e => setSaleData(prev => ({ ...prev, buyer: e.target.value }))} 
                  placeholder="ex: Siloz Roman / Client"
                />
              </div>

              <div className="bg-green-50 p-4 rounded-xl border border-green-100 flex justify-between items-center">
                <span className="text-xs font-bold text-green-800 uppercase">Total de încasat:</span>
                <span className="text-xl font-black text-green-700">{(saleData.quantity * saleData.price).toLocaleString()} RON</span>
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="ghost" className="flex-1 font-bold" onClick={() => setSellingItem(null)} disabled={isSelling}>Anulare</Button>
                <Button className="flex-1 agral-gradient text-white font-bold" disabled={isSelling} onClick={handleSell}>
                  {isSelling ? <Loader2 className="w-4 h-4 animate-spin"/> : <ArrowUpRight className="w-4 h-4"/>}
                  Confirmă Vânzarea
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal Istoric Produs */}
      <Dialog open={!!selectedHistoryItem} onOpenChange={(open: boolean) => { if(!open) setSelectedHistoryItem(null); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <History className="w-6 h-6 text-primary" />
              Istoric: {selectedHistoryItem?.name}
            </DialogTitle>
            <DialogDescription>
              Urmărește intrările, ieșirile și loturile disponibile pentru acest produs.
            </DialogDescription>
          </DialogHeader>

          {historyLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Se încarcă datele...</p>
            </div>
          ) : historyData && (
            <div className="space-y-6 pt-4">
              {/* Explicație Loturi */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 text-blue-800">
                <div className="p-2 bg-blue-100 rounded-lg h-fit">
                  <PackageSearch className="w-4 h-4" />
                </div>
                <div className="text-xs leading-relaxed">
                  <p className="font-bold mb-1">Sistemul de Loturi (FIFO)</p>
                  Sistemul salvează produsele în "loturi" separate pe baza datei de achiziție. La consum, se folosește automat marfa din cel mai vechi lot disponibil (**FIFO** - First In, First Out). Acest lucru asigură un calcul precis al costurilor pe baza prețului real de cumpărare.
                </div>
              </div>

              {/* Loturi Active */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground px-1">Loturi în Stoc (FIFO)</h4>
                <div className="grid gap-3">
                  {historyData.lots.filter((l: any) => Number(l.quantity) > 0).map((lot: any, idx: number) => {
                    const isNextToConsume = idx === 0;

                    return (
                      <div key={lot.id} className="bg-muted/30 border rounded-xl p-4 flex justify-between items-center transition-all hover:border-primary/30">
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-lg ${isNextToConsume ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                            <span className="font-black text-[10px]">LOT {lot.id.substring(0,4).toUpperCase()}</span>
                          </div>
                          <div>
                            <p className="font-bold text-sm">
                              {Number(lot.quantity).toLocaleString()} {historyData.unit} rămase
                              <span className="text-muted-foreground font-normal text-xs ml-2">din {Number(lot.initialQuantity).toLocaleString()}</span>
                            </p>
                            <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-0.5">
                              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(lot.purchaseDate)}</span>
                              <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> {Number(lot.pricePerUnit).toFixed(2)} Lei/{historyData.unit}</span>
                            </div>
                          </div>
                        </div>
                        <Badge className={`border-none ${isNextToConsume ? 'bg-amber-100 text-amber-700' : 'bg-muted text-muted-foreground'}`}>
                          {isNextToConsume ? "Urmează la consum" : "În așteptare"}
                        </Badge>
                      </div>
                    );
                  })}
                  {historyData.lots.filter((l: any) => Number(l.quantity) > 0).length === 0 && (
                    <div className="text-center py-4 bg-muted/20 border-2 border-dashed rounded-xl text-sm text-muted-foreground">
                      Niciun lot activ în stoc.
                    </div>
                  )}
                </div>
              </div>

              {/* Toate Tranzacțiile */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground px-1">Toate Tranzacțiile</h4>
                <div className="border rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/50 text-muted-foreground uppercase font-semibold">
                      <tr>
                        <th className="px-4 py-3">Data</th>
                        <th className="px-4 py-3">Tip</th>
                        <th className="px-4 py-3">Descriere</th>
                        <th className="px-4 py-3 text-right">Cantitate</th>
                        <th className="px-4 py-3 text-center">Doc</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {historyData.lots.flatMap((l: any) => l.transactions).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((t: any) => (
                        <tr key={t.id} className="hover:bg-muted/10 transition-colors">
                          <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{formatDate(t.date)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {t.type === 'intake' ? <ArrowDownCircle className="w-3.5 h-3.5 text-green-600" /> : <ArrowUpCircle className="w-3.5 h-3.5 text-amber-600" />}
                              <span className="capitalize">{t.type === 'intake' ? 'Intrare' : t.type === 'consumption' ? 'Consum' : 'Vânzare'}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-medium">{t.description || "-"}</td>
                          <td className={`px-4 py-3 text-right font-bold ${t.type === 'intake' ? 'text-green-600' : 'text-amber-600'}`}>
                            {t.type === 'intake' ? '+' : '-'}{Number(t.quantity).toLocaleString()} {historyData.unit}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {t.referenceId && (
                              <Button 
                                variant="ghost" size="icon" className="h-6 w-6 text-primary"
                                onClick={() => handleViewDocument(t.referenceId, t.type)}
                              >
                                <FileText className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
