import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid md:grid-cols-2">
      {/* Left - Brand panel */}
      <div className="hidden md:flex flex-col items-center justify-center agral-gradient p-12 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-40 h-40 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-20 right-10 w-60 h-60 rounded-full bg-white blur-3xl" />
        </div>
        <div className="relative text-center max-w-sm">
          {/* Logo pe fundal verde — versiune albă */}
          <div className="flex items-center justify-center mb-8">
            <div className="bg-white rounded-2xl px-8 py-5 shadow-xl">
              <Image
                src="/logo_agral.png"
                alt="Agral — Portalul Fermierilor"
                width={180}
                height={80}
                className="object-contain"
                priority
              />
            </div>
          </div>
          <p className="text-lg text-white/85 leading-relaxed mb-8">
            Platforma digitală pentru fermieri. Gestionează parcele, contracte de arendă, vreme și finanțe.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: "2,400+", label: "Fermieri" },
              { value: "180k", label: "Hectare" },
              { value: "14k+", label: "Contracte" },
              { value: "100%", label: "Securizat" },
            ].map((s) => (
              <div key={s.label} className="bg-white/15 rounded-xl p-3 text-center">
                <div className="text-xl font-bold">{s.value}</div>
                <div className="text-xs text-white/70">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right - Form */}
      <div className="flex flex-col items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          {/* Logo pentru mobile */}
          <div className="md:hidden flex items-center justify-center mb-8">
            <Link href="/">
              <Image
                src="/logo_agral.png"
                alt="Agral"
                width={140}
                height={60}
                className="object-contain"
                priority
              />
            </Link>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
