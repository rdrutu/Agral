"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Plus,
  Search,
  Filter,
  Edit2,
  Move,
  Sprout,
  ChevronRight,
  Loader2,
  Calendar, // Added Calendar
  Pencil, // Added Pencil
  Trash2, // Added Trash2
} from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils"; // Added this import
import { toast } from "react-hot-toast"; // Added this import
import { createParcel, updateParcel } from "@/lib/actions/parcels";
import dynamic from "next/dynamic";
import AllParcelsMapClient from "./AllParcelsMapClient";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";

const MapPolygonPicker = dynamic(
  () => import("./MapPolygonPicker").then((mod) => mod.MapPolygonPicker),
  { 
    ssr: false, 
    loading: () => (
      <div className="h-[400px] w-full bg-muted animate-pulse rounded-xl flex items-center justify-center border-2 border-primary/20">
        <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
      </div>
    )
  }
);

const statusColors: Record<string, string> = {
  growing: "bg-green-100 text-green-700 border-green-200",
  planned: "bg-blue-100 text-blue-700 border-blue-200",
  harvested: "bg-gray-100 text-gray-600 border-gray-200",
  sown: "bg-amber-100 text-amber-700 border-amber-200",
};

const ownershipColors: Record<string, string> = {
  Propriu: "bg-primary/10 text-primary border-primary/20",
  owned: "bg-primary/10 text-primary border-primary/20",
  Arendat: "bg-purple-100 text-purple-700 border-purple-200",
  rented: "bg-purple-100 text-purple-700 border-purple-200",
};

