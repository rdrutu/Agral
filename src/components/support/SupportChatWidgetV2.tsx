"use client";

import { useState, useEffect, useRef } from "react";
import {
  MessageCircle,
  X,
  Send,
  User,
  Headphones,
  MoreHorizontal,
  Clock,
  ShieldAlert
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  getSupportStatus,
  startChat,
  sendMessage,
  getConversationMessages
} from "@/lib/actions/support";
import toast from "react-hot-toast";

export default function SupportChatWidgetV2() {
  const [isOpen, setIsOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [supportInfo, setSupportInfo] = useState<any>(null);
  const [conversation, setConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Check support status on load
  useEffect(() => {
    const checkStatus = async () => {
      const status = await getSupportStatus();
      setIsOnline(status.isOnline);
      setSupportInfo(status);
    };
    checkStatus();
    const interval = setInterval(checkStatus, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  // Poll for messages if chat is active
  useEffect(() => {
    if (!isOpen || !conversation) return;

    const fetchMessages = async () => {
      const msgs = await getConversationMessages(conversation.id);
      setMessages(msgs);

      // Update local conversation state if status changed
      if (msgs.some((m: any) => m.type === "MODERATOR") && conversation.status === "WAITING") {
        setConversation({ ...conversation, status: "ACTIVE" });
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 3000); // Polling every 3s
    return () => clearInterval(interval);
  }, [isOpen, conversation]);

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleStartChat = async () => {
    setIsLoading(true);
    try {
      const conv = await startChat();
      setConversation(conv);
    } catch (err) {
      toast.error("Eroare la pornirea chat-ului");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !conversation || isSending) return;

    const content = input.trim();
    setInput("");
    setIsSending(true);

    try {
      await sendMessage(conversation.id, content, "USER");
      // Local push for immediate feedback
      setMessages(prev => [...prev, { content, type: "USER", createdAt: new Date() }]);
    } catch (err) {
      toast.error("Eroare la trimitere");
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Button
          onClick={() => setIsOpen(true)}
          className="h-16 w-16 rounded-full shadow-2xl agral-gradient border-4 border-white dark:border-slate-800 scale-110 hover:scale-125 transition-all duration-300"
        >
          <MessageCircle className="h-8 w-8 text-white fill-white/20" />
          {isOnline && (
            <span className="absolute top-0 right-0 h-4 w-4 bg-green-500 border-2 border-white rounded-full animate-pulse" />
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[400px] max-w-[calc(100vw-2rem)] animate-in zoom-in-95 fade-in duration-300">
      <Card className="shadow-2xl border-none overflow-hidden rounded-[2rem]">
        <CardHeader className="agral-gradient text-white p-6 pb-12 rounded-b-[3rem]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                <Headphones className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-xl font-black tracking-tight">Suport Agral</CardTitle>
                <div className="flex items-center gap-2">
                  <div className={cn("h-2 w-2 rounded-full", isOnline ? "bg-green-400" : "bg-red-400")} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/80">
                    {isOnline ? "Online acum" : "Offline momentan"}
                  </span>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20 rounded-xl"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {!conversation && (
            <p className="text-xs font-medium text-white/90 leading-relaxed max-w-[280px]">
              {isOnline
                ? "Bună! Suntem aici să te ajutăm cu orice întrebare legată de ferma ta."
                : `Programul nostru este între orele ${supportInfo?.startHour}:00 - ${supportInfo?.endHour}:00, de luni până vineri.`}
            </p>
          )}
        </CardHeader>

        <CardContent className="-mt-8 p-6 pt-2">
          {!conversation ? (
            <div className="bg-white rounded-2xl p-8 shadow-xl text-center space-y-6">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <MessageCircle className="h-10 w-10 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black">Începe o conversație</h3>
                <p className="text-xs text-muted-foreground font-medium">Un moderator va prelua cererea ta în cel mai scurt timp.</p>
              </div>
              <Button
                disabled={!isOnline || isLoading}
                onClick={handleStartChat}
                className="w-full h-12 rounded-xl font-black uppercase tracking-widest text-[10px]"
              >
                {isLoading ? "Se conectează..." : "Contactează-ne"}
              </Button>
              {!isOnline && (
                <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-amber-600 bg-amber-50 p-2 rounded-lg">
                  <Clock className="w-3 h-3" />
                  Momentan suntem în afara programului
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-[1.5rem] shadow-xl overflow-hidden flex flex-col h-[400px]">
              {/* Messages Area */}
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
              >
                {messages.map((msg, idx) => (
                  <div key={idx} className={cn(
                    "flex flex-col max-w-[85%]",
                    msg.type === "USER" ? "ml-auto items-end" : "items-start",
                    msg.type === "SYSTEM" && "mx-auto w-full items-center text-center max-w-full"
                  )}>
                    {msg.type === "SYSTEM" ? (
                      <div className="bg-muted/50 rounded-full px-4 py-1.5 flex items-center gap-2">
                        {msg.status === "WAITING" && <MoreHorizontal className="w-3 h-3 animate-pulse" />}
                        {msg.status === "CLOSED" && <ShieldAlert className="w-3 h-3 text-red-500" />}
                        <span className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground">{msg.content}</span>
                      </div>
                    ) : (
                      <>
                        <div className={cn(
                          "px-4 py-3 rounded-2xl text-sm font-medium shadow-sm",
                          msg.type === "USER"
                            ? "bg-primary text-white rounded-tr-none"
                            : "bg-muted text-foreground rounded-tl-none border"
                        )}>
                          {msg.content}
                        </div>
                        <span className="text-[9px] font-black uppercase text-muted-foreground/60 mt-1 px-1 tracking-tighter">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {msg.type === "MODERATOR" && " • Moderator"}
                        </span>
                      </>
                    )}
                  </div>
                ))}

                {conversation.status === "WAITING" && (
                  <div className="flex items-center gap-2 bg-primary/5 p-4 rounded-xl border border-primary/10 animate-pulse">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                      <MoreHorizontal className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black tracking-widest uppercase text-primary">Se caută un moderator</span>
                      <span className="text-[9px] font-bold text-muted-foreground leading-tight">Te rugăm să ne scrii deja problema ta mai jos, pentru ca moderatorul să te poată ajuta imediat ce preia chat-ul.</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="p-4 bg-muted/20 border-t">
                <form
                  onSubmit={handleSendMessage}
                  className="flex gap-2"
                >
                  <Input
                    placeholder="Scrie un mesaj..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="flex-1 bg-white border-none shadow-inner rounded-xl h-12 text-sm focus-visible:ring-1"
                  />
                  <Button
                    type="submit"
                    disabled={!input.trim() || isSending}
                    size="icon"
                    className="h-12 w-12 rounded-xl shadow-lg shrink-0"
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </form>
              </div>
            </div>
          )}
        </CardContent>

        <div className="p-4 text-center">
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">Powered by Agral</p>
        </div>
      </Card>
    </div>
  );
}
