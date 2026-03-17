"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Building2,
  Mail,
  MapPin,
  Loader2,
  CheckCircle2,
  Sprout,
} from "lucide-react";
import { updateUserProfile } from "@/lib/actions/profile";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

const BaseLocationPicker = dynamic(() => import("./BaseLocationPicker"), { 
  ssr: false,
  loading: () => <div className="h-[300px] w-full bg-muted animate-pulse rounded-xl flex items-center justify-center text-muted-foreground">Încarc harta...</div>
});

interface ProfileClientProps {
  user: {
    firstName: string | null;
    lastName: string | null;
    email: string;
    role: string;
    organization: {
      name: string;
      county: string | null;
      address: string | null;
      subscriptionTier: string;
      cui: string | null;
      legalName: string | null;
      registrationNumber: string | null;
      caen: string | null;
      phone: string | null;
      baseLat: number | null;
      baseLng: number | null;
    } | null;
  };
}

export default function ProfileClient({ user }: ProfileClientProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [firstName, setFirstName] = useState(user.firstName || "");
  const [lastName, setLastName] = useState(user.lastName || "");
  const [orgName, setOrgName] = useState(user.organization?.name || "");
  const [legalName, setLegalName] = useState(user.organization?.legalName || "");
  const [registrationNumber, setRegistrationNumber] = useState(user.organization?.registrationNumber || "");
  const [caen, setCaen] = useState(user.organization?.caen || "");
  const [cui, setCui] = useState(user.organization?.cui || "");
  const [phone, setPhone] = useState(user.organization?.phone || "");
  const [county, setCounty] = useState(user.organization?.county || "");
  const [address, setAddress] = useState(user.organization?.address || "");
  const [baseLat, setBaseLat] = useState<number | null>(user.organization?.baseLat ? Number(user.organization.baseLat) : null);
  const [baseLng, setBaseLng] = useState<number | null>(user.organization?.baseLng ? Number(user.organization.baseLng) : null);

  const isSuper = user.role === "superadmin";

  const initials =
    `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase() ||
    user.email[0].toUpperCase();

  async function handleSave() {
    setIsSaving(true);
    setSaved(false);
    try {
      await updateUserProfile({ 
        firstName, lastName, 
        orgName: isSuper ? undefined : orgName, 
        county, address,
        legalName, registrationNumber, caen, cui, phone,
        baseLat, baseLng
      });
      setSaved(true);
      toast.success("Profil actualizat!");
      setTimeout(() => setSaved(false), 3000);
      router.refresh();
    } catch (err: any) {
      toast.error("Eroare la salvarea profilului: " + err.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl agral-gradient flex items-center justify-center text-white text-2xl font-extrabold shadow-lg">
          {initials}
        </div>
        <div>
          <h2 className="text-2xl font-extrabold text-foreground">
            {firstName || lastName ? `${firstName} ${lastName}`.trim() : "Profilul meu"}
          </h2>
          <p className="text-muted-foreground">{user.email}</p>
          <div className="flex items-center gap-2 mt-1">
            <Badge className={cn("text-xs", isSuper ? "bg-purple-100 text-purple-800 border-purple-200" : "bg-green-100 text-green-800 border-green-200")}>
              {isSuper ? "ADMINISTRATOR SISTEM" : `Plan ${user.organization?.subscriptionTier || "trial"}`}
            </Badge>
          </div>
        </div>
      </div>

      {/* Date personale */}
      <Card>
        <CardHeader className="border-b pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="w-4 h-4 text-primary" /> Date Personale
          </CardTitle>
          <CardDescription>Informațiile despre contul tău Agral.</CardDescription>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="firstName">Prenume</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Ion"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName">Nume de familie</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Popescu"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" /> Email (read-only)
            </Label>
            <Input value={user.email} disabled className="bg-muted/40" />
          </div>
        </CardContent>
      </Card>

      {/* Date Ferma - Ascunse pentru Admin */}
      {!isSuper && (
        <Card>
          <CardHeader className="border-b pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="w-4 h-4 text-primary" /> Datele Fermei
            </CardTitle>
            <CardDescription>Informații despre organizația ta agricolă.</CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="orgName" className="flex items-center gap-1.5">
                <Sprout className="w-3.5 h-3.5" /> Nume Afișat (Ferma / Cont)
              </Label>
              <Input
                id="orgName"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="Ferma Popescu Agro"
              />
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1.5 lg:col-span-2">
                <Label htmlFor="legalName">Titlu Legal (PFA/SRL)</Label>
                <Input
                  id="legalName"
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  placeholder="SC Popescu Agro SRL"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cui">CUI / CIF</Label>
                <Input
                  id="cui"
                  value={cui}
                  onChange={(e) => setCui(e.target.value)}
                  placeholder="4231..."
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="registrationNumber">Nr. Reg. Com.</Label>
                <Input
                  id="registrationNumber"
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value)}
                  placeholder="J40/..."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="caen">Cod CAEN</Label>
                <Input
                  id="caen"
                  value={caen}
                  onChange={(e) => setCaen(e.target.value)}
                  placeholder="0111"
                />
              </div>
              <div className="space-y-1.5">
                 <Label htmlFor="phone">Telefon Contact</Label>
                 <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="07..."
                  />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="county" className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> Județ
                </Label>
                <Input
                  id="county"
                  value={county}
                  onChange={(e) => setCounty(e.target.value)}
                  placeholder="ex: Olt, Dolj"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="address">Adresă Sediu</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Strada..."
                />
              </div>
            </div>

            <div className="pt-4 border-t">
              <Label className="flex items-center gap-2 mb-3 text-sm font-bold">
                <MapPin className="w-4 h-4 text-primary" /> Poziționare Sediu Fermă
              </Label>
              <BaseLocationPicker 
                lat={baseLat} 
                lng={baseLng} 
                onChange={(lat, lng) => {
                  setBaseLat(lat);
                  setBaseLng(lng);
                }} 
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save Button */}
      <div className="flex items-center gap-3">
        <Button
          className="agral-gradient text-white font-semibold gap-2 min-w-36"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Salvez...</>
          ) : saved ? (
            <><CheckCircle2 className="w-4 h-4" /> Salvat!</>
          ) : (
            "Salvează modificările"
          )}
        </Button>
        {saved && (
          <span className="text-sm text-green-600 font-medium animate-in fade-in">
            ✓ Profilul a fost actualizat cu succes.
          </span>
        )}
      </div>
    </div>
  );
}
