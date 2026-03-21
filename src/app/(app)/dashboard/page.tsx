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
    <div className="space-y-8 max-w-7xl mx-auto pb-10 min-h-screen p-4 md:p-8 rounded-[2.5rem]" suppressHydrationWarning>
      {/* Refined Header - Rendered immediately */}
      <div className="relative overflow-hidden rounded-[1.5rem] md:rounded-[2.5rem] bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 p-6 md:p-8 text-white shadow-2xl shadow-green-900/20" suppressHydrationWarning>
        <div className="absolute top-0 right-0 p-12 opacity-10 blur-2xl hidden md:block" suppressHydrationWarning>
          <Sprout className="w-64 h-64 rotate-12" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6" suppressHydrationWarning>
          <div suppressHydrationWarning>
            <div className="flex items-center gap-3 mb-2 md:mb-3" suppressHydrationWarning>
              <div className="h-1 w-1 rounded-full bg-white/40" suppressHydrationWarning />
              <span className="text-[10px] md:text-xs font-bold text-white/60 uppercase tracking-tighter" suppressHydrationWarning>
                {formatDate(new Date())}
              </span>
            </div>
            <h2 className="text-2xl md:text-4xl font-black tracking-tight mb-2" suppressHydrationWarning>Bună ziua, {firstName}!</h2>
            <p className="text-sm md:text-base text-green-100/70 font-medium max-w-md" suppressHydrationWarning>
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

  // Run ALL asynchronous data fetching in a massive parallel burst
  const [
    kpisResult,
    recentParcels,
    expiringContracts,
    weather,
    news,
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

    // 3: Weather
    getWeatherData(((org as any)?.baseLat ? Number((org as any).baseLat) : null) || countyCoords[(org as any)?.county || "Olt"].lat, ((org as any)?.baseLng ? Number((org as any).baseLng) : null) || countyCoords[(org as any)?.county || "Olt"].lon).catch(() => null),

    // 4: News
    getAgriNews(),

    // 5: System Alerts
    getSystemAlerts()
  ]);

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
      value: activeSeason?.startDate ? new Date(activeSeason.startDate).getFullYear().toString() : "2024",
      unit: "",
      desc: activeSeason?.name || "Niciun sezon activ",
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
    combinedAlerts.push({ type: "success", text: "Toate sistemele sunt în parametri optimi.", href: "#" });
  }

  const dashboardConfig = (dbUser as any)?.dashboardConfig;

  return (
    <>
      {/* KPI Section */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700" suppressHydrationWarning>
        {kpis.map((kpi) => (
          <Card key={kpi.title} className={cn("border-none shadow-lg hover:shadow-xl transition-all duration-300 group overflow-hidden", kpi.bg)} suppressHydrationWarning>
            <CardContent className="p-6 relative" suppressHydrationWarning>
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-500" suppressHydrationWarning>
                <kpi.icon className={cn("w-16 h-16", kpi.color)} />
              </div>
              <div className="flex items-start justify-between mb-4" suppressHydrationWarning>
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner", kpi.bg, kpi.color, "bg-white/50 border", kpi.border)} suppressHydrationWarning>
                  <kpi.icon className="w-6 h-6" />
                </div>
              </div>
              <div className="space-y-1" suppressHydrationWarning>
                <div className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60" suppressHydrationWarning>{kpi.title}</div>
                <div className="flex items-baseline gap-1" suppressHydrationWarning>
                  <span className="text-3xl font-black tracking-tighter text-foreground tabular-nums" suppressHydrationWarning>{kpi.value}</span>
                  <span className="text-xs font-bold text-muted-foreground uppercase" suppressHydrationWarning>{kpi.unit}</span>
                </div>
                <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-tighter" suppressHydrationWarning>{kpi.desc}</p>
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
