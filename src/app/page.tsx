import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AuthWidget } from "@/components/auth/AuthWidget";
import { CheckCircle2, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/background_register.png"
          alt="Agral Background"
          fill
          className="object-cover object-center"
          quality={100}
          priority
        />
        {/* Gradient verde subtil pentru lizibilitate */}
        <div className="absolute inset-0 bg-gradient-to-r from-green-100/90 via-green-100/40 to-transparent" />
      </div>
      <section className="px-4 py-12 relative w-full h-full flex flex-col justify-center min-h-screen z-10">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            {/* Left - Hero Text */}
            <div className="max-w-2xl relative">
              <div className="mb-10 animate-fade-in-up">
                <Image
                  src="/logo_agral_clar_cropped.png"
                  alt="Agral - Portalul Fermierilor"
                  width={460}
                  height={180}
                  className="object-contain mix-blend-multiply"
                  priority
                />
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-5xl font-extrabold text-foreground mb-6 animate-fade-in-up">
                Gestionează-ți ferma{" "}
                <span className="text-transparent bg-clip-text agral-gradient !bg-clip-text" style={{ WebkitBackgroundClip: "text", paddingBottom: "0.2em" }}>
                  inteligent
                </span>
              </h1>
              
              <p className="text-lg md:text-xl text-black font-medium mb-8 leading-relaxed animate-fade-in-up animate-delay-100">
                Aplicația web perfectă care îți digitalizează ferma. Parcele, contracte de arendă, 
                vreme, finanțe și lucrări agricole — toate la un click distanță.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up animate-delay-200">
                <Link href="/prezentare">
                  <Button size="lg" variant="outline" className="font-bold text-lg px-8 py-6 border-2 border-green-600 text-green-800 bg-green-50 hover:bg-green-100 hover:text-green-900 transition-all shadow-sm">
                    Află detalii despre aplicație
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              </div>
              
              <div className="flex flex-wrap items-center gap-6 mt-10 text-sm font-bold text-black animate-fade-in-up animate-delay-300">
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

            {/* Right - Auth Widget */}
            <div className="w-full max-w-md mx-auto lg:ml-auto animate-in zoom-in-95 duration-500 delay-150 relative">
              <div className="absolute -inset-4 bg-gradient-to-tr from-primary/20 to-accent/20 rounded-[2.5rem] blur-xl opacity-70" />
              <div className="relative">
                <AuthWidget />
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
