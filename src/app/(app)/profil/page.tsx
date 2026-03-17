import { getCurrentUser } from "@/lib/actions/profile";
import ProfileClient from "@/components/profil/ProfileClient";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ProfilPage() {
  const user = await getCurrentUser();

  if (!user) redirect("/");

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
                cui: user.organization.cui,
                legalName: user.organization.legalName,
                registrationNumber: user.organization.registrationNumber,
                caen: user.organization.caen,
                phone: user.organization.phone,
                baseLat: user.organization.baseLat ? Number(user.organization.baseLat) : null,
                baseLng: user.organization.baseLng ? Number(user.organization.baseLng) : null,
                payments: user.organization.payments || []
              }
            : null,
        }}
      />
    </div>
  );
}
