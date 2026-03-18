"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Tractor, 
  Truck, 
  Settings, 
  Plus, 
  Wrench, 
  Fuel, 
  ShieldCheck, 
  Calendar,
  AlertCircle,
  Hash,
  Trash2,
  FileText,
  Loader2,
  Clock
} from "lucide-react";
import { addVehicle, removeVehicle, addVehicleMaintenance } from "@/lib/actions/vehicles";
import { deleteVehicleMaintenance } from "@/lib/actions/operations";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface VehiclesClientProps {
  initialVehicles: any[];
  hideHeader?: boolean;
}

const typeIcons: Record<string, any> = {
  tractor: Tractor,
  combine: Tractor, // Fallback la iconita tractor pt combina momentan
  pickup: Truck,
  trailer: Truck,
  other: Settings,
};

const maintenanceIcons: Record<string, any> = {
  service: Wrench,
  fuel: Fuel,
  insurance_rca: ShieldCheck,
  insurance_casco: ShieldCheck,
  itp: Calendar,
  other: FileText,
};

export default function VehiclesClient({ 
  initialVehicles,
  hideHeader = false 
}: VehiclesClientProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Add Vehicle Form state
  const [name, setName] = useState("");
  const [type, setType] = useState("tractor");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState<number | "">("");
  const [vin, setVin] = useState("");
  const [licensePlate, setLicensePlate] = useState("");

  // Maintenance Form State
  const [activeVehicleId, setActiveVehicleId] = useState<string | null>(null);
  const [mType, setMType] = useState("service");
  const [mDate, setMDate] = useState(new Date().toISOString().split('T')[0]);
  const [mCost, setMCost] = useState<number | "">("");
  const [mDetails, setMDetails] = useState("");

  async function handleAddVehicle() {
    if (!name || !type) return alert("Numele și tipul sunt obligatorii.");
    setIsSubmitting(true);
    try {
      await addVehicle({ 
        name, type, brand, model, 
        year: typeof year === 'number' ? year : undefined, 
        vin, licensePlate 
      });
      setShowAddForm(false);
      setName(""); setBrand(""); setModel(""); setVin(""); setLicensePlate(""); setYear("");
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAddMaintenance(vehicleId: string) {
    if (!mType || !mDate) return alert("Tipul și data sunt obligatorii");
    setIsSubmitting(true);
    try {
      await addVehicleMaintenance(vehicleId, {
        type: mType,
        date: mDate,
        cost: typeof mCost === 'number' ? mCost : undefined,
        details: mDetails
      });
      setActiveVehicleId(null);
      setMCost(""); setMDetails("");
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteMaintenance(maintenanceId: string) {
    if (!confirm("Sigur vrei să ștergi această înregistrare?")) return;
    try {
      await deleteVehicleMaintenance(maintenanceId);
      toast.success("Înregistrare ștearsă");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {!hideHeader && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-foreground flex items-center gap-2">
              <Tractor className="w-8 h-8 text-primary" />
              Parcul Auto & Utilaje
            </h2>
            <p className="text-muted-foreground mt-1 text-lg">
              Gestionează reparațiile, RCA, ITP și alimentările utilajelor agricole din flotă.
            </p>
          </div>
          
          {!showAddForm && (
            <Button 
              onClick={() => setShowAddForm(true)} 
              className="agral-gradient text-white gap-2 shadow-lg h-11 px-6 text-sm"
            >
              <Plus className="w-5 h-5" />
              Înregistrează Vehicul
            </Button>
          )}
        </div>
      )}

      {hideHeader && (
        <div className="flex justify-end">
          {!showAddForm && (
            <Button 
              onClick={() => setShowAddForm(true)} 
              className="agral-gradient text-white gap-2 shadow-lg h-11 px-6 text-sm"
            >
              <Plus className="w-5 h-5" />
              Înregistrează Vehicul
            </Button>
          )}
        </div>
      )}

      {showAddForm && (
        <Card className="animate-in slide-in-from-top-4 duration-300 border-primary/20 shadow-xl overflow-hidden mb-8">
          <CardHeader className="bg-primary/5 border-b">
            <CardTitle>Adaugă Utilaj/Vehicul Nou</CardTitle>
            <CardDescription>Introduceți datele de identificare ale mașinii sau tractorului.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Nume / Alias (ex: Tractorul Mare)</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Tractor John Deere" />
              </div>
              <div className="space-y-2">
                <Label>Tip Vehicul</Label>
                <select 
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={type}
                  onChange={e => setType(e.target.value)}
                >
                  <option value="tractor">Tractor</option>
                  <option value="combine">Combină</option>
                  <option value="trailer">Remorcă</option>
                  <option value="pickup">Pick-up / Mașină teren</option>
                  <option value="other">Alt utilaj</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Marcă</Label>
                <Input value={brand} onChange={e => setBrand(e.target.value)} placeholder="Claas, John Deere..." />
              </div>
              <div className="space-y-2">
                <Label>Model</Label>
                <Input value={model} onChange={e => setModel(e.target.value)} placeholder="Axion 850" />
              </div>
              <div className="space-y-2">
                <Label>An Fabricație</Label>
                <Input type="number" value={year} onChange={e => setYear(parseInt(e.target.value))} placeholder="2018" />
              </div>
              <div className="space-y-2">
                <Label>Număr Înmatriculare</Label>
                <Input value={licensePlate} onChange={e => setLicensePlate(e.target.value)} placeholder="OT 21 AGR" />
              </div>
              <div className="space-y-2 lg:col-span-2">
                <Label>Serie Șasiu (VIN)</Label>
                <Input value={vin} onChange={e => setVin(e.target.value)} placeholder="JN1029..." />
              </div>
            </div>
            <div className="flex gap-3 mt-6 pt-6 border-t">
              <Button variant="ghost" onClick={() => setShowAddForm(false)}>Anulează</Button>
              <Button className="agral-gradient text-white px-8" onClick={handleAddVehicle} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin"/> : "Salvează Vehiculul"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grid of Vehicles */}
      {initialVehicles.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-xl bg-muted/5">
          <Tractor className="w-16 h-16 text-muted-foreground mx-auto opacity-20 mb-4" />
          <h3 className="text-xl font-bold text-foreground">Nu ai niciun utilaj înregistrat</h3>
          <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
            Adaugă tractoarele și echipamentele tale pentru a le putea urmări asigurările și costurile de reparație per sezon.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {initialVehicles.map(v => {
            const Icon = typeIcons[v.type] || Tractor;
            const isAddingLog = activeVehicleId === v.id;
            
            // Calcul cheltuieli totale
            const totalSpent = v.maintenanceLogs.reduce((acc: number, log: any) => acc + Number(log.cost || 0), 0);
            
            return (
              <Card key={v.id} className="shadow-sm border border-border group overflow-hidden flex flex-col">
                <CardHeader className="bg-muted/10 border-b pb-4 relative">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">{v.name}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          {v.brand} {v.model} {v.year && `(${v.year})`}
                        </CardDescription>
                      </div>
                    </div>
                    
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-destructive/50 hover:bg-destructive/10 hover:text-destructive md:opacity-0 group-hover:opacity-100 transition-opacity absolute top-4 right-4"
                      onClick={() => confirm(`Ștergi ${v.name}?`) && removeVehicle(v.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {(v.licensePlate || v.vin) && (
                    <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border/50 text-xs">
                      {v.licensePlate && (
                        <Badge variant="outline" className="font-mono bg-background">
                          <span className="w-3 h-3 bg-blue-600 rounded-sm inline-block mr-1"></span>
                          {v.licensePlate}
                        </Badge>
                      )}
                      {v.vin && (
                        <span className="text-muted-foreground flex items-center gap-1 opacity-70">
                          <Hash className="w-3 h-3" /> VIN: {v.vin}
                        </span>
                      )}
                    </div>
                  )}
                </CardHeader>

                <CardContent className="p-0 flex flex-col flex-1 divide-y">
                  {/* Total Costs Bar */}
                  <div className="bg-background p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Cumulat Cheltuieli</p>
                      <p className="text-xl font-black text-foreground">{totalSpent.toLocaleString('ro-RO')} <span className="text-sm font-normal text-muted-foreground">RON</span></p>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => setActiveVehicleId(isAddingLog ? null : v.id)}
                      variant={isAddingLog ? "secondary" : "default"}
                      className={cn("gap-2 shadow-sm", !isAddingLog && "agral-gradient text-white")}
                    >
                      <Wrench className="w-4 h-4" /> 
                      {isAddingLog ? "Anulează" : "Adaugă Lucrare / Cost"}
                    </Button>
                  </div>

                  {/* Add Log Form */}
                  {isAddingLog && (
                    <div className="p-4 bg-muted/20 space-y-4 shadow-inner">
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="space-y-1.5 lg:col-span-2">
                          <Label className="text-xs">Tip Cheltuială</Label>
                          <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm" value={mType} onChange={e => setMType(e.target.value)}>
                            <option value="service">Revizie / Reparație</option>
                            <option value="fuel">Alimentare Combustibil</option>
                            <option value="insurance_rca">Asigurare RCA</option>
                            <option value="insurance_casco">Asigurare CASCO</option>
                            <option value="itp">Inspecție ITP</option>
                            <option value="other">Altele</option>
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Data</Label>
                          <Input type="date" value={mDate} onChange={e => setMDate(e.target.value)} className="h-9 text-sm" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Cost (RON)</Label>
                          <Input type="number" value={mCost} onChange={e => setMCost(parseFloat(e.target.value))} className="h-9 text-sm" placeholder="1500" />
                        </div>
                        <div className="space-y-1.5 lg:col-span-4">
                          <Label className="text-xs">Detalii / Observații</Label>
                          <Input value={mDetails} onChange={e => setMDetails(e.target.value)} className="h-9 text-sm" placeholder="ex: Schimbat filtre și ulei motor" />
                        </div>
                        <div className="lg:col-span-4 mt-2">
                           <Button 
                             className="w-full h-9 text-sm font-bold" 
                             onClick={() => handleAddMaintenance(v.id)}
                             disabled={isSubmitting}
                           >
                              {isSubmitting ? "Se salvează..." : "Înregistrează Operațiunea"}
                           </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Log History */}
                  <div className="relative flex-1 bg-background max-h-[250px] overflow-y-auto custom-scrollbar p-0">
                    {v.maintenanceLogs.length > 0 ? (
                      <div className="divide-y relative">
                        {v.maintenanceLogs.map((log: any) => {
                          const LogIcon = maintenanceIcons[log.type] || Settings;
                          return (
                            <div key={log.id} className="p-4 hover:bg-muted/5 transition-colors flex items-start gap-3">
                              <div className="mt-0.5 shrink-0 bg-muted/50 p-2 rounded-full text-muted-foreground">
                                <LogIcon className="w-3.5 h-3.5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground capitalize">
                                  {log.type.replace('_', ' ')}
                                </p>
                                {log.details && (
                                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{log.details}</p>
                                )}
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-sm font-bold text-foreground">
                                  {Number(log.cost)} <span className="text-[10px] text-muted-foreground uppercase font-normal">RON</span>
                                </p>
                                <p className="text-[10px] text-muted-foreground flex items-center justify-end gap-1 mt-1">
                                  <Clock className="w-3 h-3" /> {new Date(log.date).toLocaleDateString('ro-RO')}
                                </p>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6 text-muted-foreground hover:text-destructive md:opacity-0 group-hover:opacity-100 transition-opacity mt-1"
                                  onClick={() => handleDeleteMaintenance(log.id)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-sm text-muted-foreground italic">Niciun istoric de mentenanță pentru acest utilaj.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  );
}
