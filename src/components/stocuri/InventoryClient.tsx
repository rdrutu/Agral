"use client";

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
  ArrowUpRight
} from "lucide-react";
import { createInventoryItem, updateInventoryStock } from "@/lib/actions/inventory";
import { sellCrop } from "@/lib/actions/finance";
import { DollarSign } from "lucide-react";

const categoryConfig: Record<string, { icon: any, color: string, label: string }> = {
  chimic: { icon: FlaskConical, color: "text-purple-600 bg-purple-100", label: "Erbicid/Tratament" },
  ingrasamant: { icon: Droplets, color: "text-blue-600 bg-blue-100", label: "Îngrășământ" },
  samanta: { icon: Wheat, color: "text-green-600 bg-green-100", label: "Sămânță" },
  combustibil: { icon: Fuel, color: "text-amber-600 bg-amber-100", label: "Motorină/Combustibil" },
  recolta: { icon: Wheat, color: "text-amber-700 bg-amber-50", label: "Recoltă Fermă" },
};

export default function InventoryClient({ initialInventory }: { initialInventory: any[] }) {
  const [items, setItems] = useState(initialInventory);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editVal, setEditVal] = useState<string>("");

  // Sale Modal State
  const [sellingItem, setSellingItem] = useState<any | null>(null);
  const [isSelling, setIsSelling] = useState(false);
  const [saleData, setSaleData] = useState({ quantity: 0, price: 0, buyer: "" });

  const filtered = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()) || i.category.toLowerCase().includes(search.toLowerCase()));

  const totalValue = items.reduce((sum, item) => sum + (Number(item.stockQuantity) * Number(item.pricePerUnit)), 0);

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    try {
      const newItem = await createInventoryItem(formData);
      setItems(prev => [...prev, newItem].sort((a,b) => a.name.localeCompare(b.name)));
      setShowForm(false);
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

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-foreground flex items-center gap-2">
            <PackageSearch className="w-7 h-7 text-primary" />
            Magazia Fermei
          </h2>
          <p className="text-muted-foreground mt-1">Gestionează input-urile agricole, cantitățile și prețurile de achiziție.</p>
        </div>
        <Button
          className="agral-gradient text-white font-semibold gap-2"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Anulează" : <><Plus className="w-4 h-4" /> Adaugă în Stoc</>}
        </Button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-card border rounded-xl flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground font-medium mb-1">Valoare Totală Stocuri</p>
            <p className="text-2xl font-bold text-foreground">{totalValue.toLocaleString('ro-RO', { style: 'currency', currency: 'RON' })}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="font-bold text-primary text-lg">\u20AC</span>
          </div>
        </div>
      </div>

      {/* Adaugare Form */}
      {showForm && (
        <Card className="border-2 border-primary/20">
          <CardContent className="p-6">
            <h3 className="font-bold text-lg mb-4">Intrare nouă în magazie</h3>
            <form action={handleSubmit}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="name">Denumire Produs *</Label>
                  <Input id="name" name="name" required placeholder="ex: Adengo 465 SC / Uree / Motorină" className="h-11" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="category">Categorie</Label>
                  <select id="category" name="category" className="w-full h-11 rounded-lg border border-input bg-background px-3 text-sm">
                    {Object.entries(categoryConfig).map(([key, config]) => (
                      <option key={key} value={key}>{config.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="unit">Unitate de măsură</Label>
                  <select id="unit" name="unit" className="w-full h-11 rounded-lg border border-input bg-background px-3 text-sm">
                    <option value="L">Litri (L)</option>
                    <option value="Kg">Kilograme (Kg)</option>
                    <option value="Tone">Tone</option>
                    <option value="Doze">Doze</option>
                  </select>
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="stockQuantity">Cantitate Inițială Achiziționată *</Label>
                  <Input id="stockQuantity" name="stockQuantity" type="number" step="0.01" required placeholder="0.00" className="h-11" />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="pricePerUnit">Preț per Unitate (RON) *</Label>
                  <Input id="pricePerUnit" name="pricePerUnit" type="number" step="0.01" required placeholder="ex: 6.50 pentru Motorină" className="h-11" />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button type="submit" disabled={isSubmitting} className="agral-gradient text-white font-semibold flex-1 md:flex-none md:w-48">
                  {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Salvează Stocul
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
            <thead className="bg-muted/50 text-muted-foreground uppercase text-xs font-semibold">
              <tr>
                <th className="px-5 py-4">Denumire Produs</th>
                <th className="px-5 py-4">Categorie</th>
                <th className="px-5 py-4 text-right">Preț Unitar</th>
                <th className="px-5 py-4 text-right">Cantitate Stoc</th>
                <th className="px-5 py-4 text-right">Valoare (RON)</th>
                <th className="px-5 py-4 text-center">Acțiuni</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map(item => {
                const conf = categoryConfig[item.category] || categoryConfig["chimic"];
                const Icon = conf.icon;
                const totalLei = Number(item.stockQuantity) * Number(item.pricePerUnit);

                return (
                  <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-4 font-medium text-foreground flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${conf.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      {item.name}
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant="outline" className="font-normal">{conf.label}</Badge>
                    </td>
                    <td className="px-5 py-4 text-right text-muted-foreground">
                      {Number(item.pricePerUnit).toFixed(2)} Lei / {item.unit}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {editingId === item.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <Input 
                            type="number" step="0.1" 
                            className="h-8 w-24 text-right px-2" 
                            value={editVal} 
                            onChange={(e) => setEditVal(e.target.value)} 
                            autoFocus
                          />
                          <Button size="sm" onClick={() => handleQuickUpdate(item.id)}>Ok</Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>X</Button>
                        </div>
                      ) : (
                        <div className="font-bold text-foreground">
                          {Number(item.stockQuantity).toLocaleString('ro-RO')} {item.unit}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right font-medium">
                      {totalLei.toFixed(2)}
                    </td>
                    <td className="px-5 py-4 text-right w-24">
                      <div className="flex items-center justify-end gap-1">
                        {item.category === "recolta" && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => {
                              setSellingItem(item);
                              setSaleData({ quantity: Number(item.stockQuantity), price: item.pricePerUnit || 0, buyer: "" });
                            }}
                            title="Vinde din recoltă"
                          >
                            <DollarSign className="w-4 h-4" />
                          </Button>
                        )}
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
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
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
                Vânzare Recoltă: {sellingItem.name}
              </CardTitle>
              <CardDescription>Înregistrează o vânzare din stocul de recoltă.</CardDescription>
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
    </div>
  );
}
