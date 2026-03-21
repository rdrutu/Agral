"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Cookie, X } from "lucide-react";
import Link from "next/link";

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Verificăm dacă utilizatorul a acceptat deja cookies
    const consent = localStorage.getItem("agral_cookie_consent");
    if (!consent) {
      // Afișăm banner-ul după un scurt delay pentru un UX mai bun
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("agral_cookie_consent", "accepted");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 left-6 right-6 z-[100] animate-in slide-in-from-bottom-10 fade-in duration-500">
      <div className="max-w-4xl mx-auto bg-white/80 backdrop-blur-2xl border border-green-100 shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-[2rem] p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 justify-between">
        <div className="flex items-start gap-4 flex-1">
          <div className="w-12 h-12 rounded-2xl agral-gradient flex items-center justify-center text-white shrink-0 shadow-lg shadow-green-600/20">
            <Cookie className="w-6 h-6" />
          </div>
          <div className="space-y-1 text-left">
            <h4 className="text-lg font-black text-foreground tracking-tight">Experiență îmbunătățită cu Cookies</h4>
            <p className="text-sm text-muted-foreground font-medium leading-relaxed">
              Folosim cookie-uri esențiale pentru a-ți asigura securitatea contului și cookie-uri de analiză pentru a îmbunătăți platforma. 
              Continuând navigarea, ești de acord cu utilizarea acestora conform{" "}
              <Link href="/confidentialitate" className="text-green-600 font-bold hover:underline">Politicii de Confidențialitate</Link>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
          <Button 
            variant="ghost" 
            onClick={() => setIsVisible(false)}
            className="hidden md:flex font-bold text-muted-foreground rounded-xl"
          >
            Mai târziu
          </Button>
          <Button 
            onClick={handleAccept}
            className="agral-gradient text-white font-black px-8 py-6 text-base rounded-2xl shadow-xl shadow-green-600/30 hover:scale-105 transition-all w-full md:w-auto"
          >
            Sunt de acord
          </Button>
        </div>

        <button 
          onClick={() => setIsVisible(false)}
          className="absolute top-4 right-4 text-muted-foreground/50 hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
