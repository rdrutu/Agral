"use client";

import React from "react";
import { Search, Filter, LayoutGrid, Map as MapIcon, Layers } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ParcelFiltersProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  filterGroup: string;
  setFilterGroup: (val: string) => void;
  filterCrop: string;
  setFilterCrop: (val: string) => void;
  groups: any[];
  availableCrops: string[];
  viewMode: "grid" | "map";
  setViewMode: (mode: "grid" | "map") => void;
  isGroupingEnabled: boolean;
  setIsGroupingEnabled: (val: boolean) => void;
}

export function ParcelFilters({
  searchQuery,
  setSearchQuery,
  filterGroup,
  setFilterGroup,
  filterCrop,
  setFilterCrop,
  groups,
  availableCrops,
  viewMode,
  setViewMode,
  isGroupingEnabled,
  setIsGroupingEnabled
}: ParcelFiltersProps) {
  return (
    <div className="space-y-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-in fade-in duration-700">
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full lg:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Caută denumire, ID sau tip sol..."
            className="pl-11 h-12 bg-slate-50 border-slate-100 rounded-xl font-medium focus:bg-white transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filters & View Modes */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
            <select
              value={filterGroup}
              onChange={(e) => setFilterGroup(e.target.value)}
              className="h-9 rounded-lg bg-transparent border-none text-xs font-black uppercase tracking-widest text-slate-600 focus:ring-0 outline-none px-2 cursor-pointer"
            >
              <option value="all">Toate Sectoarele</option>
              {groups.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
            <div className="w-px h-4 bg-slate-200 mx-1" />
            <select
              value={filterCrop}
              onChange={(e) => setFilterCrop(e.target.value)}
              className="h-9 rounded-lg bg-transparent border-none text-xs font-black uppercase tracking-widest text-slate-600 focus:ring-0 outline-none px-2 cursor-pointer"
            >
              <option value="all">Toate Culturile</option>
              {availableCrops.map((crop: any) => <option key={crop} value={crop}>{crop}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-900 p-1.5 rounded-xl shadow-lg shadow-slate-900/10">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              className={cn(
                "h-9 px-4 rounded-lg font-black text-[10px] tracking-widest uppercase transition-all",
                viewMode === "grid" ? "bg-white text-slate-950 shadow-sm" : "text-slate-400 hover:text-white"
              )}
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="w-3.5 h-3.5 mr-2" /> Listă
            </Button>
            <Button
              variant={viewMode === "map" ? "secondary" : "ghost"}
              size="sm"
              className={cn(
                "h-9 px-4 rounded-lg font-black text-[10px] tracking-widest uppercase transition-all",
                viewMode === "map" ? "bg-white text-slate-950 shadow-sm" : "text-slate-400 hover:text-white"
              )}
              onClick={() => setViewMode("map")}
            >
              <MapIcon className="w-3.5 h-3.5 mr-2" /> Hartă
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-12 px-5 rounded-xl font-black text-[10px] tracking-widest uppercase border-slate-200 transition-all",
              isGroupingEnabled ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "text-slate-600"
            )}
            onClick={() => setIsGroupingEnabled(!isGroupingEnabled)}
          >
            <Layers className="w-4 h-4 mr-2" strokeWidth={1.5} />
            {isGroupingEnabled ? "Grupare Activă" : "Grupare Dezactivată"}
          </Button>
        </div>
      </div>
    </div>
  );
}
