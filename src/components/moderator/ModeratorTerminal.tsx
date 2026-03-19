"use client";

import { useState, useEffect, useRef } from "react";
import { 
  MessageSquare, 
  Users, 
  Clock, 
  CheckCircle2, 
  Search, 
  Send, 
  User as UserIcon,
  Building2,
  Phone,
  Mail,
  MapPin,
  ChevronRight,
  ShieldCheck,
  History,
  Archive,
  ArrowLeft
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle,
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  getActiveConversations, 
  joinChat, 
  sendMessage, 
  getConversationMessages,
  closeConversation,
  getConversationHistory,
  updateLastSeen,
  toggleSupportStatus,
  getModeratorStatus
} from "@/lib/actions/support";
import toast from "react-hot-toast";

interface ModeratorTerminalProps {
  moderatorName: string;
}

export default function ModeratorTerminal({ moderatorName }: ModeratorTerminalProps) {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState<"active" | "history">("active");
  const [history, setHistory] = useState<any[]>([]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [lastHeartbeat, setLastHeartbeat] = useState(0);
  const [showMobileList, setShowMobileList] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  // Load initial status
  useEffect(() => {
    getModeratorStatus().then(res => setIsOnline(res.active));
  }, []);

  // Moderator Heartbeat (Presence)
  useEffect(() => {
    if (!isOnline) return; // Only heartbeat if manually online

    const heartbeat = async () => {
      try {
        await updateLastSeen();
        setLastHeartbeat(Date.now());
      } catch (e) { /* silent */ }
    };
    
    heartbeat();
    const interval = setInterval(heartbeat, 15000); // 15 secunde
    return () => clearInterval(interval);
  }, [isOnline]);

  // Poll for active conversations
  useEffect(() => {
    const fetchActive = async () => {
      if (view !== "active") return;
      const active = await getActiveConversations();
      setConversations(active);
    };

    fetchActive();
    const interval = setInterval(fetchActive, 5000);
    return () => clearInterval(interval);
  }, [view]);

  // Load history
  useEffect(() => {
    const fetchHistory = async () => {
      if (view !== "history") return;
      const hist = await getConversationHistory();
      setHistory(hist);
    };
    fetchHistory();
  }, [view]);

  // Load messages for selected chat
  useEffect(() => {
    if (!selectedChat) return;

    const fetchMessages = async () => {
      const msgs = await getConversationMessages(selectedChat.id);
      setMessages(msgs);
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [selectedChat]);

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleJoin = async (id: string) => {
    try {
      const joined = await joinChat(id);
      setSelectedChat(joined);
      toast.success("Ai intrat în conversație");
    } catch (err) {
      toast.error("Eroare la preluare");
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedChat || isSending) return;

    const content = input.trim();
    setInput("");
    setIsSending(true);

    try {
      await sendMessage(selectedChat.id, content, "MODERATOR");
       setMessages(prev => [...prev, { content, type: "MODERATOR", createdAt: new Date() }]);
    } catch (err) {
      toast.error("Eroare la trimitere");
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = async () => {
    if (!selectedChat) return;
    if (!confirm("Ești sigur că vrei să închizi această conversație?")) return;

    try {
      await closeConversation(selectedChat.id);
      setSelectedChat(null);
      setMessages([]);
      toast.success("Conversație închisă");
    } catch (err) {
      toast.error("Eroare la închidere");
    }
  };

  const handleToggleOnline = async (checked: boolean) => {
    setIsToggling(true);
    try {
      await toggleSupportStatus(checked);
      setIsOnline(checked);
      toast.success(checked ? "Ești ONLINE" : "Ești OFFLINE");
    } catch (err) {
      toast.error("Eroare la schimbarea statusului");
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 md:gap-6 h-[calc(100vh-180px)] min-h-[500px] overflow-hidden">
      {/* Sidebar: Chat List */}
      <Card className={cn(
        "w-full md:w-80 flex flex-col border-none shadow-xl rounded-[2rem] overflow-hidden",
        !showMobileList && "hidden md:flex"
      )}>
        <CardHeader className="p-6 bg-slate-900 text-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-black uppercase tracking-widest text-[10px]">Cererile Mele</h3>
            <Badge variant="outline" className={cn(
               "border-white/20 text-white text-[9px] uppercase font-black",
               isOnline ? "bg-green-500/20 border-green-500/40" : "bg-red-500/20 border-red-500/40"
            )}>
               {isOnline ? 'Online' : 'Offline'}
            </Badge>
          </div>

          <div className="flex items-center justify-between p-3 bg-white/5 rounded-2xl mb-4 border border-white/10">
             <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-tighter opacity-70">Status Suport</span>
                <span className="text-[9px] font-bold italic">{isOnline ? "Fermierii te pot vedea" : "Ești invizibil"}</span>
             </div>
             <button 
               onClick={() => handleToggleOnline(!isOnline)}
               disabled={isToggling}
               className={cn(
                 "w-12 h-6 rounded-full transition-all duration-300 relative border-2",
                 isOnline ? "bg-green-500 border-green-500" : "bg-slate-700 border-slate-700"
               )}
             >
                <div className={cn(
                  "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-300",
                  isOnline ? "left-[calc(100%-1.25rem)]" : "left-0.5"
                )} />
             </button>
          </div>

          <div className="flex gap-2 p-1 bg-white/10 rounded-xl">
             <Button 
                variant={view === "active" ? "secondary" : "ghost"} 
                size="sm" 
                className="flex-1 rounded-lg text-[10px] font-black uppercase"
                onClick={() => setView("active")}
             >
                <MessageSquare className="w-3 h-3 mr-2" /> Live
             </Button>
             <Button 
                variant={view === "history" ? "secondary" : "ghost"} 
                size="sm" 
                className="flex-1 rounded-lg text-[10px] font-black uppercase"
                onClick={() => setView("history")}
             >
                <History className="w-3 h-3 mr-2" /> Arhivă
             </Button>
          </div>
        </CardHeader>
        
        <div className="p-4 border-b bg-muted/30">
          <div className="relative">
             <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
             <Input 
                placeholder="Caută utilizator..." 
                className="pl-9 bg-white border-none rounded-xl text-xs h-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
             />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-2 space-y-1">
            {(view === "active" ? conversations : history).map((chat) => (
              <button
                key={chat.id}
                onClick={() => {
                  setSelectedChat(chat);
                  setShowMobileList(false);
                }}
                className={cn(
                  "w-full p-4 rounded-2xl text-left transition-all duration-300 flex items-center gap-3 group relative overflow-hidden",
                  selectedChat?.id === chat.id 
                    ? "bg-primary text-white shadow-lg shadow-primary/30" 
                    : "hover:bg-primary/5 bg-white mb-1"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                  selectedChat?.id === chat.id ? "bg-white/20" : "bg-muted text-primary"
                )}>
                  <UserIcon className="w-5 h-5" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-bold text-sm truncate">{chat.user.firstName} {chat.user.lastName}</span>
                    <span className={cn(
                      "text-[9px] font-black",
                      selectedChat?.id === chat.id ? "text-white/60" : "text-muted-foreground"
                    )}>
                      {new Date(chat.lastMessageAt || chat.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className={cn(
                    "text-[10px] truncate font-medium",
                    selectedChat?.id === chat.id ? "text-white/80" : "text-muted-foreground"
                  )}>
                    {chat.messages?.[0]?.content || "Începe discuția..."}
                  </p>
                </div>
                {chat.status === "WAITING" && (
                   <div className="absolute top-2 right-2 flex">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                   </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Main Chat Area */}
      {selectedChat ? (
        <div className={cn(
          "flex-1 flex flex-col md:flex-row gap-4 md:gap-6 h-full min-w-0 transition-all duration-300",
          showMobileList && "hidden md:flex"
        )}>
          <Card className="flex-1 flex flex-col border-none shadow-xl rounded-3xl md:rounded-[2rem] overflow-hidden bg-white h-full">
            <CardHeader className="p-4 md:p-6 border-b flex flex-row items-center justify-between">
               <div className="flex items-center gap-3 md:gap-4">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="md:hidden -ml-2" 
                    onClick={() => setShowMobileList(true)}
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="text-base md:text-xl font-black truncate">{selectedChat.user.firstName} {selectedChat.user.lastName}</CardTitle>
                    <div className="flex items-center gap-2">
                       <Badge variant="outline" className="text-[8px] md:text-[9px] font-black uppercase text-primary border-primary/20">
                          {selectedChat.status}
                       </Badge>
                    </div>
                  </div>
               </div>
               {selectedChat.status !== 'CLOSED' && (
                 <Button 
                   variant="destructive" 
                   size="sm" 
                   onClick={handleClose}
                   className="rounded-xl px-4 font-black uppercase tracking-widest text-[10px]"
                 >
                   Închide Chat
                 </Button>
               )}
            </CardHeader>

            <div className="flex-1 p-6 overflow-y-auto">
               <div ref={scrollRef} className="space-y-6">
                  {messages.map((msg, idx) => (
                    <div key={idx} className={cn(
                      "flex flex-col max-w-[70%]",
                      msg.type === "MODERATOR" ? "ml-auto items-end" : "items-start",
                      msg.type === "SYSTEM" && "mx-auto w-full items-center text-center max-w-full"
                    )}>
                       {msg.type === "SYSTEM" ? (
                          <div className="bg-muted px-4 py-1 rounded-full text-[10px] font-bold text-muted-foreground uppercase">
                             {msg.content}
                          </div>
                       ) : (
                         <>
                           <div className={cn(
                             "px-5 py-4 rounded-[1.5rem] text-sm font-medium shadow-sm leading-relaxed",
                             msg.type === "MODERATOR" 
                               ? "bg-slate-900 text-white rounded-tr-none" 
                               : "bg-muted/50 text-foreground rounded-tl-none"
                           )}>
                             {msg.content}
                           </div>
                           <span className="text-[10px] font-black text-muted-foreground/60 mt-1.5 uppercase tracking-tighter">
                             {new Date(msg.createdAt).toLocaleTimeString()}
                           </span>
                         </>
                       )}
                    </div>
                  ))}
               </div>
            </div>

            {selectedChat.status === "WAITING" ? (
               <div className="p-8 bg-amber-50 text-center border-t">
                  <h4 className="text-amber-800 font-black uppercase tracking-widest text-sm mb-4">Conversație în așteptare</h4>
                  <p className="text-amber-700/70 text-xs font-bold mb-6">Utilizatorul așteaptă ajutorul tău. Preia chat-ul pentru a începe.</p>
                  <Button 
                    onClick={() => handleJoin(selectedChat.id)}
                    className="agral-gradient text-white rounded-xl h-12 px-8 font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-transform"
                  >
                    Acceptă Conversația
                  </Button>
               </div>
            ) : selectedChat.status === "ACTIVE" ? (
              <CardFooter className="p-4 md:p-6 border-t bg-muted/10">
                <form 
                  onSubmit={handleSend}
                  className="flex gap-2 md:gap-4 w-full"
                >
                  <Input 
                    placeholder="Mesaj..." 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="flex-1 h-12 md:h-14 bg-white border-2 border-muted focus-visible:border-primary rounded-xl md:rounded-2xl px-4 md:px-6 text-sm font-medium shadow-inner"
                  />
                  <Button 
                    type="submit" 
                    disabled={!input.trim() || isSending}
                    className="h-12 w-12 md:h-14 md:w-14 rounded-xl md:rounded-2xl shrink-0 group hover:scale-105 transition-transform"
                  >
                    <Send className="w-5 h-5 md:w-6 md:h-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </Button>
                </form>
              </CardFooter>
            ) : (
              <div className="p-8 bg-muted/30 text-center border-t italic text-muted-foreground font-bold text-sm">
                 Această conversație a fost arhivată.
              </div>
            )}
          </Card>

          {/* User Context Sidebar */}
          <Card className="hidden xl:flex w-80 border-none shadow-xl rounded-[2rem] overflow-hidden bg-white h-full">
            <CardHeader className="bg-primary/5 p-6 border-b">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-primary">Context Fermier</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-8">
               <div className="space-y-4">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                        <UserIcon className="w-6 h-6 text-muted-foreground" />
                     </div>
                     <div>
                        <h4 className="text-sm font-black tracking-tight">{selectedChat.user.firstName} {selectedChat.user.lastName}</h4>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">{selectedChat.user.role}</p>
                     </div>
                  </div>
                  <div className="space-y-2">
                     <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                        <Mail className="w-3.5 h-3.5" /> {selectedChat.user.email}
                     </div>
                  </div>
               </div>

                <div className="space-y-4 pt-6 border-t">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Detalii Organizație</h4>
                  {selectedChat.user.organization ? (
                    <div className="space-y-4">
                       <div className="flex items-center gap-3">
                          <Building2 className="w-5 h-5 text-primary" />
                          <div className="flex flex-col">
                             <span className="text-sm font-black leading-tight">{selectedChat.user.organization.legalName || selectedChat.user.organization.name}</span>
                             <span className="text-[9px] font-bold text-muted-foreground uppercase">{selectedChat.user.organization.registrationNumber || "Fără RO/J"}</span>
                          </div>
                       </div>
                       <div className="space-y-3 bg-muted/20 p-4 rounded-2xl">
                          <div className="flex items-center justify-between">
                             <span className="text-[8px] font-black uppercase text-muted-foreground">CUI / CIF</span>
                             <span className="text-[10px] font-bold">{selectedChat.user.organization.cui || "Nespecificat"}</span>
                          </div>
                          <div className="flex items-center justify-between">
                             <span className="text-[8px] font-black uppercase text-muted-foreground">Abonament</span>
                             <Badge variant="secondary" className="text-[8px] font-black uppercase bg-primary/10 text-primary border-none">
                                {selectedChat.user.organization.subscriptionTier}
                             </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                             <span className="text-[8px] font-black uppercase text-muted-foreground">Expiră la</span>
                             <span className="text-[10px] font-bold">
                                {selectedChat.user.organization.subscriptionExpiresAt ? new Date(selectedChat.user.organization.subscriptionExpiresAt).toLocaleDateString() : "Nelimitat"}
                             </span>
                          </div>
                       </div>

                       {/* Latest Payments */}
                       <div className="space-y-3">
                          <h5 className="text-[9px] font-black uppercase tracking-tighter text-muted-foreground flex items-center gap-2">
                             <History className="w-3 h-3" /> Ultimele Plăți
                          </h5>
                          <div className="space-y-2">
                             {selectedChat.user.organization.payments?.length > 0 ? (
                               selectedChat.user.organization.payments.map((p: any, i: number) => (
                                 <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-muted/10 border border-muted/20">
                                    <span className="text-[9px] font-bold">{new Date(p.date).toLocaleDateString()}</span>
                                    <span className="text-[9px] font-black text-primary">{Number(p.amount).toLocaleString()} lei</span>
                                 </div>
                               ))
                             ) : (
                               <p className="text-[9px] italic text-muted-foreground">Nicio plată înregistrată.</p>
                             )}
                          </div>
                       </div>

                       <div className="space-y-2 pt-2">
                          <div className="flex items-center gap-2 text-[10px] font-bold">
                             <Phone className="w-3 h-3 text-muted-foreground" />
                             <span>{selectedChat.user.organization.phone || "Fără telefon"}</span>
                          </div>
                          <div className="flex items-start gap-2 text-[10px] font-bold">
                             <MapPin className="w-3 h-3 text-muted-foreground mt-0.5" />
                             <span className="leading-tight">{selectedChat.user.organization.address}, {selectedChat.user.organization.county}</span>
                          </div>
                       </div>
                    </div>
                  ) : (
                    <p className="text-xs italic text-muted-foreground">Fără organizație asociată.</p>
                  )}
               </div>

               <div className="pt-2">
                  <Badge className="w-full justify-center py-2 rounded-xl agral-gradient border-none text-[10px] font-black uppercase tracking-widest">
                    <ShieldCheck className="w-3 h-3 mr-2" /> Cont Verificat
                  </Badge>
               </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className={cn(
          "flex-1 flex flex-col items-center justify-center bg-white rounded-[2rem] shadow-sm border p-6 md:p-12 text-center space-y-4 md:space-y-6",
          !showMobileList && "hidden md:flex"
        )}>
           <div className="w-24 h-24 md:w-32 md:h-32 bg-primary/5 rounded-full flex items-center justify-center animate-pulse">
              <MessageSquare className="w-12 h-12 md:w-16 md:h-16 text-primary/40" />
           </div>
           <div className="space-y-2">
              <h2 className="text-xl md:text-2xl font-black italic tracking-tight uppercase">Gata să ajuți?</h2>
              <p className="text-muted-foreground font-medium max-w-sm mx-auto text-xs md:text-sm">Selectează o conversație activă din stânga sau așteaptă noi solicitări.</p>
           </div>
           <div className="flex items-center gap-4 md:gap-6 pt-4">
              <div className="flex flex-col items-center">
                 <span className="text-3xl md:text-4xl font-black text-primary">{conversations.filter(c => c.status === 'WAITING').length}</span>
                 <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground">În Așteptare</span>
              </div>
              <div className="w-px h-10 md:h-12 bg-muted" />
              <div className="flex flex-col items-center">
                 <span className="text-3xl md:text-4xl font-black text-slate-900">{conversations.filter(c => c.status === 'ACTIVE').length}</span>
                 <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground">Active Acum</span>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
