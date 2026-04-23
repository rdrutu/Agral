"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { submitOnboarding, cancelOnboarding } from "@/lib/actions/onboarding";
import { Loader2, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";

const BaseLocationPicker = dynamic(() => import("@/components/profil/BaseLocationPicker"), {
  ssr: false,
  loading: () => <div className="h-full w-full flex items-center justify-center bg-green-50/50"><Loader2 className="w-8 h-8 animate-spin text-green-600" /></div>
});

const MapPolygonPicker = dynamic(() => import("@/components/parcele/MapPolygonPicker").then(mod => mod.MapPolygonPicker), {
  ssr: false,
  loading: () => <div className="h-full w-full flex items-center justify-center bg-green-50/50"><Loader2 className="w-8 h-8 animate-spin text-green-600" /></div>
});

export function OnboardingClient() {
  const router = useRouter();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form Data
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [entityType, setEntityType] = useState("SRL");
  const [county, setCounty] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [cui, setCui] = useState("");
  const [phone, setPhone] = useState("");
  const [caen, setCaen] = useState("");
  const [iban, setIban] = useState("");
  const [bankName, setBankName] = useState("");
  const [website, setWebsite] = useState("");
  
  // Representative Info
  const [representativeName, setRepresentativeName] = useState("");
  const [representativeCnp, setRepresentativeCnp] = useState("");
  const [representativeCiSeries, setRepresentativeCiSeries] = useState("");
  const [representativeCiNumber, setRepresentativeCiNumber] = useState("");
  const [representativeRole, setRepresentativeRole] = useState("Administrator");
  
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

  const [lookupLoading, setLookupLoading] = useState(false);

  const handleCuiLookup = async () => {
    if (!cui || cui.length < 2) {
      toast.error("Introdu un CUI valid");
      return;
    }
    
    setLookupLoading(true);
    try {
      const response = await fetch("/api/anaf/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cui }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        const data = result.data;
        setLegalName(data.denumire || "");
        setRegistrationNumber(data.nrRegCom || "");
        setCaen(data.codCAEN || "");
        setIban(data.iban || "");
        
        // Compoziție adresă
        if (data.adresa) {
          setAddress(data.adresa);
        } else if (data.sediu) {
          const s = data.sediu;
          setCounty(s.judet || "");
          setCity(s.localitate || "");
          setAddress(`${s.strada || ""} ${s.numar || ""} ${s.detalii || ""}`.trim());
        }
        
        if (data.sediu) {
          const s = data.sediu;
          setCounty(s.judet || "");
          setCity(s.localitate || "");
          if (s.tara) setWebsite(s.tara === "ROMANIA" ? "" : s.tara);
        }

        toast.success("Datele firmei au fost preluate din ANAF!");
      } else {
        toast.error(result.error || "Firma nu a fost găsită");
      }
    } catch (error) {
      console.error("CUI Lookup error:", error);
      toast.error("Eroare la conectarea cu serviciul de verificare");
    } finally {
      setLookupLoading(false);
    }
  };

  const [parcelData, setParcelData] = useState<{ geoJson: any; areaHa: number } | null>(null);
  const [parcelName, setParcelName] = useState("");
  const [parcelOwnership, setParcelOwnership] = useState("owned");

  useState(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata) {
        if (user.user_metadata.first_name) setFirstName(user.user_metadata.first_name);
        if (user.user_metadata.last_name) setLastName(user.user_metadata.last_name);
      }
    };
    fetchUser();
  });

  const handleNext = () => {
    if (step < 4) setStep((s) => s + 1);
  };
  const handlePrev = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  const isStep1Valid = 
    firstName.length >= 2 &&
    lastName.length >= 2 &&
    orgName.length > 2;

  const isStep2Valid = 
    legalName.length > 3 &&
    cui.length > 3 &&
    county.length > 2 && 
    city.length > 2 && 
    address.length > 2;

  const isStep3Valid = 
    representativeName.length > 2 &&
    representativeCnp.length === 13;

  const isStep4Valid = lat !== null && lng !== null;

  const handleCancel = async () => {
    if (!confirm("Ești sigur că vrei să anulezi? Contul tău va fi șters definitiv.")) return;
    
    setLoading(true);
    try {
      await cancelOnboarding();
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/");
    } catch (error) {
      console.error(error);
      toast.error("Eroare la ștergerea contului.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await submitOnboarding({
        firstName,
        lastName,
        orgName,
        legalName,
        registrationNumber,
        entityType,
        county,
        city,
        address,
        cui,
        phone,
        caen,
        iban,
        bankName,
        website,
        representativeName,
        representativeCnp,
        representativeCiSeries,
        representativeCiNumber,
        representativeRole,
        lat,
        lng,
        parcelData: null,
        parcelName: "",
        parcelOwnership: "owned",
      });
      // Redirect to dashboard on success
      router.push("/dashboard");
    } catch (error) {
      console.error(error);
      alert("A apărut o eroare la salvarea datelor.");
    } finally {
      setLoading(false);
    }
  };

  const progressPercentage = (step / 4) * 100;

  return (
    <div className="w-full max-w-5xl mx-auto p-1 md:p-2 flex flex-col items-center pt-0 mt-0">
      {/* Header Branding - Logo Mare */}
      <div className="flex justify-center mb-1 mt-0">
        <Image
          src="/logo_agral_clar_cropped.png"
          alt="Agral Logo"
          width={180}
          height={75}
          className="object-contain drop-shadow-md z-10"
        />
      </div>

      {/* Progress Bar Header */}
      <div className="mb-1 p-4 bg-white/90 backdrop-blur-md rounded-2xl border border-border shadow-lg flex items-center justify-between relative overflow-hidden w-full">
        <div className="absolute top-0 left-0 h-1 bg-green-500 transition-all duration-500" style={{ width: `${progressPercentage}%` }} />
        <div className={`flex flex-col flex-1 items-center text-center ${step >= 1 ? 'text-green-700' : 'text-muted-foreground'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mb-1 ${step >= 1 ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>1</div>
          <span className="text-[10px] font-semibold">Cont & Brand</span>
        </div>
        <div className="w-px h-8 bg-border"></div>
        <div className={`flex flex-col flex-1 items-center text-center ${step >= 2 ? 'text-green-700' : 'text-muted-foreground'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mb-1 ${step >= 2 ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>2</div>
          <span className="text-[10px] font-semibold">Firma</span>
        </div>
        <div className="w-px h-8 bg-border"></div>
        <div className={`flex flex-col flex-1 items-center text-center ${step >= 3 ? 'text-green-700' : 'text-muted-foreground'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mb-1 ${step >= 3 ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>3</div>
          <span className="text-[10px] font-semibold">Admin</span>
        </div>
        <div className="w-px h-8 bg-border"></div>
        <div className={`flex flex-col flex-1 items-center text-center ${step >= 4 ? 'text-green-700' : 'text-muted-foreground'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mb-1 ${step >= 4 ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>4</div>
          <span className="text-[10px] font-semibold">Sediu</span>
        </div>
      </div>

      <Card className="shadow-2xl border-border bg-white/90 backdrop-blur-md w-full">
        {step === 1 && (
          <>
            <CardHeader className="text-center py-6">
              <CardTitle className="text-3xl font-black text-slate-900 tracking-tight">Bine ai venit pe Agral!</CardTitle>
              <CardDescription className="text-base font-medium">Pentru început, avem nevoie de câteva informații despre contul și brandul tău.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 max-w-2xl mx-auto pb-10">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="font-black text-[10px] uppercase tracking-widest text-slate-400 ml-1">Prenume <span className="text-red-500">*</span></Label>
                  <Input id="firstName" placeholder="Ion" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="h-12 rounded-xl bg-slate-50 border-none shadow-inner" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="font-black text-[10px] uppercase tracking-widest text-slate-400 ml-1">Nume <span className="text-red-500">*</span></Label>
                  <Input id="lastName" placeholder="Popa" value={lastName} onChange={(e) => setLastName(e.target.value)} className="h-12 rounded-xl bg-slate-50 border-none shadow-inner" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="orgName" className="font-black text-[10px] uppercase tracking-widest text-slate-400 ml-1">Numele Fermei (Brand Comercial) <span className="text-red-500">*</span></Label>
                <Input id="orgName" placeholder="Ex: Agro Muntenia" value={orgName} onChange={(e) => setOrgName(e.target.value)} className="h-14 rounded-xl bg-slate-50 border-none shadow-inner text-lg font-bold" />
                <p className="text-[10px] text-slate-400 italic ml-1">Acest nume va fi afișat în aplicație și pe rapoartele interne.</p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between py-6 border-t bg-slate-50/50">
              <Button variant="ghost" onClick={handleCancel} className="text-slate-400 hover:text-red-500 font-bold uppercase text-[10px] tracking-widest">
                Anulează
              </Button>
              <Button onClick={handleNext} disabled={!isStep1Valid} size="lg" className="agral-gradient w-56 h-14 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20">
                Pasul Următor <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </CardFooter>
          </>
        )}

        {step === 2 && (
          <>
            <CardHeader className="text-center py-6">
              <CardTitle className="text-3xl font-black text-slate-900 tracking-tight">Date Identitate Firmă</CardTitle>
              <CardDescription className="text-base font-medium">Informații oficiale necesare pentru facturare și legalitate.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 max-w-4xl mx-auto pb-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="font-black text-[10px] uppercase tracking-widest text-primary ml-1">Denumire Juridică <span className="text-red-500">*</span></Label>
                    <Input placeholder="SC Agro Muntenia SRL" value={legalName} onChange={e => setLegalName(e.target.value)} className="h-12 rounded-xl bg-slate-50 border-none shadow-inner font-bold" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400 ml-1">Formă Legală</Label>
                      <select value={entityType} onChange={e => setEntityType(e.target.value)} className="w-full h-12 rounded-xl bg-slate-50 border-none shadow-inner px-4 font-bold text-sm">
                        <option value="SRL">SRL</option>
                        <option value="PFA">PFA</option>
                        <option value="II">I.I.</option>
                        <option value="IF">I.F.</option>
                        <option value="SA">S.A.</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400 ml-1">Cod CAEN</Label>
                      <Input placeholder="0111" value={caen} onChange={e => setCaen(e.target.value)} className="h-12 rounded-xl bg-slate-50 border-none shadow-inner font-bold" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400 ml-1">CUI / CIF <span className="text-red-500">*</span></Label>
                      <div className="flex gap-2">
                        <Input 
                          placeholder="RO1234..." 
                          value={cui} 
                          onChange={e => setCui(e.target.value)} 
                          className="h-12 rounded-xl bg-slate-50 border-none shadow-inner font-bold tracking-widest uppercase flex-1" 
                        />
                        <Button 
                          type="button" 
                          onClick={handleCuiLookup} 
                          disabled={lookupLoading || cui.length < 2}
                          variant="secondary"
                          className="h-12 rounded-xl px-4 font-bold text-[10px] uppercase tracking-widest bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
                        >
                          {lookupLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Caută"}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400 ml-1">Reg. Comertului</Label>
                      <Input placeholder="J40/..." value={registrationNumber} onChange={e => setRegistrationNumber(e.target.value)} className="h-12 rounded-xl bg-slate-50 border-none shadow-inner font-bold" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="font-black text-[10px] uppercase tracking-widest text-indigo-500 ml-1">Cont IBAN (RON)</Label>
                    <Input placeholder="RO..." value={iban} onChange={e => setIban(e.target.value)} className="h-12 rounded-xl bg-slate-50 border-none shadow-inner font-bold tracking-tight uppercase text-xs" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400 ml-1">Bancă</Label>
                    <Input placeholder="Banca Transilvania" value={bankName} onChange={e => setBankName(e.target.value)} className="h-12 rounded-xl bg-slate-50 border-none shadow-inner font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400 ml-1">Website Oficial</Label>
                    <Input placeholder="www.agromuntenia.ro" value={website} onChange={e => setWebsite(e.target.value)} className="h-12 rounded-xl bg-slate-50 border-none shadow-inner font-bold text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex flex-col md:flex-row gap-4">
                <div className="flex-1 space-y-2">
                  <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400 ml-1">Județ <span className="text-red-500">*</span></Label>
                  <Input value={county} onChange={e => setCounty(e.target.value)} className="h-12 rounded-xl bg-slate-50 border-none shadow-inner font-bold" />
                </div>
                <div className="flex-1 space-y-2">
                  <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400 ml-1">Oraș <span className="text-red-500">*</span></Label>
                  <Input value={city} onChange={e => setCity(e.target.value)} className="h-12 rounded-xl bg-slate-50 border-none shadow-inner font-bold" />
                </div>
                <div className="flex-[2] space-y-2">
                  <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400 ml-1">Adresă completă / Sediu <span className="text-red-500">*</span></Label>
                  <Input value={address} onChange={e => setAddress(e.target.value)} className="h-12 rounded-xl bg-slate-50 border-none shadow-inner font-bold" />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between py-6 border-t bg-slate-50/50">
              <Button variant="outline" onClick={handlePrev} className="rounded-xl px-8 h-12 font-bold uppercase text-[10px] tracking-widest">Înapoi</Button>
              <Button onClick={handleNext} disabled={!isStep2Valid} size="lg" className="agral-gradient w-56 h-14 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20">
                Următorul Pas <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </CardFooter>
          </>
        )}

        {step === 3 && (
          <>
            <CardHeader className="text-center py-6">
              <CardTitle className="text-3xl font-black text-slate-900 tracking-tight">Reprezentant Legal</CardTitle>
              <CardDescription className="text-base font-medium">Datele persoanei care administrează ferma.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 max-w-2xl mx-auto pb-10">
              <div className="space-y-3">
                <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400 ml-1">Nume Complet Administrator <span className="text-red-500">*</span></Label>
                <Input value={representativeName} onChange={e => setRepresentativeName(e.target.value)} placeholder="Ion Popescu" className="h-14 rounded-xl bg-slate-50 border-none shadow-inner font-black text-lg" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400 ml-1">CNP <span className="text-red-500">*</span></Label>
                  <Input value={representativeCnp} onChange={e => setRepresentativeCnp(e.target.value)} placeholder="500..." className="h-12 rounded-xl bg-slate-50 border-none shadow-inner font-bold tracking-widest" />
                </div>
                <div className="space-y-2">
                  <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400 ml-1">Funcție / Rol</Label>
                  <Input value={representativeRole} onChange={e => setRepresentativeRole(e.target.value)} placeholder="Administrator" className="h-12 rounded-xl bg-slate-50 border-none shadow-inner font-bold" />
                </div>
              </div>
              <div className="p-6 bg-slate-900 rounded-[2rem] text-white flex flex-col items-center gap-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Act Identitate (CI)</span>
                <div className="flex gap-4 w-full">
                  <div className="flex-1 space-y-2">
                    <Label className="text-[9px] font-bold text-white/30 uppercase ml-1">Serie</Label>
                    <Input value={representativeCiSeries} onChange={e => setRepresentativeCiSeries(e.target.value)} className="h-12 rounded-xl bg-white/5 border-none shadow-inner text-center font-black uppercase" />
                  </div>
                  <div className="flex-[2] space-y-2">
                    <Label className="text-[9px] font-bold text-white/30 uppercase ml-1">Număr</Label>
                    <Input value={representativeCiNumber} onChange={e => setRepresentativeCiNumber(e.target.value)} className="h-12 rounded-xl bg-white/5 border-none shadow-inner text-center font-black" />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between py-6 border-t bg-slate-50/50">
              <Button variant="outline" onClick={handlePrev} className="rounded-xl px-8 h-12 font-bold uppercase text-[10px] tracking-widest">Înapoi</Button>
              <Button onClick={handleNext} disabled={!isStep3Valid} size="lg" className="agral-gradient w-56 h-14 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20">
                Următorul Pas <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </CardFooter>
          </>
        )}

        {step === 4 && (
          <>
            <CardHeader className="text-center py-6">
              <CardTitle className="text-3xl font-black text-slate-900 tracking-tight">Locația de Bază a Fermei</CardTitle>
              <CardDescription className="text-base font-medium">Mutați pinul pe hartă pentru a activa stația meteo dedicată.</CardDescription>
            </CardHeader>
            <CardContent className="pb-10">
              <div className="h-[350px] w-full rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-slate-100 ring-1 ring-slate-200">
                <BaseLocationPicker lat={lat} lng={lng} onChange={(l: number, lg: number) => { setLat(l); setLng(lg); }} />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between py-6 border-t bg-slate-50/50">
              <Button variant="outline" onClick={handlePrev} className="rounded-xl px-8 h-12 font-bold uppercase text-[10px] tracking-widest">Înapoi</Button>
              <Button onClick={handleSubmit} disabled={!isStep4Valid || loading} size="lg" className="agral-gradient w-56 h-14 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20">
                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <CheckCircle2 className="w-5 h-5 mr-2" />}
                Finalizează
              </Button>
            </CardFooter>
          </>
        )}

      </Card>
    </div>
  );
}
