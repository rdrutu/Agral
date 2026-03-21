import { getCurrentUser } from "@/lib/actions/profile";
import SettingsClient from "@/components/setari/SettingsClient";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in zoom-in duration-300" suppressHydrationWarning>
      <div className="flex flex-col gap-1" suppressHydrationWarning>
        <h1 className="text-3xl font-black tracking-tight">Setări Aplicație</h1>
        <p className="text-muted-foreground font-medium">Configurează preferințele tale și accesează ghidul de utilizare.</p>
      </div>
      
      <Suspense fallback={<div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
        <SettingsDynamicContent />
      </Suspense>
    </div>
  );
}

async function SettingsDynamicContent() {
  const user = await getCurrentUser();

  if (!user) redirect("/");

  return (
    <SettingsClient
      user={{
        email: user.email,
        role: user.role,
      }}
    />
  );
}
