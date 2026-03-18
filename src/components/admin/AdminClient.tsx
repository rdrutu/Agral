"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn, formatDate } from "@/lib/utils";
import toast from "react-hot-toast";
import {
  ShieldCheck,
  Building2,
  Users,
  MapPin,
  Search,
  Settings,
  X,
  Loader2,
  CheckCircle2,
  CreditCard,
  Calendar,
  Phone
} from "lucide-react";
import { 
  updateOrgSubscription, 
  promoteToSuperadmin, 
  getSuperadmins, 
  demoteSuperadmin, 
  cleanupGhostFarms 
} from "@/lib/actions/admin";
import { useRouter } from "next/navigation";

// Tipurile abonamentelor
const TIERS = [
  { id: "trial", label: "Trial", max: 1 },
  { id: "starter", label: "Starter", max: 3 },
  { id: "pro", label: "Pro", max: 10 },
  { id: "enterprise", label: "Enterprise", max: 50 },
];

export default function AdminClient({ orgs, isSuperadmin }: { orgs: any[], isSuperadmin: boolean }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [editingOrg, setEditingOrg] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [activeTab, setActiveTab] = useState<"orgs" | "admins">("orgs");
  const [admins, setAdmins] = useState<any[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);

  // States pt form edit
  const [newTier, setNewTier] = useState("");
  const [newMaxUsers, setNewMaxUsers] = useState<number>(1);

  const filteredOrgs = orgs.filter(o => 
    o.name.toLowerCase().includes(search.toLowerCase()) || 
    (o.county || "").toLowerCase().includes(search.toLowerCase())
  );

  async function handlePromote() {
    if (confirm("Promovați acest cont la Superadmin?")) {
      try {
        await promoteToSuperadmin();
        toast.success("Succes! Reîncărcare...");
        setTimeout(() => window.location.reload(), 1000);
      } catch (err: any) {
        toast.error("Eroare la promovare: " + err.message);
      }
    }
  }

  async function handleSaveSettings() {
    if (!editingOrg) return;
    setIsSubmitting(true);
    try {
      await updateOrgSubscription(editingOrg.id, { tier: newTier, maxUsers: newMaxUsers });
      toast.success("Modificări salvate cu succes!");
      setTimeout(() => window.location.reload(), 1000);
    } catch {
      toast.error("Eroare la salvare. Verificați permisiunile.");
      setIsSubmitting(false);
    }
  }

  async function fetchAdmins() {
    setLoadingAdmins(true);
    try {
      const data = await getSuperadmins();
      setAdmins(data);
    } catch (err: any) {
      toast.error("Eroare la preluarea adminilor: " + err.message);
    } finally {
      setLoadingAdmins(false);
    }
  }

  async function handleDemote(id: string) {
    if (confirm("Sigur doriți să eliminați permisiunile de superadmin pentru acest cont?")) {
      try {
        await demoteSuperadmin(id);
        toast.success("Utilizator retrogradat.");
        fetchAdmins();
      } catch (err: any) {
        toast.error(err.message);
      }
    }
  }

  async function handleCleanup() {
    setIsCleaning(true);
    try {
      const count = await cleanupGhostFarms();
      toast.success(`Curățenie finalizată! Am șters ${count} ferme fără activitate.`);
      setTimeout(() => window.location.reload(), 1000);
    } catch (err: any) {
      toast.error("Eroare la curățenie: " + err.message);
    } finally {
      setIsCleaning(false);
    }
  }

  if (!isSuperadmin) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
        <ShieldCheck className="w-16 h-16 text-muted-foreground opacity-50" />
        <h2 className="text-2xl font-bold">Zonă Restricționată</h2>
        <p className="text-muted-foreground max-w-md">
          Această secțiune este accesibilă doar administratorilor platformei Agral.
        </p>
        <Button onClick={handlePromote} variant="outline" className="mt-4 border-primary text-primary">
          [DEV] Promovează-mă pe mine Superadmin
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-foreground flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-primary" />
            Administrare Platformă
          </h2>
          <p className="text-muted-foreground mt-1">
            Gestionează fermele înscrise, abonamentele și limitele de utilizatori (`maxUsers`).
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleCleanup} 
            disabled={isCleaning}
            variant="ghost" 
            className="text-xs text-muted-foreground hover:text-destructive gap-2 h-9"
          >
            {isCleaning ? <Loader2 className="w-4 h-4 animate-spin"/> : <X className="w-4 h-4"/>}
            Cleanup Ghost Farms
          </Button>
          <div className="flex bg-muted p-1 rounded-lg">
            <button 
              className={cn("px-4 py-1.5 text-xs font-bold rounded-md transition-all", activeTab === 'orgs' ? "bg-white text-primary shadow-sm" : "text-muted-foreground")}
              onClick={() => setActiveTab("orgs")}
            >
              Ferme
            </button>
            <button 
              className={cn("px-4 py-1.5 text-xs font-bold rounded-md transition-all", activeTab === 'admins' ? "bg-white text-primary shadow-sm" : "text-muted-foreground")}
              onClick={() => {
                setActiveTab("admins");
                if (admins.length === 0) fetchAdmins();
              }}
            >
              Administratori
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'orgs' ? (
        <Card>
        <CardHeader className="border-b bg-muted/10 pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="w-5 h-5" /> Registrul Fermelor
              </CardTitle>
              <CardDescription>Total: {orgs.length} organizații active</CardDescription>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Caută fermă..."
                className="pl-9"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[10px] md:text-xs text-muted-foreground uppercase bg-muted/40 border-b">
                <tr>
                  <th className="px-3 md:px-4 py-3">Organizație</th>
                  <th className="px-4 py-3 hidden xl:table-cell">Contact</th>
                  <th className="px-3 md:px-4 py-3">Suprafață (Ha)</th>
                  <th className="px-3 md:px-4 py-3 hidden sm:table-cell">Abonament</th>
                  <th className="px-4 py-3 hidden lg:table-cell">Expiră la</th>
                  <th className="px-4 py-3 hidden md:table-cell">Utilizatori</th>
                  <th className="px-3 md:px-4 py-3 text-right">Acțiuni</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredOrgs.map(org => {
                  const isOverLimit = org.userCount > org.maxUsers;
                  const expiryDate = org.subscriptionExpiresAt ? new Date(org.subscriptionExpiresAt) : null;
                  const isExpired = expiryDate && expiryDate < new Date();

                  return (
                    <tr key={org.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-3 md:px-4 py-3">
                        <div className="font-semibold text-foreground flex items-center gap-2 cursor-pointer hover:text-primary text-xs md:text-sm" onClick={() => router.push(`/admin/${org.id}`)}>
                          {org.name}
                        </div>
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" /> {org.county || "Nespecificat"}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs hidden xl:table-cell">
                        {org.phone || <span className="text-muted-foreground italic">Fără telefon</span>}
                      </td>
                      <td className="px-3 md:px-4 py-3 font-medium text-foreground text-xs md:text-sm">
                        {org.totalAreaHa.toFixed(0)} <span className="text-muted-foreground font-normal hidden md:inline">ha</span>
                      </td>
                      <td className="px-3 md:px-4 py-3 hidden sm:table-cell">
                        <Badge className={`uppercase text-[9px] md:text-[10px] ${
                          org.subscriptionTier === 'enterprise' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                          org.subscriptionTier === 'pro' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                          org.subscriptionTier === 'starter' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                          'bg-gray-100 text-gray-800 border-gray-200'
                        }`}>
                          {org.subscriptionTier}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {expiryDate ? (
                          <div className={cn("text-xs font-medium", isExpired ? "text-destructive" : "text-foreground")}>
                            {formatDate(expiryDate)}
                            {isExpired && <span className="block text-[10px] uppercase font-bold text-destructive">Expirat</span>}
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic text-xs">Fără limită (Trial)</span>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          <Users className={`w-4 h-4 ${isOverLimit ? 'text-destructive' : 'text-muted-foreground'}`} />
                          <span className={`text-sm ${isOverLimit ? 'font-bold text-destructive' : 'text-foreground'}`}>
                            {org.userCount} <span className="text-muted-foreground font-normal">/ {org.maxUsers}</span>
                          </span>
                        </div>
                      </td>
                      <td className="px-3 md:px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 md:h-8 gap-1 border-primary/20 text-primary hover:bg-primary/5 text-[10px] md:text-xs"
                            onClick={() => router.push(`/admin/${org.id}`)}
                          >
                            <Settings className="w-3 h-3 md:w-3.5 md:h-3.5" /> <span className="hidden sm:inline">Gestionează</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredOrgs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nicio fermă găsită.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      ) : (
        <Card>
          <CardHeader className="border-b bg-muted/10 pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldCheck className="w-5 h-5" /> Conturi Superadmin
            </CardTitle>
            <CardDescription>Persoane cu acces total la platformă</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loadingAdmins ? (
              <div className="p-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
              </div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/20 border-b">
                  <tr>
                    <th className="px-4 py-3">Administrator</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Creat la</th>
                    <th className="px-4 py-3 text-right">Acțiuni</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {admins.map(admin => (
                    <tr key={admin.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-bold text-foreground">
                        {admin.firstName || "---"} {admin.lastName || "---"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{admin.email}</td>
                      <td className="px-4 py-3 text-xs">
                        {formatDate(admin.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 text-destructive hover:bg-destructive/5"
                          onClick={() => handleDemote(admin.id)}
                        >
                          Demite
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
