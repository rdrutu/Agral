import { getOrganizationDetails } from "@/lib/actions/admin";
import { getUserOrganization } from "@/lib/actions/parcels";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Building2, MapPin, Hash, Phone } from "lucide-react";

export async function FarmMetadataCard() {
  const orgId = await getUserOrganization();
  if (!orgId) return null;

  try {
    const defaultOrg = await getOrganizationDetails(orgId as string);
    const org = defaultOrg as any;

    return (
      <Card className="mt-6 border-primary/20 bg-primary/5">
        <CardHeader className="pb-3 border-b border-primary/10">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
            <Building2 className="w-4 h-4" /> Date Fiscale & Contractuale
          </CardTitle>
          <CardDescription>Informații utilizate pentru facturare și contracte.</CardDescription>
        </CardHeader>
        <CardContent className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
              <FileText className="w-3.5 h-3.5" /> Entitate Legală
            </div>
            <div className="font-bold text-foreground">
              {org.legalName || <span className="text-muted-foreground italic text-xs">Necompletat</span>}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
              <Hash className="w-3.5 h-3.5" /> CUI / CIF
            </div>
            <div className="font-mono text-sm font-bold">
              {org.cui || <span className="text-muted-foreground italic text-xs font-sans">Necompletat</span>}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
              <Hash className="w-3.5 h-3.5" /> Reg. Com. & CAEN
            </div>
            <div className="text-sm font-bold">
              {org.registrationNumber || "-"} <span className="text-muted-foreground font-normal">| CAEN: {org.caen || "-"}</span>
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
              <Phone className="w-3.5 h-3.5" /> Telefon Contact
            </div>
            <div className="text-sm font-bold text-primary">
              {org.phone || <span className="text-muted-foreground italic text-xs">Necompletat</span>}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  } catch {
    return null;
  }
}
