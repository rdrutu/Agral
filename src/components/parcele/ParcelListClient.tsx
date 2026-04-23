"use client";

import { useState } from "react";
import { Plus, MapPin, Loader2, List, LayoutGrid, Table as TableIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";

// Components
import { ParcelStats } from "./ParcelStats";
import { ParcelFilters } from "./ParcelFilters";
import { ParcelCard } from "./ParcelCard";
import { ParcelTable } from "./ParcelTable";
import { ParcelForm } from "./ParcelForm";

// Actions
import {
  getParcels,
  deleteParcel,
  createParcel,
  updateParcel,
  createParcelGroup,
  deleteParcelGroup,
  bulkUpdateParcels
} from "@/lib/actions/parcels";

// Dynamic Imports for heavy map components
const AllParcelsMapClient = dynamic(() => import("./AllParcelsMapClient"), {
  ssr: false,
  loading: () => <div className="h-[500px] w-full bg-slate-100 animate-pulse rounded-2xl flex items-center justify-center border-2 border-slate-200"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
});

// UI Components
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";

export default function ParcelListClient({
  initialParcels,
  initialGroups = [],
  farmBase
}: {
  initialParcels: any[];
  initialGroups?: any[];
  farmBase?: { lat: number; lng: number } | null;
}) {
  const [parcels, setParcels] = useState(initialParcels);
  const [groups, setGroups] = useState(initialGroups);
  const [viewMode, setViewMode] = useState<"grid" | "map" | "table">("grid");
  const [isGroupingEnabled, setIsGroupingEnabled] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterGroup, setFilterGroup] = useState<string>("all");
  const [filterCrop, setFilterCrop] = useState<string>("all");

  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingParcel, setEditingParcel] = useState<any>(null);

  // Derived Data
  const filtered = parcels.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.cadastralCode?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.cadastralNumber?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.cfNumber?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchGroup = filterGroup === "all" || p.groupId === filterGroup;
    const matchCrop = filterCrop === "all" || (p.cropPlans?.[0]?.cropType === filterCrop);
    return matchSearch && matchGroup && matchCrop;
  });

  const availableCrops = Array.from(new Set(parcels.map(p => p.cropPlans?.[0]?.cropType).filter(Boolean))) as string[];
  const totalArea = parcels.reduce((sum, p) => sum + Number(p.areaHa), 0);

  // Handlers
  const handleDeleteParcel = async (id: string) => {
    if (!confirm("Ești sigur că vrei să ștergi această parcelă?")) return;
    try {
      await deleteParcel(id);
      setParcels(prev => prev.filter(p => p.id !== id));
      toast.success("Parcelă ștearsă");
    } catch (e) { toast.error("Eroare la ștergere"); }
  };

  const handleFormSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    try {
      if (editingParcel) {
        const data = {
          name: formData.get("name") as string,
          cadastralCode: formData.get("cadastralCode") as string,
          areaHa: parseFloat(formData.get("areaHa") as string),
          groupId: (formData.get("groupId") as string) || null,
          landUse: formData.get("landUse") as string,
          ownership: formData.get("ownership") as string,
          uat: formData.get("uat") as string,
          cadastralNumber: formData.get("cadastralNumber") as string,
          cfNumber: formData.get("cfNumber") as string,
          coordinates: formData.get("coordinates") ? JSON.parse(formData.get("coordinates") as string) : undefined
        };
        await updateParcel(editingParcel.id, data);
        toast.success("Parcelă actualizată");
      } else {
        await createParcel(formData);
        toast.success("Parcelă creată");
      }
      
      const updated = await getParcels();
      setParcels(updated);
      setIsAddFormOpen(false);
      setEditingParcel(null);
    } catch (e) {
      toast.error("Eroare la salvare");
      console.error(e);
    } finally {
      setIsSubmitting(false);
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

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20 px-4 md:px-0" suppressHydrationWarning>
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6" suppressHydrationWarning>
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-xl shadow-emerald-600/20">
              <MapPin className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Command Center: <span className="text-emerald-600">Parcele</span></h1>
          </div>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em] ml-1">Gestiune Tehnică și Monitorizare Geospațială</p>
        </div>
        
        <Button 
          className="agral-gradient text-white font-black uppercase tracking-widest text-[11px] h-14 px-8 rounded-2xl shadow-xl shadow-emerald-600/20 hover:scale-[1.02] active:scale-95 transition-all"
          onClick={() => setIsAddFormOpen(true)}
        >
          <Plus className="w-5 h-5 mr-2" strokeWidth={3} /> Adaugă Parcelă
        </Button>
      </div>

      {/* 2. Stats Dashboard */}
      <ParcelStats 
        totalCount={parcels.length} 
        totalArea={totalArea} 
        groupCount={groups.length} 
      />

      {/* 3. Filtering & View Switchers */}
      <ParcelFilters 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterGroup={filterGroup}
        setFilterGroup={setFilterGroup}
        filterCrop={filterCrop}
        setFilterCrop={setFilterCrop}
        groups={groups}
        availableCrops={availableCrops}
        viewMode={viewMode === "map" ? "map" : "grid"}
        setViewMode={(mode) => setViewMode(mode as any)}
        isGroupingEnabled={isGroupingEnabled}
        setIsGroupingEnabled={setIsGroupingEnabled}
      />

      {/* 4. Main View Renderer */}
      {viewMode === "map" ? (
        <div className="rounded-[2.5rem] overflow-hidden border border-slate-200 shadow-2xl h-[700px] animate-in zoom-in-95 duration-700">
          <AllParcelsMapClient parcels={parcels} groups={groups} farmBase={farmBase} />
        </div>
      ) : viewMode === "table" ? (
        <ParcelTable parcels={filtered} onEdit={(p) => { setEditingParcel(p); setIsAddFormOpen(true); }} onDelete={handleDeleteParcel} />
      ) : (
        <div className="space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          {isGroupingEnabled ? (
            <>
              {groupedParcels.map((group) => (
                <div key={group.id} className="space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white font-black text-sm shadow-lg">
                      {group.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight">{group.name}</h3>
                      <div className="flex items-center gap-2">
                        <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{group.parcels.length} Parcele</div>
                        <div className="w-1 h-1 rounded-full bg-slate-300" />
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          {group.parcels.reduce((s: number, p: any) => s + Number(p.areaHa), 0).toFixed(2)} ha
                        </div>
                      </div>
                    </div>
                    <div className="h-px flex-1 bg-slate-100" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {group.parcels.map((parcel: any) => (
                      <ParcelCard
                        key={parcel.id}
                        parcel={parcel}
                        onEdit={() => { setEditingParcel(parcel); setIsAddFormOpen(true); }}
                        onDelete={() => handleDeleteParcel(parcel.id)}
                      />
                    ))}
                    {/* Quick Add Placeholder */}
                    <button 
                      onClick={() => setIsAddFormOpen(true)}
                      className="group relative h-full min-h-[200px] rounded-3xl border-2 border-dashed border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/30 transition-all flex flex-col items-center justify-center gap-3 p-8"
                    >
                      <div className="h-12 w-12 rounded-full bg-slate-100 group-hover:bg-emerald-500 group-hover:text-white flex items-center justify-center transition-colors">
                        <Plus className="w-6 h-6" />
                      </div>
                      <div className="text-xs font-black uppercase tracking-widest text-slate-400 group-hover:text-emerald-600">Adaugă în sector</div>
                    </button>
                  </div>
                </div>
              ))}

              {unmappedParcels.length > 0 && (
                <div className="space-y-8 mt-12">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 font-black text-sm">
                      ?
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-400 tracking-tight">Nealocate</h3>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{unmappedParcels.length} Parcele</div>
                    </div>
                    <div className="h-px flex-1 bg-slate-100" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {unmappedParcels.map((parcel: any) => (
                      <ParcelCard
                        key={parcel.id}
                        parcel={parcel}
                        onEdit={() => { setEditingParcel(parcel); setIsAddFormOpen(true); }}
                        onDelete={() => handleDeleteParcel(parcel.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filtered.map((parcel: any) => (
                <ParcelCard
                  key={parcel.id}
                  parcel={parcel}
                  onEdit={() => { setEditingParcel(parcel); setIsAddFormOpen(true); }}
                  onDelete={() => handleDeleteParcel(parcel.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. Empty State */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
          <div className="h-20 w-20 rounded-3xl bg-slate-200 flex items-center justify-center text-slate-400 mb-6">
            <MapPin className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">Nu am găsit nicio parcelă</h3>
          <p className="text-sm text-slate-500 font-bold mt-2">Ajustează filtrele sau adaugă o parcelă nouă.</p>
          <Button onClick={() => setIsAddFormOpen(true)} variant="outline" className="mt-8 h-12 px-8 rounded-xl font-black uppercase tracking-widest text-[10px] border-slate-200">
            Adaugă prima parcelă
          </Button>
        </div>
      )}

      {/* 6. Floating Persistent Controls */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-950/90 backdrop-blur-xl border border-white/10 p-2.5 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] z-50 flex items-center gap-1.5 transition-all hover:scale-105">
        <ViewModeButton active={viewMode === "grid"} onClick={() => setViewMode("grid")} icon={LayoutGrid} label="GRID" />
        <ViewModeButton active={viewMode === "table"} onClick={() => setViewMode("table")} icon={TableIcon} label="TABLE" />
        <ViewModeButton active={viewMode === "map"} onClick={() => setViewMode("map")} icon={MapPin} label="MAP" />
      </div>

      {/* 7. Add/Edit Modal */}
      <Dialog open={isAddFormOpen} onOpenChange={(open) => { setIsAddFormOpen(open); if(!open) setEditingParcel(null); }}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden">
          <div className="bg-white p-8 md:p-12">
            <DialogHeader className="mb-10">
              <div className="flex items-center gap-4 mb-2">
                 <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Plus className="w-5 h-5" />
                 </div>
                 <DialogTitle className="text-3xl font-black text-slate-900 tracking-tighter">
                   {editingParcel ? "Editare Parcelă" : "Parcelă Nouă"}
                 </DialogTitle>
              </div>
              <DialogDescription className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                {editingParcel ? "Actualizează detaliile tehnice ale parcelei selectate." : "Înregistrează o nouă suprafață în sistemul de management."}
              </DialogDescription>
            </DialogHeader>
            
            <ParcelForm 
              initialData={editingParcel}
              groups={groups}
              farmBase={farmBase}
              onSubmit={handleFormSubmit}
              isSubmitting={isSubmitting}
              onCancel={() => { setIsAddFormOpen(false); setEditingParcel(null); }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ViewModeButton({ active, onClick, icon: Icon, label }: any) {
  return (
    <Button 
      variant="ghost" 
      size="sm" 
      className={cn(
        "rounded-xl h-12 px-6 font-black text-[10px] tracking-[0.2em] transition-all", 
        active ? "bg-white text-slate-900 shadow-xl" : "text-white/60 hover:text-white hover:bg-white/10"
      )}
      onClick={onClick}
    >
      <Icon className="w-4 h-4 mr-2" /> {label}
    </Button>
  );
}
