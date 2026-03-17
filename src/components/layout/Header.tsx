"use client";

import { Bell, ChevronDown, LogOut, Settings, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface HeaderProps {
  userName?: string;
  farmName?: string;
  userEmail?: string;
  userRole?: string;
  subscriptionTier?: string;
}

export function Header({
  userName = "Utilizator",
  farmName = "Ferma Mea",
  userEmail = "",
  userRole = "owner",
  subscriptionTier = "trial",
}: HeaderProps) {
  const router = useRouter();
  const supabase = createClient();

  const initials = userName
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <header className="h-16 border-b border-border bg-background/95 backdrop-blur flex items-center px-6 gap-4 sticky top-0 z-40">
      <div className="flex-1" />

      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button className="relative p-2 rounded-xl hover:bg-accent transition-colors">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
        </button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 h-10 px-3 rounded-xl hover:bg-accent transition-colors outline-none">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="agral-gradient text-white text-sm font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:flex flex-col items-start text-left">
              <span className="text-sm font-semibold text-foreground leading-none">{userName}</span>
              <span className="text-xs text-muted-foreground leading-none mt-0.5">{farmName}</span>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5 flex flex-col gap-1">
              <div className="flex flex-col">
                <p className="text-sm font-semibold">{userName}</p>
                <p className="text-[10px] uppercase font-bold text-primary/70 tracking-wider">
                  {userRole === 'owner' ? 'Proprietar' : userRole === 'superadmin' ? 'Super Administrator' : userRole === 'agronomist' ? 'Agronom' : 'Lucrător'}
                </p>
              </div>
              <p className="text-xs text-muted-foreground truncate">{userEmail || farmName}</p>
              <Badge className="mt-1 text-[10px] w-fit h-5 bg-green-100 text-green-800 border-green-200">
                Plan {subscriptionTier.toUpperCase()}
              </Badge>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => router.push("/profil")}>
              <User className="w-4 h-4" /> Profilul meu
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => router.push("/setari")}>
              <Settings className="w-4 h-4" /> Setări fermă
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 text-destructive cursor-pointer"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" /> Deconectare
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
