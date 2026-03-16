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
};

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const grouped = navItems.reduce((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {} as Record<string, typeof navItems>);

  return (
    <aside
      className={cn(
        "h-screen sticky top-0 flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 p-4 border-b border-sidebar-border min-h-[72px]">
        {collapsed ? (
          <AgralLogo variant="icon" size="md" href="/dashboard" />
        ) : (
          <AgralLogo variant="full" size="sm" href="/dashboard" className="h-10 w-auto" />
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-accent"
        >
          {collapsed ? <ChevronsRight className="w-4 h-4" /> : <ChevronsLeft className="w-4 h-4" />}
        </button>
      </div>

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
      <div className="p-2 border-t border-sidebar-border">
        <Link
          href="/setari"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all"
        >
          <Settings className="w-5 h-5 shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Setări</span>}
        </Link>
      </div>
    </aside>
  );
}
