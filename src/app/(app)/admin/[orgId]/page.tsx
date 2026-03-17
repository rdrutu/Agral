import { getOrganizationDetails } from "@/lib/actions/admin";
import { notFound } from "next/navigation";
import AdminOrgDetail from "@/components/admin/AdminOrgDetail";

export const dynamic = "force-dynamic";

export default async function AdminOrgPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  try {
    const org = await getOrganizationDetails(orgId);
    return <AdminOrgDetail org={org} />;
  } catch (error) {
    console.error("Error fetching org details:", error);
    return notFound();
  }
}
