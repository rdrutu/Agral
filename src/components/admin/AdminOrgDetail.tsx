"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  Users, 
  CreditCard, 
  Calendar, 
  Phone, 
  MapPin, 
  ArrowLeft,
  CheckCircle2,
  Loader2,
  History,
  Plus,
  AlertCircle,
  Trash2,
  Sprout, 
  ExternalLink,
  Percent,
  Info,
  DollarSign
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { addSubscriptionMonths, deleteOrganization, deleteParcel } from "@/lib/actions/admin";
import toast from "react-hot-toast";

interface AdminOrgDetailProps {
  org: any;
}

export default function AdminOrgDetail({ org }: AdminOrgDetailProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAddMonths, setShowAddMonths] = useState(false);
  
  // Form add payment
  const [monthsToAdd, setMonthsToAdd] = useState(1);
  const [amount, setAmount] = useState(0);
  const [discount, setDiscount] = useState(0); // Procent discount
  const [tier, setTier] = useState(org.subscriptionTier || 'starter');
  const [notes, setNotes] = useState("");
  const [activeTab, setActiveTab] = useState("members");

  const amountBeforeDiscount = amount;
  const discountFixed = (amount * discount) / 100;
  const finalAmount = amount - discountFixed;

  async function handleDeleteParcel(id: string) {
    if (!confirm("Ești sigur că vrei să ștergi această parcelă? Această acțiune este ireversibilă.")) return;
    try {
      await deleteParcel(id);
      toast.success("Parcela a fost ștearsă.");
      router.refresh();
    } catch (e) {
      toast.error("Eroare la ștergere.");
    }
  }

  const expiryDate = org.subscriptionExpiresAt ? new Date(org.subscriptionExpiresAt) : null;
  const isExpired = expiryDate && expiryDate < new Date();
  
  const daysLeft = expiryDate 
    ? Math.max(0, Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
    : null;

  async function handleAddSubscription() {
    setIsUpdating(true);
    try {
      await addSubscriptionMonths(org.id, {
        months: monthsToAdd,
        amount: finalAmount,
        tier,
        notes,
        amountBeforeDiscount,
        discountApplied: discountFixed
      });
      setShowAddMonths(false);
      toast.success("Abonament actualizat cu succes!");
      router.refresh();
    } catch (error: any) {
      toast.error("Eroare: " + error.message);
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Sunteți SIGUR că doriți să ștergeți ferma "${org.name}"? Această acțiune va șterge toți utilizatorii și datele asociate și este IREVOCABILĂ.`)) {
      return;
    }

    if (!confirm("Confirmare secundară: Ștergerea definitivă a contului?")) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteOrganization(org.id);
      router.push("/admin");
    } catch (err: any) {
      toast.error("Eroare la ștergere: " + err.message);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.push("/admin")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h2 className="text-3xl font-extrabold text-foreground">{org.name}</h2>
          <div className="flex items-center gap-3 text-muted-foreground mt-1">
            <span className="flex items-center gap-1 text-sm italic">
              <MapPin className="w-3.5 h-3.5" /> {org.county || "Fără locație"}
            </span>
            <span className="w-1 h-1 bg-muted-foreground/30 rounded-full" />
            <span className="flex items-center gap-1 text-sm font-medium">
              ID: {org.id.split('-')[0]}...
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Farm Stats/Overview */}
        <Card className="lg:col-span-1 border-primary/10 shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/30 border-b pb-4">
            <div className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl agral-gradient flex items-center justify-center text-white shadow-xl shrink-0">
                  <Building2 className="w-7 h-7" />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-2xl font-black truncate">{org.name}</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1 text-sm font-medium">
                    <MapPin className="w-3.5 h-3.5 text-primary" /> {org.county || "Județ nesetat"}
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-muted/30 rounded-xl p-4 border border-border/50">
                <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-2 block">Informații Generale</Label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground flex items-center gap-1.5"><Phone className="w-3 h-3" /> Telefon:</span>
                    <span className="text-sm font-bold">{org.phone || "Nespecificat"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground flex items-center gap-1.5"><MapPin className="w-3 h-3" /> Adresă:</span>
                    <span className="text-sm font-semibold truncate max-w-[120px]">{org.address || "Nesetată"}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-border/50 pt-2 mt-2">
                    <span className="text-xs text-muted-foreground">Suprafață Totală:</span>
                    <span className="text-lg font-black text-primary">{org.totalAreaHa.toFixed(2)} ha</span>
                  </div>
                </div>
              </div>

              <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
                <Label className="text-[10px] uppercase tracking-widest font-bold text-primary mb-2 block">Status Abonament</Label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge className={cn(
                      "uppercase text-[10px] font-black px-2 py-0.5",
                      org.subscriptionTier === 'enterprise' ? 'bg-purple-100 text-purple-800' :
                      org.subscriptionTier === 'pro' ? 'bg-amber-100 text-amber-800' :
                      'bg-blue-100 text-blue-800'
                    )}>
                      {org.subscriptionTier}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] font-bold">
                      {org.maxUsers} utilizatori
                    </Badge>
                  </div>
                  <div className="pt-2 border-t border-primary/10">
                    {expiryDate ? (
                      <div className="space-y-1">
                        <div className={cn("text-sm font-bold flex items-center gap-2", isExpired ? "text-destructive" : "text-foreground")}>
                          <Calendar className="w-4 h-4" />
                          Expiră la: {expiryDate.toLocaleDateString('ro-RO')}
                        </div>
                        <p className="text-[11px]">
                          {isExpired ? (
                            <span className="text-destructive font-black uppercase">Expirat!</span>
                          ) : (
                            <span className="text-muted-foreground italic">Rămân <strong className="text-primary">{daysLeft} zile</strong></span>
                          )}
                        </p>
                      </div>
                    ) : (
                      <div className="text-sm font-bold text-blue-600 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Trial
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-muted/30 rounded-xl p-4 border border-border/50">
              <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-2 block">Resurse Umane</Label>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground italic">Total Angajați (Registru):</span>
                  <span className="text-sm font-black">{org.users?.length || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground italic">Utilizatori cu acces Log-in:</span>
                  <span className="text-sm font-black text-primary">{org.users?.filter((u: any) => u.canLogin).length || 0}</span>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full text-destructive hover:bg-destructive/10 gap-2 h-10 border-destructive/20"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                <Trash2 className="w-4 h-4" />
                {isDeleting ? "Se șterge organizația..." : "Șterge definitiv această fermă"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* tabs */}
          <div className="flex gap-2 border-b mb-6">
            <button 
              onClick={() => setActiveTab("members")}
              className={cn("px-4 py-2 font-bold text-sm transition-all border-b-2", activeTab === "members" ? "border-primary text-primary" : "border-transparent text-muted-foreground")}
            >
              Membri Echipa
            </button>
            <button 
              onClick={() => setActiveTab("parcels")}
              className={cn("px-4 py-2 font-bold text-sm transition-all border-b-2", activeTab === "parcels" ? "border-primary text-primary" : "border-transparent text-muted-foreground")}
            >
              Parcele ({org._count?.parcels || 0})
            </button>
            <button 
              onClick={() => setActiveTab("payments")}
              className={cn("px-4 py-2 font-bold text-sm transition-all border-b-2", activeTab === "payments" ? "border-primary text-primary" : "border-transparent text-muted-foreground")}
            >
              Istoric Plăți
            </button>
          </div>

          {activeTab === "members" && (
            <Card className="border-none shadow-md overflow-hidden bg-white/50 backdrop-blur-sm">
              <CardHeader className="bg-muted/30 border-b pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    Utilizatori cu acces Log-in
                  </CardTitle>
                  <Badge variant="secondary" className="text-[10px] font-bold">
                    Apar doar membrii care se pot conecta
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead className="bg-muted/20 border-b">
                    <tr>
                      <th className="text-left p-4 font-bold text-muted-foreground">Nume</th>
                      <th className="text-left p-4 font-bold text-muted-foreground">Email</th>
                      <th className="text-left p-4 font-bold text-muted-foreground">Rol</th>
                      <th className="text-left p-4 font-bold text-muted-foreground">Creat la</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-muted/10">
                    {org.users?.filter((u: any) => u.canLogin).map((u: any) => (
                      <tr key={u.id} className="hover:bg-primary/5 transition-colors">
                        <td className="p-4 font-bold flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full agral-gradient flex items-center justify-center text-[10px] text-white">
                            {u.firstName?.[0]}{u.lastName?.[0]}
                          </div>
                          {u.firstName} {u.lastName}
                        </td>
                        <td className="p-4 text-muted-foreground font-medium">{u.email}</td>
                        <td className="p-4">
                          <Badge variant="outline" className="text-[10px] uppercase font-bold text-primary border-primary/20">
                            {u.role}
                          </Badge>
                        </td>
                        <td className="p-4 text-muted-foreground text-xs">
                          {new Date(u.createdAt).toLocaleDateString('ro-RO')}
                        </td>
                      </tr>
                    ))}
                    {org.users?.filter((u: any) => u.canLogin).length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-muted-foreground">
                          Nu există utilizatori cu acces log-in.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}

          {activeTab === "parcels" && (
            <Card className="border-none shadow-md overflow-hidden bg-white/50 backdrop-blur-sm">
              <CardHeader className="bg-muted/30 border-b pb-4">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  Parcele Organizație
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead className="bg-muted/20 border-b">
                    <tr>
                      <th className="text-left p-4 font-bold text-muted-foreground">Nume Parcelă</th>
                      <th className="text-left p-4 font-bold text-muted-foreground">Suprafață</th>
                      <th className="text-right p-4 font-bold text-muted-foreground">Acțiuni</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-muted/10">
                    {(org as any).parcels?.map((p: any) => (
                      <tr key={p.id} className="hover:bg-primary/5 transition-colors">
                        <td className="p-4 font-bold flex items-center gap-2">
                          <Sprout className="w-4 h-4 text-green-600" />
                          {p.name}
                        </td>
                        <td className="p-4 font-black">{p.areaHa} ha</td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteParcel(p.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {((org as any).parcels || []).length === 0 && (
                      <tr>
                        <td colSpan={3} className="p-8 text-center text-muted-foreground font-medium italic">
                          Nu există parcele adăugate pentru această fermă.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}

          {activeTab === "payments" && (
            <Card className="border-none shadow-md overflow-hidden bg-white/50 backdrop-blur-sm">
              <CardHeader className="bg-muted/30 border-b pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <History className="w-5 h-5 text-primary" />
                    Istoric Plăți & Facturare
                  </CardTitle>
                  <Button 
                    onClick={() => setShowAddMonths(true)} 
                    size="sm" 
                    className="gap-1 agral-gradient text-white shadow-md"
                  >
                    <DollarSign className="w-4 h-4" /> Prelungește Abonament
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead className="bg-muted/20 border-b">
                    <tr>
                      <th className="text-left p-4 font-bold text-muted-foreground">Dată</th>
                      <th className="text-left p-4 font-bold text-muted-foreground">Plan</th>
                      <th className="text-left p-4 font-bold text-muted-foreground">Luni</th>
                      <th className="text-left p-4 font-bold text-muted-foreground">Sumă</th>
                      <th className="text-left p-4 font-bold text-muted-foreground">Detalii</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-muted/10">
                    {org.payments?.map((p: any) => (
                      <tr key={p.id} className="hover:bg-primary/5 transition-colors">
                        <td className="p-4 font-bold">{new Date(p.date).toLocaleDateString('ro-RO')}</td>
                        <td className="p-4">
                          <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-none uppercase text-[10px] font-black">
                            {p.tier}
                          </Badge>
                        </td>
                        <td className="p-4 font-bold">{p.months} luni</td>
                        <td className="p-4">
                          <div className="font-extrabold text-foreground">{p.amount} RON</div>
                          {p.discountApplied > 0 && (
                            <div className="text-[10px] text-green-600 font-bold">-{p.discountApplied} (Discount)</div>
                          )}
                        </td>
                        <td className="p-4 text-xs text-muted-foreground font-medium">{p.notes || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* MODAL ADAUGA PLATA */}
      {showAddMonths && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-in zoom-in-95 backdrop-blur-sm">
          <Card className="w-full max-w-md mx-4 shadow-2xl border-none">
            <CardHeader className="bg-muted/20 border-b">
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                Adaugă Plată Nouă
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs uppercase font-bold text-muted-foreground">Luni Acces</Label>
                  <Input type="number" value={monthsToAdd} onChange={e => setMonthsToAdd(parseInt(e.target.value) || 1)} className="font-bold h-12 text-lg" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase font-bold text-muted-foreground">Plan Tarifar</Label>
                  <select 
                    value={tier} 
                    onChange={e => setTier(e.target.value)}
                    className="flex h-12 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-bold"
                  >
                    <option value="starter">Starter</option>
                    <option value="pro">Pro</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs uppercase font-bold text-muted-foreground">Sumă Brută (RON)</Label>
                  <Input type="number" value={amount} onChange={e => setAmount(parseInt(e.target.value) || 0)} className="font-bold h-12 text-lg" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase font-bold text-muted-foreground">Discount (%)</Label>
                  <div className="relative">
                    <Input type="number" value={discount} onChange={e => setDiscount(parseInt(e.target.value) || 0)} className="font-bold h-12 text-lg pr-8" />
                    <Percent className="w-4 h-4 absolute right-3 top-4 text-muted-foreground" />
                  </div>
                </div>
              </div>

              <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 space-y-2">
                <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase">
                  <span>Subtotal:</span>
                  <span>{amountBeforeDiscount} RON</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-green-600 uppercase">
                  <span>Discount ({discount}%):</span>
                  <span>-{discountFixed} RON</span>
                </div>
                <div className="flex justify-between text-lg font-black text-foreground pt-1 border-t border-primary/10">
                  <span>TOTAL DE PLATĂ:</span>
                  <span className="text-primary">{finalAmount} RON</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold text-muted-foreground">Observații Facturare</Label>
                <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Ex: Prelungire campanie martie..." />
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="ghost" className="flex-1 font-bold" onClick={() => setShowAddMonths(false)}>Anulare</Button>
                <Button className="flex-1 agral-gradient text-white font-bold" disabled={isUpdating} onClick={handleAddSubscription}>
                  {isUpdating ? <Loader2 className="w-4 h-4 animate-spin"/> : <CheckCircle2 className="w-4 h-4"/>}
                  Confirmă & Salvează Plată
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
