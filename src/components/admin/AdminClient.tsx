"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
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
              <thead className="text-xs text-muted-foreground uppercase bg-muted/40 border-b">
                <tr>
                  <th className="px-4 py-3">Organizație</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Dimensiune (Ha)</th>
                  <th className="px-4 py-3">Abonament</th>
                  <th className="px-4 py-3">Expiră la</th>
                  <th className="px-4 py-3">Utilizatori</th>
                  <th className="px-4 py-3 text-right">Acțiuni</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredOrgs.map(org => {
                  const isOverLimit = org.userCount > org.maxUsers;
                  const expiryDate = org.subscriptionExpiresAt ? new Date(org.subscriptionExpiresAt) : null;
                  const isExpired = expiryDate && expiryDate < new Date();

                  return (
                    <tr key={org.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-foreground flex items-center gap-2 cursor-pointer hover:text-primary" onClick={() => router.push(`/admin/${org.id}`)}>
                          {org.name}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" /> {org.county || "Nespecificat"}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {org.phone || <span className="text-muted-foreground italic">Fără telefon</span>}
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">
                        {org.totalAreaHa.toFixed(0)} <span className="text-muted-foreground font-normal">ha</span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={`uppercase text-[10px] ${
                          org.subscriptionTier === 'enterprise' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                          org.subscriptionTier === 'pro' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                          org.subscriptionTier === 'starter' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                          'bg-gray-100 text-gray-800 border-gray-200'
                        }`}>
                          {org.subscriptionTier}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {expiryDate ? (
                          <div className={cn("text-xs font-medium", isExpired ? "text-destructive" : "text-foreground")}>
                            {expiryDate.toLocaleDateString('ro-RO')}
                            {isExpired && <span className="block text-[10px] uppercase font-bold text-destructive">Expirat</span>}
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic text-xs">Fără limită (Trial)</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Users className={`w-4 h-4 ${isOverLimit ? 'text-destructive' : 'text-muted-foreground'}`} />
                          <span className={`text-sm ${isOverLimit ? 'font-bold text-destructive' : 'text-foreground'}`}>
                            {org.userCount} <span className="text-muted-foreground font-normal">/ {org.maxUsers} admiși</span>
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs text-muted-foreground hover:text-primary"
                            onClick={() => router.push(`/admin/${org.id}`)}
                          >
                            Detalii
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1 border-primary/20 text-primary hover:bg-primary/5"
                            onClick={() => {
                              setEditingOrg(org);
                              setNewTier(org.subscriptionTier);
                              setNewMaxUsers(org.maxUsers || 1);
                            }}
                          >
                            <Settings className="w-3.5 h-3.5" /> Gestiune
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
                        {new Date(admin.createdAt).toLocaleDateString('ro-RO')}
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

      {/* MODAL CONFIGURARE ABONAMENT */}
      {editingOrg && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-in fade-in">
          <Card className="w-full max-w-md mx-4 shadow-2xl">
            <CardHeader className="border-b bg-muted/40 relative">
              <Button 
                variant="ghost" size="icon" className="absolute right-4 top-4"
                onClick={() => setEditingOrg(null)}
              >
                <X className="w-5 h-5" />
              </Button>
              <CardTitle className="text-xl text-foreground">Setări Abonament</CardTitle>
              <CardDescription>
                Ajustezi limitele pentru <strong>{editingOrg.name}</strong>.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              
              <div className="space-y-2">
                <Label>Nivel Abonament</Label>
                <select 
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-primary/20"
                  value={newTier}
                  onChange={e => {
                    const t = e.target.value;
                    setNewTier(t);
                    // Preluam numarul maxim de utilizatori default pt acest nivel
                    const defaultMax = TIERS.find(x => x.id === t)?.max || 1;
                    if (newMaxUsers < defaultMax) setNewMaxUsers(defaultMax);
                  }}
                >
                  {TIERS.map(t => <option key={t.id} value={t.id}>{t.label} (max ~{t.max} conturi)</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <Label className="flex justify-between items-center">
                  Limită Utilizatori Permiși (maxUsers)
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded font-mono">
                    Curent: {editingOrg.userCount} conturi
                  </span>
                </Label>
                <Input 
                  type="number" 
                  min="1" 
                  max="1000"
                  className="text-lg font-bold"
                  value={newMaxUsers}
                  onChange={e => setNewMaxUsers(parseInt(e.target.value) || 1)}
                />
                <p className="text-xs text-muted-foreground">
                  Dacă limita este mai mică decât numărul curent de utilizatori ({editingOrg.userCount}), conturile adiționale nu se vor putea conecta (vor primi eroare de limită atinsă, funcționalitate ce poate fi implementată ulterior la login).
                </p>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <Button variant="outline" className="flex-1" onClick={() => setEditingOrg(null)}>Anulează</Button>
                <Button className="flex-1 gap-2 agral-gradient text-white" onClick={handleSaveSettings} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin"/> : <CheckCircle2 className="w-4 h-4"/>}
                  Aplică Modificările
                </Button>
              </div>

            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
