import { getOrganizationDetails } from "@/lib/actions/admin";
import { notFound } from "next/navigation";
import AdminOrgDetail from "@/components/admin/AdminOrgDetail";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminOrgPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  return (
    <Suspense fallback={<div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
      <AdminOrgDynamicContent orgId={orgId} />
    </Suspense>
  );
}

async function AdminOrgDynamicContent({ orgId }: { orgId: string }) {
  try {
    const org = await getOrganizationDetails(orgId);
    return <AdminOrgDetail org={org} />;
  } catch (error) {
    console.error("Error fetching org details:", error);
    return notFound();
  }
}
