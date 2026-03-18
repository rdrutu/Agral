"use client";

import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  HelpCircle, 
  ChevronDown,
  ChevronUp,
  MapPin,
  Phone,
  Mail,
  Package,
  CloudSun,
  Users,
  DollarSign,
  Sprout,
  Settings as SettingsIcon,
  Bell,
  Map as MapIcon,
  Globe,
  Wallet
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingsClientProps {
  user: {
    email: string;
    role: string;
  };
}

export default function SettingsClient({ user }: SettingsClientProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      question: "Cum văd câtă motorină mai am în fermă?",
      answer: "Mergi în meniul 'Magazie & Stocuri' din partea stângă. Acolo vei vedea o listă cu tot ce ai în depozit.",
      icon: <Package className="w-4 h-4 text-amber-600" />
    },
    {
      question: "Unde văd dacă plouă mâine?",
      answer: "Apasă pe butonul 'Vreme' din meniu. Îți arată prognoza exactă pentru ferma ta.",
      icon: <CloudSun className="w-4 h-4 text-blue-600" />
    },
    {
      question: "Cum găsesc numărul de telefon al unui angajat?",
      answer: "Intră la secțiunea 'Angajați'. Acolo ai lista cu toți oamenii și numerele lor.",
      icon: <Users className="w-4 h-4 text-green-600" />
    },
    {
      question: "Cum adaug o parcelă nouă pe hartă?",
      answer: "Mergi la 'Parcele' -> 'Adaugă Parcelă' și desenează pe hartă terenul.",
      icon: <MapPin className="w-4 h-4 text-primary" />
    },
    {
      question: "Cum schimb ziua de salarii?",
      answer: "Pentru a schimba setările fermei, te rugăm să contactezi administratorul sau să mergi la secțiunea de Profil.",
      icon: <DollarSign className="w-4 h-4 text-emerald-600" />
    }
  ];

  const tutorials = [
    {
      title: "Adăugare Parcelă",
      steps: ["Parcele -> Adaugă Parcelă", "Desenează pe hartă", "Pune nume și Salvează"]
    },
    {
      title: "Înregistrare Recoltă",
      steps: ["Apasă pe o parcelă activă", "Butonul 'Recoltează'", "Scrie tonele obținute", "Salvează"]
    }
  ];

  const prefSections = [
    {
      title: "Vizualizare & Măsurători",
      icon: <Globe className="w-5 h-5 text-blue-600" />,
      items: [
        { label: "Limbă sistem", value: "Română", badge: true },
        { label: "Unități suprafață", value: "Hectare (ha)", badge: true },
        { label: "Unități greutate", value: "Tone (to)", badge: true }
      ]
    },
    {
      title: "Hărți & Geografie",
      icon: <MapIcon className="w-5 h-5 text-emerald-600" />,
      items: [
        { label: "Stil hartă implicit", value: "Satelit (Hibrid)", badge: true },
        { label: "Afișare limite județene", value: "Activat", badge: true },
        { label: "Auto-zoom pe parcele", value: "Da", badge: true }
      ]
    },
    {
      title: "Notificări & Alerte",
      icon: <Bell className="w-5 h-5 text-amber-600" />,
      items: [
        { label: "Alerte meteo prin Email", value: "Activat", badge: true },
        { label: "Notificări stoc minim", value: "Dezactivat", badge: false, status: "indisponibil" },
        { label: "Raport săptămânal", value: "Activat", badge: true }
      ]
    },
    {
      title: "Financiar & Rapoarte",
      icon: <Wallet className="w-5 h-5 text-primary" />,
      items: [
        { label: "Monedă afișare", value: "RON", badge: true },
        { label: "Calcul TVA inclus", value: "Da", badge: true },
        { label: "Format dată", value: "ZZ/LL/AAAA", badge: true }
      ]
    }
  ];

  return (
    <div className="space-y-12 pb-12">
      {/* Section 1: Preferinte Complete */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b pb-4">
          <SettingsIcon className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-black tracking-tight">Preferințe Aplicație</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {prefSections.map((section, idx) => (
            <Card key={idx} className="border-none shadow-sm bg-muted/30">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 mb-1">
                  {section.icon}
                  <CardTitle className="text-sm font-bold uppercase tracking-wider">{section.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {section.items.map((item, iIdx) => (
                  <div key={iIdx} className="flex flex-col gap-1 border-b border-muted last:border-0 pb-2 last:pb-0">
                    <span className="text-[10px] font-black uppercase text-muted-foreground/70 tracking-widest">{item.label}</span>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-foreground">{item.value}</span>
                      {item.status === "indisponibil" && <Badge variant="secondary" className="text-[8px] uppercase font-black px-1.5 py-0">Curând</Badge>}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Section 2: Ajutor & Ghid */}
      <section className="space-y-6 pt-6 border-t">
        <div className="flex items-center gap-3 border-b pb-4">
          <HelpCircle className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-black tracking-tight">Ghid & Întrebări Frecvente</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* FAQ List */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground mb-4">Întrebări Comune</h3>
            {faqs.map((faq, idx) => (
              <div key={idx} className={cn(
                "border rounded-xl overflow-hidden transition-all duration-300",
                openFaq === idx ? "bg-white border-primary shadow-md" : "bg-white hover:border-primary/50"
              )}>
                <button 
                  className="w-full p-5 text-left flex items-center justify-between group"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                      openFaq === idx ? "bg-primary text-white" : "bg-muted text-primary"
                    )}>
                      {faq.icon}
                    </div>
                    <span className="font-bold text-sm tracking-tight">{faq.question}</span>
                  </div>
                  {openFaq === idx ? <ChevronUp className="w-4 h-4 text-primary" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-5 pt-0 animate-in slide-in-from-top-2 duration-300">
                    <div className="pl-14 text-sm text-muted-foreground font-medium leading-relaxed border-t pt-4">
                      {faq.answer}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Quick Guides & Support */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground">Tutoriale Rapide</h3>
              {tutorials.map((tut, idx) => (
                <Card key={idx} className="border-none bg-primary/5">
                  <CardHeader className="py-4">
                    <CardTitle className="text-sm font-bold flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-[10px]">{idx + 1}</span>
                      {tut.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <ol className="space-y-2">
                       {tut.steps.map((step, sIdx) => (
                         <li key={sIdx} className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                            <div className="w-1 h-1 rounded-full bg-primary" />
                            {step}
                         </li>
                       ))}
                    </ol>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="p-8 rounded-[2rem] agral-gradient text-white shadow-xl shadow-primary/20">
              <h4 className="text-xl font-black mb-2">Suport Agral</h4>
              <p className="text-sm font-bold text-white/80 mb-6 italic">Suntem aici pentru tine!</p>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-white/10 rounded-xl">
                  <Phone className="w-4 h-4" />
                  <span className="text-sm font-black tracking-widest">07xx xxx xxx</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white/10 rounded-xl">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm font-black tracking-widest uppercase">suport@agral.ro</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
