"use client";

import { useState, useEffect } from "react";
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
  DollarSign,
  Briefcase,
  FileText,
  Activity,
  UserCheck,
  Package,
  ChevronRight,
  TrendingUp,
  ShieldAlert,
  Globe,
  Mail,
  Landmark,
  ShieldCheck,
  LayoutDashboard,
  Fingerprint,
  Wallet,
  Settings2,
  Save
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn, formatDate } from "@/lib/utils";
import { addSubscriptionMonths, deleteOrganization, deleteParcel, updateOrgSubscription, updateOrganizationLegalDetails } from "@/lib/actions/admin";
import toast from "react-hot-toast";

interface AdminOrgDetailProps {
  org: any;
}

const SECTIONS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "legal", label: "Legal & Fiscal", icon: FileText },
  { id: "representative", label: "Reprezentant", icon: UserCheck },
  { id: "financial", label: "Abonament & Plăți", icon: Wallet },
  { id: "team", label: "Echipă", icon: Users },
] as const;

const PLAN_PRESETS = [
  { id: "trial", label: "Trial", maxUsers: 1, color: "bg-slate-100 text-slate-800", description: "30 zile de test" },
  { id: "starter", label: "Starter", maxUsers: 3, color: "bg-blue-100 text-blue-800", description: "Ferme mici (3 utilizatori)" },
  { id: "pro", label: "Pro", maxUsers: 10, color: "bg-amber-100 text-amber-800", description: "Ferme medii (10 utilizatori)" },
  { id: "enterprise", label: "Enterprise", maxUsers: 50, color: "bg-purple-100 text-purple-800", description: "Ferme mari (50 utilizatori)" },
];

