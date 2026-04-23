"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MapPin,
  FileText,
  CloudSun,
  BarChart3,
  Sprout,
  Package,
  Tractor,
  Users,
  Newspaper,
  Settings,
  ChevronsLeft,
  ChevronsRight,
  CalendarDays,
  Headset,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { cn, formatDate } from "@/lib/utils";
import { AgralLogo } from "@/components/ui/agral-logo";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", group: "principal" },
  { href: "/parcele", icon: MapPin, label: "Parcele", group: "principal" },
  { href: "/campanii", icon: CalendarDays, label: "Plan de Culturi", group: "principal" },
  { href: "/operatiuni", icon: Tractor, label: "Lucrări Agricole", group: "principal" },
  { href: "/stocuri", icon: Package, label: "Magazie & Stocuri", group: "principal" },

  { href: "/contracte", icon: FileText, label: "Contracte Arendă", group: "afacere" },
  { href: "/financiar", icon: BarChart3, label: "Financiar", group: "afacere" },

  { href: "/vreme", icon: CloudSun, label: "Vreme", group: "utilitar" },
  { href: "/stiri", icon: Newspaper, label: "Știri Agricole", group: "utilitar" },

  { href: "/utilaje", icon: Tractor, label: "Utilaje", group: "avansate" },
  { href: "/angajati", icon: Users, label: "Angajați", group: "avansate" },
];

const groups: Record<string, string> = {
  principal: "Principal",
  afacere: "Afacere",
  utilitar: "Utilitar",
  avansate: "Avansate",
  admin: "Administrare Platformă",
  support: "Suport Clienți",
};

