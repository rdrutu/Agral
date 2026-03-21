import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AuthWidget } from "@/components/auth/AuthWidget";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Footer } from "@/components/layout/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-background relative flex flex-col">
      {/* Background Image */}
      <div className="fixed inset-0 z-0">
        <Image
          src="/background.png"
          alt="Agral Background"
          fill
          className="object-cover object-center"
          quality={100}
          priority
        />
        {/* Gradient verde subtil pentru lizibilitate */}
        <div className="absolute inset-0 bg-gradient-to-b md:bg-gradient-to-r from-green-100/90 via-green-100/60 md:via-green-100/40 to-green-100/20 md:to-transparent" />
      </div>
      <section className="relative w-full min-h-screen z-10 flex items-center justify-center px-4 py-12">
        <div className="max-w-7xl mx-auto w-full">
          {/* Logo special pentru mobil - Apare doar pe telefoane deasupra totului */}
          <div className="lg:hidden flex justify-center mb-8 animate-fade-in-up">
            <Image
              src="/logo_agral_clar_cropped.png"
              alt="Agral"
              width={160}
              height={60}
              className="object-contain mix-blend-multiply"
              priority
            />
          </div>

          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            
            <div className="order-2 lg:order-1 max-w-2xl relative flex flex-col items-center lg:items-start text-center lg:text-left">
              {/* Logo Desktop - Ascuns pe mobil ca avem versiunea de sus */}
              <div className="hidden lg:block mb-8 md:mb-12 animate-fade-in-up">
                <Image
                  src="/logo_agral_clar_cropped.png"
                  alt="Agral - Portalul Fermierilor"
                  width={420}
                  height={120}
                  className="object-contain mix-blend-multiply w-full max-w-[420px]"
                  priority
                />
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-7xl font-black text-foreground mb-4 md:mb-6 animate-fade-in-up leading-[1.1]">
                Gestionează-ți ferma{" "}
                <span className="text-transparent bg-clip-text agral-gradient !bg-clip-text" style={{ WebkitBackgroundClip: "text", paddingBottom: "0.2em" }}>
                  inteligent
                </span>
              </h1>
              
              <p className="text-base md:text-xl text-black font-semibold mb-8 md:mb-12 leading-relaxed animate-fade-in-up animate-delay-100 max-w-xl">
                Aplicația web perfectă care îți digitalizează ferma. Parcele, contracte de arendă, 
                vreme și finanțe — toate la un click distanță.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4 animate-fade-in-up animate-delay-200 w-full lg:w-auto">
                <Link href="/prezentare">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto font-bold text-base md:text-lg px-8 py-5 md:py-7 border-2 border-green-600 text-green-800 bg-green-50/50 hover:bg-green-100 hover:text-green-900 transition-all shadow-sm rounded-xl">
                    Află detalii despre aplicație
                    <ArrowRight className="ml-2 w-4 h-4 md:w-5 md:h-5" />
                  </Button>
                </Link>
              </div>
              
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-8 gap-y-4 mt-12 md:mt-16 text-sm font-black text-black/80 animate-fade-in-up animate-delay-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  <span>Configurare rapidă</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  <span>Siguranța datelor (Cloud)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  <span>Suport tehnic local</span>
                </div>
              </div>
            </div>

            {/* Right - Auth Widget - Order 1 on mobile, 2 on Desktop (pt a fi sub Logo-ul de mobil) */}
            <div className="order-1 lg:order-2 w-full max-w-[520px] mx-auto lg:mr-0 lg:ml-auto animate-in zoom-in-95 duration-500 delay-150 relative">
              <div className="absolute -inset-6 bg-gradient-to-tr from-primary/30 to-emerald-400/20 rounded-full blur-[100px] opacity-70" />
              <div className="relative">
                <AuthWidget />
              </div>
            </div>

          </div>
        </div>
      </section>
      
      <div className="mt-auto">
        <Footer />
      </div>
    </div>
  );
}
