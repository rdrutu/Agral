"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Map as MapIcon, List, Filter, Trash2, Edit2, ChevronRight, LayoutGrid, Layers, Settings2, Globe, MapPin, Move, Sprout, Calendar, History as HistoryIcon, Pencil, Loader2, Check } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { toast } from "react-hot-toast";
import {
  getParcels,
  deleteParcel,
  createParcel,
  updateParcel,
  getParcelGroups,
  createParcelGroup,
  updateParcelGroup,
  deleteParcelGroup,
  bulkUpdateParcels
} from "@/lib/actions/parcels";
import dynamic from "next/dynamic";
const AllParcelsMapClient = dynamic(() => import("./AllParcelsMapClient"), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] w-full bg-muted animate-pulse rounded-xl flex items-center justify-center border-2 border-primary/20">
      <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
    </div>
  )
});
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";

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
  initialGroups = [],
  farmBase,
  hideHeader = false
}: {
  initialParcels: any[];
  initialGroups?: any[];
  farmBase?: { lat: number; lng: number } | null;
  hideHeader?: boolean;
}) {
  const [parcels, setParcels] = useState(initialParcels);
  const [groups, setGroups] = useState(initialGroups);
  const [isGroupingEnabled, setIsGroupingEnabled] = useState(true);
  const [isManageGroupsOpen, setIsManageGroupsOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");

  const [cadastralMetadata, setCadastralMetadata] = useState<{
    cadastralNumber?: string;
    cfNumber?: string;
    uat?: string;
  } | null>(null);

  const [cadastralNo, setCadastralNo] = useState("");
  const [cfNo, setCfNo] = useState("");
  const [uatName, setUatName] = useState("");

  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
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
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isQuickAssignOpen, setIsQuickAssignOpen] = useState(false);
  const [activeQuickAssignSectorId, setActiveQuickAssignSectorId] = useState<string | null>(null);

  // Selection & Bulk Actions
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Advanced Filtering
  const [filterGroup, setFilterGroup] = useState<string>("all");
  const [filterCrop, setFilterCrop] = useState<string>("all");
  const [filterOwnership, setFilterOwnership] = useState<string>("all");

  const filtered = parcels.filter(
    (p) => {
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.soilType && p.soilType.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.cadastralCode && p.cadastralCode.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchGroup = filterGroup === "all" || p.groupId === filterGroup;
      const matchCrop = filterCrop === "all" || (p.cropPlans?.[0]?.cropType === filterCrop);
      const matchOwnership = filterOwnership === "all" || p.ownership === filterOwnership;

      return matchSearch && matchGroup && matchCrop && matchOwnership;
    }
  );

  const availableCrops = Array.from(new Set(parcels.map(p => p.cropPlans?.[0]?.cropType).filter(Boolean)));

  const totalArea = parcels.reduce((sum, p) => sum + Number(p.areaHa), 0);

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    if (coordinates) {
      formData.set("coordinates", JSON.stringify(coordinates));
    }

    try {
      await createParcel(formData);
      setShowForm(false);
      setCoordinates(null);
      setAutoArea(0);
      setCadastralNo("");
      setCfNo("");
      setUatName("");
      const updatedParcels = await getParcels();
      setParcels(updatedParcels);
      toast.success("Parcelă adăugată cu succes!");
    } catch (e) {
      console.error(e);
      toast.error("Eroare la adăugarea parcelei.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleEditParcel = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingParcel) return;
    setIsLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const data = {
        name: formData.get("name") as string,
        cadastralCode: formData.get("cadastralCode") as string,
        areaHa: parseFloat(formData.get("areaHa") as string),
        soilType: formData.get("soilType") as string,
        landUse: formData.get("landUse") as string,
        ownership: formData.get("ownership") as string,
        groupId: (formData.get("groupId") as string) || null,
        uat: formData.get("uat") as string,
        cadastralNumber: formData.get("cadastralNumber") as string,
        cfNumber: formData.get("cfNumber") as string,
      };

      await updateParcel(editingParcel.id, data);
      toast.success("Parcelă actualizată cu succes");
      setEditingParcel(null);
      const updated = await getParcels();
      setParcels(updated);
    } catch (error) {
      toast.error("Eroare la actualizarea parcelei");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteParcel = async (id: string) => {
    if (!confirm("Ești sigur că vrei să ștergi această parcelă? Toate operațiunile asociate vor fi șterse.")) return;
    try {
      await deleteParcel(id);
      setParcels(parcels.filter(p => p.id !== id));
      toast.success("Parcelă ștearsă");
    } catch (error) {
      toast.error("Eroare la ștergerea parcelei");
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName) return;
    try {
      const group = await createParcelGroup(newGroupName);
      setGroups([...groups, group]);
      setNewGroupName("");
      toast.success("Sector creat cu succes");
    } catch (error) {
      toast.error("Eroare la crearea sectorului");
    }
  };

  const handleDeleteGroup = async (id: string) => {
    if (!confirm("Ești sigur că vrei să ștergi acest sector? Parcelele vor fi păstrate dar nu vor mai fi grupate.")) return;
    try {
      await deleteParcelGroup(id);
      setGroups(groups.filter((g: any) => g.id !== id));
      const updatedParcels = await getParcels();
      setParcels(updatedParcels);
      toast.success("Sector șters");
    } catch (error) {
      toast.error("Eroare la ștergerea sectorului");
    }
  };

  const groupedParcels = isGroupingEnabled
    ? groups.map((g: any) => ({
      ...g,
      parcels: filtered.filter(p => p.groupId === g.id)
    })).filter(g => g.parcels.length > 0)
    : [];

  const unmappedParcels = isGroupingEnabled
    ? filtered.filter(p => !p.groupId || !groups.find((g: any) => g.id === p.groupId))
    : filtered;

  const handleBulkGroup = async (groupId: string | null) => {
    if (selectedIds.length === 0) return;
    setIsLoading(true);
    try {
      await bulkUpdateParcels(selectedIds, { groupId });
      toast.success(`${selectedIds.length} parcele mutate cu succes`);
      setSelectedIds([]);
      setIsSelectionMode(false);
      const updated = await getParcels();
      setParcels(updated);
    } catch (error) {
      toast.error("Eroare la mutarea parcelelor");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Ești sigur că vrei să ștergi ${selectedIds.length} parcele?`)) return;
    setIsLoading(true);
    try {
      // Direct deletion in loop or new bulk action (using loop for safety here)
      for (const id of selectedIds) {
        await deleteParcel(id);
      }
      toast.success(`${selectedIds.length} parcele șterse`);
      setSelectedIds([]);
      setIsSelectionMode(false);
      const updated = await getParcels();
      setParcels(updated);
    } catch (error) {
      toast.error("Eroare la ștergerea parcelelor");
    } finally {
      setIsLoading(false);
    }
  };

  return (
      <div className="space-y-6 max-w-7xl" suppressHydrationWarning>
        {/* 1. Titlu & Statistici */}
        <div suppressHydrationWarning>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3" suppressHydrationWarning>
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center" suppressHydrationWarning>
            <MapPin className="w-6 h-6 text-primary" />
          </div>
          Gestiune Parcele
        </h1>
        <p className="text-muted-foreground mt-1 font-medium">{parcels.length} parcele • {totalArea.toFixed(1)} ha înregistrate.</p>
      </div>

      {/* 2. Filtre (Top) */}
      <div className="space-y-4" suppressHydrationWarning>
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Caută parcelă..."
                className="pl-9 h-11"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <select
              value={filterGroup}
              onChange={(e) => setFilterGroup(e.target.value)}
              className="h-11 rounded-lg border border-input bg-card px-3 text-sm font-medium"
            >
              <option value="all">Toate Sectoarele</option>
              {groups.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
            <select
              value={filterCrop}
              onChange={(e) => setFilterCrop(e.target.value)}
              className="h-11 rounded-lg border border-input bg-card px-3 text-sm font-medium"
            >
              <option value="all">Toate Culturile</option>
              {availableCrops.map((crop: any) => <option key={crop} value={crop}>{crop}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* 3. Hartă (Sub Filtre) */}
      {!showForm && viewMode !== "map" && (
        <div className="rounded-xl overflow-hidden border border-border shadow-sm">
          <div className="bg-muted/30 px-4 py-2 border-b flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Previzualizare Hartă</span>
            <Badge variant="outline" className="bg-primary/5 text-primary text-[10px]">Activ</Badge>
          </div>
          <AllParcelsMapClient parcels={initialParcels} groups={groups} farmBase={farmBase} />
        </div>
      )}

      {/* 4. Gestionare Sectoare & Parcele (Mijloc) */}
      <h2 className="text-xl font-bold text-primary flex items-center gap-2 mt-8 mb-4">
        <Layers className="w-5 h-5" />
        Configurare Sectoare & Parcele
      </h2>
      <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-dashed">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="h-11 gap-2 border-primary/20 text-primary font-bold hover:bg-primary/5"
            onClick={() => setIsManageGroupsOpen(true)}
          >
            <Plus className="w-4 h-4" /> Sector Nou
          </Button>
          <Button 
            className="agral-gradient text-white font-bold h-11 gap-2 shadow-sm px-6"
            onClick={() => setShowForm(!showForm)}
          >
            <Plus className="w-4 h-4" /> Adaugă Parcelă
          </Button>
        </div>

        <div className="flex items-center gap-2 bg-muted/30 p-1 rounded-xl">
          <Button
            variant={!isGroupingEnabled ? "secondary" : "ghost"}
            size="sm"
            className="h-8 px-3 font-semibold"
            onClick={() => setIsGroupingEnabled(false)}
          >
            Listă
          </Button>
          <Button
            variant={isGroupingEnabled ? "secondary" : "ghost"}
            size="sm"
            className="h-8 px-3 font-semibold"
            onClick={() => setIsGroupingEnabled(true)}
          >
            Sectoare
          </Button>
          <div className="w-px h-4 bg-border mx-1" />
          <Button 
            variant={viewMode === "grid" ? "secondary" : "ghost"} 
            size="sm" 
            className="h-8 w-8 p-0"
            onClick={() => setViewMode("grid")}
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
          <Button 
            variant={viewMode === "map" ? "secondary" : "ghost"} 
            size="sm" 
            className="h-8 w-8 p-0"
            onClick={() => setViewMode("map")}
          >
            <MapIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {showForm && (
        <Card className="border-2 border-primary animate-in slide-in-from-top-4 duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-xl flex items-center gap-2">
                <MapPin className="w-6 h-6 text-primary" />
                Adaugă Parcelă Nouă
              </h3>
              <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}>
                <Plus className="w-5 h-5 rotate-45" />
              </Button>
            </div>
            <form action={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Denumire *</Label>
                  <Input id="name" name="name" required placeholder="ex: Tarla 12 — Lot 1" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cadastralCode">Cod Intern (Optional)</Label>
                  <Input id="cadastralCode" name="cadastralCode" placeholder="ex: T12-L1" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="areaHa">Suprafață (ha) *</Label>
                  <Input
                    id="areaHa"
                    name="areaHa"
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={autoArea}
                    onChange={(e) => setAutoArea(e.target.value ? Number(e.target.value) : "")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="soilType">Tipul Solului</Label>
                  <Input id="soilType" name="soilType" placeholder="ex: Cernoziom" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="landUse">Mod de Folosință</Label>
                  <select id="landUse" name="landUse" className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                    <option value="arabil">Arabil</option>
                    <option value="pasune">Pășune</option>
                    <option value="vie">Vie</option>
                    <option value="livada">Livadă</option>
                    <option value="padure">Pădure</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ownership">Regim Proprietate</Label>
                  <select id="ownership" name="ownership" className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                    <option value="owned">Propriu</option>
                    <option value="rented">Arendat</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="groupId">Asignează în Sector</Label>
                  <select id="groupId" name="groupId" className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm font-bold text-primary">
                    <option value="">Fără sector (Nealocată)</option>
                    {groups.map((g: any) => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6 p-4 bg-muted/30 rounded-xl space-y-4">
                <div className="text-sm font-bold text-primary flex items-center gap-2">
                  <Globe className="w-4 h-4" /> Detalii Cadastrale (ANCPI)
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="uat">UAT / Localitate</Label>
                    <Input id="uat" name="uat" placeholder="Identificat automat" value={uatName} onChange={(e) => setUatName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cadastralNumber">Nr. Cadastral</Label>
                    <Input id="cadastralNumber" name="cadastralNumber" placeholder="Nr. Cadastral" value={cadastralNo} onChange={(e) => setCadastralNo(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cfNumber">Nr. Carte Funciară</Label>
                    <Input id="cfNumber" name="cfNumber" placeholder="Nr. CF" value={cfNo} onChange={(e) => setCfNo(e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <Label className="mb-2 block">Delimitare pe Hartă</Label>
                <div className="rounded-xl overflow-hidden border">
                  <MapPolygonPicker
                    onPolygonComplete={(geoJson, area, metadata) => {
                      setCoordinates(geoJson);
                      if (area > 0) setAutoArea(area);
                      if (metadata) {
                        setCadastralMetadata(metadata);
                        if (metadata.cadastralNumber) setCadastralNo(metadata.cadastralNumber);
                        if (metadata.cfNumber) setCfNo(metadata.cfNumber);
                        if (metadata.uat) setUatName(metadata.uat);
                      }
                    }}
                    baseLat={farmBase?.lat ?? null}
                    baseLng={farmBase?.lng ?? null}
                    parcels={parcels}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Anulează</Button>
                <Button type="submit" disabled={isSubmitting} className="agral-gradient text-white font-bold px-8">
                  {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                  Creează Parcelă
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}


      {/* 5. Bulk Action Bar (Floating bottom-like but contextually above grid) */}
      {selectedIds.length > 0 && (
        <div className="bg-primary/10 border-2 border-primary/20 p-4 rounded-xl flex items-center justify-between animate-in fade-in slide-in-from-bottom-2 duration-300 shadow-lg mb-6 sticky top-2 z-50 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-primary text-white rounded-lg flex items-center justify-center font-bold">
              {selectedIds.length}
            </div>
            <div>
              <div className="font-bold text-sm">Parcele Selectate</div>
              <div className="text-xs text-muted-foreground whitespace-nowrap">Alege o acțiune pentru selecția curentă</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              className="h-9 rounded-lg border border-primary/20 bg-background px-3 text-sm font-medium focus:ring-2 focus:ring-primary outline-none"
              onChange={(e) => handleBulkGroup(e.target.value)}
              value=""
            >
              <option value="" disabled>Mută în sector...</option>
              <option value="none">Fără sector (Nealocate)</option>
              {groups.map((g: any) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
            <Button
              variant="destructive"
              size="sm"
              className="h-9 font-bold px-4"
              onClick={handleBulkDelete}
              disabled={isLoading}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Șterge
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-9 font-bold text-muted-foreground hover:text-primary"
              onClick={() => setSelectedIds([])}
            >
              Anulează
            </Button>
          </div>
        </div>
      )}

      {/* 6. Vizualizare (Grilă sau Hartă) */}
      {viewMode === "map" ? (
        <AllParcelsMapClient parcels={parcels} groups={groups} farmBase={farmBase} />
      ) : (
        <div className="space-y-8">
          {isGroupingEnabled ? (
            <>
              {groupedParcels.map((group) => (
                <div key={group.id} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-1 agral-gradient rounded-full" />
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      {group.name}
                      <Badge variant="outline" className="text-[10px] ml-2 font-medium bg-primary/5">
                        {group.parcels.length} {group.parcels.length === 1 ? 'parcelă' : 'parcele'}
                      </Badge>
                    </h3>
                  </div>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {group.parcels.map((parcel: any) => (
                      <ParcelCard
                        key={parcel.id}
                        parcel={parcel}
                        isSelected={selectedIds.includes(parcel.id)}
                        isSelectionMode={isSelectionMode}
                        onSelect={() => {
                          if (selectedIds.includes(parcel.id)) {
                            setSelectedIds(selectedIds.filter(id => id !== parcel.id));
                          } else {
                            setSelectedIds([...selectedIds, parcel.id]);
                          }
                        }}
                        onEdit={() => {
                          setEditingParcel(parcel);
                          setEditFormData({
                            name: parcel.name,
                            cadastralCode: parcel.cadastralCode || "",
                            areaHa: Number(parcel.areaHa),
                            soilType: parcel.soilType || "",
                            landUse: parcel.landUse,
                            ownership: parcel.ownership,
                            groupId: parcel.groupId,
                            uat: parcel.uat || "",
                            cadastralNumber: parcel.cadastralNumber || "",
                            cfNumber: parcel.cfNumber || ""
                          } as any);
                        }}
                        onDelete={() => handleDeleteParcel(parcel.id)}
                        onMoveToSector={(sectorId: string) => handleBulkGroup(sectorId)}
                      />
                    ))}
                    {/* Quick Add Card - Special & Intuitive */}
                    <Card
                      className="border-2 border-dashed border-primary/20 hover:border-primary/50 transition-all cursor-pointer bg-primary/5 group min-h-[150px] flex flex-col items-center justify-center p-6 text-center"
                      onClick={() => {
                        setActiveQuickAssignSectorId(group.id);
                        setIsQuickAssignOpen(true);
                      }}
                    >
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <Plus className="w-6 h-6 text-primary" />
                      </div>
                      <h4 className="font-bold text-sm text-primary">Adaugă în {group.name}</h4>
                      <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider font-semibold">Selectează parcelele nealocate</p>
                    </Card>
                  </div>
                </div>
              ))}

              {groups.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 bg-muted/20 border-2 border-dashed rounded-2xl text-center">
                  <Layers className="w-12 h-12 text-muted-foreground/30 mb-4" />
                  <h3 className="font-bold text-lg mb-2">Nu ai sectoare create</h3>
                  <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
                    Organizează-ți parcelele pe zone sau sectoare pentru o gestionare mai eficientă a fermei.
                  </p>
                  <Button onClick={() => setIsManageGroupsOpen(true)} className="agral-gradient text-white font-bold px-8">
                    <Plus className="w-4 h-4 mr-2" />
                    Creează primul sector
                  </Button>
                </div>
              ) : (
                <>
                  {unmappedParcels.length > 0 && (
                    <div className="space-y-4 mt-8">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-1 bg-slate-300 rounded-full" />
                        <h3 className="text-lg font-bold text-slate-500 flex items-center gap-2">
                          Parcele Nealocate (Fără Sector)
                          <Badge variant="outline" className="text-[10px] ml-2 font-medium">
                            {unmappedParcels.length} {unmappedParcels.length === 1 ? 'parcelă' : 'parcele'}
                          </Badge>
                        </h3>
                      </div>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {unmappedParcels.map((parcel: any) => (
                          <ParcelCard
                            key={parcel.id}
                            parcel={parcel}
                            isSelected={selectedIds.includes(parcel.id)}
                            isSelectionMode={isSelectionMode}
                            onSelect={() => {
                              if (selectedIds.includes(parcel.id)) {
                                setSelectedIds(selectedIds.filter(id => id !== parcel.id));
                              } else {
                                setSelectedIds([...selectedIds, parcel.id]);
                              }
                            }}
                            onEdit={() => {
                              setEditingParcel(parcel);
                              setEditFormData({
                                name: parcel.name,
                                cadastralCode: parcel.cadastralCode || "",
                                areaHa: Number(parcel.areaHa),
                                soilType: parcel.soilType || "",
                                landUse: parcel.landUse,
                                ownership: parcel.ownership,
                                groupId: parcel.groupId,
                                uat: parcel.uat || "",
                                cadastralNumber: parcel.cadastralNumber || "",
                                cfNumber: parcel.cfNumber || ""
                              } as any);
                            }}
                            onDelete={() => handleDeleteParcel(parcel.id)}
                            onMoveToSector={(sectorId: string) => handleBulkGroup(sectorId)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((parcel) => (
                <ParcelCard
                  key={parcel.id}
                  parcel={parcel}
                  isSelected={selectedIds.includes(parcel.id)}
                  isSelectionMode={isSelectionMode}
                  onSelect={() => {
                    if (selectedIds.includes(parcel.id)) {
                      setSelectedIds(selectedIds.filter(id => id !== parcel.id));
                    } else {
                      setSelectedIds([...selectedIds, parcel.id]);
                    }
                  }}
                  onEdit={() => {
                    setEditingParcel(parcel);
                    setEditFormData({
                      name: parcel.name,
                      cadastralCode: parcel.cadastralCode || "",
                      areaHa: Number(parcel.areaHa),
                      soilType: parcel.soilType || "",
                      landUse: parcel.landUse,
                      ownership: parcel.ownership,
                      groupId: parcel.groupId,
                      uat: parcel.uat || "",
                      cadastralNumber: parcel.cadastralNumber || "",
                      cfNumber: parcel.cfNumber || ""
                    } as any);
                  }}
                  onDelete={() => handleDeleteParcel(parcel.id)}
                  onMoveToSector={(sectorId: string) => handleBulkGroup(sectorId)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Nicio parcelă găsită</p>
        </div>
      )}

      {/* Manage Groups Dialog */}
      <Dialog open={isManageGroupsOpen} onOpenChange={setIsManageGroupsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Gestionare Sectoare</DialogTitle>
            <DialogDescription>
              Creează și organizează parcelele în grupuri/sectoare pentru o monitorizare mai ușoară.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            <div className="flex gap-2">
              <Input
                placeholder="Nume sector nou (ex: Sector Nord)"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateGroup()}
              />
              <Button onClick={handleCreateGroup} className="agral-gradient text-white">
                <Plus className="w-4 h-4 mr-2" /> Adaugă
              </Button>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {groups.length === 0 && (
                <p className="text-sm text-center text-muted-foreground py-8">Nu aveți sectoare create.</p>
              )}
              {groups.map((group: any) => (
                <div key={group.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50">
                  <span className="font-semibold text-sm">{group.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDeleteGroup(group.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Parcel Dialog */}
      <Dialog open={!!editingParcel} onOpenChange={(open) => !open && setEditingParcel(null)}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          {editingParcel && (
            <>
              <DialogHeader>
                <DialogTitle>Editează Parcelă: {editingParcel.name}</DialogTitle>
              </DialogHeader>
              <form key={editingParcel.id} onSubmit={handleEditParcel} className="space-y-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Denumire *</Label>
                    <Input
                      id="edit-name"
                      name="name"
                      defaultValue={editingParcel.name}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-cadastralCode">Cod Intern</Label>
                    <Input
                      id="edit-cadastralCode"
                      name="cadastralCode"
                      defaultValue={editingParcel.cadastralCode || ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-groupId">Sector / Grup</Label>
                    <select
                      id="edit-groupId"
                      name="groupId"
                      defaultValue={editingParcel.groupId || ""}
                      className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Fără sector</option>
                      {groups.map((g: any) => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-areaHa">Suprafață (ha) *</Label>
                    <Input
                      id="edit-areaHa"
                      name="areaHa"
                      type="number"
                      step="0.01"
                      defaultValue={editingParcel.areaHa}
                      required
                    />
                  </div>
                </div>

                <div className="p-4 bg-muted/30 rounded-xl border border-border/50 space-y-4">
                  <div className="flex items-center gap-2 text-primary font-bold text-sm">
                    <Globe className="w-4 h-4" />
                    Detașează Date Cadastrale (ANCPI)
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-uat">UAT (Localitate)</Label>
                      <Input id="edit-uat" name="uat" defaultValue={editingParcel.uat || ""} placeholder="ex: Sibiu" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-cadastralNumber">Nr. Cadastral</Label>
                      <Input id="edit-cadastralNumber" name="cadastralNumber" defaultValue={editingParcel.cadastralNumber || ""} placeholder="ex: 102341" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-cfNumber">Nr. CF</Label>
                      <Input id="edit-cfNumber" name="cfNumber" defaultValue={editingParcel.cfNumber || ""} placeholder="ex: 102341" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="space-y-2">
                    <Label htmlFor="edit-soilType">Tip Sol</Label>
                    <Input id="edit-soilType" name="soilType" defaultValue={editingParcel.soilType || ""} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-landuse">Categorie</Label>
                    <select
                      id="edit-landuse"
                      name="landUse"
                      className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                      defaultValue={editingParcel.landUse}
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
                      name="ownership"
                      className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                      defaultValue={editingParcel.ownership}
                    >
                      <option value="owned">Propriu</option>
                      <option value="rented">Arendat</option>
                    </select>
                  </div>
                </div>

                <DialogFooter className="pt-4 border-t gap-2">
                  <Button type="button" variant="outline" onClick={() => setEditingParcel(null)}>Anulează</Button>
                  <Button type="submit" disabled={isLoading} className="agral-gradient text-white">
                    {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Actualizează Parcelă
                  </Button>
                </DialogFooter>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Quick Assign Dialog */}
      <Dialog open={isQuickAssignOpen} onOpenChange={setIsQuickAssignOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" />
              Asignează parcele în: {groups.find(g => g.id === activeQuickAssignSectorId)?.name}
            </DialogTitle>
            <DialogDescription>
              Alege una sau mai multe parcele din lista de parcele nealocate pentru a le muta instantaneu în acest sector.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto pr-2 py-4">
            {unmappedParcels.length === 0 ? (
              <div className="text-center py-12 bg-muted/20 rounded-xl border border-dashed">
                <Check className="w-12 h-12 text-primary/50 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground font-medium">Toate parcelele sunt deja asignate unor sectoare.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {unmappedParcels.map((parcel: any) => (
                  <div 
                    key={parcel.id}
                    className="flex items-center justify-between p-3 bg-card border border-border/50 rounded-xl hover:border-primary/50 cursor-pointer transition-all hover:shadow-md group"
                    onClick={() => {
                      handleBulkGroup(activeQuickAssignSectorId);
                      setSelectedIds([parcel.id]);
                    }}
                  >
                    <div className="overflow-hidden mr-2">
                      <div className="font-bold text-sm truncate">{parcel.name}</div>
                      <div className="text-[10px] text-muted-foreground font-bold">{parcel.areaHa} ha • {parcel.uat}</div>
                    </div>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <DialogFooter className="pt-4 border-t">
            <Button variant="outline" onClick={() => setIsQuickAssignOpen(false)} className="w-full sm:w-auto">Închide</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ParcelCard({ parcel, onEdit, onDelete, isSelected, isSelectionMode, onSelect, onMoveToSector }: any) {
  const latestPlan = parcel.cropPlans?.[0];

  return (
    <Card
      className={`group overflow-hidden border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-xl relative ${isSelected ? 'ring-2 ring-primary border-primary bg-primary/5 shadow-lg' : ''} ${isSelectionMode ? 'cursor-pointer active:scale-95' : ''}`}
      onClick={() => isSelectionMode && onSelect()}
      suppressHydrationWarning
    >
      {isSelectionMode && (
        <div className={`absolute top-4 right-4 z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-primary border-primary text-white scale-110 shadow-md' : 'bg-white/90 border-slate-300'}`}>
          {isSelected && <Check className="w-4 h-4" />}
        </div>
      )}
      <div className={`h-2 transition-colors ${isSelected ? 'bg-primary' : 'agral-gradient'}`} suppressHydrationWarning />
      <CardContent className="p-5" suppressHydrationWarning>
        <div className="flex items-start justify-between mb-3" suppressHydrationWarning>
          <div className="overflow-hidden" suppressHydrationWarning>
            <h3 className="font-bold text-foreground text-lg leading-tight truncate">{parcel.name}</h3>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold flex items-center gap-1.5">
              {parcel.cadastralCode && <span>ID: {parcel.cadastralCode}</span>}
              {parcel.cadastralNumber && (
                <>
                  {parcel.cadastralCode && <span className="opacity-30">•</span>}
                  <span>CAD: {parcel.cadastralNumber}</span>
                </>
              )}
              {!parcel.cadastralCode && !parcel.cadastralNumber && <span>Fărâ cod</span>}
            </p>
          </div>
          <Badge className={`text-[10px] uppercase font-bold border shrink-0 ${ownershipColors[parcel.ownership] || ""}`}>
            {parcel.ownership === "owned" ? "Propriu" : "Arendat"}
          </Badge>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4" suppressHydrationWarning>
          <div className="p-2.5 bg-muted/50 rounded-lg flex flex-col justify-center" suppressHydrationWarning>
            <div className="text-[10px] text-muted-foreground uppercase font-bold" suppressHydrationWarning>Suprafață</div>
            <div className="font-bold text-foreground text-sm truncate" suppressHydrationWarning>{Number(parcel.areaHa).toFixed(2)} ha</div>
          </div>
          <div className="p-2.5 bg-muted/50 rounded-lg flex flex-col justify-center" suppressHydrationWarning>
            <div className="text-[10px] text-muted-foreground uppercase font-bold" suppressHydrationWarning>Localitate</div>
            <div className="font-bold text-foreground text-sm truncate" suppressHydrationWarning>{parcel.uat || "-"}</div>
          </div>
          <div className="p-2.5 bg-muted/50 rounded-lg flex flex-col justify-center" suppressHydrationWarning>
            <div className="text-[10px] text-muted-foreground uppercase font-bold" suppressHydrationWarning>Carte Funciară</div>
            <div className="font-bold text-foreground text-sm truncate" suppressHydrationWarning>{parcel.cfNumber || "-"}</div>
          </div>
        </div>

        {latestPlan ? (
          <div className="space-y-2 mb-4" suppressHydrationWarning>
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl border border-green-100" suppressHydrationWarning>
              <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center text-lg shrink-0" suppressHydrationWarning>
                {cropIcons[latestPlan.cropType] || "🌱"}
              </div>
              <div className="overflow-hidden" suppressHydrationWarning>
                <div className="text-sm font-extrabold text-green-900 truncate" suppressHydrationWarning>{latestPlan.cropType}</div>
                <div className="text-[10px] text-green-600 font-bold uppercase tracking-wider" suppressHydrationWarning>
                  {latestPlan.status === 'sown' ? 'Semănat' :
                    latestPlan.status === 'growing' ? 'În vegetație' :
                      latestPlan.status === 'harvested' ? 'Recoltat' : 'Planificat'}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 mb-4 p-3 bg-gray-50 rounded-xl border border-gray-100 italic">
            <div className="h-8 w-8 rounded-lg bg-gray-200 flex items-center justify-center text-gray-400 shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <span className="text-xs text-muted-foreground">Fără recoltă activă</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-dashed">
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
            {!parcel.groupId && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1 px-2 text-primary font-bold hover:bg-primary/5"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(); // Fallback to edit or I could add a specialized popup
                }}
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="text-[10px]">Asignează</span>
              </Button>
            )}
          </div>
          <Link href={`/parcele/${parcel.id}`} onClick={(e) => isSelectionMode && e.preventDefault()}>
            <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-primary text-xs font-bold hover:bg-primary/5">
              Detalii complete
              <ChevronRight className="w-3 h-3" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

const cropIcons: Record<string, string> = {
  "Grâu": "🌾",
  "Porumb": "🌽",
  "Floarea Soarelui": "🌻",
  "Rapiță": "🟡",
  "Orz": "🌾",
  "Soia": "🟢",
  "Lucernă": "☘️",
  "Mazăre": "🫛",
  "Sfeclă de zahăr": "🥔",
  "Fâneață": "🌿",
  "Pârloagă": "🌫️"
};

