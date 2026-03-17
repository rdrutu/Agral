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
    icon: "/logo_agral.png",
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
        {children}
      </body>
    </html>
  );
}
