"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Bell, 
  Package, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  MessageSquare,
  ExternalLink,
  Check,
  Info,
  Truck,
  FileText,
  X
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
  DropdownMenuPortal
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { 
  getNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead 
} from "@/lib/actions/notifications";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

const getIcon = (type: string) => {
  switch (type) {
    case 'stock': return <Package className="w-4 h-4 text-amber-500" />;
    case 'weather': return <AlertTriangle className="w-4 h-4 text-orange-500" />;
    case 'success': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    case 'error': return <AlertTriangle className="w-4 h-4 text-red-500" />;
    case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
    case 'support': return <MessageSquare className="w-4 h-4 text-blue-500" />;
    case 'contract': return <FileText className="w-4 h-4 text-primary" />;
    case 'vehicle': return <Truck className="w-4 h-4 text-purple-500" />;
    default: return <Info className="w-4 h-4 text-blue-500" />;
  }
};

function formatRelativeTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "acum";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
  return `${Math.floor(diffInSeconds / 86400)}z`;
}

export function NotificationMenu() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const supabase = createClient();

  const loadNotifications = useCallback(async () => {
    const data = await getNotifications();
    setNotifications(data);
  }, []);

  useEffect(() => {
    loadNotifications();

    // Abonament Realtime
    const channel = supabase
      .channel('public:notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          // Adăugăm notificarea nouă la începutul listei
          setNotifications(prev => [payload.new as Notification, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadNotifications, supabase]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAsRead = async (id: string) => {
    await markNotificationAsRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <div className="relative p-2 rounded-xl hover:bg-accent transition-colors outline-none group cursor-pointer">
          <Bell className={cn(
            "w-5 h-5 transition-colors",
            unreadCount > 0 ? "text-primary fill-primary/10" : "text-muted-foreground"
          )} />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white shadow-sm ring-2 ring-background group-hover:scale-110 transition-transform">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0 overflow-hidden shadow-2xl border-none ring-1 ring-black/5 bg-background/95 backdrop-blur-xl">
        <div className="p-4 flex items-center justify-between border-b bg-muted/30">
          <div className="font-black text-xs uppercase tracking-widest flex items-center gap-2 text-muted-foreground">
            Notificări
            {unreadCount > 0 && <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[10px] h-4 px-1.5">{unreadCount} noi</Badge>}
          </div>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleMarkAllRead}
              className="h-7 px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-lg"
            >
              Marchează tot citit
            </Button>
          )}
        </div>
        
        <div className="max-h-[400px] overflow-y-auto py-1 custom-scrollbar">
          {notifications.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center px-4">
              <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-3">
                <Bell className="w-6 h-6 text-muted-foreground/50" />
              </div>
              <p className="text-sm font-bold text-foreground">Nicio notificare</p>
              <p className="text-xs text-muted-foreground mt-1">Vom afișa aici alerte despre ferma ta.</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div 
                key={notification.id}
                className={cn(
                  "relative group px-4 py-3 hover:bg-accent/50 transition-colors flex gap-3 cursor-pointer border-b border-muted/50 last:border-0",
                  !notification.isRead && "bg-primary/[0.02]"
                )}
                onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
              >
                {!notification.isRead && (
                  <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-full group-hover:h-10 transition-all" />
                )}
                
                <div className="mt-0.5 shrink-0">
                  <div className="w-8 h-8 rounded-lg bg-background shadow-sm ring-1 ring-black/5 flex items-center justify-center">
                    {getIcon(notification.type)}
                  </div>
                </div>
                
                <div className="flex-1 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className={cn(
                      "text-xs leading-none font-bold tracking-tight",
                      notification.isRead ? "text-muted-foreground" : "text-foreground"
                    )}>
                      {notification.title}
                    </h4>
                    <span className="text-[10px] font-medium text-muted-foreground/60 whitespace-nowrap">
                      {formatRelativeTime(notification.createdAt)}
                    </span>
                  </div>
                  <p className={cn(
                    "text-[11px] leading-relaxed",
                    notification.isRead ? "text-muted-foreground/70" : "text-muted-foreground"
                  )}>
                    {notification.message}
                  </p>
                  
                  {notification.link && (
                    <div className="pt-1">
                      <Link 
                        href={notification.link} 
                        className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1 hover:underline"
                      >
                        Vezi detalii <ExternalLink className="w-2.5 h-2.5" />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        
        {notifications.length > 0 && (
          <div className="p-2 border-t bg-muted/10 text-center">
            <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest uppercase">
              Centru de Control Agral
            </p>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
