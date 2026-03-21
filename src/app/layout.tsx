import type { Metadata } from "next";
import { Nunito, Raleway } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

// Raleway — matching logo-ul Agral (geometric, bold caps)
const raleway = Raleway({
  variable: "--font-raleway",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

// Nunito — body text, prietenos, ușor de citit
const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Agral — Portalul Fermierilor",
  description: "Gestionează-ți ferma inteligent: parcele, contracte de arendă, vreme, finanțe — totul într-un singur loc.",
  keywords: ["agricultura", "fermier", "parcele", "arenda", "management ferma", "Romania"],
  icons: {
    icon: "/logo_agral_mic_cropped.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ro" suppressHydrationWarning>
      <body className={`${raleway.variable} ${nunito.variable} antialiased`} suppressHydrationWarning>
        <Toaster position="top-center" reverseOrder={false} />
        {/* Mitigation for browser extensions injecting attributes that break hydration (e.g. Bitdefender) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const clean = (el) => {
                  if (el.removeAttribute) {
                    el.removeAttribute('bis_skin_checked');
                    el.removeAttribute('bis_size');
                    el.removeAttribute('bis_id');
                  }
                };
                const observer = new MutationObserver((mutations) => {
                  for (const mutation of mutations) {
                    for (const node of mutation.addedNodes) {
                      if (node.nodeType === 1) {
                        clean(node);
                        const children = node.querySelectorAll('[bis_skin_checked], [bis_size], [bis_id]');
                        for (const child of children) clean(child);
                      }
                    }
                  }
                });
                observer.observe(document.documentElement, { childList: true, subtree: true });
                // Initial clean
                const initial = document.querySelectorAll('[bis_skin_checked], [bis_size], [bis_id]');
                for (const el of initial) clean(el);
              })();
            `,
          }}
        />
        {children}
      </body>
    </html>
  );
}
