import { getCurrentUser } from "@/lib/actions/profile";
import SettingsClient from "@/components/setari/SettingsClient";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getCurrentUser();

  if (!user) redirect("/");

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in zoom-in duration-300">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black tracking-tight">Setări Aplicație</h1>
        <p className="text-muted-foreground font-medium">Configurează preferințele tale și accesează ghidul de utilizare.</p>
      </div>
      
      <SettingsClient
        user={{
          email: user.email,
          role: user.role,
        }}
      />
    </div>
  );
}
