import { WeatherWidget, NewsWidget, QuickActionsWidget } from "@/components/dashboard/DashboardWidgets";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Sprout,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Zap,
  Banknote,
  Tractor,
  Calendar
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getWeatherData, countyCoords } from "@/lib/weather";
import { getAgriNews } from "@/lib/actions/news";
import { cn, formatDate } from "@/lib/utils";
import { Suspense } from "react";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { getSystemAlerts } from "@/lib/actions/notifications";

const statusColors: Record<string, string> = {
  growing: "bg-emerald-100 text-emerald-700 border-emerald-200/50",
  planned: "bg-sky-100 text-sky-700 border-sky-200/50",
  harvested: "bg-slate-100 text-slate-600 border-slate-200/50",
  sown: "bg-amber-100 text-amber-700 border-amber-200/50",
};

const tips = [
  "🌱 Primăvara, evitați tratamentele în zilele cu vânt > 15 km/h pentru a preveni deriva.",
  "🌽 Porumbul semănat la 35,000 boabe/ha produce cu 8-12% mai mult decât la 28,000.",
  "💧 Irigarea înainte de antesis la grâu crește producția cu 400-600 kg/ha.",
  "🐝 Tratamentele fitosanitare aplicate seara protejează polenizatorii.",
];
const todayTip = tips[0]; // Set a stable default for SSR

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: { organization: true }
  }) as any;

  if (dbUser?.role === 'superadmin') {
    redirect("/admin");
  }
  if (dbUser?.role === 'moderator') {
    redirect("/moderator");
  }

  const firstName = dbUser?.firstName || "Fermier";
  const hour = 12; // Stable default for SSR
  let greeting = "Bună ziua";

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10 min-h-screen p-4 md:p-8 relative overflow-hidden" suppressHydrationWarning>
      {/* Background Layer */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <Image 
          src="/dashboard_bg.png" 
          alt="Dashboard Background" 
          fill 
          className="object-cover opacity-10 blur-[40px] scale-105"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/0 via-background/60 to-background" />
      </div>

      {/* Dynamic Content - Wrapped in Suspense so everything appears at once */}
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardDynamicContent dbUser={dbUser} firstName={firstName} />
      </Suspense>
    </div>
  );
}

