"use client";

import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Globe, MapPin, Loader2, Save } from "lucide-react";
import dynamic from "next/dynamic";

const MapPolygonPicker = dynamic(() => import("./MapPolygonPicker").then((mod) => mod.MapPolygonPicker), {
  ssr: false,
  loading: () => <div className="h-[300px] w-full bg-slate-100 animate-pulse rounded-xl border-2 border-slate-200 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
});

interface ParcelFormProps {
  initialData?: any;
  groups: any[];
  farmBase?: { lat: number; lng: number } | null;
  onSubmit: (formData: FormData) => Promise<void>;
  isSubmitting: boolean;
  onCancel: () => void;
}

export function ParcelForm({ initialData, groups, farmBase, onSubmit, isSubmitting, onCancel }: ParcelFormProps) {
  const [coordinates, setCoordinates] = useState<any>(initialData?.coordinates || null);
  const [area, setArea] = useState<number | "">(initialData?.areaHa || "");
  const [cadastralMetadata, setCadastralMetadata] = useState<any>({
    uat: initialData?.uat || "",
    cadastralNumber: initialData?.cadastralNumber || "",
    cfNumber: initialData?.cfNumber || ""
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (coordinates) {
      formData.set("coordinates", JSON.stringify(coordinates));
    }
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-xs font-black uppercase tracking-widest text-slate-500">Denumire Parcelă</Label>
          <Input id="name" name="name" defaultValue={initialData?.name} required className="h-12 rounded-xl border-slate-200 focus:ring-emerald-500" placeholder="ex: Tarla Nord - Lot A" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cadastralCode" className="text-xs font-black uppercase tracking-widest text-slate-500">Cod Intern</Label>
          <Input id="cadastralCode" name="cadastralCode" defaultValue={initialData?.cadastralCode} className="h-12 rounded-xl border-slate-200" placeholder="ex: TN-A" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="areaHa" className="text-xs font-black uppercase tracking-widest text-slate-500">Suprafață (ha)</Label>
          <Input id="areaHa" name="areaHa" type="number" step="0.01" value={area} onChange={(e) => setArea(e.target.value ? Number(e.target.value) : "")} required className="h-12 rounded-xl border-slate-200" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label htmlFor="groupId" className="text-xs font-black uppercase tracking-widest text-slate-500">Asignează în Sector</Label>
          <select id="groupId" name="groupId" defaultValue={initialData?.groupId || ""} className="w-full h-12 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500">
            <option value="">Fără sector (Nealocată)</option>
            {groups.map((g: any) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="landUse" className="text-xs font-black uppercase tracking-widest text-slate-500">Mod Folosință</Label>
          <select id="landUse" name="landUse" defaultValue={initialData?.landUse || "arabil"} className="w-full h-12 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700">
            <option value="arabil">Arabil</option>
            <option value="pasune">Pășune</option>
            <option value="vie">Vie</option>
            <option value="livada">Livadă</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="ownership" className="text-xs font-black uppercase tracking-widest text-slate-500">Regim Proprietate</Label>
          <select id="ownership" name="ownership" defaultValue={initialData?.ownership || "owned"} className="w-full h-12 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700">
            <option value="owned">Propriu (În proprietate)</option>
            <option value="rented">Arendat (Contract arendă)</option>
          </select>
        </div>
      </div>

      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
        <div className="flex items-center gap-2 text-emerald-600 font-black text-xs uppercase tracking-widest">
          <Globe className="w-4 h-4" /> Date Cadastrale (ANCPI)
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="uat" className="text-[10px] font-bold text-slate-400">UAT / Localitate</Label>
            <Input id="uat" name="uat" value={cadastralMetadata.uat} onChange={(e) => setCadastralMetadata({...cadastralMetadata, uat: e.target.value})} className="h-10 rounded-lg bg-white" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cadastralNumber" className="text-[10px] font-bold text-slate-400">Nr. Cadastral</Label>
            <Input id="cadastralNumber" name="cadastralNumber" value={cadastralMetadata.cadastralNumber} onChange={(e) => setCadastralMetadata({...cadastralMetadata, cadastralNumber: e.target.value})} className="h-10 rounded-lg bg-white" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cfNumber" className="text-[10px] font-bold text-slate-400">Nr. Carte Funciară</Label>
            <Input id="cfNumber" name="cfNumber" value={cadastralMetadata.cfNumber} onChange={(e) => setCadastralMetadata({...cadastralMetadata, cfNumber: e.target.value})} className="h-10 rounded-lg bg-white" />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Delimitare Geospațială</Label>
        <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-inner h-[400px]">
          <MapPolygonPicker
            onPolygonComplete={(geoJson, autoArea, metadata) => {
              setCoordinates(geoJson);
              if (autoArea > 0) setArea(autoArea);
              if (metadata) {
                setCadastralMetadata({
                  uat: metadata.uat || cadastralMetadata.uat,
                  cadastralNumber: metadata.cadastralNumber || cadastralMetadata.cadastralNumber,
                  cfNumber: metadata.cfNumber || cadastralMetadata.cfNumber
                });
              }
            }}
            baseLat={farmBase?.lat ?? null}
            baseLng={farmBase?.lng ?? null}
            initialPolygon={initialData?.coordinates}
          />
        </div>
        <p className="text-[10px] text-slate-400 font-bold italic">Sfat: Desenează conturul parcelei pe hartă pentru calcularea automată a suprafeței și identificarea datelor ANCPI.</p>
      </div>

      <div className="flex justify-end gap-4 pt-6 border-t border-slate-100">
        <Button type="button" variant="ghost" onClick={onCancel} className="h-12 px-8 rounded-xl font-black uppercase tracking-widest text-[10px]">Anulează</Button>
        <Button type="submit" disabled={isSubmitting} className="agral-gradient text-white h-12 px-10 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-600/20">
          {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Salvează Parcelă
        </Button>
      </div>
    </form>
  );
}