export default function ParcelListClient({ 
  initialParcels,
  farmBase,
  hideHeader = false
}: { 
  initialParcels: any[];
  farmBase?: { lat: number; lng: number } | null;
  hideHeader?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [coordinates, setCoordinates] = useState<any>(null);
  const [autoArea, setAutoArea] = useState<number | "">("");

  const [editingParcel, setEditingParcel] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    cadastralCode: "",
    areaHa: 0,
    soilType: "",
    landUse: "",
    ownership: ""
  });

  const filtered = initialParcels.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.soilType && p.soilType.toLowerCase().includes(search.toLowerCase()))
  );

  const totalArea = initialParcels.reduce((sum, p) => sum + Number(p.areaHa), 0);

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    if (coordinates) {
      formData.set("coordinates", JSON.stringify(coordinates));
    }
    
    try {
      await createParcel(formData);
      setShowForm(false);
    } catch (e) {
      console.error(e);
      alert("Eroare la adăugarea parcelei.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await updateParcel(editingParcel.id, editFormData);
      setEditingParcel(null);
    } catch (e) {
      console.error(e);
      alert("Eroare la actualizarea parcelei.");
    } finally {
      setIsSubmitting(false);
    }
  }
  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      {!hideHeader && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-extrabold text-foreground leading-tight">Parcele Agricole</h2>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              {initialParcels.length} parcele • {totalArea.toFixed(1)} ha total
            </p>
          </div>
          <Button
            className="agral-gradient text-white font-semibold gap-2 w-full sm:w-auto"
            onClick={() => setShowForm(!showForm)}
          >
            <Plus className="w-4 h-4" />
            Adaugă parcelă
          </Button>
        </div>
      )}

      {hideHeader && (
        <div className="flex justify-end">
          <Button
            className="agral-gradient text-white font-semibold gap-2"
            onClick={() => setShowForm(!showForm)}
          >
            <Plus className="w-4 h-4" />
            Adaugă parcelă
          </Button>
        </div>
      )}

      {/* Harta Generală a Fermei */}
      {!showForm && (
        <div className="mb-8">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Vedere în plan a parcelelor și rutei sediului
          </h3>
          <AllParcelsMapClient parcels={initialParcels} farmBase={farmBase} />
        </div>
      )}

      {/* Add Parcel Form */}
      {showForm && (
        <Card className="border-2 border-primary/20">
          <CardContent className="p-6">
            <h3 className="font-bold text-lg mb-4">Parcelă nouă</h3>
            <form action={handleSubmit}>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Denumire *</Label>
                  <Input id="name" name="name" required placeholder="ex: La Iaz — Lot B" className="h-11" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cadastralCode">Cod cadastral</Label>
                  <Input id="cadastralCode" name="cadastralCode" placeholder="ex: 1234/A" className="h-11" />
                </div>
                <div className="space-y-1.5 flex flex-col justify-end">
                  <Label htmlFor="areaHa">Suprafață (ha) *</Label>
                  <Input 
                    id="areaHa" 
                    name="areaHa" 
                    type="number" 
                    step="0.01" 
                    required 
                    placeholder="0.00" 
                    className="h-11" 
                    value={autoArea} 
                    onChange={(e) => setAutoArea(e.target.value ? Number(e.target.value) : "")} 
                    readOnly={!!coordinates} 
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="soilType">Tip sol</Label>
                  <Input id="soilType" name="soilType" placeholder="ex: Cernoziom" className="h-11" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="landUse">Categorie</Label>
                  <select id="landUse" name="landUse" className="w-full h-11 rounded-lg border border-input bg-background px-3 text-sm">
                    <option value="arabil">Arabil</option>
                    <option value="pasune">Pășune</option>
                    <option value="vie">Vie</option>
                    <option value="livada">Livadă</option>
                    <option value="padure">Pădure</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ownership">Proprietate</Label>
                  <select id="ownership" name="ownership" className="w-full h-11 rounded-lg border border-input bg-background px-3 text-sm">
                    <option value="owned">Propriu</option>
                    <option value="rented">Arendat</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-6 mb-4">
                <Label className="mb-2 block text-sm font-semibold">Desenează conturul parcelei (opțional, calculează automat aria)</Label>
                <MapPolygonPicker 
                  onPolygonComplete={(geoJson, area) => {
                    setCoordinates(geoJson);
                    if (area > 0) setAutoArea(area);
                  }} 
                  baseLat={farmBase?.lat ?? null}
                  baseLng={farmBase?.lng ?? null}
                />
              </div>

              <div className="flex gap-3 mt-4">
                <Button type="submit" disabled={isSubmitting} className="agral-gradient text-white font-semibold">
                  {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Salvează parcela
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Anulează</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Search & Filter */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Caută parcelă sau cultură..."
            className="pl-9 h-11"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" className="h-11 gap-2">
          <Filter className="w-4 h-4" />
          Filtrează
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Parcele", value: initialParcels.length.toString(), icon: MapPin },
          { label: "Total Hectare", value: `${totalArea.toFixed(1)} ha`, icon: Move },
        ].map((s) => (
          <div key={s.label} className="p-4 bg-card border border-border rounded-xl text-center flex flex-col items-center justify-center">
            <s.icon className="w-5 h-5 text-muted-foreground mb-1" />
            <div className="text-xl font-extrabold text-primary">{s.value}</div>
            <div className="text-sm text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Parcels grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((parcel) => (
          <Card key={parcel.id} className="card-hover overflow-hidden">
            <div className="h-2 agral-gradient" />
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-foreground text-lg leading-tight">{parcel.name}</h3>
                  <p className="text-sm text-muted-foreground">{parcel.cadastralCode || "-"}</p>
                </div>
                <Badge className={`text-xs border shrink-0 ${ownershipColors[parcel.ownership] || ""}`}>
                  {parcel.ownership === "owned" ? "Propriu" : "Arendat"}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-2.5 bg-muted/50 rounded-lg">
                  <div className="text-xs text-muted-foreground">Suprafață</div>
                  <div className="font-bold text-foreground">{parcel.areaHa?.toString()} ha</div>
                </div>
                <div className="p-2.5 bg-muted/50 rounded-lg">
                  <div className="text-xs text-muted-foreground">Tip sol</div>
                  <div className="font-bold text-foreground text-sm">{parcel.soilType || "-"}</div>
                </div>
              </div>

              {/* Daca avem cropPlans active, le afisam, altfel e liberă */}
              {parcel.cropPlans?.length > 0 ? (
                <div className="space-y-2 mb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 p-2 px-3 bg-green-50 rounded-lg border border-green-100 flex-1">
                      <Sprout className="w-4 h-4 text-green-600 shrink-0" />
                      <span className="text-sm text-green-800 font-bold">{parcel.cropPlans[0].cropType}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center px-1">
                    <Badge variant="outline" className={`text-[10px] uppercase font-bold tracking-wider ${statusColors[parcel.cropPlans[0].status] || ""}`}>
                      {parcel.cropPlans[0].status === 'sown' ? 'Semănat' : 
                       parcel.cropPlans[0].status === 'growing' ? 'În vegetație' : 
                       parcel.cropPlans[0].status === 'harvested' ? 'Recoltat' : 'Planificat'}
                    </Badge>
                    {parcel.cropPlans[0].sownDate && (
                      <span className="text-[10px] text-muted-foreground uppercase font-medium">
                        Din: {formatDate(parcel.cropPlans[0].sownDate)}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 mb-3 p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                  <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="text-sm text-gray-500 font-medium">Fără recoltă curentă</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex gap-1 ml-auto">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0"
                    onClick={() => {
                      setEditingParcel(parcel);
                      setEditFormData({
                        name: parcel.name,
                        cadastralCode: parcel.cadastralCode || "",
                        areaHa: Number(parcel.areaHa),
                        soilType: parcel.soilType || "",
                        landUse: parcel.landUse,
                        ownership: parcel.ownership
                      });
                    }}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                  <Link href={`/parcele/${parcel.id}`}>
                    <Button variant="ghost" size="sm" className="h-8 px-2 gap-1 text-primary">
                      Detalii <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Nicio parcelă găsită</p>
        </div>
      )}

      {/* Edit Parcel Dialog */}
      <Dialog open={!!editingParcel} onOpenChange={(open) => !open && setEditingParcel(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editează Parcelă</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Denumire</Label>
              <Input 
                id="edit-name" 
                value={editFormData.name} 
                onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-cadastral">Cod Cadastral</Label>
              <Input 
                id="edit-cadastral" 
                value={editFormData.cadastralCode} 
                onChange={(e) => setEditFormData({...editFormData, cadastralCode: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-area">Suprafață (ha)</Label>
                <Input 
                  id="edit-area" 
                  type="number"
                  step="0.01"
                  value={editFormData.areaHa} 
                  onChange={(e) => setEditFormData({...editFormData, areaHa: Number(e.target.value)})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-soil">Tip Sol</Label>
                <Input 
                  id="edit-soil" 
                  value={editFormData.soilType} 
                  onChange={(e) => setEditFormData({...editFormData, soilType: e.target.value})}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-landuse">Categorie</Label>
                <select 
                  id="edit-landuse" 
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={editFormData.landUse}
                  onChange={(e) => setEditFormData({...editFormData, landUse: e.target.value})}
                >
                  <option value="arabil">Arabil</option>
                  <option value="pasune">Pășune</option>
                  <option value="vie">Vie</option>
                  <option value="livada">Livadă</option>
                  <option value="padure">Pădure</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-ownership">Proprietate</Label>
                <select 
                  id="edit-ownership" 
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={editFormData.ownership}
                  onChange={(e) => setEditFormData({...editFormData, ownership: e.target.value})}
                >
                  <option value="owned">Propriu</option>
                  <option value="rented">Arendat</option>
                </select>
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setEditingParcel(null)}>Anulează</Button>
              <Button type="submit" disabled={isSubmitting} className="agral-gradient text-white">
                {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Salvează Modificările
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
