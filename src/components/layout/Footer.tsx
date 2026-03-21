"use client";

import Image from "next/image";
import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-green-100 py-12 px-4 relative z-10 font-nunito">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Logo & Slogan */}
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="inline-block mb-6">
              <Image
                src="/logo_agral_clar_cropped.png"
                alt="Agral"
                width={120}
                height={48}
                className="object-contain mix-blend-multiply"
              />
            </Link>
            <p className="text-muted-foreground text-sm font-medium leading-relaxed italic">
              Digitalizăm agricultura din România, pas cu pas, parcelă cu parcelă.
            </p>
          </div>

          {/* Date Firma (Placeholders) */}
          <div className="col-span-1">
            <h4 className="text-foreground font-black uppercase tracking-tighter text-sm mb-6">Identitate Legală</h4>
            <div className="space-y-3 text-sm font-bold text-muted-foreground/80">
              <p>[TEST] NUME FIRMA S.R.L.</p>
              <p>CUI: RO00000000</p>
              <p>Reg. Com: Jxx/xxxx/xxxx</p>
              <p>Sediu: [TEST] Adresa Sediului Social, Oraș, Județ</p>
            </div>
          </div>

          {/* Linkuri Utile */}
          <div className="col-span-1">
            <h4 className="text-foreground font-black uppercase tracking-tighter text-sm mb-6">Navigare</h4>
            <ul className="space-y-3 text-sm font-bold">
              <li>
                <Link href="/prezentare" className="text-muted-foreground hover:text-green-700 transition-colors">Prezentare</Link>
              </li>
              <li>
                <Link href="/" className="text-muted-foreground hover:text-green-700 transition-colors">Aplicație</Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-green-700 transition-colors">Contact & Suport</Link>
              </li>
            </ul>
          </div>

          {/* Legal Mandatory Links */}
          <div className="col-span-1">
            <h4 className="text-foreground font-black uppercase tracking-tighter text-sm mb-6">Informații Legale</h4>
            <div className="flex flex-col gap-4">
              <ul className="space-y-3 text-sm font-bold">
                <li>
                  <Link href="/termeni-si-conditii" className="text-muted-foreground hover:text-green-700 transition-colors">Termeni & Condiții</Link>
                </li>
                <li>
                  <Link href="/confidentialitate" className="text-muted-foreground hover:text-green-700 transition-colors">Confidențialitate & GDPR</Link>
                </li>
              </ul>
              
              {/* Mandatory ANPC/SOL images/links */}
              <div className="flex flex-wrap gap-3 pt-2">
                <a 
                  href="https://anpc.ro/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:opacity-80 transition-opacity"
                >
                  <div className="bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 text-[10px] font-black text-slate-600 uppercase">ANPC</div>
                </a>
                <a 
                  href="https://ec.europa.eu/consumers/odr/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:opacity-80 transition-opacity"
                >
                  <div className="bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 text-[10px] font-black text-slate-600 uppercase">SOL</div>
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-green-50 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs font-bold text-muted-foreground/60">
            © {currentYear} Agral Portalul Fermierilor. Toate drepturile rezervate.
          </p>
          <p className="text-xs font-black text-green-600 uppercase tracking-widest bg-green-50 px-3 py-1 rounded-full border border-green-200">
            Versiune Beta / Testare
          </p>
        </div>
      </div>
    </footer>
  );
}
