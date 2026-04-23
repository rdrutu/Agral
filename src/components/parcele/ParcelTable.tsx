"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, ChevronRight, MapPin } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface ParcelTableProps {
  parcels: any[];
  onEdit: (parcel: any) => void;
  onDelete: (id: string) => void;
}

export function ParcelTable({ parcels, onEdit, onDelete }: ParcelTableProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Denumire / ID</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Suprafață</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Cultură Activă</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Localitate / CF</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Proprietate</th>
              <th className="px-6 py-4 text-right px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Acțiuni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {parcels.map((parcel) => {
              const latestPlan = parcel.cropPlans?.[0];
              return (
                <tr key={parcel.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-black text-slate-900 text-sm">{parcel.name}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{parcel.cadastralCode || "Fără ID"}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-black text-slate-900 text-sm">{Number(parcel.areaHa).toFixed(2)} ha</div>
                  </td>
                  <td className="px-6 py-4">
                    {latestPlan ? (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-700">{latestPlan.cropType}</span>
                        <Badge variant="outline" className="text-[9px] font-black uppercase px-1.5 py-0 bg-emerald-50 text-emerald-600 border-emerald-100">
                          {latestPlan.status}
                        </Badge>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Niciuna</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs font-bold text-slate-600">{parcel.uat || "-"}</div>
                    <div className="text-[10px] text-slate-400">CF: {parcel.cfNumber || "-"}</div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge className={cn(
                      "text-[9px] font-black uppercase px-2 py-0.5 rounded-md border",
                      parcel.ownership === "owned" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-purple-50 text-purple-700 border-purple-100"
                    )}>
                      {parcel.ownership === "owned" ? "Propriu" : "Arendat"}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => onEdit(parcel)}>
                        <Pencil className="w-4 h-4 text-slate-400 hover:text-emerald-600" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => onDelete(parcel.id)}>
                        <Trash2 className="w-4 h-4 text-slate-400 hover:text-red-600" />
                      </Button>
                      <Link href={`/parcele/${parcel.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-emerald-600">
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
