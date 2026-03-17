import { getCurrentUser } from "@/lib/actions/profile";
import ProfileClient from "@/components/profil/ProfileClient";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ProfilPage() {
  const user = await getCurrentUser();

  if (!user) redirect("/login");

  return (
    <div className="animate-in fade-in zoom-in duration-300">
      <ProfileClient
        user={{
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          organization: user.organization
            ? {
                name: user.organization.name,
                county: user.organization.county,
                address: user.organization.address,
                subscriptionTier: user.organization.subscriptionTier,
              }
            : null,
        }}
      />
    </div>
  );
}
