import { WeatherWidget, NewsWidget } from "@/components/dashboard/DashboardWidgets";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Sprout,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Banknote,
  Tractor,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getWeatherData, countyCoords } from "@/lib/weather";
import { getAgriNews } from "@/lib/actions/news";

const statusColors: Record<string, string> = {
  growing: "bg-green-100 text-green-700 border-green-200",
  planned: "bg-blue-100 text-blue-700 border-blue-200",
  harvested: "bg-gray-100 text-gray-600 border-gray-200",
  sown: "bg-amber-100 text-amber-700 border-amber-200",
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
  });

  // Izolare Superadmin
  if (dbUser?.role === 'superadmin') {
    redirect("/admin");
  }

  const firstName = dbUser?.firstName || "Fermier";
  const org = dbUser?.organization;

  // Izolare Superadmin
  if (dbUser?.role === 'superadmin') {
    redirect("/admin");
  }

  // Dashboard real logic
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
    (prisma as any).agriculturalOperation.aggregate({
      where: { orgId },
      _sum: { totalAreaHa: true }
    }),
    (prisma.user.aggregate({
      where: { orgId },
      _sum: { monthlySalary: true }
    }) as any)
  ]);

  const totalMonthlyCost = Number((hrExpenses as any)._sum.monthlySalary || 0);
  const totalOpArea = Number(operationalExpenses._sum.totalAreaHa || 0);

  const kpis = [
    {
      title: "Cheltuieli Lunare",
      value: totalMonthlyCost.toLocaleString(),
      unit: "lei",
      change: "Salarii & Gestiune",
      positive: false,
      icon: Banknote,
      color: "text-red-600",
      bg: "bg-red-50",
    },
    {
      title: "Activitate Totală",
      value: totalOpArea.toLocaleString(),
      unit: "ha",
      change: "Operațiuni înregistrate",
      positive: true,
      icon: Tractor,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      title: todayTip.split(' ')[0], // Dynamic
      value: "Info",
      unit: "Util",
      change: "Sfatul agronomului",
      positive: true,
      icon: CheckCircle2,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  // 2. Fetch Recent Parcels
  const recentParcels = await prisma.parcel.findMany({
    where: { orgId },
    orderBy: { createdAt: "desc" },
    take: 4,
    include: { cropPlans: { where: { status: "growing" }, take: 1 } }
  });

  // 3. Simple Real Alerts
  const realAlerts = [];
  if (parcelCount === 0) {
    realAlerts.push({ type: "info", text: "Nu ai desenat nicio parcelă. Începe acum!", href: "/parcele" });
  }
  
  // Contracts alerts
  const expiringContracts = await (prisma as any).leaseContract?.findMany({
    where: { orgId, endDate: { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } },
    take: 2
  });
  
  expiringContracts?.forEach((c: any) => {
    realAlerts.push({ type: "warning", text: `Contractul cu ${c.landownerName} expiră curând!`, href: `/contracte` });
  });

  if (realAlerts.length === 0) {
    realAlerts.push({ type: "success", text: "Toate sistemele sunt în parametri optimi.", href: "#" });
  }

  // Fetch Weather & News
  const county = (org as any)?.county || "Olt";
  const baseLat = (org as any)?.baseLat ? Number((org as any).baseLat) : null;
  const baseLng = (org as any)?.baseLng ? Number((org as any).baseLng) : null;
  
  const coords = (baseLat && baseLng) 
    ? { lat: baseLat, lon: baseLng }
    : (countyCoords[county] || countyCoords["Bucuresti"]);
    
  const weather = await getWeatherData(coords.lat, coords.lon);
  const news = await getAgriNews();

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Greeting */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-foreground">Bună ziua, {firstName}! 👋</h2>
          <p className="text-muted-foreground mt-1">Iată ce se întâmplă la ferma ta azi, {new Date().toLocaleDateString('ro-RO')}.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.title} className="card-hover">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 ${kpi.bg} rounded-xl flex items-center justify-center`}>
                  <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-foreground mb-0.5">
                {kpi.value}
                <span className="text-sm font-normal text-muted-foreground ml-1">{kpi.unit}</span>
              </div>
              <p className="text-sm text-foreground font-semibold mb-1">{kpi.title}</p>
              <p className={`text-xs ${kpi.positive ? "text-green-600" : "text-amber-600"}`}>
                {kpi.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Weather & News & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* News - 2 cols on tablet/desktop */}
        <div className="lg:col-span-2 order-2 lg:order-1">
          <NewsWidget news={news} />
        </div>

        {/* Weather - 1 col */}
        <div className="lg:col-span-1 order-1 lg:order-2">
          <WeatherWidget weather={weather} county={county} />
        </div>

        {/* Alerts - 1 col */}
        <div className="lg:col-span-1 order-3">
          <Card className="h-full">
            <CardHeader className="pb-3 px-4">
              <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-muted-foreground/60">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                Sistem Alerte
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 px-4 overflow-y-auto max-h-[350px]">
              {realAlerts.map((alert, i) => (
                <Link
                  key={i}
                  href={alert.href}
                  className={`flex items-start gap-3 p-3 rounded-xl border transition-all hover:translate-x-1 ${
                    alert.type === "warning"
                      ? "bg-amber-50/50 border-amber-100"
                      : alert.type === "success"
                      ? "bg-green-50/50 border-green-100"
                      : "bg-blue-50/50 border-blue-100"
                  }`}
                >
                  {alert.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                  ) : (
                    <AlertCircle className={`w-4 h-4 mt-0.5 shrink-0 ${alert.type === "warning" ? "text-amber-600" : "text-blue-600"}`} />
                  )}
                  <p className="text-xs text-foreground font-bold leading-tight">{alert.text}</p>
                </Link>
              ))}

              {/* Sfat agricol */}
              <div className="mt-2 p-3 bg-primary/5 border border-primary/10 rounded-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:scale-125 transition-transform">
                  <Sprout className="w-12 h-12 text-primary" />
                </div>
                <p className="text-[10px] font-black text-primary mb-1 uppercase tracking-tighter">💡 Sfatul agronomului</p>
                <p className="text-xs text-foreground font-medium leading-relaxed">{todayTip}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Parcels */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Parcele recente
          </CardTitle>
          <Link
            href="/parcele"
            className="text-sm text-primary font-semibold flex items-center gap-1 hover:underline"
          >
            Vezi toate <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-sm font-semibold text-muted-foreground pb-3 pr-4">Parcelă</th>
                  <th className="text-left text-sm font-semibold text-muted-foreground pb-3 pr-4">Suprafață</th>
                  <th className="text-left text-sm font-semibold text-muted-foreground pb-3 pr-4">Cultură</th>
                  <th className="text-left text-sm font-semibold text-muted-foreground pb-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentParcels.map((parcel) => (
                  <tr key={parcel.id} className="border-b border-border/50 last:border-0 hover:bg-accent/50 transition-colors">
                    <td className="py-3 pr-4">
                      <Link href={`/parcele/${parcel.id}`} className="font-semibold text-foreground hover:text-primary transition-colors">
                        {parcel.name}
                      </Link>
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">{Number(parcel.areaHa).toFixed(2)} ha</td>
                    <td className="py-3 pr-4 text-foreground truncate max-w-[120px]">
                      {parcel.cropPlans?.[0]?.cropType || "Fără cultură"}
                    </td>
                    <td className="py-3">
                      <Badge
                        className={`text-[10px] uppercase font-bold border ${statusColors[parcel.cropPlans?.[0]?.status || 'planned'] || "bg-gray-100 text-gray-600"}`}
                      >
                        {parcel.cropPlans?.[0]?.status || "Planificat"}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {recentParcels.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-muted-foreground italic">
                      Nu ai adăugat parcele încă.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
