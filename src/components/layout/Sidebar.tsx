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
  CalendarDays, // Added CalendarDays import
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
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
};

export function Sidebar({ 
  userRole = "owner", 
  userName = "Utilizator", 
  subTier = "trial",
  orgCreatedAt,
  subExpiresAt
}: { 
  userRole?: string;
  userName?: string;
  subTier?: string;
  orgCreatedAt?: string;
  subExpiresAt?: string;
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
    ? [{ href: "/admin", icon: Settings, label: "Admin Panel", group: "admin" }]
    : navItems;

  const grouped = effectiveNavItems.reduce((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {} as Record<string, typeof navItems>);

  // Calculare zile trial ramase
  let trialDaysLeft = null;
  let subscriptionExpiryStr = null;

  if (subTier === "trial" && orgCreatedAt) {
    const trialExpiry = new Date(new Date(orgCreatedAt).getTime() + 30 * 24 * 60 * 60 * 1000);
    const msDiff = trialExpiry.getTime() - new Date().getTime();
    trialDaysLeft = Math.max(0, Math.ceil(msDiff / (1000 * 60 * 60 * 24)));
  } else if (subExpiresAt) {
    const expiry = new Date(subExpiresAt);
    subscriptionExpiryStr = expiry.toLocaleDateString("ro-RO", { day: "2-digit", month: "2-digit", year: "2-digit" });
  }

  return (
    <aside
      className={cn(
        "h-screen sticky top-0 flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 relative",
        collapsed ? "w-20" : "w-72"
      )}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-6 bg-sidebar border border-sidebar-border text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-full hover:bg-accent z-50 flex items-center justify-center shadow-sm"
      >
        {collapsed ? <ChevronsRight className="w-4 h-4" /> : <ChevronsLeft className="w-4 h-4" />}
      </button>

      {/* Logo */}
      <div className={cn("flex items-center border-b border-sidebar-border min-h-[80px]", collapsed ? "justify-center p-2" : "gap-3 p-4")}>
        {collapsed ? (
          <AgralLogo variant="icon" size="xl" href="/dashboard" className="w-14 h-14" />
        ) : (
          <AgralLogo variant="full" size="xl" href="/dashboard" className="h-14 w-auto" />
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
            <span className="text-[10px] uppercase font-bold text-primary/70 tracking-tighter truncate border-b border-transparent pb-0.5 mb-0.5">
              {userRole === 'owner' ? 'Proprietar' : userRole === 'superadmin' ? 'Super Admin' : userRole === 'agronomist' ? 'Agronom' : 'Lucrător'}
            </span>
            {subTier === "trial" ? (
              trialDaysLeft !== null && userRole !== "superadmin" && (
                <span className="text-[10px] font-black text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 w-fit leading-none mt-0.5 shadow-sm">
                  TRIAL: {trialDaysLeft} ZILE
                </span>
              )
            ) : (
              userRole !== "superadmin" && (
                <span className="text-[10px] font-black text-green-700 bg-green-500/10 px-1.5 py-0.5 rounded border border-green-500/20 w-fit leading-none mt-0.5 shadow-sm uppercase">
                  {subTier}: {subscriptionExpiryStr ? `EXP. ${subscriptionExpiryStr}` : 'Activ'}
                </span>
              )
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2">
        {Object.entries(grouped).map(([groupKey, items]) => (
          <div key={groupKey} className="mb-4">
            {!collapsed && (
              <div className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
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
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 transition-all duration-150 group",
                    active
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom settings */}
      {userRole !== 'superadmin' && (
        <div className="p-2 border-t border-sidebar-border">
          <Link
            href="/setari"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all"
          >
            <Settings className="w-5 h-5 shrink-0" />
            {!collapsed && <span className="text-sm font-medium">Setări</span>}
          </Link>
        </div>
      )}
    </aside>
  );
}