async function DashboardDynamicContent({ dbUser, firstName }: { dbUser: any, firstName: string }) {
  // 1. FAST: Auth & Organization logic (already done in parent or above)
  const org = dbUser?.organization;
  const orgId = org?.id || "00000000-0000-0000-0000-000000000000";

  // 2. MEDIUM: Database queries - these are relatively fast, we await them together
  const [
    kpisResult,
    recentParcels,
    expiringContracts,
    systemAlerts
  ] = await Promise.all([
    // 0: KPIs (nested Promise.all)
    Promise.all([
      prisma.parcel.aggregate({ where: { orgId }, _sum: { areaHa: true } }),
      prisma.parcel.count({ where: { orgId } }),
      prisma.season.findFirst({ where: { orgId, isActive: true } as any, orderBy: { startDate: "desc" } }),
      (prisma as any).agriculturalOperation?.aggregate({ where: { orgId }, _sum: { totalAreaHa: true } }),
      (prisma.user.aggregate({ where: { orgId }, _sum: { monthlySalary: true } }) as any)
    ]),
    
    // 1: Recent Parcels
    prisma.parcel.findMany({
      where: { orgId },
      orderBy: { createdAt: "desc" },
      take: 4,
      include: { cropPlans: { orderBy: { id: "desc" }, take: 1 } }
    }),

    // 2: Expiring Contracts
    (prisma as any).leaseContract?.findMany({
      where: { orgId, endDate: { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } },
      take: 2
    }),

    // 3: System Alerts
    getSystemAlerts()
  ]);

  // 3. SLOW: External fetches - DO NOT AWAIT, pass as promises
  const weatherPromise = getWeatherData(
    ((org as any)?.baseLat ? Number((org as any).baseLat) : null) || countyCoords[(org as any)?.county || "Olt"].lat, 
    ((org as any)?.baseLng ? Number((org as any).baseLng) : null) || countyCoords[(org as any)?.county || "Olt"].lon
  ).catch(() => null);

  const newsPromise = getAgriNews();

  const [totalArea, parcelCount, activeSeason, operationalExpenses, hrExpenses] = kpisResult;

  const totalMonthlyCost = Number((hrExpenses as any)._sum.monthlySalary || 0);
  const totalOpArea = Number(operationalExpenses?._sum.totalAreaHa || 0);

  const kpis = [
    {
      title: "Cheltuieli Lunare",
      value: totalMonthlyCost.toLocaleString(),
      unit: "lei",
      desc: "Salarii & Admin",
      icon: Banknote,
      color: "text-rose-600",
      bg: "bg-rose-50",
      border: "border-rose-100/50"
    },
    {
      title: "Activitate Totală",
      value: totalOpArea.toLocaleString(),
      unit: "ha",
      desc: "Lucrări înregistrate",
      icon: Tractor,
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-100/50"
    },
    {
      title: "Suprafață Totală",
      value: Number(totalArea._sum.areaHa || 0).toFixed(1),
      unit: "ha",
      desc: `${parcelCount} parcele active`,
      icon: MapPin,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-100/50"
    },
    {
      title: "Sezon Activ",
      value: activeSeason?.startDate ? new Date(activeSeason.startDate).getFullYear().toString() : "---",
      unit: "",
      desc: activeSeason?.name || "Niciun sezon definit",
      icon: Sprout,
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-100/50"
    },
  ];

  const county = (org as any)?.county || "Olt";
  
  const serializedRecentParcels = (recentParcels as any[]).map(p => ({
    ...p,
    areaHa: Number(p.areaHa),
    cropPlans: (p.cropPlans || []).map((cp: any) => ({
      ...cp,
      sownAreaHa: Number(cp.sownAreaHa),
      estimatedYieldTha: Number(cp.estimatedYieldTha || 0),
      actualYieldTha: Number(cp.actualYieldTha || 0),
    }))
  }));

  const realAlerts: any[] = [];
  if (parcelCount === 0) {
    realAlerts.push({ type: "info", text: "Nu ai desenat nicio parcelă. Începe acum!", href: "/parcele" });
  }
  
  expiringContracts?.forEach((c: any) => {
    realAlerts.push({ type: "warning", text: `Contractul cu ${c.landownerName} expiră curând!`, href: `/contracte` });
  });

  const combinedAlerts = [
    ...realAlerts,
    ...(systemAlerts || []).map((sa: any) => ({
      type: sa.type,
      text: sa.message,
      href: sa.link
    }))
  ];

  if (combinedAlerts.length === 0) {
    combinedAlerts.push({ type: "success", text: "Sistemul nu a detectat nicio alertă activă.", href: "#" });
  }

  const dashboardConfig = (dbUser as any)?.dashboardConfig;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-900 shadow-xl group border border-white/10" suppressHydrationWarning>
        <Image 
          src="/dashboard_bg.png" 
          alt="Hero" 
          fill 
          className="object-cover opacity-60 group-hover:scale-105 transition-transform duration-[15s] ease-out"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-900/40 to-transparent" />
        
        <div className="relative z-10 p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6" suppressHydrationWarning>
          <div className="space-y-3" suppressHydrationWarning>
            <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-4 duration-700" suppressHydrationWarning>
              <span className="text-xs font-bold text-white/60 uppercase tracking-widest" suppressHydrationWarning>
                {formatDate(new Date())}
              </span>
            </div>
            
            <div className="space-y-1 animate-in fade-in slide-in-from-left-4 duration-700 delay-100" suppressHydrationWarning>
              <h2 className="text-2xl md:text-4xl font-black tracking-tight text-white leading-none font-sans" suppressHydrationWarning>
                Salut, <span className="text-emerald-400">{firstName}</span>.
              </h2>
              <p className="text-sm md:text-base text-slate-300 font-medium max-w-lg" suppressHydrationWarning>
                Sistemul nu a detectat nicio alertă activă. Ai <span className="text-white font-bold">{combinedAlerts.length} notificări</span> de verificat.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300" suppressHydrationWarning>
        {kpis.map((kpi, idx) => (
          <Card 
            key={kpi.title} 
            className={cn(
              "border border-slate-200 shadow-md transition-all duration-500 group overflow-hidden bg-white hover:shadow-xl hover:-translate-y-1 rounded-2xl",
            )} 
            suppressHydrationWarning
          >
            <CardContent className="p-6 relative" suppressHydrationWarning>
              <div className="flex items-start justify-between mb-4" suppressHydrationWarning>
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500 group-hover:scale-110", 
                  kpi.bg, kpi.color, "border border-slate-100"
                )} suppressHydrationWarning>
                  <kpi.icon className="w-6 h-6" strokeWidth={1.5} />
                </div>
              </div>
              
              <div className="space-y-1" suppressHydrationWarning>
                <div className="text-xs font-black uppercase tracking-widest text-slate-600" suppressHydrationWarning>{kpi.title}</div>
                <div className="flex items-baseline gap-1.5" suppressHydrationWarning>
                  <span className="text-3xl font-black tracking-tighter text-slate-900 tabular-nums" suppressHydrationWarning>{kpi.value}</span>
                  <span className="text-sm font-black text-slate-400 uppercase tracking-widest">{kpi.unit}</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-tight" suppressHydrationWarning>{kpi.desc}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Interactive Bento Grid Layout */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
        <DashboardClient 
          weatherPromise={weatherPromise}
          county={county}
          newsPromise={newsPromise}
          realAlerts={combinedAlerts}
          todayTip={todayTip}
          recentParcels={serializedRecentParcels}
          statusColors={statusColors}
          initialConfig={dashboardConfig}
        />
      </div>
    </div>
  );
}
