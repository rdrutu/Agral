import { OnboardingClient } from "@/components/onboarding/OnboardingClient";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Footer } from "@/components/layout/Footer";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  // VerificÄƒm dacÄƒ are deja organizaÈ›ie
  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (dbUser?.orgId) {
    redirect("/dashboard");
  }

  return (
    <div
      className="min-h-screen relative flex flex-col items-center justify-start p-4 md:p-6 bg-cover bg-center bg-fixed pt-4 md:pt-8"
      style={{
        backgroundImage: "url('/background_onboarding.png')",
      }}
    >
      {/* Overlay gradient subtil alb (stânga → dreapta) */}
      <div className="fixed inset-0 bg-gradient-to-r from-white/60 to-white/10 backdrop-blur-[2px] z-0" />

      <div className="relative w-full z-10 flex flex-col items-center justify-start h-full flex-1">
        <OnboardingClient />
      </div>

      <div className="relative z-10 w-full mt-10">
        <Footer />
      </div>
    </div>
  );
}
