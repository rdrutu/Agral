"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Tractor,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Calendar,
  FlaskConical,
  Trash2,
  FileText,
  Calculator,
  Loader2
} from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { createOperation, updateResourceConsumed, deleteOperation, updateOperation } from "@/lib/actions/operations";
import { Edit } from "lucide-react";

const MapSelector = dynamic(() => import("@/components/operatiuni/MultiParcelMapSelector"), { 
  ssr: false,
  loading: () => <div className="h-[400px] bg-muted/20 animate-pulse rounded-xl flex items-center justify-center text-muted-foreground">Se încarcă harta parcelelor...</div>
});

const opStatusColors: Record<string, string> = {
  planned: "bg-blue-100 text-blue-700 border-blue-200",
  in_progress: "bg-amber-100 text-amber-700 border-amber-200",
  completed: "bg-green-100 text-green-700 border-green-200",
};

const resourceTypes = [
  { value: "combustibil", label: "Combustibil (Motorină)" },
  { value: "chimic", label: "Erbicid/Fungicid" },
  { value: "ingrasamant", label: "Îngrășământ" },
  { value: "samanta", label: "Sămânță" },
];

const OP_TEMPLATES = [
  { id: "semanat", label: "Semănat", defaultInput: "samanta", allowedCategories: ["samanta", "ingrasamant"] },
  { id: "erbicidat", label: "Erbicidat", defaultInput: "chimic", allowedCategories: ["chimic", "ingrasamant", "adjuvant"] },
  { id: "recoltat", label: "Recoltat", defaultInput: "combustibil", allowedCategories: ["combustibil"] },
  { id: "aratura", label: "Arătură / Pregătire sol", defaultInput: "combustibil", allowedCategories: ["combustibil", "ingrasamant"] },
  { id: "tratament", label: "Tratament Foliar / Fungicid", defaultInput: "chimic", allowedCategories: ["chimic", "adjuvant", "ingrasamant"] },
];

const CROPS = ["Grâu", "Porumb", "Floarea Soarelui", "Rapiță", "Orz", "Soia", "Toate"];

