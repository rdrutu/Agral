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
const todayTip = tips[new Date().getDate() % tips.length];

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
  const hour = new Date().getHours();
  let greeting = "Bună ziua";
  if (hour >= 5 && hour < 12) greeting = "Bună dimineața";
  else if (hour >= 18 || hour < 5) greeting = "Bună seara";

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10 min-h-screen p-4 md:p-8 rounded-[2.5rem]" suppressHydrationWarning>
      {/* Refined Header - Rendered immediately */}
      <div className="relative overflow-hidden rounded-[1.5rem] md:rounded-[2.5rem] bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 p-6 md:p-8 text-white shadow-2xl shadow-green-900/20" suppressHydrationWarning>
        <div className="absolute top-0 right-0 p-12 opacity-10 blur-2xl hidden md:block">
          <Sprout className="w-64 h-64 rotate-12" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2 md:mb-3">
              <div className="h-1 w-1 rounded-full bg-white/40" />
              <span className="text-[10px] md:text-xs font-bold text-white/60 uppercase tracking-tighter">
                {formatDate(new Date())}
              </span>
            </div>
            <h2 className="text-2xl md:text-4xl font-black tracking-tight mb-2">{greeting}, {firstName}!</h2>
            <p className="text-sm md:text-base text-green-100/70 font-medium max-w-md">
              Monitorizarea fermei tale este activă. Verifică situația actualizată mai jos.
            </p>
          </div>
        </div>
      </div>

      {/* Dynamic Content - Wrapped in Suspense so everything appears at once */}
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardDynamicContent dbUser={dbUser} />
      </Suspense>
    </div>
  );
}

async function DashboardDynamicContent({ dbUser }: { dbUser: any }) {
  const org = dbUser?.organization;
  const orgId = org?.id || "00000000-0000-0000-0000-000000000000";

  // 1. Fetch Real KPI Values
  const [totalArea, parcelCount, activeSeason, operationalExpenses, hrExpenses] = await Promise.all([
    prisma.parcel.aggregate({
      where: { orgId },
      _sum: { areaHa: true }
    }),
    prisma.parcel.count({
      where: { orgId }
    }),
    prisma.season.findFirst({
      where: { orgId, isActive: true } as any,
      orderBy: { startDate: "desc" }
    }),
    (prisma as any).agriculturalOperation?.aggregate({
      where: { orgId },
      _sum: { totalAreaHa: true }
    }),
    (prisma.user.aggregate({
      where: { orgId },
      _sum: { monthlySalary: true }
    }) as any)
  ]);

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
      value: activeSeason?.startDate ? new Date(activeSeason.startDate).getFullYear().toString() : "2024",
      unit: "",
      desc: activeSeason?.name || "Niciun sezon activ",
      icon: Sprout,
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-100/50"
    },
  ];

  // 2. Fetch Recent Parcels
  const recentParcels = await prisma.parcel.findMany({
    where: { orgId },
    orderBy: { createdAt: "desc" },
    take: 4,
    include: { cropPlans: { orderBy: { id: "desc" }, take: 1 } }
  });

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

  // 3. Simple Real Alerts
  const realAlerts = [];
  if (parcelCount === 0) {
    realAlerts.push({ type: "info", text: "Nu ai desenat nicio parcelă. Începe acum!", href: "/parcele" });
  }
  
  const expiringContracts = await (prisma as any).leaseContract?.findMany({
    where: { orgId, endDate: { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } },
    take: 2
  });
  
  expiringContracts?.forEach((c: any) => {
    realAlerts.push({ type: "warning", text: `Contractul cu ${c.landownerName} expiră curând!`, href: `/contracte` });
  });

  const county = (org as any)?.county || "Olt";
  const baseLat = (org as any)?.baseLat ? Number((org as any).baseLat) : null;
  const baseLng = (org as any)?.baseLng ? Number((org as any).baseLng) : null;
  
  const coords = (baseLat && baseLng) 
    ? { lat: baseLat, lon: baseLng }
    : (countyCoords[county] || countyCoords["Bucuresti"]);
    
  // Parallel fetch for external APIs
  const [weather, news, systemAlerts] = await Promise.all([
    getWeatherData(coords.lat, coords.lon),
    getAgriNews(),
    getSystemAlerts()
  ]);
  
  const combinedAlerts = [
    ...realAlerts,
    ...(systemAlerts || []).map((sa: any) => ({
      type: sa.type,
      text: sa.message,
      href: sa.link
    }))
  ];

  if (combinedAlerts.length === 0) {
    combinedAlerts.push({ type: "success", text: "Toate sistemele sunt în parametri optimi.", href: "#" });
  }

  const dashboardConfig = (dbUser as any)?.dashboardConfig;

  return (
    <>
      {/* KPI Section */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {kpis.map((kpi) => (
          <Card key={kpi.title} className={cn("border-none shadow-lg hover:shadow-xl transition-all duration-300 group overflow-hidden", kpi.bg)}>
            <CardContent className="p-6 relative">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
                <kpi.icon className={cn("w-16 h-16", kpi.color)} />
              </div>
              <div className="flex items-start justify-between mb-4">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner", kpi.bg, kpi.color, "bg-white/50 border", kpi.border)}>
                  <kpi.icon className="w-6 h-6" />
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60">{kpi.title}</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black tracking-tighter text-foreground tabular-nums">{kpi.value}</span>
                  <span className="text-xs font-bold text-muted-foreground uppercase">{kpi.unit}</span>
                </div>
                <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-tighter">{kpi.desc}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Interactive Bento Grid Layout */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
        <DashboardClient 
          weather={weather}
          county={county}
          news={news}
          realAlerts={combinedAlerts}
          todayTip={todayTip}
          recentParcels={serializedRecentParcels}
          statusColors={statusColors}
          initialConfig={dashboardConfig}
        />
      </div>
    </>
  );
}
