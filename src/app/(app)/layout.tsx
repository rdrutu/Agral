import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { redirect } from "next/navigation";
import SupportChatWidgetV2 from "@/components/support/SupportChatWidgetV2";
import { getCurrentUser } from "@/lib/actions/profile";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Fetch real user data server-side using cached function
  const dbUser = await getCurrentUser();

  let userName = "Utilizator";
  let farmName = "Ferma Mea";
  let userEmail = "";
  let userRole = "owner";
  let subTier = "trial";
  let orgCreatedAt: Date | null = null;
  let subExpiresAt: Date | null = null;

  if (dbUser) {
    userEmail = dbUser.email || "";

    if (!dbUser) {
      redirect("/onboarding");
    }
    userRole = dbUser.role || "owner";
    
    if (!dbUser.organization && userRole !== "superadmin" && userRole !== "moderator") {
      redirect("/onboarding");
    }

    const firstName = dbUser.firstName || "";
    const lastName = dbUser.lastName || "";
    if (firstName || lastName) {
      userName = `${firstName} ${lastName}`.trim();
    } else {
      userName = userEmail.split("@")[0] || "Utilizator";
    }
    userRole = dbUser.role || "owner";
    if (dbUser.organization) {
      farmName = dbUser.organization.name;
      subTier = dbUser.organization.subscriptionTier;
      orgCreatedAt = new Date(dbUser.organization.createdAt);
      subExpiresAt = dbUser.organization.subscriptionExpiresAt ? new Date(dbUser.organization.subscriptionExpiresAt) : null;
    } else if (userRole === "superadmin") {
      farmName = "Administrator Agral";
    } else if (userRole === "moderator") {
      farmName = "Moderator Suport";
    }
  } else {
    // If not logged in redirect to login/onboarding
    // Usually middleware handles auth, but just in case
    redirect("/onboarding");
  }

  return (
    <div className="flex h-screen overflow-hidden mesh-gradient-bg" suppressHydrationWarning>
      <Sidebar 
        userRole={userRole} 
        userName={userName} 
        subTier={subTier} 
        orgCreatedAt={orgCreatedAt?.toISOString()}
        subExpiresAt={subExpiresAt?.toISOString()}
      />
      <div className="flex-1 flex flex-col overflow-hidden" suppressHydrationWarning>
        <Header 
          userName={userName} 
          farmName={farmName} 
          userEmail={userEmail} 
          userRole={userRole}
          subscriptionTier={subTier}
        />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6" suppressHydrationWarning>
          {children}
        </main>
      </div>
      {userRole !== "superadmin" && userRole !== "moderator" && <SupportChatWidgetV2 />}
    </div>
  );
}