export default function OperationsClient({ initialOperations, parcels, inventory = [] }: { initialOperations: any[], parcels: any[], inventory?: any[] }) {
  const [ops, setOps] = useState(initialOperations);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingRes, setEditingRes] = useState<{ id: string, val: string } | null>(null);
  const [editingOpId, setEditingOpId] = useState<string | null>(null);

  // Form State
  const [opTemplate, setOpTemplate] = useState("semanat");
  const [opCrop, setOpCrop] = useState("Toate");
  const [name, setName] = useState("Semănat");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");

  const [selectedParcels, setSelectedParcels] = useState<{ id: string; name: string; maxHa: number; usedHa: number }[]>([]);
  const [resources, setResources] = useState<{ id: number; inventoryItemId?: string; name: string; type: string; quantityPerHa: number; unit: string; pricePerUnit: number }[]>([]);

  // Compute live totals
  const totalArea = selectedParcels.reduce((sum, p) => sum + p.usedHa, 0);
  
  const grandTotalCost = resources.reduce((sum, r) => {
    return sum + (totalArea * r.quantityPerHa * r.pricePerUnit);
  }, 0);

  const filteredOps = ops.filter(op => op.name.toLowerCase().includes(search.toLowerCase()));

  // Filtrare Inteligentă Parcele în funcție de Cultură
  const visibleParcels = opCrop === "Toate" ? parcels : parcels.filter(p => {
    const pCrop = p.cropPlans?.[0]?.cropType?.toLowerCase();
    return pCrop === opCrop.toLowerCase();
  });

  // Handlers
  const toggleParcel = (p: any) => {
    const exists = selectedParcels.find(x => x.id === p.id);
    if (exists) {
      setSelectedParcels(prev => prev.filter(x => x.id !== p.id));
    } else {
      setSelectedParcels(prev => [...prev, { id: p.id, name: p.name, maxHa: Number(p.areaHa), usedHa: Number(p.areaHa) }]);
    }
  };

  const updateParcelArea = (id: string, val: string) => {
    const num = parseFloat(val) || 0;
    setSelectedParcels(prev => prev.map(x => x.id === id ? { ...x, usedHa: num } : x));
  };

  const addResource = () => {
    const template = OP_TEMPLATES.find(t => t.id === opTemplate);
    setResources(prev => [...prev, { id: Date.now(), name: "", type: template?.defaultInput || "chimic", quantityPerHa: 0, unit: "L", pricePerUnit: 0 }]);
  };

  const handleTemplateChange = (val: string) => {
    setOpTemplate(val);
    const tmplName = OP_TEMPLATES.find(t => t.id === val)?.label || "";
    setName(opCrop === "Toate" ? tmplName : `${tmplName} - ${opCrop}`);
  };

  const handleCropChange = (val: string) => {
    setOpCrop(val);
    const tmplName = OP_TEMPLATES.find(t => t.id === opTemplate)?.label || "";
    setName(val === "Toate" ? tmplName : `${tmplName} - ${val}`);
    // Clear selection if parcels hidden
    setSelectedParcels([]);
  };

  const updateResource = (id: number, field: string, val: any) => {
    setResources(prev => prev.map(r => r.id === id ? { ...r, [field]: val } : r));
  };
  
  const applyInventoryItem = (id: number, invId: string) => {
    if (!invId) {
      // Revert la manual
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
        unit: item.unit
      } : r));
    }
  };

  const removeResource = (id: number) => {
    setResources(prev => prev.filter(r => r.id !== id));
  };

  const handleEditOp = (op: any) => {
    setEditingOpId(op.id);
    setName(op.name);
    // Presupunem template din nume (ex: Semanat - Porumb)
    const tmplMatch = OP_TEMPLATES.find(t => op.name.includes(t.label));
    if (tmplMatch) setOpTemplate(tmplMatch.id);
    
    setDate(new Date(op.date).toISOString().split("T")[0]);
    setNotes(op.notes || "");
    
    // Setăm parcelele
    setSelectedParcels((op.parcels || []).map((p: any) => ({
      id: p.parcelId,
      name: p.parcel.name,
      maxHa: Number(p.parcel.areaHa),
      usedHa: Number(p.operatedAreaHa)
    })));

    // Setăm datele din resources (ne asigurăm că au `totalConsumed` setat dinainte)
    setResources((op.resources || []).map((r: any) => ({
      ...r,
      pricePerUnit: Number(r.pricePerUnit),
      quantityPerHa: Number(r.quantityPerHa),
      totalConsumed: r.totalConsumed ? Number(r.totalConsumed) : undefined
    })));

    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  async function handleSave() {
    if (!name || selectedParcels.length === 0) {
      alert("Completati numele și selectați cel puțin o parcelă!");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name,
        date,
        notes,
        parcels: selectedParcels.map(p => ({ parcelId: p.id, operatedAreaHa: p.usedHa })),
        resources: resources.map(r => ({
          name: r.name,
          type: r.type,
          quantityPerHa: r.quantityPerHa,
          unit: r.unit,
          pricePerUnit: r.pricePerUnit,
          inventoryItemId: r.inventoryItemId
        }))
      };

      if (editingOpId) {
        // Logica UPDATE Complet
        const updatedOp = await updateOperation(editingOpId, payload);
        // În loc de reload, actualizăm local
        setOps(prev => prev.map(o => o.id === editingOpId ? updatedOp : o));
        setShowForm(false);
      } else {
        // Logica CREATE 
        const newOp = await createOperation(payload);
        setOps(prev => [newOp, ...prev]);
        setShowForm(false);
      }
      
      // Reset form
      setEditingOpId(null);
      setName("");
      setNotes("");
      setSelectedParcels([]);
      setResources([]);

    } catch (e) {
      console.error(e);
      alert("Eroare la înregistrarea lucrării.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdateTotalConsumed(resId: string) {
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
  }

  async function handleDeleteOp(opId: string) {
    if (confirm("Ești sigur că vrei să ștergi lucrarea? Toate materialele se vor returna în stoc.")) {
      try {
        await deleteOperation(opId);
        setOps(prev => prev.filter(o => o.id !== opId));
      } catch (e) {
        alert("Eroare stergere");
      }
    }
  }

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-foreground flex items-center gap-2">
            <Tractor className="w-7 h-7 text-primary" />
            Lucrări Agricole
          </h2>
          <p className="text-muted-foreground mt-1">Gestionează operațiunile din câmp și calculează automat consumurile și devizele (Motorină, Îngrășăminte, Tratamente).</p>
        </div>
        <Button
          className="agral-gradient text-white font-semibold gap-2"
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

      {/* COMPONENTA FORMULAR (Deviz Interactiv) */}
      {showForm && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Coloana Stânga: Detalii și Parcele */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="border-primary/20 shadow-md">
              <CardHeader className="pb-3 border-b bg-muted/20">
                <CardTitle className="text-lg">{editingOpId ? "Modifică Deviz #"+editingOpId.slice(-4) : "Detalii Operațiune Nouă"}</CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label>Tipul Lucrării</Label>
                    <select 
                      className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                      value={opTemplate}
                      onChange={e => handleTemplateChange(e.target.value)}
                    >
                      {OP_TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Pentru Cultura</Label>
                    <select 
                      className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                      value={opCrop}
                      onChange={e => handleCropChange(e.target.value)}
                    >
                      {CROPS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Data Lucrării *</Label>
                    <Input type="date" className="h-10" value={date} onChange={e => setDate(e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-[1fr_2fr] gap-4">
                  <div className="space-y-1.5">
                    <Label>Nume Deviz (Salvat)</Label>
                    <Input className="font-semibold text-primary" value={name} onChange={e => setName(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Observații</Label>
                    <Input placeholder="ex: Vânt moderat 12km/h, norma de apă..." value={notes} onChange={e => setNotes(e.target.value)} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/20 shadow-md">
              <CardHeader className="pb-3 border-b bg-muted/20 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">1. Selectează Terenul Lucrat</CardTitle>
                  <CardDescription>Alege parcelele pe care se desfășoară lucrarea.</CardDescription>
                </div>
                <Badge className="bg-primary/10 text-primary border-primary/20 text-sm px-3 py-1">
                  Suprafață Sumată: {totalArea.toFixed(2)} ha
                </Badge>
              </CardHeader>
              <CardContent className="p-0 sm:p-5">
                <div className="mb-6 w-full rounded-xl overflow-hidden border">
                  {/* HARTA INTERACTIVĂ A PARCELELOR FILTRATE */}
                  <MapSelector 
                    parcels={visibleParcels} 
                    selectedIds={selectedParcels.map(p => p.id)} 
                    onToggleParcel={(id) => {
                      const p = visibleParcels.find(x => x.id === id);
                      if (p) toggleParcel(p);
                    }} 
                  />
                </div>

                {selectedParcels.length > 0 ? (
                  <div className="bg-muted/30 p-4 rounded-xl space-y-3">
                    <h4 className="font-semibold text-sm border-b pb-2">Ajustează suprafața lucrată (Dacă lucrarea a fost parțială)</h4>
                    {selectedParcels.map(sp => (
                      <div key={sp.id} className="flex items-center gap-3">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium w-32 truncate">{sp.name}</span>
                        <div className="flex items-center gap-2 flex-1">
                          <Input 
                            type="number" 
                            step="0.01" 
                            className="h-8 w-24" 
                            value={sp.usedHa} 
                            onChange={(e) => updateParcelArea(sp.id, e.target.value)} 
                          />
                          <span className="text-xs text-muted-foreground">din {sp.maxHa} ha</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground text-sm px-4">
                    Faceți click pe parcelele din hartă pentru a le adăuga în acest deviz. Suprafața va fi calculată automat.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Coloana Dreapta: Produse & Deviz Total */}
          <div className="space-y-4 font-sans">
            <Card className="border-primary/20 shadow-md sticky top-20">
              <CardHeader className="pb-3 border-b bg-amber-50/50">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FlaskConical className="w-5 h-5 text-amber-600" />
                  2. Input-uri / Tratamente
                </CardTitle>
                <CardDescription>Calculator automat normă/hectar</CardDescription>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                
                {resources.length === 0 ? (
                  <div className="text-center py-6 pb-2 text-muted-foreground text-sm border-2 border-dashed rounded-xl">
                    Niciun produs adăugat. Adaugă motorină sau inputuri pentru a genera devizul.
                  </div>
                ) : (
                  <div className="space-y-6">
                    {resources.map((res, index) => {
                      const totalQty = totalArea * res.quantityPerHa;
                      const costValue = totalQty * res.pricePerUnit;
                      
                      const activeTemplateDef = OP_TEMPLATES.find(t => t.id === opTemplate);
                      const filteredInventory = inventory.filter(inv => {
                        if (!activeTemplateDef || !activeTemplateDef.allowedCategories) return true;
                        // Ne uităm la inv.category să vedem dacă face match
                        return activeTemplateDef.allowedCategories.includes(inv.category);
                      });

                      return (
                        <div key={res.id} className="relative p-3 pt-6 bg-muted/20 border rounded-xl space-y-3">
                          <Button 
                            variant="destructive" 
                            size="icon" 
                            className="absolute -top-3 -right-3 w-7 h-7 rounded-full shadow-md"
                            onClick={() => removeResource(res.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>

                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Sursă Produs / Nume</Label>
                            <div className="flex gap-2">
                              <select 
                                className="h-9 w-1/2 md:w-1/3 rounded-md border border-input bg-background px-2 text-sm shrink-0"
                                value={res.inventoryItemId || ""}
                                onChange={(e) => applyInventoryItem(res.id, e.target.value)}
                              >
                                <option value="">🛒 Produs Manual (Fără stoc)</option>
                                {filteredInventory.length > 0 && (
                                  <optgroup label="Din Magazie (Scade Stoc)">
                                    {filteredInventory.map(inv => (
                                      <option key={inv.id} value={inv.id}>{inv.name} ({Number(inv.stockQuantity)} {inv.unit})</option>
                                    ))}
                                  </optgroup>
                                )}
                              </select>
                              <Input 
                                placeholder="Nume produs" 
                                className="h-9 flex-1" 
                                value={res.name}
                                onChange={(e) => updateResource(res.id, "name", e.target.value)}
                                disabled={!!res.inventoryItemId}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Normă (Cant. / Hectar)</Label>
                              <div className="flex gap-2">
                                <Input 
                                  type="number" step="0.1" className="h-9" 
                                  value={res.quantityPerHa || ""}
                                  onChange={(e) => updateResource(res.id, "quantityPerHa", parseFloat(e.target.value)||0)}
                                />
                                <select 
                                  className="h-9 w-16 rounded-md border border-input bg-background px-1 text-sm shrink-0 text-center"
                                  value={res.unit}
                                  onChange={(e) => updateResource(res.id, "unit", e.target.value)}
                                >
                                  <option value="L">L</option><option value="Kg">Kg</option><option value="Miez">Miez</option>
                                </select>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Preț (\u20AC sau RON / unitate)</Label>
                              <Input 
                                type="number" step="0.1" className="h-9" 
                                value={res.pricePerUnit || ""}
                                onChange={(e) => updateResource(res.id, "pricePerUnit", parseFloat(e.target.value)||0)}
                                disabled={!!res.inventoryItemId}
                              />
                            </div>
                          </div>
                          
                          <div className="bg-primary/5 p-2 rounded flex justify-between items-center text-sm border border-primary/10">
                            <span className="text-muted-foreground font-medium">Necesar total: 
                              <b className="text-foreground ml-1">{totalQty.toFixed(1)} {res.unit}</b>
                            </span>
                            <span className="font-bold text-primary">{costValue.toFixed(2)} Lei</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                <Button variant="outline" className="w-full border-dashed border-2 gap-2" onClick={addResource}>
                  <Plus className="w-4 h-4" /> Adaugă Consum / Input
                </Button>

                {/* Final DEVIZ */}
                <div className="bg-foreground text-background rounded-xl p-4 mt-6">
                  <div className="flex items-center justify-between font-medium text-sm text-muted-foreground/80 mb-1">
                    <span>Estimare Totală Operațiune</span>
                    <Calculator className="w-4 h-4" />
                  </div>
                  <div className="text-3xl font-extrabold pb-4 border-b border-background/20 mb-4">
                    {grandTotalCost.toFixed(2)} Lei
                  </div>
                  
                  <Button 
                    variant="default" 
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-12 text-md gap-2"
                    onClick={handleSave}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                    {editingOpId ? "Salvează Modificările" : "Salvează și Închide Devizul"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Tabela Operațiuni Înregistrate */}
      {!showForm && (
        <>
          <div className="flex gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Caută lucrare..."
                className="pl-9 h-11"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOps.map((op) => (
              <Card key={op.id} className="card-hover">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-foreground text-lg leading-tight">{op.name}</h3>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:bg-primary/10" onClick={() => handleEditOp(op)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteOp(op.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(op.date).toLocaleDateString("ro-RO")}
                      </div>
                    </div>
                    <Badge className={`text-xs border shrink-0 ${opStatusColors[op.status] || ""}`}>
                      {op.status === "completed" ? "Finalizată" : "În plan"}
                    </Badge>
                  </div>

                  <div className="mb-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-foreground bg-muted/50 p-2 rounded-md">
                      <MapPin className="w-4 h-4 text-primary shrink-0" />
                      <span className="font-medium">{Number(op.totalAreaHa).toFixed(2)} Hectare lucrate</span>
                    </div>
                    {op.parcels?.length > 0 && (
                      <div className="text-xs text-muted-foreground italic truncate pl-2">
                        {op.parcels.map((p: any) => p.parcel.name).join(", ")}
                      </div>
                    )}
                  </div>

                  {(op.resources && op.resources.length > 0) && (
                    <div className="border-t pt-3 mt-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Input_uri aplicate</p>
                      <div className="space-y-1.5">
                        {op.resources.map((r: any) => {
                          const initialCalc = r.quantityPerHa ? Number(r.quantityPerHa) * Number(op.totalAreaHa) : 0;
                          const finalTotalText = r.totalConsumed ? Number(r.totalConsumed) : initialCalc;
                          const isCustomized = !!r.totalConsumed;

                          return (
                            <div key={r.id} className="flex flex-col gap-1 text-sm bg-background border p-2 rounded-lg relative group">
                              <div className="flex justify-between items-center">
                                <span className="font-medium text-foreground">{r.name} 
                                  <span className="text-muted-foreground ml-1">({r.type})</span>
                                </span>
                                
                                {editingRes?.id === r.id ? (
                                  <div className="flex items-center gap-1">
                                    <Input 
                                      type="number" step="0.1" 
                                      className="h-6 w-16 text-right px-1 text-xs" 
                                      value={editingRes?.val || ""} 
                                      onChange={e => setEditingRes({ id: r.id, val: e.target.value })} 
                                    />
                                    <Button size="sm" className="h-6 px-2 text-xs" onClick={() => handleUpdateTotalConsumed(r.id)}>OK</Button>
                                    <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => setEditingRes(null)}>X</Button>
                                  </div>
                                ) : (
                                  <div className="font-bold text-primary flex items-center gap-2 cursor-pointer" onClick={() => setEditingRes({ id: r.id, val: finalTotalText.toString() })}>
                                    <span className={isCustomized ? "text-amber-600 underline decoration-dotted" : ""}>
                                      {finalTotalText.toFixed(1)} {r.unit} total
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="text-[10px] text-muted-foreground flex justify-between">
                                  <span>Normă: {Number(r.quantityPerHa).toFixed(1)} {r.unit}/ha</span>
                                  {isCustomized && <span className="text-amber-600 italic">Ajustat post-lucrare</span>}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                  
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredOps.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed rounded-xl">
              <Tractor className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground font-medium text-lg">Nicio lucrare înregistrată</p>
              <p className="text-sm text-muted-foreground mt-1">Acestea vor apărea aici după ce le creezi.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
