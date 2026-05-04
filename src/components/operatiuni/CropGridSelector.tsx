"use client";

import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tractor, Sprout, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface CropGridSelectorProps {
  crops: string[];
  cropColors: Record<string, string>;
  onSelect: (crop: string) => void;
  onAddOperation: () => void;
}

export const CropGridSelector = memo(function CropGridSelector({
  crops,
  cropColors,
  onSelect,
  onAddOperation
}: CropGridSelectorProps) {
  return (
    <div className="space-y-8 py-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 text-primary font-black uppercase text-[10px] tracking-widest mb-1">
          <Tractor className="w-3.5 h-3.5" /> Jurnal Lucrări Agricole
        </div>
        <h2 className="text-3xl font-black text-foreground tracking-tight">Alege cultura pentru vizualizare</h2>
        <p className="text-muted-foreground text-sm">Selectează o cultură pentru a vedea istoricul lucrărilor și devizele asociate.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {crops.map((crop) => (
          <Card 
            key={crop} 
            className="group cursor-pointer hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden"
            onClick={() => onSelect(crop)}
          >
            <div className={cn("h-1.5", crop === "Toate" ? "bg-slate-400" : "agral-gradient")} />
            <CardContent className="p-8 flex flex-col items-center justify-center gap-4 text-center">
              <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300", cropColors[crop] || "bg-slate-300")}>
                {crop === "Toate" ? <Tractor className="w-7 h-7 text-white" /> : <Sprout className="w-7 h-7 text-white" />}
              </div>
              <div>
                <h3 className="text-lg font-black text-foreground tracking-tight">{crop}</h3>
                <p className="text-[10px] text-muted-foreground mt-1 font-bold uppercase tracking-widest">
                  {crop === "Toate" ? "Toate lucrările" : `Lucrări ${crop}`}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-white rounded-3xl p-8 border border-dashed border-border flex flex-col items-center justify-center gap-4 text-center">
          <div className="h-12 w-12 rounded-2xl agral-gradient flex items-center justify-center text-white">
            <Plus className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-black text-lg tracking-tight">Înregistrează o lucrare nouă</h4>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">Poți înregistra o operațiune nouă direct, fără a selecta în prealabil o cultură.</p>
          </div>
          <Button 
             className="agral-gradient text-white font-black uppercase tracking-widest text-[11px] h-12 px-8 rounded-2xl shadow-xl shadow-primary/20"
             onClick={onAddOperation}
          >
            <Plus className="w-4 h-4 mr-2" /> Adăugați Lucrare
          </Button>
      </div>
    </div>
  );
});
