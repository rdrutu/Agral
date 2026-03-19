import { getCurrentUser } from "@/lib/actions/profile";
import ModeratorTerminal from "@/components/moderator/ModeratorTerminal";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ModeratorPage() {
  const user = await getCurrentUser();

  if (!user || typeof user !== 'object' || (user.role !== "moderator" && user.role !== "superadmin")) {
    redirect("/");
  }

  return (
    <div className="h-[calc(100vh-120px)] animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-1 mb-6">
        <h1 className="text-3xl font-black tracking-tight">Terminal Moderator</h1>
        <p className="text-muted-foreground font-medium italic">Gestionează cererile de suport în timp real.</p>
      </div>
      
      <ModeratorTerminal moderatorName={user.firstName || "Moderator"} />
    </div>
  );
}
