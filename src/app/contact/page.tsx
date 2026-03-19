"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, Mail, Phone, MapPin, Send } from "lucide-react";
import { toast } from "react-hot-toast";

export default function ContactPage() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulare trimitere
    setTimeout(() => {
      setLoading(false);
      toast.success("Mesajul a fost trimis! Te vom contacta în curând.");
      (e.target as HTMLFormElement).reset();
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <Link href="/prezentare">
          <Button variant="ghost" className="mb-8 gap-2">
            <ChevronLeft size={16} /> Înapoi la prezentare
          </Button>
        </Link>
        
        <div className="grid lg:grid-cols-2 gap-16">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-foreground mb-6">Contactează-ne</h1>
            <p className="text-lg text-muted-foreground mb-12 leading-relaxed font-medium">
              Echipa noastră este aici pentru a te ajuta cu orice informație despre platforma Agral. 
              Fie că ești la început sau ai o fermă mare, găsim soluția potrivită.
            </p>

            <div className="space-y-8">
              <div className="flex gap-4 items-start">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
                  <Mail className="w-6 h-6 text-green-700" />
                </div>
                <div>
                  <div className="font-black text-foreground uppercase tracking-wider text-xs mb-1">Email Suport</div>
                  <div className="text-lg font-bold text-muted-foreground">suport@agral.ro</div>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                  <Phone className="w-6 h-6 text-blue-700" />
                </div>
                <div>
                  <div className="font-black text-foreground uppercase tracking-wider text-xs mb-1">Telefon</div>
                  <div className="text-lg font-bold text-muted-foreground">+40 700 000 000</div>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                  <MapPin className="w-6 h-6 text-amber-700" />
                </div>
                <div>
                  <div className="font-black text-foreground uppercase tracking-wider text-xs mb-1">Locație</div>
                  <div className="text-lg font-bold text-muted-foreground">Strada Agriculturii, Nr. 1, București</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card/50 backdrop-blur-md p-8 md:p-12 rounded-[2.5rem] border border-border shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold ml-1">Nume Complet</label>
                  <Input placeholder="Popescu Ion" required className="h-12 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold ml-1">Email</label>
                  <Input type="email" placeholder="ion@exemplu.ro" required className="h-12 rounded-xl" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold ml-1">Subiect</label>
                <Input placeholder="Vreau să aflu mai multe despre..." required className="h-12 rounded-xl" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold ml-1">Mesaj</label>
                <Textarea placeholder="Scrie-ne cum te putem ajuta..." required className="min-h-[150px] rounded-xl pt-4" />
              </div>
              <Button 
                type="submit" 
                disabled={loading}
                className="w-full agral-gradient text-white h-14 text-lg font-black rounded-xl shadow-xl shadow-green-600/20 hover:scale-[1.02] transition-all"
              >
                {loading ? "Se trimite..." : <><Send className="mr-2 w-5 h-5" /> Trimite Mesajul</>}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
