import { getAllOrganizations, checkSuperadmin } from "@/lib/actions/admin";
import AdminClient from "@/components/admin/AdminClient";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const isSuper = await checkSuperadmin();

  // Daca nu e superadmin dam doar prop isSuperadmin = false catre client
  // Ca sa afiseze placeholder-ul dev de promovare manuala
  const orgs = isSuper ? await getAllOrganizations() : [];

  return (
    <div className="animate-in fade-in zoom-in duration-300">
      <AdminClient orgs={orgs} isSuperadmin={isSuper} />
    </div>
  );
}
