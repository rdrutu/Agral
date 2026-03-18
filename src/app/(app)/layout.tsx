import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Fetch real user data server-side
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let userName = "Utilizator";
  let farmName = "Ferma Mea";
  let userEmail = "";
  let userRole = "owner";
  let subTier = "trial";
  let orgCreatedAt: Date | null = null;
  let subExpiresAt: Date | null = null;

  if (user) {
    userEmail = user.email || "";
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { organization: true }
    });

    if (!dbUser) {
      // User din Supabase dar fÄƒrÄƒ rÃ¢nd Ã®n Prisma -> trimitem la onboarding
      redirect("/onboarding");
    }

    if (dbUser) {
      userRole = dbUser.role || "owner";
      
      // DacÄƒ utilizatorul nu e superadmin È™i nu are organizaÈ›ie, Ã®l trimitem la onboarding
      if (!dbUser.organization && userRole !== "superadmin") {
        redirect("/onboarding");
      }

      const firstName = dbUser.firstName || "";
      const lastName = dbUser.lastName || "";
      if (firstName || lastName) {
        userName = `${firstName} ${lastName}`.trim();
      } else {
        // Fallback la email prefix
        userName = userEmail.split("@")[0] || "Utilizator";
      }
      userRole = dbUser.role || "owner";
      if (dbUser.organization) {
        farmName = dbUser.organization.name;
        subTier = dbUser.organization.subscriptionTier;
        orgCreatedAt = dbUser.organization.createdAt;
        subExpiresAt = dbUser.organization.subscriptionExpiresAt;
      } else if (userRole === "superadmin") {
        farmName = "Administrator Agral";
      }
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar 
        userRole={userRole} 
        userName={userName} 
        subTier={subTier} 
        orgCreatedAt={orgCreatedAt?.toISOString()}
        subExpiresAt={subExpiresAt?.toISOString()}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          userName={userName} 
          farmName={farmName} 
          userEmail={userEmail} 
          userRole={userRole}
          subscriptionTier={subTier}
        />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
