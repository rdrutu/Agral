"use client";

import dynamic from "next/dynamic";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const AncpiMapTest = dynamic(() => import("@/components/test/AncpiMapTest"), { 
  ssr: false,
  loading: () => <div className="h-[600px] w-full bg-slate-100 animate-pulse rounded-2xl flex items-center justify-center text-slate-400 font-bold">Se încarcă harta...</div>
});

export default function AncpiTestPage() {
  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Link href="/" className="text-sm text-green-600 hover:underline flex items-center gap-2 mb-4 font-bold">
              <ArrowLeft className="w-4 h-4" /> Înapoi la aplicație
            </Link>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">
              Test Layer <span className="text-green-600">ANCPI</span>
            </h1>
            <p className="text-slate-500 font-medium">
              Verificarea integrării serviciilor de cadastru național (INSPIRE).
            </p>
          </div>
        </div>

        <AncpiMapTest />
      </div>
    </main>
  );
}
