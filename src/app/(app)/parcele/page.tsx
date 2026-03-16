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
} from "lucide-react";
import Link from "next/link";

const parcels = [
  {
    id: 1,
    name: "La Iaz — Lot A",
    cadastralCode: "1234/1",
    area: 45.2,
    soilType: "Cernoziom",
    landUse: "Arabil",
    ownership: "Arendat",
    currentCrop: "Grâu de toamnă",
    status: "growing",
    statusLabel: "În creștere",
  },
  {
    id: 2,
    name: "Câmpia Dunăre",
    cadastralCode: "2890/A",
    area: 78.5,
    soilType: "Aluvionar",
    landUse: "Arabil",
    ownership: "Propriu",
    currentCrop: "Porumb",
    status: "planned",
    statusLabel: "Planificat",
  },
  {
    id: 3,
    name: "Dealul Mic",
    cadastralCode: "512/B2",
    area: 12.3,
    soilType: "Brun roșcat",
    landUse: "Arabil",
    ownership: "Arendat",
    currentCrop: "—",
    status: "harvested",
    statusLabel: "Liber",
  },
  {
    id: 4,
    name: "Luncă Sud",
    cadastralCode: "7801/3",
    area: 34.8,
    soilType: "Cernoziom",
    landUse: "Arabil",
    ownership: "Propriu",
    currentCrop: "Rapiță",
    status: "growing",
    statusLabel: "În creștere",
  },
  {
    id: 5,
    name: "Câmpul Nou",
    cadastralCode: "4432/C",
    area: 62.0,
    soilType: "Aluvionar",
    landUse: "Arabil",
    ownership: "Arendat",
    currentCrop: "Floarea soarelui",
    status: "sown",
    statusLabel: "Semănat",
  },
  {
    id: 6,
    name: "Pădurița Est",
    cadastralCode: "9011/1",
    area: 28.7,
    soilType: "Cernoziom",
    landUse: "Pășune",
    ownership: "Arendat",
    currentCrop: "—",
    status: "harvested",
    statusLabel: "Pășune",
  },
];

const statusColors: Record<string, string> = {
  growing: "bg-green-100 text-green-700 border-green-200",
  planned: "bg-blue-100 text-blue-700 border-blue-200",
  harvested: "bg-gray-100 text-gray-600 border-gray-200",
  sown: "bg-amber-100 text-amber-700 border-amber-200",
};

const ownershipColors: Record<string, string> = {
  Propriu: "bg-primary/10 text-primary border-primary/20",
  Arendat: "bg-purple-100 text-purple-700 border-purple-200",
};

export default function ParcelelePage() {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  const filtered = parcels.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.currentCrop.toLowerCase().includes(search.toLowerCase())
  );

  const totalArea = parcels.reduce((sum, p) => sum + p.area, 0);

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-foreground">Parcele Agricole</h2>
          <p className="text-muted-foreground mt-1">
            {parcels.length} parcele • {totalArea.toFixed(1)} ha total
          </p>
        </div>
        <Button
          className="agral-gradient text-white font-semibold gap-2"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus className="w-4 h-4" />
          Adaugă parcelă
        </Button>
      </div>

      {/* Add Parcel Form */}
      {showForm && (
        <Card className="border-2 border-primary/20">
          <CardContent className="p-6">
            <h3 className="font-bold text-lg mb-4">Parcelă nouă</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="pName">Denumire</Label>
                <Input id="pName" placeholder="ex: La Iaz — Lot B" className="h-11" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pCadastral">Cod cadastral</Label>
                <Input id="pCadastral" placeholder="ex: 1234/A" className="h-11" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pArea">Suprafață (ha)</Label>
                <Input id="pArea" type="number" step="0.01" placeholder="0.00" className="h-11" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pSoil">Tip sol</Label>
                <Input id="pSoil" placeholder="ex: Cernoziom" className="h-11" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pUse">Categorie</Label>
                <select id="pUse" className="w-full h-11 rounded-lg border border-input bg-background px-3 text-sm">
                  <option>Arabil</option>
                  <option>Pășune</option>
                  <option>Vie</option>
                  <option>Livadă</option>
                  <option>Pădure</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pOwnership">Proprietate</Label>
                <select id="pOwnership" className="w-full h-11 rounded-lg border border-input bg-background px-3 text-sm">
                  <option>Propriu</option>
                  <option>Arendat</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <Button className="agral-gradient text-white font-semibold">Salvează parcela</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Anulează</Button>
            </div>
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
          { label: "Total Parcele", value: parcels.length.toString(), icon: MapPin },
          { label: "Total Hectare", value: `${totalArea.toFixed(0)} ha`, icon: Move },
          { label: "Culturi active", value: "4", icon: Sprout },
          { label: "Libere", value: "2", icon: MapPin },
        ].map((s) => (
          <div key={s.label} className="p-4 bg-card border border-border rounded-xl text-center">
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
                  <p className="text-sm text-muted-foreground">{parcel.cadastralCode}</p>
                </div>
                <Badge className={`text-xs border shrink-0 ${ownershipColors[parcel.ownership] || ""}`}>
                  {parcel.ownership}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-2.5 bg-muted/50 rounded-lg">
                  <div className="text-xs text-muted-foreground">Suprafață</div>
                  <div className="font-bold text-foreground">{parcel.area} ha</div>
                </div>
                <div className="p-2.5 bg-muted/50 rounded-lg">
                  <div className="text-xs text-muted-foreground">Tip sol</div>
                  <div className="font-bold text-foreground text-sm">{parcel.soilType}</div>
                </div>
              </div>

              {parcel.currentCrop !== "—" && (
                <div className="flex items-center gap-2 mb-3 p-2.5 bg-green-50 rounded-lg border border-green-100">
                  <Sprout className="w-4 h-4 text-green-600 shrink-0" />
                  <span className="text-sm text-green-800 font-medium">{parcel.currentCrop}</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <Badge className={`text-xs border ${statusColors[parcel.status] || ""}`}>
                  {parcel.statusLabel}
                </Badge>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
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
          <p className="text-muted-foreground">Nicio parcelă găsită pentru &quot;{search}&quot;</p>
        </div>
      )}
    </div>
  );
}
