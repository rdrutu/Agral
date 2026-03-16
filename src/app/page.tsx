import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

const features = [
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
    price: "49",
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
    price: "149",
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
    price: "399",
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
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center">
              <Image
                src="/logo_agral.png"
                alt="Agral — Portalul Fermierilor"
                width={110}
                height={44}
                className="object-contain"
                priority
              />
            </Link>
            <div className="hidden md:flex items-center gap-8 text-sm font-medium">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Funcționalități</a>
              <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Prețuri</a>
              <a href="#testimonials" className="text-muted-foreground hover:text-foreground transition-colors">Testimoniale</a>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" className="font-semibold">Intră în cont</Button>
              </Link>
              <Link href="/register">
                <Button className="agral-gradient text-white font-semibold hover:opacity-90 transition-opacity">
                  Încearcă 30 zile gratuit
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 agral-gradient-subtle" />
        <div className="absolute top-20 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-10 w-64 h-64 bg-accent/30 rounded-full blur-3xl" />
        
        <div className="max-w-7xl mx-auto relative">
          <div className="max-w-3xl">
            <Badge className="mb-6 bg-green-100 text-green-800 border-green-200 font-semibold py-1 px-3">
              🌾 Platformă dedicată fermierilor români
            </Badge>
            <h1 className="text-5xl md:text-6xl font-extrabold text-foreground leading-tight mb-6 animate-fade-in-up">
              Gestionează-ți ferma{" "}
              <span className="text-transparent bg-clip-text agral-gradient">
                inteligent
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-10 leading-relaxed animate-fade-in-up animate-delay-100">
              Agral centralizează toate activitățile fermei tale: parcele, contracte de arendă, 
              vreme, finanțe și lucrări agricole — într-o interfață simplă, optimizată pentru fermieri.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up animate-delay-200">
              <Link href="/register">
                <Button size="lg" className="agral-gradient text-white font-bold text-lg px-8 py-6 hover:opacity-90 transition-opacity shadow-lg shadow-primary/20">
                  Încearcă gratuit 30 zile
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="#features">
                <Button size="lg" variant="outline" className="font-bold text-lg px-8 py-6 border-2">
                  Vezi funcționalitățile
                </Button>
              </Link>
            </div>
            <div className="flex items-center gap-6 mt-8 text-sm text-muted-foreground animate-fade-in-up animate-delay-300">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <span>Fără card bancar</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <span>Anulezi oricând</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-primary" />
                <span>Date securizate GDPR</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20">
            {[
              { value: "2,400+", label: "Fermieri activi" },
              { value: "180,000", label: "Hectare gestionate" },
              { value: "14,000+", label: "Contracte generate" },
              { value: "99.9%", label: "Uptime garantat" },
            ].map((stat) => (
              <div key={stat.label} className="text-center p-6 bg-card rounded-2xl border border-border shadow-sm">
                <div className="text-3xl font-extrabold text-primary mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-green-100 text-green-800 border-green-200">Tot ce ai nevoie</Badge>
            <h2 className="text-4xl font-extrabold text-foreground mb-4">
              O platformă completă pentru ferma ta
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              De la parcelele din câmp până la contractele de arendă și prognoza meteo — 
              Agral acoperă toate aspectele activității agricole.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="p-6 bg-card rounded-2xl border border-border card-hover cursor-default animate-fade-in-up"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className={`w-12 h-12 ${f.bg} rounded-xl flex items-center justify-center mb-4`}>
                  <f.icon className={`w-6 h-6 ${f.color}`} />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{f.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Agral */}
      <section className="py-20 px-4 bg-primary/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <Badge className="mb-4 bg-green-100 text-green-800 border-green-200">De ce Agral?</Badge>
              <h2 className="text-4xl font-extrabold text-foreground mb-6">
                Construit special pentru fermierii români
              </h2>
              <div className="space-y-4">
                {[
                  { icon: FileText, title: "Contracte conform legii române", desc: "Template-uri actualizate la Legea 16/1994 privind arenda, cu toate clauzele obligatorii." },
                  { icon: Tractor, title: "Gândit pentru realitatea câmpului", desc: "Interfață simplă, butoane mari, funcționează pe orice dispozitiv — chiar și de pe telefon în câmp." },
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
              <div className="aspect-square bg-card rounded-3xl border-2 border-border shadow-xl overflow-hidden p-8">
                <div className="h-full agral-gradient-subtle rounded-2xl flex flex-col items-center justify-center gap-6">
                  <Image
                    src="/logo_agral.png"
                    alt="Agral"
                    width={120}
                    height={54}
                    className="object-contain"
                  />
                  <div className="text-muted-foreground text-sm font-medium">Ferma ta, digitalizată</div>
                  <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
                    {[
                      { label: "Parcele", value: "47" },
                      { label: "Hectare", value: "320" },
                      { label: "Contracte", value: "23" },
                      { label: "Sezon activ", value: "✓" },
                    ].map((item) => (
                      <div key={item.label} className="bg-white/80 rounded-xl p-3 text-center">
                        <div className="text-lg font-bold text-primary">{item.value}</div>
                        <div className="text-xs text-muted-foreground">{item.label}</div>
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
      <section id="testimonials" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-green-100 text-green-800 border-green-200">Testimoniale</Badge>
            <h2 className="text-4xl font-extrabold text-foreground mb-4">
              Fermieri care au ales Agral
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="p-6 bg-card rounded-2xl border border-border card-hover">
                <div className="flex mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-foreground mb-4 leading-relaxed italic">&ldquo;{t.text}&rdquo;</p>
                <div>
                  <div className="font-bold text-foreground">{t.name}</div>
                  <div className="text-sm text-muted-foreground">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 bg-primary/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-green-100 text-green-800 border-green-200">Prețuri transparente</Badge>
            <h2 className="text-4xl font-extrabold text-foreground mb-4">
              Un plan pentru orice fermă
            </h2>
            <p className="text-lg text-muted-foreground">
              30 zile gratuit pe orice plan. Nicio taxă ascunsă.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`p-8 rounded-2xl border-2 ${
                  plan.popular
                    ? "border-primary bg-primary text-primary-foreground shadow-xl shadow-primary/20 scale-105"
                    : "border-border bg-card"
                }`}
              >
                {plan.popular && (
                  <Badge className="bg-white/20 text-white border-white/30 mb-4">
                    ⭐ Cel mai popular
                  </Badge>
                )}
                <h3 className={`text-xl font-bold mb-1 ${plan.popular ? "text-white" : "text-foreground"}`}>
                  {plan.name}
                </h3>
                <p className={`text-sm mb-4 ${plan.popular ? "text-white/70" : "text-muted-foreground"}`}>
                  {plan.desc}
                </p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className={`text-4xl font-extrabold ${plan.popular ? "text-white" : "text-foreground"}`}>
                    {plan.price}
                  </span>
                  <span className={`text-sm ${plan.popular ? "text-white/70" : "text-muted-foreground"}`}>
                    RON/lună
                  </span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <CheckCircle2 className={`w-4 h-4 shrink-0 ${plan.popular ? "text-white/80" : "text-primary"}`} />
                      <span className={`text-sm ${plan.popular ? "text-white/90" : "text-foreground"}`}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/register">
                  <Button
                    className={`w-full font-bold py-6 ${
                      plan.popular
                        ? "bg-white text-primary hover:bg-white/90"
                        : "agral-gradient text-white hover:opacity-90"
                    }`}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="p-12 agral-gradient rounded-3xl text-white shadow-2xl shadow-primary/30">
            <h2 className="text-4xl font-extrabold mb-4">
              Gata să-ți digitalizezi ferma?
            </h2>
            <p className="text-xl text-white/80 mb-8">
              Alătură-te celor 2,400+ fermieri care gestionează peste 180,000 hectare cu Agral.
            </p>
            <Link href="/register">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-bold text-lg px-10 py-6 shadow-lg">
                Încearcă 30 zile gratuit
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <p className="mt-4 text-sm text-white/60">Fără card bancar • Anulezi oricând</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <Link href="/" className="flex items-center">
              <Image
                src="/logo_agral.png"
                alt="Agral"
                width={90}
                height={36}
                className="object-contain"
              />
            </Link>
            <p className="text-sm text-muted-foreground">
              © 2026 Agral. Platforma pentru fermierii români.
            </p>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Termeni</a>
              <a href="#" className="hover:text-foreground transition-colors">Confidențialitate</a>
              <a href="#" className="hover:text-foreground transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
