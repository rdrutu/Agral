"use client";

import { useState, useMemo } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Plus,
  Search,
  Calendar,
  User,
  MapPin,
  Download,
  Printer,
  Trash2,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Building2,
  Landmark,
  Loader2,
  Mail,
  Edit,
  DollarSign,
  Users,
  ArrowRight,
  MoreVertical,
  Edit2
} from "lucide-react";
import { 
  createLeaseContract, 
  updateLeaseContract, 
  deleteLeaseContract, 
  updateLeasePayment 
} from "@/lib/actions/leases";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { toast } from "react-hot-toast";
import { PrintContractButton } from "./PrintContractButton";
import { cn, formatDate } from "@/lib/utils";
import dynamic from "next/dynamic";

const LeaseParcelMapSelector = dynamic(
  () => import("./LeaseParcelMapSelector"),
  { 
    ssr: false,
    loading: () => <div className="h-[300px] w-full bg-muted/20 animate-pulse rounded-lg border flex items-center justify-center font-bold text-muted-foreground">Incarcare harta...</div>
  }
);

interface LeaseContractClientProps {
  initialContracts: any[];
  parcels: any[];
  organization: any;
}

export default function LeaseContractClient({ initialContracts, parcels, organization }: LeaseContractClientProps) {
  const [contracts, setContracts] = useState(initialContracts);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [landownerType, setLandownerType] = useState<"individual" | "company">("individual");
  
  const [formData, setFormData] = useState({
    parcelId: "",
    contractNumber: "",
    landownerName: "",
    landownerCnp: "",
    landownerFiscalCode: "",
    landownerAddress: "",
    landownerCity: "",
    landownerCounty: "",
    landownerCiSeries: "",
    landownerCiNumber: "",
    landownerRepresentative: "",
    landownerPhone: "",
    registrationCouncil: "Daia", // Default based on user model
    registrationCounty: "Giurgiu", // Default based on user model
    cadastralCode: "",
    startDate: "",
    endDate: "",
    pricePerHa: "",
    paymentType: "cash",
    notes: ""
  });

  const [editingContract, setEditingContract] = useState<any | null>(null);

  // Stats
  const stats = useMemo(() => {
    const active = contracts.filter(c => new Date(c.endDate) > new Date());
    const totalArea = active.reduce((acc, curr) => acc + Number(curr.parcel.areaHa), 0);
    const pendingPayments = contracts.filter(c => c.paymentStatus === "pending").length;
    
    return {
      totalContracts: contracts.length,
      activeContracts: active.length,
      totalArea,
      pendingPayments
    };
  }, [contracts]);

  const filteredContracts = contracts.filter(c => 
    c.landownerName.toLowerCase().includes(search.toLowerCase()) ||
    c.contractNumber.toLowerCase().includes(search.toLowerCase()) ||
    c.parcel.name.toLowerCase().includes(search.toLowerCase())
  );

  const availableParcels = useMemo(() => {
    return parcels.filter(p => {
      // Must be rented
      if (p.ownership !== "rented") return false;

      // Filter out parcels with active lease contracts
      // (Except if we're editing a contract that already belongs to this parcel)
      const now = new Date();
      const hasActiveLease = p.leaseContracts?.some((lc: any) => {
        if (editingContract && lc.id === editingContract.id) return false;
        return new Date(lc.endDate) > now;
      });

      if (hasActiveLease) return false;

      return true;
    });
  }, [parcels, editingContract]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingContract) {
        const updated = await updateLeaseContract(editingContract.id, {
          ...formData,
          landownerType
        });
        window.location.reload(); // Simple reload to get updated parcel data too
        toast.success("Contract actualizat cu succes");
      } else {
        const result = await createLeaseContract({
          ...formData,
          landownerType,
          pricePerHa: Number(formData.pricePerHa)
        });
        // Refresh would be better but let's update local state for speed if needed
        // Or just window.location.reload() for simplicity in this complex action
        window.location.reload();
      }
      setShowForm(false);
    } catch (error: any) {
      toast.error(error.message || "Eroare la salvarea contractului");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Sigur dorești să ștergi acest contract?")) return;
    try {
      await deleteLeaseContract(id);
      setContracts(contracts.filter(c => c.id !== id));
      toast.success("Contract șters");
    } catch (error) {
      toast.error("Eroare la ștergere");
    }
  };

  const handleMarkAsPaid = async (id: string) => {
    try {
      const date = new Date().toISOString();
      await updateLeasePayment(id, "paid", date);
      setContracts(contracts.map(c => c.id === id ? { ...c, paymentStatus: "paid", lastPaymentDate: date } : c));
      toast.success("Plată înregistrată");
    } catch (error) {
      toast.error("Eroare la actualizarea plății");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contracte Arendă</h1>
          <p className="text-muted-foreground">Gestionează contractele de închiriere și relația cu proprietarii.</p>
        </div>
        <Button onClick={() => { setEditingContract(null); setShowForm(true); }} className="agral-gradient text-white gap-2 shadow-sm shrink-0">
          <Plus className="w-4 h-4" /> Adaugă Contract
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm border-none bg-blue-50/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-blue-600">Total Contracte</CardTitle>
            <FileText className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalContracts}</div>
            <p className="text-xs text-muted-foreground">{stats.activeContracts} active</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-none bg-green-50/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-green-600">Suprafață Arendată</CardTitle>
            <Building2 className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalArea.toFixed(2)} Ha</div>
            <p className="text-xs text-muted-foreground">Din total fermă</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-none bg-amber-50/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-amber-600">Plăți Pendinte</CardTitle>
            <DollarSign className="w-4 h-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingPayments}</div>
            <p className="text-xs text-muted-foreground">Necesită atenție</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-none bg-purple-50/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-purple-600">Persoane Juridice</CardTitle>
            <Users className="w-4 h-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contracts.filter(c => c.landownerType === "company").length}</div>
            <p className="text-xs text-muted-foreground">Firme arendatoare</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-none overflow-hidden">
        <CardHeader className="bg-white border-b px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="text-lg">Listă Contracte</CardTitle>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Caută proprietar, nr. contract..." 
                className="pl-10 h-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b">
                <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Contract / Proprietar</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Parcelă / Detalii</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Perioadă</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Preț & Statut</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">Acțiuni</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredContracts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground italic">
                    Nu s-au găsit contracte care să corespundă căutării.
                  </td>
                </tr>
              ) : (
                filteredContracts.map((contract) => {
                  const isExpired = new Date(contract.endDate) < new Date();
                  return (
                    <tr key={contract.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                            contract.landownerType === "company" ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600"
                          )}>
                            {contract.landownerType === "company" ? <Building2 className="w-5 h-5" /> : <User className="w-5 h-5" />}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-foreground truncate">{contract.landownerName}</span>
                            <span className="text-xs text-muted-foreground font-medium">Nr. {contract.contractNumber}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-sm">{contract.parcel.name}</span>
                          <span className="text-xs text-muted-foreground">{contract.parcel.areaHa} Ha • {contract.parcel.cadastralCode || 'Fără cod'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5 font-medium text-slate-700">
                            {formatDate(contract.startDate)}
                            <ArrowRight className="w-3 h-3 text-muted-foreground" />
                            {formatDate(contract.endDate)}
                          </div>
                          {isExpired ? (
                            <Badge variant="outline" className="w-fit mt-1 h-5 text-[10px] bg-red-50 text-red-700 border-red-200">Expirat</Badge>
                          ) : (
                            <span className="text-[10px] text-green-600 font-bold mt-0.5">Activ</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5">
                          <span className="font-bold text-sm">{contract.pricePerHa} RON/Ha</span>
                          <div className="flex items-center gap-2">
                             <Badge className={cn(
                               "text-[10px] h-5",
                               contract.paymentStatus === "paid" ? "bg-green-100 text-green-700 hover:bg-green-100" : "bg-amber-100 text-amber-700 hover:bg-amber-100"
                             )}>
                               {contract.paymentStatus === "paid" ? "Plătit" : "Neplătit"}
                             </Badge>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <PrintContractButton 
                            contract={contract} 
                            organization={organization} 
                          />
                          <DropdownMenu>
                            <DropdownMenuTrigger render={
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            } />
                            <DropdownMenuContent align="end">
                              {contract.paymentStatus !== "paid" && (
                                <DropdownMenuItem onClick={() => handleMarkAsPaid(contract.id)} className="gap-2 text-green-600">
                                  <CheckCircle2 className="w-4 h-4" /> Marchează ca plătit
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => {
                                setEditingContract(contract);
                                setFormData({
                                  parcelId: contract.parcelId || "",
                                  contractNumber: contract.contractNumber || "",
                                  landownerName: contract.landownerName || "",
                                  landownerCnp: contract.landownerCnp || "",
                                  landownerFiscalCode: contract.landownerFiscalCode || "",
                                  landownerAddress: contract.landownerAddress || "",
                                  landownerCity: contract.landownerCity || "",
                                  landownerCounty: contract.landownerCounty || "",
                                  landownerCiSeries: contract.landownerCiSeries || "",
                                  landownerCiNumber: contract.landownerCiNumber || "",
                                  landownerRepresentative: contract.landownerRepresentative || "",
                                  landownerPhone: contract.landownerPhone || "",
                                  registrationCouncil: contract.registrationCouncil || "Daia",
                                  registrationCounty: contract.registrationCounty || "Giurgiu",
                                  cadastralCode: contract.parcel?.cadastralCode || "",
                                  startDate: new Date(contract.startDate).toISOString().split('T')[0],
                                  endDate: new Date(contract.endDate).toISOString().split('T')[0],
                                  pricePerHa: contract.pricePerHa?.toString() || "",
                                  paymentType: contract.paymentType || "cash",
                                  notes: contract.notes || ""
                                });
                                setLandownerType(contract.landownerType);
                                setShowForm(true);
                              }} className="gap-2">
                                <Edit2 className="w-4 h-4" /> Editează
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDelete(contract.id)} className="gap-2 text-destructive font-semibold">
                                <Trash2 className="w-4 h-4" /> Șterge contract
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Contract Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingContract ? 'Editează Contract' : 'Adaugă Contract Nou'}</DialogTitle>
            <DialogDescription>
              Introdu datele contractului de arendă conform actelor oficiale.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 py-4">
            {/* Map Selection */}
            {!editingContract && (
              <div className="space-y-2">
                <Label>Selectează Parcela de pe Hartă (doar cele în arendă disponibile)</Label>
                <LeaseParcelMapSelector 
                  parcels={availableParcels.filter(p => p.coordinates)} 
                  selectedParcelId={formData.parcelId}
                  onSelect={(id) => {
                    const parcel = availableParcels.find(p => p.id === id);
                    if (parcel) {
                      setFormData({
                        ...formData,
                        parcelId: id,
                        cadastralCode: parcel.cadastralCode || formData.cadastralCode
                      });
                    }
                  }}
                />
              </div>
            )}

            {/* General Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="parcelId">Parcelă Vizată</Label>
                <select 
                  id="parcelId"
                  className="w-full h-10 rounded-md border border-input bg-background px-3"
                  value={formData.parcelId}
                  onChange={(e) => {
                    const pId = e.target.value;
                    const parcel = parcels.find(p => p.id === pId);
                    setFormData({
                      ...formData, 
                      parcelId: pId,
                      cadastralCode: parcel?.cadastralCode || formData.cadastralCode
                    });
                  }}
                  required
                >
                  <option value="">Alege parcela...</option>
                  {availableParcels.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.areaHa} Ha)</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cadastralCode">Nr. Cadastral (se va salva pe parcelă)</Label>
                <Input 
                  id="cadastralCode"
                  value={formData.cadastralCode}
                  onChange={(e) => setFormData({...formData, cadastralCode: e.target.value})}
                  placeholder="ex: 30123"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contractNumber">Număr Contract</Label>
                <Input 
                  id="contractNumber"
                  value={formData.contractNumber}
                  onChange={(e) => setFormData({...formData, contractNumber: e.target.value})}
                  placeholder="ex: 123/2025"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Tip Proprietar</Label>
                <div className="flex bg-slate-100 p-1 rounded-lg h-10">
                  <button
                    type="button"
                    className={cn(
                      "flex-1 flex items-center justify-center text-xs font-bold rounded-md transition-all",
                      landownerType === "individual" ? "bg-white text-blue-600 shadow-sm" : "text-muted-foreground"
                    )}
                    onClick={() => setLandownerType("individual")}
                  >
                    Pers. Fizică
                  </button>
                  <button
                    type="button"
                    className={cn(
                      "flex-1 flex items-center justify-center text-xs font-bold rounded-md transition-all",
                      landownerType === "company" ? "bg-white text-purple-600 shadow-sm" : "text-muted-foreground"
                    )}
                    onClick={() => setLandownerType("company")}
                  >
                    Pers. Juridică
                  </button>
                </div>
              </div>
            </div>

            {/* Landowner Details */}
            <div className="bg-slate-50 p-4 rounded-xl space-y-4 border border-slate-200">
               <h3 className="text-sm font-bold flex items-center gap-2">
                 {landownerType === "individual" ? <User className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                 Detalii {landownerType === "individual" ? "Proprietar" : "Firmă"}
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="landownerName">{landownerType === "individual" ? "Nume Complet" : "Denumire Firmă"}</Label>
                    <Input 
                      id="landownerName"
                      value={formData.landownerName}
                      onChange={(e) => setFormData({...formData, landownerName: e.target.value})}
                      placeholder={landownerType === "individual" ? "ex: Popescu Ion" : "ex: SC Agro SRL"}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="landownerCnp">{landownerType === "individual" ? "CNP" : "CUI / CIF"}</Label>
                    <Input 
                      id="landownerCnp"
                      value={formData.landownerCnp}
                      onChange={(e) => setFormData({...formData, landownerCnp: e.target.value})}
                      placeholder={landownerType === "individual" ? "13 cifre" : "RO..."}
                    />
                  </div>
                  
                  {landownerType === "company" && (
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="landownerRepresentative">Reprezentant Legal</Label>
                      <Input 
                        id="landownerRepresentative"
                        value={formData.landownerRepresentative}
                        onChange={(e) => setFormData({...formData, landownerRepresentative: e.target.value})}
                        placeholder="Numele administratorului / delegatului"
                      />
                    </div>
                  )}

                  {landownerType === "individual" && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="landownerCiSeries">Serie CI</Label>
                        <Input 
                          id="landownerCiSeries"
                          value={formData.landownerCiSeries}
                          onChange={(e) => setFormData({...formData, landownerCiSeries: e.target.value})}
                          placeholder="ex: AX"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="landownerCiNumber">Număr CI</Label>
                        <Input 
                          id="landownerCiNumber"
                          value={formData.landownerCiNumber}
                          onChange={(e) => setFormData({...formData, landownerCiNumber: e.target.value})}
                          placeholder="6 cifre"
                        />
                      </div>
                    </>
                  )}
                  
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="landownerAddress">Adresă (Strada, Nr, Bloc etc)</Label>
                    <Input 
                      id="landownerAddress"
                      value={formData.landownerAddress}
                      onChange={(e) => setFormData({...formData, landownerAddress: e.target.value})}
                      placeholder="ex: Str. Principală nr. 10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="landownerCity">Localitate</Label>
                    <Input 
                      id="landownerCity"
                      value={formData.landownerCity}
                      onChange={(e) => setFormData({...formData, landownerCity: e.target.value})}
                      placeholder="ex: Daia"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="landownerCounty">Județ</Label>
                    <Input 
                      id="landownerCounty"
                      value={formData.landownerCounty}
                      onChange={(e) => setFormData({...formData, landownerCounty: e.target.value})}
                      placeholder="ex: Giurgiu"
                    />
                  </div>
               </div>
            </div>

            {/* Registration Council */}
            <div className="bg-blue-50 p-4 rounded-xl space-y-4 border border-blue-100">
               <h3 className="text-sm font-bold flex items-center gap-2 text-blue-800">
                 <Building2 className="w-4 h-4" />
                 Înregistrare Consiliul Local
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="registrationCouncil">Consiliul Local (Primăria)</Label>
                    <Input 
                      id="registrationCouncil"
                      value={formData.registrationCouncil}
                      onChange={(e) => setFormData({...formData, registrationCouncil: e.target.value})}
                      placeholder="ex: Daia"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="registrationCounty">Județ Consiliu</Label>
                    <Input 
                      id="registrationCounty"
                      value={formData.registrationCounty}
                      onChange={(e) => setFormData({...formData, registrationCounty: e.target.value})}
                      placeholder="ex: Giurgiu"
                    />
                  </div>
               </div>
            </div>

            {/* Terms */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pb-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Data Început</Label>
                <Input 
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Data Expirare</Label>
                <Input 
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pricePerHa">Preț RON/Ha</Label>
                <div className="relative">
                   <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                   <Input 
                    id="pricePerHa"
                    type="number"
                    step="0.01"
                    className="pl-9"
                    value={formData.pricePerHa}
                    onChange={(e) => setFormData({...formData, pricePerHa: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentType">Tip Plată</Label>
                <select 
                  id="paymentType"
                  className="w-full h-10 rounded-md border border-input bg-background px-3"
                  value={formData.paymentType}
                  onChange={(e) => setFormData({...formData, paymentType: e.target.value})}
                >
                  <option value="cash">Bani (RON)</option>
                  <option value="grain">Cereale (Kg)</option>
                </select>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Anulează
              </Button>
              <Button type="submit" disabled={isSubmitting} className="agral-gradient text-white">
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingContract ? 'Salvează Modificările' : 'Creează Contract'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

