import { Metadata } from "next";
import { Nunito, Raleway } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { CookieBanner } from "@/components/common/CookieBanner";
import Script from "next/script";

// Raleway - matching logo-ul Agral (geometric, bold caps)
const raleway = Raleway({
  variable: "--font-raleway",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

// Nunito - body text, friendly, easy to read, preferred by user
const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Agral - Portalul Fermierilor",
    template: "%s | Agral"
  },
  description: "Eficiență în Agricultură. Înscrie-te acum",
  keywords: ["agricultura", "fermier", "parcele", "arenda", "management ferma", "Romania", "agronom", "cadastru", "lucrari agricole", "stocuri", "depozit"],
  icons: {
    icon: "/logo_agral_mic_cropped.png",
    apple: "/logo_agral_mic_cropped.png",
  },
  themeColor: "#22c55e",
  openGraph: {
    title: "Agral - Portalul Fermierilor din România",
    description: "Eficiență în Agricultură. Înscrie-te acum",
    url: "https://www.agral.ro",
    siteName: "Agral",
    images: [
      {
        url: "/imagine_distribuita.png",
        width: 1200,
        height: 630,
        alt: "Agral Dashboard Preview",
      },
    ],
    locale: "ro_RO",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Agral - Portalul Fermierilor",
    description: "Eficiență și control total asupra fermei tale.",
    images: ["/imagine_distribuita.png"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Agral",
  "operatingSystem": "Web",
  "applicationCategory": "BusinessApplication",
  "description": "Portalul Fermierilor din România pentru managementul inteligent al fermelor: parcele, contracte, finanțe.",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "RON"
  }
};

import { CookieProvider } from "@/context/CookieContext";
import { ConsentTracking } from "@/components/common/ConsentTracking";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ro" suppressHydrationWarning>
      <body className={`${raleway.variable} ${nunito.variable} antialiased`} suppressHydrationWarning>
        <CookieProvider>
          <Script
            id="json-ld"
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
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
          <CookieBanner />
          <ConsentTracking />
        </CookieProvider>
      </body>
    </html>
  );
}