export default function AdminOrgDetail({ org }: AdminOrgDetailProps) {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<typeof SECTIONS[number]["id"]>("overview");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [showAddMonths, setShowAddMonths] = useState(false);
  
  // States for all fields
  const [formData, setFormData] = useState({
    legalName: org.legalName || "",
    name: org.name || "",
    registrationNumber: org.registrationNumber || "",
    entityType: org.entityType || "SRL",
    cui: org.cui || "",
    caen: org.caen || "",
    iban: org.iban || "",
    bankName: org.bankName || "",
    website: org.website || "",
    email: org.email || "",
    phone: org.phone || "",
    address: org.address || "",
    city: org.city || "",
    county: org.county || "",
    // Representative
    representativeName: org.representativeName || "",
    representativeCnp: org.representativeCnp || "",
    representativeCiSeries: org.representativeCiSeries || "",
    representativeCiNumber: org.representativeCiNumber || "",
    representativeRole: org.representativeRole || "Administrator",
  });

  // Subscription local states
  const [selectedTier, setSelectedTier] = useState(org.subscriptionTier || 'starter');
  const [selectedMaxUsers, setSelectedMaxUsers] = useState(org.maxUsers || 1);
  const [validUntil, setValidUntil] = useState(() => {
    const base = org.subscriptionExpiresAt ? new Date(org.subscriptionExpiresAt) : new Date();
    if (!org.subscriptionExpiresAt) base.setMonth(base.getMonth() + 1); 
    return base.toISOString().split('T')[0];
  });
  const [amount, setAmount] = useState<string>("");
  const [discount, setDiscount] = useState<string>(""); 
  const [tier, setTier] = useState(org.subscriptionTier || 'starter');

  const expiryDate = org.subscriptionExpiresAt ? new Date(org.subscriptionExpiresAt) : null;
  const isExpired = expiryDate && expiryDate < new Date();
  const trialExpiryDate = new Date(new Date(org.createdAt).getTime() + 30 * 24 * 60 * 60 * 1000);
  const trialDaysLeft = Math.max(0, Math.ceil((trialExpiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));
  const isTrialExpired = new Date() > trialExpiryDate;

  async function handleSaveLegalDetails() {
    setIsSavingDetails(true);
    try {
      await updateOrganizationLegalDetails(org.id, formData);
      toast.success("Datele salvate cu succes!");
      router.refresh();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsSavingDetails(false);
    }
  }

  async function handleUpdateSubscription() {
    setIsUpdating(true);
    try {
      await updateOrgSubscription(org.id, { tier: selectedTier, maxUsers: selectedMaxUsers });
      toast.success("Abonament actualizat!");
      router.refresh();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleAddPayment() {
    setIsUpdating(true);
    try {
      const msDiff = new Date(validUntil).getTime() - new Date().getTime();
      const calculatedMonths = Math.max(1, Math.round(msDiff / (1000 * 60 * 60 * 24 * 30)));
      const parsedAmount = parseFloat(amount) || 0;
      const parsedDiscount = parseFloat(discount) || 0;
      const discountFixed = (parsedAmount * parsedDiscount) / 100;
      const finalAmount = parsedAmount - discountFixed;

      await addSubscriptionMonths(org.id, {
        months: calculatedMonths,
        amount: finalAmount,
        tier,
        amountBeforeDiscount: parsedAmount,
        discountApplied: discountFixed,
        validUntil
      });
      setShowAddMonths(false);
      toast.success("Plată înregistrată!");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Sunteți SIGUR că doriți să ștergeți ferma "${org.name}"?`)) return;
    setIsDeleting(true);
    try {
      await deleteOrganization(org.id);
      router.push("/admin");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsDeleting(false);
    }
  }


  return (
    <div className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto pb-20 p-4 lg:p-0">
      
      {/* Sidebar Navigation (Enterprise Style) */}
      <aside className="w-full lg:w-72 shrink-0 space-y-6">
         <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 p-6 border border-slate-100">
            <Button 
               variant="ghost" 
               className="w-full justify-start mb-6 text-slate-400 hover:text-slate-900 gap-2 font-bold transition-all"
               onClick={() => router.push("/admin")}
            >
               <ArrowLeft className="w-4 h-4" /> Înapoi la listă
            </Button>
            
            <div className="flex flex-col gap-2">
               {SECTIONS.map((s) => (
                 <button
                    key={s.id}
                    onClick={() => setActiveSection(s.id)}
                    className={cn(
                       "flex items-center gap-4 px-5 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all duration-300",
                       activeSection === s.id 
                         ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20" 
                         : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                    )}
                 >
                    <s.icon className={cn("w-5 h-5", activeSection === s.id ? "text-primary" : "text-slate-300")} />
                    {s.label}
                 </button>
               ))}
            </div>
         </div>

         {/* Quick Health Card */}
         <div className="bg-slate-900 rounded-[2rem] p-8 text-white space-y-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-primary/30 transition-all" />
            <div className="flex items-center gap-3">
               <Activity className="w-5 h-5 text-primary" />
               <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40">Status General</h4>
            </div>
            <div className="space-y-4">
               <div>
                  <div className="flex justify-between text-[11px] font-black uppercase mb-2">
                     <span>Capacitate Utilizatori</span>
                     <span className={cn(org.userCount >= org.maxUsers ? "text-red-400" : "text-primary")}>{org.userCount}/{org.maxUsers}</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                     <div 
                        className={cn("h-full transition-all duration-1000", org.userCount >= org.maxUsers ? "bg-red-500" : "bg-primary")}
                        style={{ width: `${Math.min(100, (org.userCount/org.maxUsers)*100)}%` }} 
                     />
                  </div>
               </div>
               <div className="pt-4 border-t border-white/5">
                  <div className="flex justify-between items-center">
                     <span className="text-[10px] font-black uppercase text-white/40">Ultima Plată</span>
                     <span className="text-xs font-bold">{org.payments?.[0] ? formatDate(org.payments[0].date) : "---"}</span>
                  </div>
               </div>
            </div>
         </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
         
         {/* OVERVIEW SECTION */}
         {activeSection === "overview" && (
           <div className="space-y-8">
              {/* Hero Banner */}
              <div className="bg-white p-10 rounded-[3rem] shadow-2xl shadow-slate-200/30 border border-slate-50 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-8">
                    <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                       <Building2 className="w-8 h-8" />
                    </div>
                 </div>
                 <div className="relative z-10">
                    <Badge className="bg-primary/10 text-primary border-none font-black text-[10px] px-4 py-1.5 rounded-full mb-6">
                       PROFILE ID: {org.id.toUpperCase()}
                    </Badge>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none mb-4">
                       {org.legalName || org.name}
                    </h1>
                    <div className="flex flex-wrap items-center gap-6 mt-6 pt-6 border-t border-slate-100">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600">
                              <MapPin className="w-5 h-5" />
                           </div>
                           <div className="flex flex-col">
                              <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Locație Principală</span>
                              <span className="text-sm font-bold text-slate-900">{org.city || "---"}, {org.county || "---"}</span>
                           </div>
                        </div>
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                              <Fingerprint className="w-5 h-5" />
                           </div>
                           <div className="flex flex-col">
                              <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Identificare Fiscală</span>
                              <span className="text-sm font-bold text-slate-900">{org.cui || "---"} / {org.registrationNumber || "---"}</span>
                           </div>
                        </div>
                    </div>
                 </div>
              </div>

              {/* Quick Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <Card className="rounded-[2.5rem] border-none shadow-xl bg-white p-8 space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 mb-2">
                       <Package className="w-6 h-6" />
                    </div>
                    <div>
                       <h3 className="text-[11px] font-black uppercase text-slate-400 tracking-widest">Abonament Activ</h3>
                       <p className="text-xl font-black text-slate-900 mt-1 capitalize">{org.subscriptionTier}</p>
                    </div>
                    <Badge variant="outline" className="border-amber-200 text-amber-600 text-[10px] font-black px-3 py-1 uppercase">
                      {org.subscriptionTier === 'trial' ? `${trialDaysLeft} zile test` : (isExpired ? "Sursă: Expirat" : "Valid")}
                    </Badge>
                 </Card>

                 <Card className="rounded-[2.5rem] border-none shadow-xl bg-white p-8 space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-green-600 mb-2">
                       <Sprout className="w-6 h-6" />
                    </div>
                    <div>
                       <h3 className="text-[11px] font-black uppercase text-slate-400 tracking-widest">Exploatare Teren</h3>
                       <p className="text-xl font-black text-slate-900 mt-1">{org.totalAreaHa.toFixed(0)} <small className="text-slate-400 font-bold ml-1 uppercase text-[10px]">Hectare</small></p>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 italic">Total {org._count?.parcels || 0} parcele active</p>
                 </Card>

                 <Card className="rounded-[2.5rem] border-none shadow-xl bg-white p-8 space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 mb-2">
                       <Users className="w-6 h-6" />
                    </div>
                    <div>
                       <h3 className="text-[11px] font-black uppercase text-slate-400 tracking-widest">Echipă & Membri</h3>
                       <p className="text-xl font-black text-slate-900 mt-1">{org.users?.length || 0} <small className="text-slate-400 font-bold ml-1 uppercase text-[10px]">Personal</small></p>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 italic">{org.users?.filter((u: any) => u.canLogin).length} utilizatori cu acces app</p>
                 </Card>
              </div>
           </div>
         )}

         {/* LEGAL & FISCAL SECTION */}
         {activeSection === "legal" && (
            <div className="space-y-8">
               <Card className="rounded-[3rem] border-none shadow-2xl bg-white p-10 overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mt-32 -z-0" />
                  <div className="relative z-10 space-y-10">
                    <div className="flex items-center justify-between">
                       <div>
                          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Profil Legal & Fiscal</h2>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Gestiune date oficiale și facturare</p>
                       </div>
                       <Button 
                         onClick={handleSaveLegalDetails} 
                         disabled={isSavingDetails}
                         className="rounded-2xl agral-gradient px-8 h-14 font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20"
                       >
                         {isSavingDetails ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5 mr-3" />}
                         Salvează Modificări
                       </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                       <div className="space-y-6">
                          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                             <span className="w-6 h-px bg-primary/30" /> Date Identificare
                          </h4>
                          <div className="space-y-4">
                             <div className="space-y-2 px-1">
                                <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Denumire Juridică Completă</Label>
                                <Input 
                                  value={formData.legalName} 
                                  onChange={e => setFormData({...formData, legalName: e.target.value})}
                                  className="h-14 rounded-2xl bg-slate-50 border-none font-black text-slate-900 shadow-inner px-6 text-lg"
                                />
                             </div>
                             <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                   <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Tip Entitate</Label>
                                   <select 
                                     value={formData.entityType}
                                     onChange={e => setFormData({...formData, entityType: e.target.value})}
                                     className="w-full h-14 rounded-2xl bg-slate-50 border-none font-bold text-slate-900 shadow-inner px-6 appearance-none focus-visible:ring-primary transition-all"
                                   >
                                      <option value="SRL">SRL</option>
                                      <option value="PFA">PFA</option>
                                      <option value="II">I.I.</option>
                                      <option value="IF">I.F.</option>
                                      <option value="Persoana Fizica">Persoană Fizică</option>
                                      <option value="SA">S.A.</option>
                                   </select>
                                </div>
                                <div className="space-y-2">
                                   <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Cod CAEN</Label>
                                   <Input 
                                     value={formData.caen} 
                                     onChange={e => setFormData({...formData, caen: e.target.value})}
                                     className="h-14 rounded-2xl bg-slate-50 border-none font-black shadow-inner px-6"
                                   />
                                </div>
                             </div>
                             <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                   <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">CUI / CIF</Label>
                                   <Input 
                                     value={formData.cui} 
                                     onChange={e => setFormData({...formData, cui: e.target.value})}
                                     className="h-14 rounded-2xl bg-slate-50 border-none font-black shadow-inner px-6 tracking-widest uppercase"
                                   />
                                </div>
                                <div className="space-y-2">
                                   <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Reg. Com.</Label>
                                   <Input 
                                     value={formData.registrationNumber} 
                                     onChange={e => setFormData({...formData, registrationNumber: e.target.value})}
                                     className="h-14 rounded-2xl bg-slate-50 border-none font-black shadow-inner px-6"
                                   />
                                </div>
                             </div>
                          </div>
                       </div>

                       <div className="space-y-6">
                          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 flex items-center gap-2">
                             <span className="w-6 h-px bg-indigo-600/30" /> Coordonate Bancare & Web
                          </h4>
                          <div className="space-y-4">
                             <div className="space-y-2 px-1">
                                <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">IBAN (RON)</Label>
                                <div className="relative">
                                   <Input 
                                     value={formData.iban} 
                                     onChange={e => setFormData({...formData, iban: e.target.value})}
                                     className="h-14 rounded-2xl bg-slate-50 border-none font-black shadow-inner px-12 text-sm uppercase tracking-tighter"
                                   />
                                   <Landmark className="w-4 h-4 absolute left-4 top-5 text-slate-300" />
                                </div>
                             </div>
                             <div className="space-y-2 px-1">
                                <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Bancă</Label>
                                <Input 
                                  value={formData.bankName} 
                                  onChange={e => setFormData({...formData, bankName: e.target.value})}
                                  className="h-14 rounded-2xl bg-slate-50 border-none font-bold shadow-inner px-6"
                                />
                             </div>
                             <div className="space-y-2 px-1">
                                <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Website Oficial</Label>
                                <div className="relative">
                                   <Input 
                                     value={formData.website} 
                                     onChange={e => setFormData({...formData, website: e.target.value})}
                                     className="h-14 rounded-2xl bg-slate-50 border-none font-bold shadow-inner px-12 text-blue-600"
                                   />
                                   <Globe className="w-4 h-4 absolute left-4 top-5 text-slate-300" />
                                </div>
                             </div>
                          </div>
                       </div>
                    </div>

                    {/* Localization Section */}
                    <div className="pt-10 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-8">
                       <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Județ</Label>
                          <Input value={formData.county} onChange={e => setFormData({...formData, county: e.target.value})} className="h-12 rounded-2xl bg-slate-50 border-none shadow-sm font-bold" />
                       </div>
                       <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Oraș / Localitate</Label>
                          <Input value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="h-12 rounded-2xl bg-slate-50 border-none shadow-sm font-bold" />
                       </div>
                       <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">E-mail Firmă</Label>
                          <div className="relative">
                             <Input value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="h-12 rounded-2xl bg-slate-50 border-none shadow-sm font-bold pl-10" />
                             <Mail className="w-4 h-4 absolute left-3.5 top-4 text-slate-300" />
                          </div>
                       </div>
                       <div className="md:col-span-3 space-y-3">
                          <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Adresă Sediu Social Completă</Label>
                          <Input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="h-14 rounded-2xl bg-slate-50 border-none shadow-sm font-bold italic" />
                       </div>
                    </div>
                  </div>
               </Card>
            </div>
         )}

         {/* REPRESENTATIVE SECTION */}
         {activeSection === "representative" && (
           <div className="space-y-8">
             <Card className="rounded-[3rem] border-none shadow-2xl bg-white overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-5 min-h-[500px]">
                   <div className="lg:col-span-2 agral-gradient p-12 text-white space-y-8 flex flex-col justify-center text-center items-center">
                      <div className="w-40 h-40 rounded-[3rem] bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-2xl">
                         <UserCheck className="w-20 h-20 text-white" />
                      </div>
                      <div className="space-y-2">
                        <h2 className="text-3xl font-black uppercase tracking-tight leading-none">{formData.representativeName || "Nume Reprezentant"}</h2>
                        <Badge className="bg-white/20 text-white border-none font-black text-[10px] uppercase py-1 px-4">{formData.representativeRole}</Badge>
                      </div>
                      <p className="text-[11px] font-bold text-white/60 uppercase tracking-[0.2em] leading-relaxed max-w-[200px]">Titularul răspunde legal pentru datele introduse în platformă.</p>
                   </div>
                   <div className="lg:col-span-3 p-12 space-y-10">
                      <div className="flex items-center justify-between">
                         <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Profil Administrator</h3>
                         <Button onClick={handleSaveLegalDetails} disabled={isSavingDetails} className="rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black uppercase text-[10px] tracking-widest px-6 h-12 shadow-xl shadow-slate-200">
                           {isSavingDetails ? <Loader2 className="w-4 h-4 animate-spin" /> : "Actualizează"}
                         </Button>
                      </div>

                      <div className="grid grid-cols-1 gap-8">
                         <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Nume Complet Reprezentant</Label>
                            <Input 
                               value={formData.representativeName} 
                               onChange={e => setFormData({...formData, representativeName: e.target.value})}
                               className="h-14 rounded-2xl bg-slate-50 border-2 border-slate-50 focus-visible:border-slate-200 font-black text-slate-900 shadow-inner px-6 text-lg"
                            />
                         </div>

                         <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-3">
                               <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">CNP</Label>
                               <Input 
                                 value={formData.representativeCnp} 
                                 onChange={e => setFormData({...formData, representativeCnp: e.target.value})}
                                 className="h-14 rounded-2xl bg-slate-50 border-none font-black shadow-inner px-6 tracking-widest"
                               />
                            </div>
                            <div className="space-y-3">
                               <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Funcție / Rol</Label>
                               <Input 
                                 value={formData.representativeRole} 
                                 onChange={e => setFormData({...formData, representativeRole: e.target.value})}
                                 className="h-14 rounded-2xl bg-slate-50 border-none font-black shadow-inner px-6"
                               />
                            </div>
                         </div>

                         <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-6">
                            <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center mb-2">Seria și Numărul Actului de Identitate</h5>
                            <div className="grid grid-cols-2 gap-4">
                               <div className="space-y-2">
                                  <Label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Serie CI</Label>
                                  <Input value={formData.representativeCiSeries} onChange={e => setFormData({...formData, representativeCiSeries: e.target.value})} className="h-12 rounded-xl bg-white border-none shadow-sm font-black text-center uppercase" />
                               </div>
                               <div className="space-y-2">
                                  <Label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Număr CI</Label>
                                  <Input value={formData.representativeCiNumber} onChange={e => setFormData({...formData, representativeCiNumber: e.target.value})} className="h-12 rounded-xl bg-white border-none shadow-sm font-black text-center" />
                               </div>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
             </Card>
           </div>
         )}

         {/* FINANCIAL & SUBSCRIPTION SECTION */}
         {activeSection === "financial" && (
            <div className="space-y-8 animate-in fade-in duration-500">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Current Plan Card */}
                  <Card className="rounded-[3rem] border-none shadow-2xl bg-slate-900 text-white p-10 flex flex-col justify-between overflow-hidden relative">
                     <div className="absolute bottom-0 right-0 p-8 opacity-5">
                        <CreditCard className="w-48 h-48 rotate-12" />
                     </div>
                     <div className="space-y-8">
                        <div className="flex justify-between items-center">
                           <h3 className="text-xl font-black uppercase tracking-tight">Status Abonament</h3>
                           <Badge className="bg-primary/20 text-primary border-none px-4 py-1.5 font-black uppercase tracking-widest text-[10px]">Active</Badge>
                        </div>
                        <div className="space-y-1">
                           <span className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em]">Pachet Curent</span>
                           <h2 className="text-5xl font-black tracking-tighter capitalize">{org.subscriptionTier}</h2>
                        </div>
                        <div className="p-6 bg-white/5 rounded-3xl border border-white/5 space-y-2">
                           <span className="text-[9px] font-black uppercase text-white/40 tracking-widest">Valabilitate</span>
                           <p className="text-lg font-bold">
                             {org.subscriptionTier === 'trial' 
                               ? (isTrialExpired ? "Trial Expirat" : `${trialDaysLeft} zile Trial rămase`)
                               : (expiryDate ? (isExpired ? "Expirat la " + formatDate(expiryDate) : `Expiră la ${formatDate(expiryDate)}`) : "Nelimitat")}
                           </p>
                        </div>
                     </div>
                     <div className="mt-8 pt-8 border-t border-white/5 flex gap-4">
                        <div className="flex-1">
                           <span className="text-[9px] font-black uppercase text-white/40 block mb-1">Limită Utilizatori</span>
                           <span className="text-xl font-black text-primary">{org.maxUsers}</span>
                        </div>
                        <div className="flex-1">
                           <span className="text-[9px] font-black uppercase text-white/40 block mb-1">Membri Înregistrați</span>
                           <span className="text-xl font-black text-white">{org.users?.length || 0}</span>
                        </div>
                     </div>
                  </Card>

                  {/* Plan Picker Card */}
                  <Card className="rounded-[3rem] border-none shadow-2xl bg-white p-10 flex flex-col justify-between">
                     <div className="space-y-8">
                        <div>
                           <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Modificare Plan</h3>
                           <p className="text-xs font-bold text-slate-400 mt-1 uppercase">Alege pachetul potrivit fermei</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                           {PLAN_PRESETS.map((p) => (
                             <button 
                                key={p.id}
                                onClick={() => {
                                   setSelectedTier(p.id);
                                   setSelectedMaxUsers(p.maxUsers);
                                }}
                                className={cn(
                                   "p-5 rounded-3xl text-left transition-all border-2 flex flex-col justify-between h-32",
                                   selectedTier === p.id ? "border-primary bg-primary/5 shadow-lg shadow-primary/10" : "border-slate-50 bg-slate-50"
                                )}
                             >
                                <span className={cn("text-[10px] font-black uppercase tracking-widest", selectedTier === p.id ? "text-primary" : "text-slate-400")}>{p.label}</span>
                                <div className="space-y-1">
                                   <span className="text-base font-black text-slate-900 block">{p.maxUsers} Conturi</span>
                                   <span className="text-[10px] font-medium text-slate-400 leading-tight block">{p.description}</span>
                                </div>
                             </button>
                           ))}
                        </div>
                     </div>
                     <div className="mt-8">
                        <Button 
                           onClick={handleUpdateSubscription}
                           disabled={isUpdating || (selectedTier === org.subscriptionTier && selectedMaxUsers === org.maxUsers)}
                           className="w-full h-16 rounded-[2rem] agral-gradient text-white font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/30 active:scale-95 transition-all"
                        >
                           {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : "Actualizează Plan Curent"}
                        </Button>
                     </div>
                  </Card>
               </div>

               {/* Payments History Card */}
               <Card className="rounded-[3rem] border-none shadow-2xl bg-white overflow-hidden">
                  <CardHeader className="p-10 border-b border-slate-50 bg-slate-50/50 flex flex-row items-center justify-between">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white shadow-xl flex items-center justify-center text-primary">
                           <History className="w-6 h-6" />
                        </div>
                        <div>
                           <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Istoric Fiscal & Facturare</h3>
                           <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Toate plățile înregistrate către Agral</p>
                        </div>
                     </div>
                     <Button 
                        onClick={() => setShowAddMonths(true)} 
                        className="h-12 px-8 rounded-2xl bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-slate-200"
                     >
                        <Plus className="w-4 h-4 mr-2" /> Înregistrează Plată
                     </Button>
                  </CardHeader>
                  <CardContent className="p-0">
                     {org.payments?.length === 0 ? (
                       <div className="p-20 text-center space-y-4">
                          <DollarSign className="w-16 h-16 text-slate-100 mx-auto" />
                          <p className="text-slate-400 font-bold italic">Nu există nicio plată înregistrată.</p>
                       </div>
                     ) : (
                       <table className="w-full text-left">
                          <thead className="bg-white border-b border-slate-50">
                             <tr>
                                <th className="p-8 text-[10px] font-black uppercase text-slate-400 tracking-widest">Data Tranzacției</th>
                                <th className="p-8 text-[10px] font-black uppercase text-slate-400 tracking-widest">Plan / Perioadă</th>
                                <th className="p-8 text-[10px] font-black uppercase text-slate-400 tracking-widest">Sumă Încasată</th>
                                <th className="p-8 text-[10px] font-black uppercase text-slate-400 tracking-widest">Observații</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                             {org.payments?.map((p: any) => (
                               <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="p-8">
                                     <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                                        <span className="font-extrabold text-slate-900">{formatDate(p.date)}</span>
                                     </div>
                                  </td>
                                  <td className="p-8">
                                     <div className="flex flex-col gap-1">
                                        <Badge className="w-fit text-[9px] font-black uppercase bg-blue-50 text-blue-600 border-none px-3">
                                           {p.tier}
                                        </Badge>
                                        <span className="text-[11px] font-bold text-slate-400 italic">{p.months} luni valabilitate</span>
                                     </div>
                                  </td>
                                  <td className="p-8">
                                     <div className="text-lg font-black text-slate-900">{Number(p.amount).toLocaleString()} <small className="text-slate-400">RON</small></div>
                                     {Number(p.discountApplied) > 0 && (
                                       <span className="text-[9px] font-black text-green-500 uppercase tracking-tighter">RED: -{Number(p.discountApplied).toLocaleString()} RON</span>
                                     )}
                                  </td>
                                  <td className="p-8 text-xs font-semibold text-slate-400 italic max-w-xs truncate">
                                     {p.notes || "---"}
                                  </td>
                               </tr>
                             ))}
                          </tbody>
                       </table>
                     )}
                  </CardContent>
               </Card>
            </div>
         )}

         {/* TEAM SECTION */}
         {activeSection === "team" && (
           <div className="space-y-8 animate-in fade-in duration-500">
              <Card className="rounded-[3rem] border-none shadow-2xl bg-white overflow-hidden">
                 <CardHeader className="p-10 border-b border-slate-50 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Utilizatori Organizație</h2>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Echipa cu acces activ în platformă</p>
                    </div>
                    <Badge variant="secondary" className="px-5 py-2 rounded-2xl font-black text-[10px] tracking-widest">TOTAL: {org.users?.length || 0}</Badge>
                 </CardHeader>
                 <CardContent className="p-0">
                    <table className="w-full text-left">
                       <thead className="bg-slate-50/50">
                          <tr>
                             <th className="p-8 text-[10px] font-black uppercase text-slate-400 tracking-widest">Nume Complet</th>
                             <th className="p-8 text-[10px] font-black uppercase text-slate-400 tracking-widest">Contact / Email</th>
                             <th className="p-8 text-[10px] font-black uppercase text-slate-400 tracking-widest">Rol Alocat</th>
                             <th className="p-8 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Acțiuni</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-50">
                          {org.users?.map((u: any) => (
                             <tr key={u.id} className="hover:bg-slate-50/20 transition-colors">
                                <td className="p-8">
                                   <div className="flex items-center gap-4">
                                      <div className="w-12 h-12 rounded-2xl agral-gradient flex items-center justify-center text-white font-black text-xs shadow-lg">
                                         {u.firstName?.[0]}{u.lastName?.[0]}
                                      </div>
                                      <div className="flex flex-col">
                                         <span className="text-sm font-black text-slate-900">{u.firstName} {u.lastName}</span>
                                         <span className="text-[10px] font-medium text-slate-400 italic">ID: {u.id.substring(0, 8)}</span>
                                      </div>
                                   </div>
                                </td>
                                <td className="p-8">
                                   <span className="text-sm font-bold text-slate-600">{u.email}</span>
                                </td>
                                <td className="p-8">
                                   <Badge variant="outline" className={cn(
                                      "px-4 py-1.5 rounded-xl font-black uppercase text-[9px] tracking-widest border-2",
                                      u.role === 'owner' ? "border-primary/20 text-primary" : "border-slate-100 text-slate-400"
                                   )}>
                                      {u.role}
                                   </Badge>
                                </td>
                                <td className="p-8 text-right">
                                   <Button variant="ghost" size="icon" className="w-10 h-10 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50">
                                      <Settings2 className="w-4 h-4" />
                                   </Button>
                                </td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </CardContent>
              </Card>
           </div>
         )}

      </main>

      {/* Advanced Action Footer (Fixed or Bottom) */}
      <div className="md:hidden p-4 fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 z-40">
         <Button variant="destructive" className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-xs" onClick={handleDelete}>
            Ștergere Organizație
         </Button>
      </div>

      {/* MODAL PLATA */}
      {showAddMonths && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xl flex items-center justify-center z-50 p-6 animate-in fade-in duration-300">
           <Card className="w-full max-w-xl rounded-[3.5rem] bg-white shadow-[0_45px_100px_rgba(0,0,0,0.2)] border-none overflow-hidden animate-in zoom-in-95 duration-500">
              <div className="p-12 space-y-10">
                 <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-[2.5rem] bg-slate-900 flex items-center justify-center text-white shadow-2xl">
                       <DollarSign className="w-10 h-10" />
                    </div>
                    <div>
                       <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Înregistrare Plată</h2>
                       <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Prelungire perioadă activă</p>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                       <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Valabilitate până la</Label>
                       <Input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} className="h-16 rounded-[1.5rem] bg-slate-50 border-none font-black text-lg px-8 shadow-inner" />
                    </div>
                    <div className="space-y-3">
                       <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Sumă (RON)</Label>
                       <Input value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="h-16 rounded-[1.5rem] bg-slate-50 border-none font-black text-2xl px-8 shadow-inner" />
                    </div>
                 </div>

                 <div className="flex gap-4">
                    <Button variant="ghost" onClick={() => setShowAddMonths(false)} className="flex-1 h-16 rounded-[1.5rem] font-black uppercase text-xs tracking-widest text-slate-400">Anulare</Button>
                    <Button onClick={handleAddPayment} disabled={isUpdating} className="flex-2 h-16 rounded-[2rem] agral-gradient text-white font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20">
                       {isUpdating ? <Loader2 className="w-5 h-5 animate-spin mr-3" /> : "Înregistrează Plată"}
                    </Button>
                 </div>
              </div>
           </Card>
        </div>
      )}
    </div>
  );
}
