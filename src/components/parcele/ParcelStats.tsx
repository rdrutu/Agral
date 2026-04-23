"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Sprout, Layers, Ruler } from "lucide-react";

interface ParcelStatsProps {
  totalCount: number;
  totalArea: number;
  groupCount: number;
}

export function ParcelStats({ totalCount, totalArea, groupCount }: ParcelStatsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <StatCard 
        icon={MapPin} 
        label="Total Parcele" 
        value={totalCount.toString()} 
        subValue="Înregistrate"
        color="text-emerald-600"
        bgColor="bg-emerald-50"
      />
      <StatCard 
        icon={Ruler} 
        label="Suprafață Totală" 
        value={`${totalArea.toFixed(1)} ha`} 
        subValue="Suprafață lucrată"
        color="text-indigo-600"
        bgColor="bg-indigo-50"
      />
      <StatCard 
        icon={Layers} 
        label="Sectoare" 
        value={groupCount.toString()} 
        subValue="Zone definite"
        color="text-amber-600"
        bgColor="bg-amber-50"
      />
      <StatCard 
        icon={Sprout} 
        label="Eficiență" 
        value="100%" 
        subValue="Toate mapate"
        color="text-sky-600"
        bgColor="bg-sky-50"
      />
    </div>
  );
}

function StatCard({ icon: Icon, label, value, subValue, color, bgColor }: any) {
  return (
    <Card className="border-none shadow-sm bg-white overflow-hidden group hover:shadow-md transition-all duration-500 rounded-2xl">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className={`p-2.5 rounded-xl ${bgColor} ${color} group-hover:scale-110 transition-transform`}>
            <Icon className="w-5 h-5" strokeWidth={1.5} />
          </div>
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{subValue}</div>
        </div>
        <div className="space-y-1">
          <div className="text-xs font-black uppercase tracking-widest text-slate-500">{label}</div>
          <div className="text-2xl font-black text-slate-900 tracking-tighter">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}
