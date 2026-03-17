"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MapPin, 
  Sprout, 
  History, 
  Tractor, 
  TrendingUp, 
  Calendar, 
  Info, 
  ArrowLeft,
  ChevronRight,
  Droplets,
  Fuel,
  Hammer,
  Banknote,
  Trash2,
  Maximize
} from "lucide-react";
import Link from "next/link";
import { deleteAgriculturalOperation } from "@/lib/actions/operations";
import { toast } from "react-hot-toast";
import dynamic from "next/dynamic";
import * as turf from "@turf/turf";

const ParcelMapView = dynamic(
  () => import("./ParcelMapView").then((mod) => mod.ParcelMapView),
  { ssr: false }
);

interface ParcelDetailClientProps {
  parcel: any;
}

const statusColors: Record<string, string> = {
  growing: "bg-green-100 text-green-700 border-green-200",
  planned: "bg-blue-100 text-blue-700 border-blue-200",
  harvested: "bg-gray-100 text-gray-600 border-gray-200",
  sown: "bg-amber-100 text-amber-700 border-amber-200",
};

export default function ParcelDetailClient({ parcel }: ParcelDetailClientProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDeleteOp = async (id: string) => {
    if (!confirm("Sigur vrei să ștergi această lucrare? Stocul va fi restabilit dacă a fost folosit din magazie.")) return;
    setIsDeleting(id);
    try {
      await deleteAgriculturalOperation(id);
      toast.success("Lucrare ștearsă cu succes");
      window.location.reload();
    } catch (e) {
      toast.error("Eroare la ștergere");
    } finally {
      setIsDeleting(null);
    }
  };

  const stats = parcel.stats;
  const currentPlan = stats.currentPlan;

  // Calculăm metrics reale
  const metrics = useMemo(() => {
    const historicalPlans = parcel.cropPlans.filter((p: any) => p.status === "harvested" && p.actualYieldTha);
    const avgYield = historicalPlans.length > 0 
      ? historicalPlans.reduce((sum: number, p: any) => sum + Number(p.actualYieldTha), 0) / historicalPlans.length
      : 0;

    let perimeter = 0;
    let centroidCoords = null;
    if (parcel.coordinates) {
      try {
        perimeter = turf.length(parcel.coordinates, { units: "kilometers" });
        const center = turf.centroid(parcel.coordinates);
        centroidCoords = center.geometry.coordinates;
      } catch (e) {
        console.error("Error calculating spatial metrics", e);
      }
    }

    // Calculăm categoriile de costuri reale
    const costCategories = {
      fuel: 0,
      inputs: 0,
      other: 0
    };

    parcel.operationParcels.forEach((opParcel: any) => {
      const totalOpArea = Number(opParcel.operation.totalAreaHa);
      const parcelArea = Number(opParcel.operatedAreaHa);
      const share = parcelArea / totalOpArea;

      opParcel.operation.resources.forEach((res: any) => {
        const qty = res.totalConsumed ? Number(res.totalConsumed) : (Number(res.quantityPerHa) * totalOpArea);
        const cost = qty * share * Number(res.pricePerUnit);
        
        if (res.type === 'combustibil') {
          costCategories.fuel += cost;
        } else if (res.type === 'seminte' || res.type === 'chimice') {
          costCategories.inputs += cost;
        } else {
          costCategories.other += cost;
        }
      });
    });

    return { avgYield, perimeter, centroidCoords, costCategories };
  }, [parcel]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Navigation */}
      <div className="flex items-center gap-4">
        <Link href="/parcele">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Înapoi la listă
          </Button>
        </Link>
      </div>

      {/* Main Hero Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 overflow-hidden border-none shadow-xl bg-white/70 backdrop-blur-md">
          <div className="h-2 agral-gradient" />
          <CardContent className="p-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-4xl font-black text-foreground mb-2">{parcel.name}</h1>
                <div className="flex items-center gap-3 text-muted-foreground font-medium text-sm">
                  <span className="flex items-center gap-1"><MapPin className="w-4 h-4 shrink-0" /> {parcel.cadastralCode || 'Fără cod cadastral'}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1 uppercase tracking-tighter font-black">{parcel.ownership === 'owned' ? 'Propriu' : 'Arendat'}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-black text-primary">{parcel.areaHa} ha</span>
                </div>
              </div>
              <Badge className={`text-md px-4 py-1 font-black uppercase tracking-widest border ${statusColors[currentPlan?.status || 'planned']}`}>
                {currentPlan?.status || 'Liberă'}
              </Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
                <p className="text-[10px] font-black text-muted-foreground uppercase mb-1">Cultură Curentă</p>
                <p className="text-lg font-bold text-primary truncate leading-tight">{currentPlan?.cropType || "Niciuna"}</p>
              </div>
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100">
                <p className="text-[10px] font-black text-amber-700 uppercase mb-1">Lucrări</p>
                <p className="text-lg font-bold text-amber-900">{stats.totalOperations}</p>
              </div>
              <div className="p-4 rounded-2xl bg-green-50 border border-green-100">
                <p className="text-[10px] font-black text-green-700 uppercase mb-1">Costuri Totale</p>
                <p className="text-lg font-bold text-green-900 leading-tight">{Number(stats.totalCost).toLocaleString()} <span className="text-sm">lei</span></p>
              </div>
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100">
                <p className="text-[10px] font-black text-blue-700 uppercase mb-1">Tip Sol</p>
                <p className="text-lg font-bold text-blue-900 truncate tracking-tighter">{parcel.soilType || "-"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Quick Card */}
        <Card className="border-none shadow-lg bg-primary text-white overflow-hidden">
          <div className="p-6 relative h-full flex flex-col justify-between">
            <TrendingUp className="absolute top-4 right-4 w-24 h-24 opacity-10" />
            <div>
              <h3 className="text-xl font-black mb-2">Performanță</h3>
              <p className="text-primary-foreground/80 mb-4 text-xs font-medium">Randamentul și costurile acumulate pe hectarele acestei parcele.</p>
              <div className="space-y-3">
                 <div className="flex justify-between text-sm font-bold border-b border-white/20 pb-2">
                   <span>Recoltă medie</span>
                   <span>{metrics.avgYield > 0 ? `${metrics.avgYield.toFixed(2)} T/ha` : "N/A"}</span>
                 </div>
                 <div className="flex justify-between text-sm font-bold border-b border-white/20 pb-2">
                   <span>Cost / ha</span>
                   <span>{Number(parcel.areaHa) > 0 ? `${(Number(stats.totalCost) / Number(parcel.areaHa)).toFixed(0)} lei` : "0 lei"}</span>
                 </div>
              </div>
            </div>
            <Link href="/lucrari" className="w-full">
              <Button className="w-full bg-white text-primary font-black hover:bg-white/90">
                ADAUGĂ LUCRARE NOUĂ
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-white/50 backdrop-blur shadow-sm p-1 rounded-2xl mb-6">
          <TabsTrigger value="overview" className="rounded-xl font-bold px-8">Vedere Generală</TabsTrigger>
          <TabsTrigger value="history" className="rounded-xl font-bold px-8">Istoric Culturi</TabsTrigger>
          <TabsTrigger value="operations" className="rounded-xl font-bold px-8">Jurnal Lucrări</TabsTrigger>
          <TabsTrigger value="financials" className="rounded-xl font-bold px-8">Analiză Financiară</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <Card className="p-6 border-none shadow-md bg-white/70 overflow-hidden flex flex-col">
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="text-lg font-bold flex items-center gap-2"><MapPin className="w-5 h-5 text-primary" /> Geometrie & Locație</CardTitle>
                </CardHeader>
                <div className="aspect-video bg-muted rounded-2xl overflow-hidden border-2 border-primary/10 flex-1 min-h-[300px]">
                    <ParcelMapView geoJson={parcel.coordinates} />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4">
                   <div className="text-sm">
                      <p className="text-muted-foreground font-medium uppercase text-[10px]">Coordonate Centru</p>
                      <p className="font-bold">{metrics.centroidCoords ? `${metrics.centroidCoords[1].toFixed(4)}N, ${metrics.centroidCoords[0].toFixed(4)}E` : "-"}</p>
                   </div>
                   <div className="text-sm text-right">
                      <p className="text-muted-foreground font-medium uppercase text-[10px]">Perimetru</p>
                      <p className="font-bold">{metrics.perimeter > 0 ? `${metrics.perimeter.toFixed(2)} km` : "-"}</p>
                   </div>
                </div>
             </Card>

             <Card className="p-6 border-none shadow-md bg-white/70">
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="text-lg font-bold flex items-center gap-2"><Sprout className="w-5 h-5 text-green-600" /> Detalii Tehnice</CardTitle>
                </CardHeader>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-muted-foreground">Utilizare teren</span>
                    <span className="font-extrabold capitalize text-foreground">{parcel.landUse}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-muted-foreground">Proprietate</span>
                    <span className="font-extrabold capitalize text-foreground">{parcel.ownership === 'owned' ? 'Propriu' : 'Arendat'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-muted-foreground">Suprafață Reală</span>
                    <span className="font-extrabold text-primary">{parcel.areaHa} ha</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-muted-foreground">Creat la</span>
                    <span className="font-extrabold text-foreground">{new Date(parcel.createdAt).toLocaleDateString('ro-RO')}</span>
                  </div>
                </div>
             </Card>
           </div>
        </TabsContent>

        <TabsContent value="history">
          <Card className="border-none shadow-md bg-white/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><History className="w-5 h-5 text-primary" /> Istoricul Campaniilor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {parcel.cropPlans.map((plan: any) => (
                  <div key={plan.id} className="flex items-center justify-between p-4 rounded-2xl bg-muted/20 border border-border/50 hover:bg-muted/30 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-primary font-black uppercase text-xl">
                        {plan.cropType[0]}
                      </div>
                      <div>
                        <p className="font-black text-foreground text-lg">{plan.cropType}</p>
                        <p className="text-xs text-muted-foreground font-black uppercase tracking-tighter">{plan.season.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-foreground text-lg">{plan.actualYieldTha || plan.estimatedYieldTha || "-"} T/ha</p>
                      <Badge variant="outline" className={`text-[10px] uppercase font-bold ${statusColors[plan.status]}`}>{plan.status}</Badge>
                    </div>
                  </div>
                ))}
                {parcel.cropPlans.length === 0 && (
                  <div className="py-12 text-center text-muted-foreground font-medium italic">
                    Nu există culturi înregistrate în sezoanele anterioare.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="operations">
          <Card className="border-none shadow-md bg-white/70">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2"><Tractor className="w-5 h-5 text-amber-600" /> Jurnal Lucrări</CardTitle>
              <Link href="/lucrari"><Button size="sm" className="agral-gradient text-white font-bold">Adaugă Lucrare</Button></Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {parcel.operationParcels.map((opParcel: any) => (
                  <div key={opParcel.id} className="group relative flex items-start gap-4 p-5 rounded-2xl bg-white border border-border pb-6 transition-all hover:shadow-lg">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0 shadow-sm">
                      <Tractor className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-black text-lg text-foreground">{opParcel.operation.name}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground font-bold uppercase mt-1">
                             <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(opParcel.operation.date).toLocaleDateString('ro-RO')}</span>
                             <span>•</span>
                             <span>{opParcel.operatedAreaHa} ha lucrate</span>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleDeleteOp(opParcel.operation.id)}
                          disabled={isDeleting === opParcel.operation.id}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      {opParcel.operation.resources?.length > 0 && (
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                          {opParcel.operation.resources.map((res: any) => (
                            <div key={res.id} className="flex items-center gap-2 p-2 rounded-xl bg-muted/30 text-xs font-bold border border-transparent">
                               {res.type === 'combustibil' ? <Fuel className="w-3.5 h-3.5 text-red-500" /> : <Sprout className="w-3.5 h-3.5 text-green-500" />}
                               <span className="truncate">{res.name}: {res.totalConsumed || (Number(res.quantityPerHa) * Number(opParcel.operatedAreaHa)).toFixed(1)} {res.unit}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {parcel.operationParcels.length === 0 && (
                  <div className="py-12 text-center text-muted-foreground font-medium italic">
                    Nu există lucrări înregistrate pe această parcelă.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financials">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 border-none shadow-md bg-white/70">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Banknote className="w-5 h-5 text-green-600" /> Detaliere Investiție</CardTitle>
              </CardHeader>
              <CardContent>
                 <div className="space-y-6">
                   <div className="space-y-3">
                      <div className="flex justify-between items-center text-[10px] font-black opacity-50 uppercase tracking-widest px-1">
                        <span>Categorie Estimată</span>
                        <span>Sumă</span>
                      </div>
                      <div className="flex justify-between items-center p-4 rounded-2xl bg-red-50 text-red-900 border border-red-100">
                        <div className="flex items-center gap-3 font-bold"><Fuel className="w-5 h-5" /> Motorină</div>
                        <span className="font-black">{metrics.costCategories.fuel.toFixed(0)} lei</span>
                      </div>
                      <div className="flex justify-between items-center p-4 rounded-2xl bg-green-50 text-green-900 border border-green-100">
                        <div className="flex items-center gap-3 font-bold"><Sprout className="w-5 h-5" /> Semințe & Chimice</div>
                        <span className="font-black">{metrics.costCategories.inputs.toFixed(0)} lei</span>
                      </div>
                      <div className="flex justify-between items-center p-4 rounded-2xl bg-blue-50 text-blue-900 border border-blue-100">
                        <div className="flex items-center gap-3 font-bold"><Hammer className="w-5 h-5" /> Mecanizare & Altele</div>
                        <span className="font-black">{metrics.costCategories.other.toFixed(0)} lei</span>
                      </div>
                   </div>

                   <div className="pt-6 border-t-2 border-dashed border-border mt-6">
                      <div className="flex justify-between items-center">
                         <span className="text-xl font-black text-foreground uppercase tracking-tighter">Investiție Reală Totală</span>
                         <span className="text-3xl font-black text-primary">{Number(stats.totalCost).toLocaleString()} lei</span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-muted-foreground font-bold uppercase">Media / hectar</p>
                        <p className="text-sm font-black text-foreground">{Number(parcel.areaHa) > 0 ? (Number(stats.totalCost) / Number(parcel.areaHa)).toFixed(0) : 0} lei</p>
                      </div>
                   </div>
                 </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md bg-emerald-600 text-white overflow-hidden relative">
               <TrendingUp className="absolute -right-6 -bottom-6 w-32 h-32 opacity-10" />
               <CardHeader>
                 <CardTitle className="text-lg font-black uppercase tracking-tighter">Bilanț Parcelă</CardTitle>
               </CardHeader>
               <CardContent className="space-y-6">
                  <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
                    <p className="text-[10px] font-bold text-emerald-100 uppercase tracking-widest mb-1">Recoltă Medie Reală</p>
                    <p className="text-3xl font-black">{metrics.avgYield > 0 ? metrics.avgYield.toFixed(2) : "0.00"} <span className="text-sm font-medium">T/ha</span></p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-emerald-50 leading-relaxed italic">
                      Datele financiare sunt agregate din resursele consumate în timpul lucrărilor înregistrate pe această parcelă.
                    </p>
                  </div>
               </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
