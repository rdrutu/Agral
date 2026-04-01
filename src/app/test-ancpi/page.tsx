"use client";

import dynamic from "next/dynamic";
import { ArrowLeft, Map, Wifi, ShieldCheck } from "lucide-react";
import Link from "next/link";

const AncpiMapTest = dynamic(() => import("@/components/test/AncpiMapTest"), { 
  ssr: false,
  loading: () => <div className="h-[700px] w-full bg-slate-100 animate-pulse rounded-2xl flex items-center justify-center text-slate-400 font-bold">Se încarcă harta...</div>
});

export default function AncpiTestPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50/30">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-6 md:py-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 mb-6">
          <div className="space-y-1">
            <Link
              href="/"
              className="text-sm text-green-600 hover:text-green-700 hover:underline flex items-center gap-1.5 mb-3 font-bold transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Înapoi la platformă
            </Link>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              Explorer Cadastral <span className="text-green-600">ANCPI</span>
            </h1>
            <p className="text-slate-500 font-medium text-sm md:text-base max-w-xl">
              Vizualizează și selectează parcele cadastrale din registrul național. Date oficiale de la ANCPI și APIA.
            </p>
          </div>

          {/* Info Badges */}
          <div className="flex gap-2 shrink-0">
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-[10px] font-bold text-slate-500 shadow-sm">
              <Map className="w-3 h-3 text-green-500" />
              Multi-Select
            </div>
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-[10px] font-bold text-slate-500 shadow-sm">
              <Wifi className="w-3 h-3 text-blue-500" />
              Live Data
            </div>
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-[10px] font-bold text-slate-500 shadow-sm">
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              Date Oficiale
            </div>
          </div>
        </div>

        {/* Map Component */}
        <AncpiMapTest />

        {/* Footer info */}
        <div className="mt-4 flex flex-wrap items-center gap-4 text-[10px] text-slate-400 font-medium">
          <span>Surse de date: ANCPI Geoportal, APIA INSPIRE, ArcGIS World Imagery, OpenStreetMap</span>
          <span className="text-slate-300">|</span>
          <span>Proiecția: WGS 84 / EPSG:4326</span>
          <span className="text-slate-300">|</span>
          <span>© Agral {new Date().getFullYear()}</span>
        </div>
      </div>
    </main>
  );
}
