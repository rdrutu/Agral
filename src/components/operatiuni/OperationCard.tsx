"use client";

import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  TrendingUp, 
  FileText, 
  Trash2, 
  Tractor,
  Edit
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { Input } from "@/components/ui/input";

const opStatusColors: Record<string, string> = {
  planned: "bg-blue-100 text-blue-700 border-blue-200",
  in_progress: "bg-amber-100 text-amber-700 border-amber-200",
  completed: "bg-green-100 text-green-700 border-green-200",
};

interface OperationCardProps {
  op: any;
  orgName: string;
  editingRes: { id: string, val: string } | null;
  setEditingRes: (val: { id: string, val: string } | null) => void;
  handleUpdateTotalConsumed: (resId: string) => Promise<void>;
  handleEditOp: (op: any) => void;
  handleDeleteOp: (opId: string) => Promise<void>;
  generateOperationDeviz: (op: any, orgName: string) => void;
}

export const OperationCard = memo(function OperationCard({
  op,
  orgName,
  editingRes,
  setEditingRes,
  handleUpdateTotalConsumed,
  handleEditOp,
  handleDeleteOp,
  generateOperationDeviz
}: OperationCardProps) {
  return (
    <Card className="group overflow-hidden border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-xl">
      <div className="h-1.5 agral-gradient" />
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="overflow-hidden">
            <h3 className="font-black text-slate-900 text-lg leading-tight truncate">{op.name}</h3>
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-black flex items-center gap-1.5 mt-1">
              <Calendar className="w-3 h-3" />
              {formatDate(op.date)}
            </div>
          </div>
          <Badge className={cn("text-[10px] uppercase font-black border shrink-0 px-2 py-0.5 rounded-md", opStatusColors[op.status] || "")}>
            {op.status === "completed" ? "Finalizată" : "Planificată"}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl">
            <div className="text-[9px] text-slate-400 uppercase font-black tracking-wider">Suprafață</div>
            <div className="font-black text-slate-900 text-sm">{Number(op.totalAreaHa).toFixed(2)} ha</div>
          </div>
          <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl">
            <div className="text-[9px] text-slate-400 uppercase font-black tracking-wider">Parcele</div>
            <div className="font-black text-slate-900 text-sm">{op.parcels?.length || 0}</div>
          </div>
        </div>

        {op.parcels?.length > 0 && (
          <div className="text-[10px] text-muted-foreground font-bold truncate mb-3">
            {op.parcels.map((p: any) => p.parcel.name).join(", ")}
          </div>
        )}

        {op.type === "recoltat" && op.totalYield && (
          <div className="p-2.5 bg-amber-50 border border-amber-100 rounded-xl flex items-center justify-between text-sm mb-3">
            <div className="flex items-center gap-2 text-amber-800">
              <TrendingUp className="w-4 h-4" />
              <span className="font-black text-xs uppercase">Producție</span>
            </div>
            <div className="font-black text-amber-900">
              {Number(op.totalYield).toFixed(1)} T <span className="text-[9px] font-bold text-amber-600">({Number(op.yieldPerHa).toFixed(1)} t/ha)</span>
            </div>
          </div>
        )}

        {op.resources && op.resources.length > 0 && (
          <div className="border-t border-slate-100 pt-3 mt-1">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Input-uri aplicate</p>
            <div className="space-y-1.5">
              {op.resources.map((r: any) => {
                const initialCalc = r.quantityPerHa ? Number(r.quantityPerHa) * Number(op.totalAreaHa) : 0;
                const finalTotalText = r.totalConsumed ? Number(r.totalConsumed) : initialCalc;
                const isCustomized = !!r.totalConsumed;

                return (
                  <div key={r.id} className="flex flex-col gap-0.5 text-sm bg-slate-50 border border-slate-100 p-2.5 rounded-xl relative group">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-900 text-xs truncate">{r.name}</span>
                      {editingRes?.id === r.id ? (
                        <div className="flex items-center gap-1">
                          <Input type="number" step="0.1" className="h-6 w-16 text-right px-1 text-xs" value={editingRes?.val || ""} onChange={e => setEditingRes({ id: r.id, val: e.target.value })} />
                          <Button size="sm" className="h-6 px-2 text-xs" onClick={() => handleUpdateTotalConsumed(r.id)}>OK</Button>
                          <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => setEditingRes(null)}>X</Button>
                        </div>
                      ) : (
                        <div className="font-black text-primary text-xs cursor-pointer" onClick={() => setEditingRes({ id: r.id, val: finalTotalText.toString() })}>
                          <span className={isCustomized ? "text-amber-600" : ""}>
                            {finalTotalText.toFixed(1)} {r.unit}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="text-[9px] text-slate-400 font-bold flex justify-between">
                      <span>Normă: {Number(r.quantityPerHa).toFixed(1)} {r.unit}/ha</span>
                      {isCustomized && <span className="text-amber-600 italic">Ajustat</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex items-center justify-end pt-3 mt-3 border-t border-slate-100 gap-1.5">
          <Button 
            variant="ghost" size="sm" 
            className="h-8 gap-1.5 text-slate-600 text-[10px] font-black uppercase tracking-wider hover:bg-slate-50 rounded-lg" 
            onClick={() => generateOperationDeviz(op, orgName)}
          >
            <FileText className="w-3.5 h-3.5" /> Deviz PDF
          </Button>
          <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-primary text-[10px] font-black uppercase tracking-wider hover:bg-primary/5 rounded-lg" onClick={() => handleEditOp(op)}>
            <Edit className="w-3.5 h-3.5" /> Modifică
          </Button>
          <Button variant="ghost" size="sm" className="h-8 gap-1 text-destructive text-[10px] font-black uppercase tracking-wider hover:bg-destructive/5 rounded-lg" onClick={() => handleDeleteOp(op.id)}>
            <Trash2 className="w-3.5 h-3.5" /> Șterge
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});
