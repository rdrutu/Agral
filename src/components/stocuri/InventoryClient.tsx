"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
  Loader2
} from "lucide-react";
import { createInventoryItem, updateInventoryStock } from "@/lib/actions/inventory";

const categoryConfig: Record<string, { icon: any, color: string, label: string }> = {
  chimic: { icon: FlaskConical, color: "text-purple-600 bg-purple-100", label: "Erbicid/Tratament" },
  ingrasamant: { icon: Droplets, color: "text-blue-600 bg-blue-100", label: "Îngrășământ" },
  samanta: { icon: Wheat, color: "text-green-600 bg-green-100", label: "Sămânță" },
  combustibil: { icon: Fuel, color: "text-amber-600 bg-amber-100", label: "Motorină/Combustibil" },
};

export default function InventoryClient({ initialInventory }: { initialInventory: any[] }) {
  const [items, setItems] = useState(initialInventory);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editVal, setEditVal] = useState<string>("");

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
    </div>
  );
}
