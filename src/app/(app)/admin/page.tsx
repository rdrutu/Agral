import { getAllOrganizations, checkSuperadmin } from "@/lib/actions/admin";
import AdminClient from "@/components/admin/AdminClient";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default function AdminPage() {
  return (
    <div className="animate-in fade-in zoom-in duration-300">
      <Suspense fallback={<div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
        <AdminDynamicContent />
      </Suspense>
    </div>
  );
}

async function AdminDynamicContent() {
  const isSuper = await checkSuperadmin();

  // Daca nu e superadmin dam doar prop isSuperadmin = false catre client
  // Ca sa afiseze placeholder-ul dev de promovare manuala
  const orgs = isSuper ? await getAllOrganizations() : [];

  return (
    <AdminClient orgs={orgs} isSuperadmin={isSuper} />
  );
}