export function Sidebar({
  userRole = "owner",
  userName = "Utilizator",
  subTier = "trial",
  orgCreatedAt,
  subExpiresAt,
  className
}: {
  userRole?: string;
  userName?: string;
  subTier?: string;
  orgCreatedAt?: string;
  subExpiresAt?: string;
  className?: string;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const initials = userName
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  // Dacă utilizatorul e superadmin, arătăm doar panelul de admin, ascunzând datele de fermă
  const effectiveNavItems = userRole === "superadmin"
    ? [
        { href: "/admin", icon: Settings, label: "Admin Panel", group: "admin" },
        { href: "/moderator", icon: Headset, label: "Terminal Suport", group: "support" }
      ]
    : userRole === "moderator"
    ? [{ href: "/moderator", icon: Headset, label: "Terminal Suport", group: "support" }]
    : navItems;

  const grouped = effectiveNavItems.reduce((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {} as Record<string, typeof navItems>);

  // Calculare zile trial ramase
  let trialDaysLeft = null;
  let subscriptionExpiryStr = null;

  if (subTier?.toLowerCase() === "trial" && orgCreatedAt) {
    const trialExpiry = new Date(new Date(orgCreatedAt).getTime() + 30 * 24 * 60 * 60 * 1000);
    const msDiff = trialExpiry.getTime() - new Date().getTime();
    trialDaysLeft = Math.max(0, Math.ceil(msDiff / (1000 * 60 * 60 * 24)));
  } else if (subExpiresAt) {
    const expiry = new Date(subExpiresAt);
    subscriptionExpiryStr = formatDate(expiry);
  }

  return (
    <aside
      className={cn(
        "h-screen sticky top-0 flex-col bg-white/40 backdrop-blur-3xl border-r border-white/20 transition-all duration-500 relative z-40",
        collapsed ? "w-20" : "w-72",
        className ? className : "hidden lg:flex"
      )}
      suppressHydrationWarning
    >
      {/* Dynamic background element for sidebar */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white/10 via-transparent to-white/5 pointer-events-none" />

      {/* Toggle Button - Hidden on mobile, only desktop */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-10 bg-white border border-slate-200 text-slate-400 hover:text-primary transition-all p-1.5 rounded-full hover:bg-white z-50 lg:flex hidden items-center justify-center shadow-xl shadow-black/5 hover:scale-110 active:scale-95"
      >
        {collapsed ? <ChevronsRight className="w-4 h-4" /> : <ChevronsLeft className="w-4 h-4" />}
      </button>

      {/* Logo */}
      <div className={cn("flex items-center min-h-[100px] mb-2 px-6 justify-center")}>
        {collapsed ? (
          <div className="hover:rotate-12 transition-transform duration-500">
            <AgralLogo variant="icon" size="xl" href="/dashboard" className="w-12 h-12" />
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-left-4 duration-700">
            <AgralLogo variant="full" size="xl" href="/dashboard" className="h-12 w-auto" />
          </div>
        )}
      </div>

      {/* User Info (Stânga Sus) */}
      {!collapsed && (
        <div className="px-4 py-4 flex items-center gap-3 border-b border-sidebar-border bg-sidebar-accent/30 animate-in fade-in slide-in-from-left-2">
          <div className="w-10 h-10 rounded-xl agral-gradient flex items-center justify-center text-white font-extrabold text-sm shadow-sm shrink-0">
            {initials}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold text-foreground truncate">{userName}</span>
            <span className="text-xs uppercase font-bold text-primary/70 tracking-tighter truncate border-b border-transparent pb-0.5 mb-0.5">
              {userRole === 'owner' ? 'Proprietar' : userRole === 'superadmin' ? 'Super Admin' : userRole === 'moderator' ? 'Moderator' : userRole === 'agronomist' ? 'Agronom' : 'Lucrător'}
            </span>
            {subTier === "trial" ? (
              trialDaysLeft !== null && userRole !== "superadmin" && (
                <span className="text-xs font-black text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 w-fit leading-none mt-0.5 shadow-sm">
                  TRIAL: {trialDaysLeft} ZILE
                </span>
              )
            ) : (
              userRole !== "superadmin" && (
                <span className="text-xs font-black text-green-700 bg-green-500/10 px-1.5 py-0.5 rounded border border-green-500/20 w-fit leading-none mt-0.5 shadow-sm uppercase">
                  {subTier}: {subscriptionExpiryStr ? `EXP. ${subscriptionExpiryStr}` : 'Activ'}
                </span>
              )
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-6">
        {Object.entries(grouped).map(([groupKey, items]) => (
          <div key={groupKey} className="space-y-1">
            {!collapsed && (
              <div className="px-4 py-2 text-xs font-black text-slate-400 uppercase tracking-widest mb-1">
                {groups[groupKey]}
              </div>
            )}
            {items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-[1.25rem] transition-all duration-300 group relative overflow-hidden",
                    collapsed ? "justify-center" : "justify-start",
                    active
                      ? "bg-slate-950 text-white shadow-xl shadow-slate-900/20 active-nav-glow"
                      : "text-slate-500 hover:bg-white/60 hover:text-slate-900"
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon className={cn(
                    "w-5 h-5 shrink-0 transition-transform duration-300 group-hover:scale-110",
                    active ? "text-emerald-400" : "text-slate-400 group-hover:text-slate-900"
                  )} strokeWidth={1.5} />
                  {!collapsed && <span className="text-sm font-black uppercase tracking-tight">{item.label}</span>}
                  
                  {active && !collapsed && (
                    <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_#10b981]" aria-hidden="true" title="Activ" />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom settings & Legal */}
      <div className="p-2 border-t border-sidebar-border space-y-1">
        {userRole !== 'superadmin' && (
          <Link
            href="/setari"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all",
              collapsed && "justify-center"
            )}
          >
            <Settings className="w-5 h-5 shrink-0" />
            {!collapsed && <span className="text-sm font-medium">Setări</span>}
          </Link>
        )}
        <Link
          href="/termeni-si-conditii"
          target="_blank"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all",
            collapsed && "justify-center"
          )}
          title={collapsed ? "Informații Legale" : undefined}
        >
          <ShieldCheck className="w-5 h-5 shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Informații Legale</span>}
        </Link>
      </div>
    </aside>
  );
}
