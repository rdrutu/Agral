"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AuthWidget } from "@/components/auth/AuthWidget";
import { TemporaryGate } from "@/components/auth/TemporaryGate";
import {
  MapPin,
  FileText,
  CloudSun,
  BarChart3,
  Sprout,
  Users,
  CheckCircle2,
  ArrowRight,
  Tractor,
  Shield,
  Star,
} from "lucide-react";
import { Footer } from "@/components/layout/Footer";


const features = [
  // ... (rest of the code remains the same but within the client component scope)
  {
    icon: MapPin,
    title: "Gestionare Parcele",
    desc: "Hartă interactivă cu toate parcelele tale. Înregistrează suprafețe, culturi și istoricul fiecărei parcele cu câteva click-uri.",
    color: "text-green-600",
    bg: "bg-green-50",
  },
  {
    icon: FileText,
    title: "Contracte de Arendă",
    desc: "Generează automat contracte conform Legii 16/1994. Urmărește scadențele și plățile proprietarilor.",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    icon: CloudSun,
    title: "Vreme & Prognoze",
    desc: "Prognoze meteo 14 zile direct pe ferma ta. Avertizări pentru înghețuri, grindină și condiții extreme.",
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    icon: BarChart3,
    title: "Financiar Simplificat",
    desc: "Registru cheltuieli și venituri pe sezon. Rapoarte profit/pierdere per cultură exportabile în PDF.",
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
  {
    icon: Sprout,
    title: "Planificare Culturi",
    desc: "Planifică rotația culturilor, normele de semănat și fertilizare. Alerte automate pentru lucrări agricole.",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    icon: Users,
    title: "Echipă & Angajați",
    desc: "Gestionează angajații sezonieri, pontajul zilnic și documentele de angajare într-un singur loc.",
    color: "text-rose-600",
    bg: "bg-rose-50",
  },
];

const plans = [
  {
    name: "Starter",
    price: "5",
    desc: "Pentru fermieri independenți",
    features: [
      "Până la 100 ha",
      "1 utilizator",
      "Gestionare parcele",
      "Planificare sezoane",
      "Widget meteo",
      "Știri agricole",
    ],
    cta: "Începe gratuit",
    popular: false,
  },
  {
    name: "Pro",
    price: "10",
    desc: "Pentru ferme cu activitate intensă",
    features: [
      "Până la 500 ha",
      "3 utilizatori",
      "Tot din Starter +",
      "Contracte de arendă",
      "Financiar & rapoarte",
      "Gestiune stocuri",
    ],
    cta: "Alege Pro",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "20",
    desc: "Pentru cooperative & ferme mari",
    features: [
      "Suprafață nelimitată",
      "Utilizatori nelimitați",
      "Tot din Pro +",
      "Utilaje & flotă",
      "Echipă & angajați",
      "API access + SLA",
    ],
    cta: "Contactează-ne",
    popular: false,
  },
];

const testimonials = [
  {
    name: "Ion Popa",
    role: "Fermier, Dolj • 320 ha",
    text: "Agral m-a ajutat să scap de dosarele cu contracte de arendă. Acum știu exact cine mi-a plătit și cine nu.",
    rating: 5,
  },
  {
    name: "Maria Ionescu",
    role: "Agronom, Ilfov • 150 ha",
    text: "Dashboard-ul cu vremea și lucrările planificate este exact ce aveam nevoie. Simplu și rapid.",
    rating: 5,
  },
  {
    name: "SC AgroVest SRL",
    role: "Cooperativă, Timiș • 1200 ha",
    text: "Gestionăm toată ferma dintr-un singur loc. Echipa noastră de 8 persoane lucrează în timp real.",
    rating: 5,
  },
];

export default function Home() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAnnual, setIsAnnual] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <TemporaryGate>
      <div className="min-h-screen bg-background relative selection:bg-green-100 selection:text-green-900">
        {/* Zoom Modal / Lightbox */}
        {selectedImage && (
          <div
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-12 cursor-zoom-out animate-in fade-in duration-300"
            onClick={() => setSelectedImage(null)}
          >
            <div className="relative w-full h-full max-w-7xl">
              <Image
                src={selectedImage}
                alt="Zoomed View"
                fill
                className="object-contain rounded-xl"
                priority
              />
              <button
                className="absolute top-4 right-4 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
                onClick={(e) => { e.stopPropagation(); setSelectedImage(null); }}
              >
                <span className="text-2xl">×</span>
              </button>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav
          className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-border ${isScrolled
            ? "bg-background/95 backdrop-blur-lg h-14"
            : "bg-background/80 backdrop-blur-md h-16 md:h-20"
            }`}
        >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex items-center justify-between h-full">
            <Link href="/" className="flex items-center transition-transform hover:scale-105">
              <Image
                src="/logo_agral_clar_cropped.png"
                alt="Agral — Portalul Fermierilor"
                width={100}
                height={40}
                className="object-contain mix-blend-multiply"
                priority
              />
            </Link>
            <div className="hidden md:flex items-center gap-10 text-sm font-bold uppercase tracking-wider">
              {/* Links removed as requested */}
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <Link href="/">
                <Button variant="ghost" className="font-bold text-sm hidden sm:flex">Intră în cont</Button>
              </Link>
              <Link href="/">
                <Button className={`agral-gradient text-white font-bold transition-all shadow-lg shadow-green-600/20 ${isScrolled ? 'h-9 px-4 text-xs' : 'h-11 px-6 text-sm'} rounded-xl`}>
                  Încearcă gratuit
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Overview */}
      <section className="relative px-4 overflow-hidden min-h-screen pt-32 md:pt-48 pb-20 flex flex-col items-center justify-start text-center">
        {/* Immersive Background Elements */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/background_prezentare.png"
            alt="Hero Background"
            fill
            className="object-cover opacity-25"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background opacity-40" />
        </div>

        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 -z-20" />
        <div className="absolute top-[-10%] left-[-10%] w-[40%] aspect-square bg-green-400/20 rounded-full blur-[120px] -z-10 animate-pulse duration-[10s]" />
        <div className="absolute top-[20%] right-[-5%] w-[30%] aspect-square bg-emerald-300/15 rounded-full blur-[100px] -z-10 animate-pulse duration-[15s]" />
        <div className="absolute bottom-[-10%] left-[20%] w-[35%] aspect-square bg-lime-200/10 rounded-full blur-[100px] -z-10 animate-pulse duration-[12s]" />

        <div className="max-w-5xl mx-auto z-10 animate-fade-in-up">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-foreground mb-6 leading-[1.05] tracking-tight">
            Digitalizarea fermei tale <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text agral-gradient !bg-clip-text drop-shadow-sm" style={{ WebkitBackgroundClip: "text" }}>
              începe aici
            </span>
          </h1>
          <p className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed font-semibold">
            Simplifică managementul agricol cu singura platformă digitală completă din România. Totul într-un singur loc, accesibil de oriunde.
          </p>

          <div className="flex flex-col items-center justify-center gap-16">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 w-full">
              <Link href="/">
                <Button className="agral-gradient text-white w-full sm:w-auto h-16 md:h-24 px-16 text-2xl font-black shadow-2xl shadow-green-600/40 hover:scale-110 active:scale-95 transition-all rounded-[2rem]">
                  Creează cont gratuit
                </Button>
              </Link>
              <a href="#features">
                <Button variant="outline" className="w-full sm:w-auto h-16 md:h-24 px-16 text-2xl font-black border-4 bg-white/60 backdrop-blur-sm border-white hover:bg-green-50 hover:text-green-700 transition-all rounded-[2rem] shadow-xl">
                  Vezi funcționalități
                </Button>
              </a>
            </div>

            {/* Social Proof */}
            <div className="flex items-center gap-4 bg-white/40 backdrop-blur-xl p-5 rounded-3xl border border-white/60 shadow-xl animate-fade-in-up animate-delay-200">
              <div className="flex -space-x-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="w-14 h-14 rounded-full border-4 border-white bg-slate-200 shadow-lg overflow-hidden transition-transform hover:translate-y-[-4px]">
                    <img src={`https://i.pravatar.cc/100?u=${i + 20}`} alt="user" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
              <div className="flex flex-col items-start ml-4">
                <div className="flex text-amber-500 mb-1">
                  {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-5 h-5 fill-current" />)}
                </div>
                <span className="text-sm font-black text-slate-800 uppercase tracking-widest italic">2,400+ fermieri au digitalizat ferma cu Agral</span>
              </div>
            </div>

            {/* NEW: 3-Column Mockup Gallery */}
            <div className="w-full pt-12">
              <div className="flex flex-col md:flex-row gap-6 lg:gap-10 w-full">
                {[
                  { src: "/dashboard_mockup.png", title: "Dashboard Central" },
                  { src: "/parcele_mockup.png", title: "Gestionare Parcele" },
                  { src: "/financiar_mockup.png", title: "Analiză Financiară" }
                ].map((mockup, idx) => (
                  <div
                    key={idx}
                    className="flex-1 group cursor-zoom-in"
                    onClick={() => setSelectedImage(mockup.src)}
                  >
                    <div className="relative aspect-[16/10] rounded-3xl overflow-hidden border-4 border-white shadow-2xl transition-all duration-500 group-hover:scale-[1.03] group-hover:shadow-green-500/20 group-hover:-translate-y-2">
                      <Image
                        src={mockup.src}
                        alt={mockup.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center p-6">
                        <span className="text-white font-black text-lg uppercase tracking-wider">{mockup.title}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-8 text-muted-foreground font-bold italic animate-pulse">
                Click pe imagini pentru a vedea detaliile în mărime naturală
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="px-4 pb-12 relative z-10 -mt-4">
        <div className="max-w-7xl mx-auto relative">
          {/* Subtle green glow behind stats */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[150%] bg-gradient-to-r from-green-400/5 via-green-300/10 to-green-400/5 blur-3xl -z-10" />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: "2,400+", label: "Fermieri activi" },
              { value: "180,000", label: "Hectare gestionate" },
              { value: "14,000+", label: "Contracte generate" },
              { value: "99.9%", label: "Uptime garantat" },
            ].map((stat) => (
              <div key={stat.label} className="text-center p-6 bg-card/80 backdrop-blur-sm rounded-2xl border border-border shadow-sm">
                <div className="text-3xl font-extrabold text-primary mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 relative overflow-hidden min-h-[calc(100vh-64px)] flex flex-col justify-center">
        {/* Subtle background waves */}
        <div className="absolute top-0 right-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        <div className="absolute top-40 right-[-10%] w-[600px] h-[600px] bg-green-500/5 rounded-full blur-[120px] -z-10" />

        <div className="max-w-7xl mx-auto z-10 relative">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-extrabold text-foreground mb-6">
              O platformă completă pentru ferma ta
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              De la parcelele din câmp până la contractele de arendă și prognoza meteo
              Agral acoperă toate aspectele activității agricole.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="group relative p-8 bg-card/80 backdrop-blur-md rounded-3xl border border-border shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                {/* Decorative glow on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/0 to-green-500/0 group-hover:from-green-500/5 group-hover:to-transparent transition-colors duration-500" />

                <div className={`w-14 h-14 ${f.bg} rounded-2xl flex items-center justify-center mb-6 shadow-inner`}>
                  <f.icon className={`w-7 h-7 ${f.color}`} />
                </div>
                <h3 className="text-xl font-extrabold text-foreground mb-3">{f.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-base relative z-10">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Agral */}
      <section className="py-20 px-4 bg-gradient-to-b from-green-50/50 to-background relative overflow-hidden min-h-[calc(100vh-64px)] flex flex-col justify-center">
        <div className="absolute left-[-10%] bottom-0 w-[500px] h-[500px] bg-green-400/10 rounded-full blur-[100px] -z-10" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-extrabold text-foreground mb-6">
                Construit special pentru fermierii români
              </h2>
              <div className="space-y-4">
                {[
                  { icon: FileText, title: "Contracte conform legii române", desc: "Template-uri actualizate la Legea 16/1994 privind arenda, cu toate clauzele obligatorii." },
                  { icon: Tractor, title: "Gândit pentru realitatea câmpului", desc: "Interfață simplă, butoane mari, funcționează pe orice dispozitiv - chiar și de pe telefon în câmp." },
                  { icon: Shield, title: "Datele tale sunt ale tale", desc: "Hosting în UE, conformitate GDPR, backup zilnic automat. CNP-urile proprietarilor sunt criptate." },
                ].map((item) => (
                  <div key={item.title} className="flex gap-4 p-4 bg-card rounded-xl border border-border">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                      <item.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-bold text-foreground mb-1">{item.title}</div>
                      <div className="text-sm text-muted-foreground">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-tr from-green-400/20 to-emerald-600/20 rounded-[3.5rem] blur-2xl opacity-70 -z-10" />
              <div className="aspect-square bg-white rounded-[3rem] border border-green-100 shadow-2xl overflow-hidden p-8 relative hover:shadow-green-500/10 transition-shadow duration-500">
                <div className="absolute top-0 right-0 w-64 h-64 bg-green-50 rounded-full blur-3xl -z-10 transform translate-x-1/2 -translate-y-1/2" />
                <div className="h-full bg-gradient-to-br from-green-50/50 to-white rounded-3xl border border-green-50/50 flex flex-col items-center justify-center gap-8 shadow-sm">
                  <Image
                    src="/logo_agral_clar_cropped.png"
                    alt="Agral"
                    width={140}
                    height={60}
                    className="object-contain mix-blend-multiply drop-shadow-sm"
                  />
                  <div className="text-green-800/80 text-sm font-bold uppercase tracking-wider">Ferma ta, digitalizată</div>
                  <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
                    {[
                      { label: "Parcele", value: "47" },
                      { label: "Hectare", value: "320" },
                      { label: "Contracte", value: "23" },
                      { label: "Sezon activ", value: "✓" },
                    ].map((item) => (
                      <div key={item.label} className="bg-white rounded-2xl p-4 text-center shadow-sm border border-green-50 hover:scale-105 transition-transform duration-300">
                        <div className="text-2xl font-black text-green-600 mb-1">{item.value}</div>
                        <div className="text-xs font-semibold text-muted-foreground uppercase">{item.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-4 relative min-h-[calc(100vh-64px)] flex flex-col justify-center">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-extrabold text-foreground mb-4">
              Fermieri care au ales Agral
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t) => (
              <div key={t.name} className="relative p-8 bg-card/50 backdrop-blur-sm rounded-3xl border border-border shadow-sm hover:shadow-lg transition-all duration-300">
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center opacity-50 z-0 text-4xl text-green-600 font-serif overflow-hidden">
                  <span className="mt-4">"</span>
                </div>
                <div className="relative z-10">
                  <div className="flex mb-6">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400 drop-shadow-sm" />
                    ))}
                  </div>
                  <p className="text-foreground mb-8 leading-relaxed text-lg font-medium">&ldquo;{t.text}&rdquo;</p>
                  <div>
                    <div className="font-bold text-foreground text-lg">{t.name}</div>
                    <div className="text-sm text-green-700 font-semibold">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 bg-gradient-to-b from-card to-background relative overflow-hidden min-h-[calc(100vh-64px)] flex flex-col justify-center">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-green-200 to-transparent" />
        <div className="absolute right-0 top-1/2 w-96 h-96 bg-green-500/5 rounded-full blur-[100px] -z-10" />

        <div className="max-w-7xl mx-auto z-10 relative">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-extrabold text-foreground mb-6">
              Un plan pentru orice fermă
            </h2>

            {/* Monthly/Annual Toggle */}
            <div className="flex items-center justify-center gap-4 mb-10">
              <span className={`text-sm font-bold ${!isAnnual ? 'text-green-700' : 'text-muted-foreground'}`}>Lunar</span>
              <button
                onClick={() => setIsAnnual(!isAnnual)}
                className="w-14 h-7 bg-muted rounded-full relative p-1 transition-colors hover:bg-slate-200"
              >
                <div className={`w-5 h-5 bg-green-600 rounded-full transition-all duration-300 shadow-md ${isAnnual ? 'translate-x-7' : 'translate-x-0'}`} />
              </button>
              <span className={`text-sm font-bold ${isAnnual ? 'text-green-700' : 'text-muted-foreground'}`}>Anual (-20%)</span>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan) => {
              const displayPrice = isAnnual
                ? Math.floor(parseInt(plan.price) * 0.8)
                : plan.price;

              return (
                <div
                  key={plan.name}
                  className={`flex flex-col p-8 rounded-[2rem] border-2 transition-all duration-300 relative ${plan.popular
                    ? "border-green-500 bg-gradient-to-b from-green-600 to-emerald-700 text-white shadow-2xl shadow-green-600/30 md:scale-105 z-10"
                    : "border-border bg-card/80 backdrop-blur-sm hover:shadow-xl hover:border-green-200"
                    }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-950 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg border-2 border-white z-20">
                      Cel mai ales
                    </div>
                  )}

                  <h3 className={`text-2xl font-extrabold mb-2 ${plan.popular ? "text-white" : "text-foreground"}`}>
                    {plan.name}
                  </h3>
                  <p className={`text-sm mb-6 ${plan.popular ? "text-white/80" : "text-muted-foreground"}`}>
                    {plan.desc}
                  </p>
                  <div className="flex items-baseline gap-1 mb-8">
                    <span className={`text-5xl font-black ${plan.popular ? "text-white" : "text-foreground"}`}>
                      {displayPrice}
                    </span>
                    <span className={`text-sm font-semibold ${plan.popular ? "text-white/80" : "text-muted-foreground"}`}>
                      RON / lună
                    </span>
                  </div>
                  <div className={`h-px w-full mb-8 ${plan.popular ? "bg-white/20" : "bg-border"}`} />
                  <ul className="space-y-4 mb-10 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-3">
                        <CheckCircle2 className={`w-5 h-5 shrink-0 ${plan.popular ? "text-green-300" : "text-green-600"}`} />
                        <span className={`text-sm font-medium ${plan.popular ? "text-white/95" : "text-foreground/90"}`}>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/">
                    <Button
                      className={`w-full font-bold h-14 text-lg rounded-xl transition-all ${plan.popular
                        ? "bg-white text-green-700 hover:bg-green-50 hover:scale-[1.02]"
                        : "agral-gradient text-white hover:opacity-90 hover:scale-[1.02]"
                        }`}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 px-4 relative overflow-hidden min-h-[calc(100vh-64px)] flex flex-col justify-center">
        <div className="absolute inset-0 agral-gradient mix-blend-multiply opacity-[0.02]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[400px] bg-green-300/10 blur-[100px] -z-10" />

        <div className="max-w-5xl mx-auto rounded-[3rem] p-12 md:p-20 text-center relative z-10 border border-green-100/60 bg-white/60 backdrop-blur-2xl shadow-xl overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-tr from-green-600/5 to-emerald-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 -z-10" />
          <h2 className="text-4xl md:text-5xl font-extrabold text-foreground mb-6 leading-tight">
            Începe să folosești Agral <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-br from-green-700 to-green-500 inline-block mt-2">gratuit chiar acum</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            Ai 30 de zile de probă în care poți folosi platforma fără restricții. Fără card bancar, fără obligații.
          </p>
          <div className="flex flex-col items-center justify-center gap-4">
            <Link href="/">
              <Button className="agral-gradient text-white h-16 px-12 text-xl font-bold shadow-2xl shadow-green-600/30 hover:scale-105 transition-all duration-300 rounded-2xl">
                Creează cont gratuit
              </Button>
            </Link>
            <p className="text-sm font-medium text-muted-foreground mt-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-600" />
              Date securizate & Confidențialitate garantată
            </p>
          </div>
        </div>
      </section>

      <Footer />
      </div>
    </TemporaryGate>
  );
}
