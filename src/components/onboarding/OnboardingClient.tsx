"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { submitOnboarding } from "@/lib/actions/onboarding";
import { Loader2, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

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
  const [orgName, setOrgName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [entityType, setEntityType] = useState("SRL");
  const [county, setCounty] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [cui, setCui] = useState("");
  const [phone, setPhone] = useState("");
  const [caen, setCaen] = useState("");
  
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

  const [parcelData, setParcelData] = useState<{ geoJson: any; areaHa: number } | null>(null);

  const handleNext = () => {
    if (step < 3) setStep((s) => s + 1);
  };
  const handlePrev = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  const isStep1Valid = 
    orgName.length > 2 && 
    legalName.length > 2 &&
    county.length > 2 && 
    city.length > 2 && 
    address.length > 2 && 
    cui.length > 2 &&
    (entityType === 'Persoana Fizica' || phone.length >= 10);
  const isStep2Valid = lat !== null && lng !== null;
  // Step 3 optional, they can skip drawing if they want? We will make it required to draw or skip explicit.
  const isStep3Valid = parcelData !== null;

  const handleCancel = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await submitOnboarding({
        orgName,
        legalName,
        entityType,
        county,
        city,
        address,
        cui,
        phone,
        caen,
        lat,
        lng,
        parcelData,
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

  return (
    <div className="w-full max-w-3xl mx-auto p-4 md:p-0">
      {/* Header Branding - Logo Mare */}
      <div className="flex justify-center mb-8 mt-2">
        <Image
          src="/logo_agral_clar_cropped.png"
          alt="Agral Logo"
          width={180}
          height={75}
          className="object-contain drop-shadow-md z-10"
        />
      </div>

      {/* Progress Bar Header */}
      <div className="mb-6 p-4 bg-white/90 backdrop-blur-md rounded-2xl border border-border shadow-lg flex items-center justify-between relative overflow-hidden">
        <div className="absolute top-0 left-0 h-1 bg-green-500 transition-all duration-500" style={{ width: `${(step / 3) * 100}%` }} />
        <div className={`flex flex-col flex-1 items-center text-center ${step >= 1 ? 'text-green-700' : 'text-muted-foreground'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mb-2 ${step >= 1 ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>1</div>
          <span className="text-sm font-semibold">Date Fermă</span>
        </div>
        <div className="w-px h-8 bg-border"></div>
        <div className={`flex flex-col flex-1 items-center text-center ${step >= 2 ? 'text-green-700' : 'text-muted-foreground'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mb-2 ${step >= 2 ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>2</div>
          <span className="text-sm font-semibold">Locație & Vreme</span>
        </div>
        <div className="w-px h-8 bg-border"></div>
        <div className={`flex flex-col flex-1 items-center text-center ${step >= 3 ? 'text-green-700' : 'text-muted-foreground'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mb-2 ${step >= 3 ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>3</div>
          <span className="text-sm font-semibold">Prima Parcelă</span>
        </div>
      </div>

      <Card className="shadow-2xl border-border bg-white/90 backdrop-blur-md">
        {step === 1 && (
          <>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-foreground">Bine ai venit pe Agral!</CardTitle>
              <CardDescription className="text-base">Pentru început, avem nevoie de câteva informații despre ferma ta.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-w-xl mx-auto mt-2">
              <div className="grid grid-cols-[1fr_2fr] gap-4">
                <div className="space-y-2">
                  <Label htmlFor="entityType" className="font-bold">Formă de organizare</Label>
                  <select
                    id="entityType"
                    value={entityType}
                    onChange={(e) => setEntityType(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="SRL">SRL</option>
                    <option value="PFA">PFA</option>
                    <option value="II">II</option>
                    <option value="IF">IF</option>
                    <option value="Persoana Fizica">Persoană Fizică</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="orgName" className="font-bold">Numele Fermei (Brand / Cum îi spuneți) <span className="text-red-500">*</span></Label>
                  <Input id="orgName" placeholder="Ex: Agro Muntenia" value={orgName} onChange={(e) => setOrgName(e.target.value)} className="h-10" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="legalName" className="font-bold">Numele Juridic ({entityType}) <span className="text-red-500">*</span></Label>
                <Input id="legalName" placeholder="Ex: SC Agro Muntenia SRL / Popescu Ion PFA" value={legalName} onChange={(e) => setLegalName(e.target.value)} className="h-10" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cui" className="font-bold">CUI / CIF / CNP <span className="text-red-500">*</span></Label>
                  <Input id="cui" placeholder="Cod unic sau CNP" value={cui} onChange={(e) => setCui(e.target.value)} className="h-10" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="font-bold">Telefon {entityType !== 'Persoana Fizica' && <span className="text-red-500">*</span>}</Label>
                  <Input id="phone" type="tel" placeholder="07xxxxxxxx" value={phone} onChange={(e) => setPhone(e.target.value)} className="h-10" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="county" className="font-bold">Județ <span className="text-red-500">*</span></Label>
                  <Input id="county" placeholder="Ex: Călărași" value={county} onChange={(e) => setCounty(e.target.value)} className="h-10" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city" className="font-bold">Oraș / Comună <span className="text-red-500">*</span></Label>
                  <Input id="city" placeholder="Ex: Dragalina" value={city} onChange={(e) => setCity(e.target.value)} className="h-10" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="address" className="font-bold">Adresa completă <span className="text-red-500">*</span></Label>
                  <Input id="address" placeholder="Strada, Numărul, Bloc, etc." value={address} onChange={(e) => setAddress(e.target.value)} className="h-10" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="caen" className="font-bold">Cod CAEN (Opțional)</Label>
                  <Input id="caen" placeholder="Ex: 0111" value={caen} onChange={(e) => setCaen(e.target.value)} className="h-10" />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between pt-8 pb-6">
              <Button variant="ghost" onClick={handleCancel} className="text-muted-foreground hover:text-red-600">
                Renunță și Anulează
              </Button>
              <Button onClick={handleNext} disabled={!isStep1Valid} size="lg" className="agral-gradient w-48 font-bold">
                Următorul Pas <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </CardFooter>
          </>
        )}

        {step === 2 && (
          <>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-foreground">Locația de Bază a Fermei</CardTitle>
              <CardDescription className="text-base">Mutați pinul pe hartă acolo unde se află sediul / baza fermei.<br/>Astfel putem prelua automat datele precise pentru prognoza meteo zilnică.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[320px] w-full rounded-2xl overflow-hidden border-2 border-green-200">
                <BaseLocationPicker lat={lat} lng={lng} onChange={(l: number, lg: number) => { setLat(l); setLng(lg); }} />
              </div>
              <p className="text-center text-sm text-muted-foreground mt-4">
                Puteți folosi și bara de căutare de pe hartă pentru a găsi rapid orașul/comuna, apoi faceți click pe zona exactă.
              </p>
            </CardContent>
            <CardFooter className="flex justify-between pt-4 pb-6">
              <Button variant="outline" onClick={handlePrev} size="lg"><ArrowLeft className="w-5 h-5 mr-2" /> Înapoi</Button>
              <Button onClick={handleNext} disabled={!isStep2Valid} size="lg" className="agral-gradient w-48 font-bold">
                Următorul Pas <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </CardFooter>
          </>
        )}

        {step === 3 && (
          <>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-foreground">Tutorial: Desenează Prima Parcelă</CardTitle>
              <CardDescription className="text-base">Găsiți zona pe hartă și folosiți instrumentul de poligon ⬟ pentru a contura limitele parcelei.</CardDescription>
            </CardHeader>
            <CardContent>
               <div className="h-[350px] w-full rounded-2xl overflow-hidden border-2 border-green-200 shadow-inner">
                <MapPolygonPicker 
                  onPolygonComplete={(geoJson, area) => setParcelData({ geoJson, areaHa: area })} 
                  baseLat={lat} 
                  baseLng={lng} 
                />
              </div>
              {parcelData && (
                <div className="mt-6 flex items-center justify-center gap-2 text-green-700 bg-green-50 p-3 rounded-lg border border-green-200">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-bold">Parcelă salvată temporar (Suprafață: {parcelData.areaHa.toFixed(2)} Ha). Apasă "Finalizează și Intră" pentru a o adăuga.</span>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between pt-4 pb-6">
              <Button variant="outline" onClick={handlePrev} size="lg"><ArrowLeft className="w-5 h-5 mr-2" /> Înapoi</Button>
              <div className="flex gap-4">
                {!parcelData && (
                  <Button variant="ghost" onClick={handleSubmit} disabled={loading} size="lg" className="text-muted-foreground hover:text-foreground">
                    Sari peste acest pas
                  </Button>
                )}
                <Button onClick={handleSubmit} disabled={loading || !parcelData} size="lg" className="agral-gradient font-bold px-8">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <CheckCircle2 className="w-5 h-5 mr-2" />}
                  Finalizează și Intră în Cont
                </Button>
              </div>
            </CardFooter>
          </>
        )}

      </Card>
    </div>
  );
}
