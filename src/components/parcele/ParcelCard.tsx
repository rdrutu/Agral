"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Pencil, Trash2, Layers, ChevronRight, Check } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

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

const ownershipColors: Record<string, string> = {
  owned: "bg-primary/10 text-primary border-primary/20",
  rented: "bg-purple-100 text-purple-700 border-purple-200",
};

export function ParcelCard({ 
  parcel, 
  onEdit, 
  onDelete, 
  isSelected, 
  isSelectionMode, 
  onSelect 
}: any) {
  const latestPlan = parcel.cropPlans?.[0];

  return (
    <Card
      className={cn(
        "group overflow-hidden border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-xl relative",
        isSelected ? 'ring-2 ring-primary border-primary bg-primary/5 shadow-lg' : '',
        isSelectionMode ? 'cursor-pointer active:scale-95' : ''
      )}
      onClick={() => isSelectionMode && onSelect()}
    >
      {isSelectionMode && (
        <div className={cn(
          "absolute top-4 right-4 z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
          isSelected ? 'bg-primary border-primary text-white scale-110 shadow-md' : 'bg-white/90 border-slate-300'
        )}>
          {isSelected && <Check className="w-4 h-4" />}
        </div>
      )}
      <div className={cn("h-2 transition-colors", isSelected ? 'bg-primary' : 'agral-gradient')} />
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="overflow-hidden">
            <h3 className="font-black text-slate-900 text-lg leading-tight truncate">{parcel.name}</h3>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black flex items-center gap-1.5 mt-1">
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
          <Badge className={cn("text-[10px] uppercase font-black border shrink-0 px-2 py-0.5 rounded-md", ownershipColors[parcel.ownership] || "")}>
            {parcel.ownership === "owned" ? "Propriu" : "Arendat"}
          </Badge>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="p-2 bg-slate-50 border border-slate-100 rounded-xl flex flex-col justify-center">
            <div className="text-[9px] text-slate-400 uppercase font-black tracking-wider">Suprafață</div>
            <div className="font-black text-slate-900 text-xs truncate">{Number(parcel.areaHa).toFixed(2)} ha</div>
          </div>
          <div className="p-2 bg-slate-50 border border-slate-100 rounded-xl flex flex-col justify-center">
            <div className="text-[9px] text-slate-400 uppercase font-black tracking-wider">UAT</div>
            <div className="font-black text-slate-900 text-xs truncate">{parcel.uat || "-"}</div>
          </div>
          <div className="p-2 bg-slate-50 border border-slate-100 rounded-xl flex flex-col justify-center">
            <div className="text-[9px] text-slate-400 uppercase font-black tracking-wider">C.F.</div>
            <div className="font-black text-slate-900 text-xs truncate">{parcel.cfNumber || "-"}</div>
          </div>
        </div>

        {latestPlan ? (
          <div className="mb-4">
            <div className="flex items-center gap-2 p-2.5 bg-emerald-50 rounded-xl border border-emerald-100/50">
              <div className="h-9 w-9 rounded-lg bg-white shadow-sm flex items-center justify-center text-xl shrink-0">
                {cropIcons[latestPlan.cropType] || "🌱"}
              </div>
              <div className="overflow-hidden">
                <div className="text-sm font-black text-emerald-900 truncate">{latestPlan.cropType}</div>
                <div className="text-[9px] text-emerald-600 font-black uppercase tracking-widest">
                  {latestPlan.status === 'sown' ? 'Semănat' :
                    latestPlan.status === 'growing' ? 'În vegetație' :
                      latestPlan.status === 'harvested' ? 'Recoltat' : 'Planificat'}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 mb-4 p-2.5 bg-slate-50 rounded-xl border border-slate-100 italic">
            <div className="h-9 w-9 rounded-lg bg-white shadow-sm flex items-center justify-center text-slate-300 shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <span className="text-[11px] text-slate-400 font-bold">Fără recoltă activă</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div className="flex gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
            >
              <Pencil className="w-4 h-4" strokeWidth={1.5} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 className="w-4 h-4" strokeWidth={1.5} />
            </Button>
          </div>
          <Link href={`/parcele/${parcel.id}`} onClick={(e) => isSelectionMode && e.preventDefault()}>
            <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-emerald-600 text-[11px] font-black uppercase tracking-wider hover:bg-emerald-50 rounded-lg">
              Detalii
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
