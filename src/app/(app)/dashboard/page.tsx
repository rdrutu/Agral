import { WeatherWidget } from "@/components/dashboard/WeatherWidget";
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
} from "lucide-react";
import Link from "next/link";

const kpis = [
  {
    title: "Total Hectare",
    value: "320",
    unit: "ha",
    change: "+12 față de sezonul trecut",
    positive: true,
    icon: MapPin,
    color: "text-green-600",
    bg: "bg-green-50",
  },
  {
    title: "Parcele Active",
    value: "47",
    unit: "parcele",
    change: "3 parcele adăugate recent",
    positive: true,
    icon: Sprout,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    title: "Sezon Activ",
    value: "2025-2026",
    unit: "toamnă-primăvară",
    change: "8 luni rămase",
    positive: true,
    icon: Clock,
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    title: "Cheltuieli Sezon",
    value: "68,400",
    unit: "RON",
    change: "71% din buget utilizat",
    positive: false,
    icon: TrendingUp,
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
];

const recentParcels = [
  { id: 1, name: "La Iaz — Lot A", area: 45.2, crop: "Grâu de toamnă", status: "growing", statusLabel: "În creștere" },
  { id: 2, name: "Câmpia Dunăre", area: 78.5, crop: "Porumb", status: "planned", statusLabel: "Planificat" },
  { id: 3, name: "Dealul Mic", area: 12.3, crop: "Floarea soarelui", status: "harvested", statusLabel: "Recoltat" },
  { id: 4, name: "Luncă Sud", area: 34.8, crop: "Rapiță", status: "growing", statusLabel: "În creștere" },
];

const alerts = [
  { type: "warning", text: "Contract arendă — Ion Vasile expiră în 14 zile", href: "/contracte" },
  { type: "info", text: "Fertilizare planificată pentru Câmpia Dunăre — Luni, 20 Mar", href: "/sezoane" },
  { type: "success", text: "Plata arendă primită de la Maria Ionescu — 1,200 RON", href: "/contracte" },
];

const tips = [
  "🌱 Primăvara, evitați tratamentele în zilele cu vânt > 15 km/h pentru a preveni deriva.",
  "🌽 Porumbul semănat la 35,000 boabe/ha produce cu 8-12% mai mult decât la 28,000.",
  "💧 Irigarea înainte de antesis la grâu crește producția cu 400-600 kg/ha.",
  "🐝 Tratamentele fitosanitare aplicate seara protejează polenizatorii.",
];

const todayTip = tips[new Date().getDate() % tips.length];

const statusColors: Record<string, string> = {
  growing: "bg-green-100 text-green-700 border-green-200",
  planned: "bg-blue-100 text-blue-700 border-blue-200",
  harvested: "bg-gray-100 text-gray-600 border-gray-200",
  sown: "bg-amber-100 text-amber-700 border-amber-200",
};

export default function DashboardPage() {
  return (
    <div className="space-y-6 max-w-7xl">
      {/* Greeting */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-foreground">Bună ziua, Ion! 👋</h2>
          <p className="text-muted-foreground mt-1">Iată ce se întâmplă la ferma ta azi, 16 Martie 2026.</p>
        </div>
        <Badge className="bg-green-100 text-green-800 border-green-200 font-semibold">
          Plan Pro • 28 zile trial
        </Badge>
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

      {/* Weather + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Weather spans 2 cols */}
        <div className="lg:col-span-2">
          <WeatherWidget />
        </div>

        {/* Alerts */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              Alerte & Notificări
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.map((alert, i) => (
              <Link
                key={i}
                href={alert.href}
                className={`flex items-start gap-3 p-3 rounded-xl border transition-colors hover:opacity-80 ${
                  alert.type === "warning"
                    ? "bg-amber-50 border-amber-200"
                    : alert.type === "success"
                    ? "bg-green-50 border-green-200"
                    : "bg-blue-50 border-blue-200"
                }`}
              >
                {alert.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                ) : (
                  <AlertCircle className={`w-4 h-4 mt-0.5 shrink-0 ${alert.type === "warning" ? "text-amber-600" : "text-blue-600"}`} />
                )}
                <p className="text-sm text-foreground">{alert.text}</p>
              </Link>
            ))}

            {/* Sfat agricol */}
            <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-xl">
              <p className="text-xs font-bold text-primary mb-1">💡 Sfatul zilei</p>
              <p className="text-sm text-foreground">{todayTip}</p>
            </div>
          </CardContent>
        </Card>
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
                    <td className="py-3 pr-4 text-muted-foreground">{parcel.area} ha</td>
                    <td className="py-3 pr-4 text-foreground">{parcel.crop}</td>
                    <td className="py-3">
                      <Badge
                        className={`text-xs border ${statusColors[parcel.status] || "bg-gray-100 text-gray-600"}`}
                      >
                        {parcel.statusLabel}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
