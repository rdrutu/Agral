import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ShieldCheck } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <Link href="/prezentare">
            <Button variant="ghost" className="gap-2 -ml-4">
              <ChevronLeft size={16} /> Înapoi la prezentare
            </Button>
          </Link>

          <div className="flex bg-muted p-1 rounded-xl shrink-0">
            <Link href="/termeni-si-conditii">
              <Button 
                variant={false ? "default" : "ghost"} 
                className={`rounded-lg px-6 font-bold ${false ? "bg-white text-foreground shadow-sm hover:bg-white" : "text-muted-foreground"}`}
              >
                Termeni & Condiții
              </Button>
            </Link>
            <Link href="/confidentialitate">
              <Button 
                variant={true ? "default" : "ghost"} 
                className={`rounded-lg px-6 font-bold ${true ? "bg-white text-foreground shadow-sm hover:bg-white" : "text-muted-foreground"}`}
              >
                Confidențialitate
              </Button>
            </Link>
          </div>
        </div>
        
        <div className="flex items-center gap-4 mb-8">
          <ShieldCheck className="w-12 h-12 text-green-600" />
          <h1 className="text-4xl md:text-6xl font-black text-foreground tracking-tight">Confidențialitate</h1>
        </div>
        
        <div className="prose prose-slate max-w-none space-y-8 text-muted-foreground leading-relaxed">
          <p className="text-sm font-bold">Ultima actualizare: 19 Martie 2026</p>
          
          <p>
            Această Politică explică modul în care Agral colectează, utilizează, stochează și protejează datele dumneavoastră cu caracter personal. Ne angajăm să respectăm confidențialitatea datelor dumneavoastră și să operăm în deplină transparență.
          </p>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">1. Categorii de Date Colectate</h2>
            <p>Colectăm și prelucrăm următoarele tipuri de informații:</p>
            <ul className="list-disc pl-5 mt-2 space-y-3">
              <li><strong>Date de Identificare și Contact:</strong> Nume, prenume, adresă de email, număr de telefon.</li>
              <li><strong>Date de Identificare a Fermei/Entității Juridice:</strong> Denumire societate, Cod Unic de Înregistrare (CUI/CIF), sediu social, număr de înregistrare la Registrul Comerțului.</li>
              <li><strong>Date Geospatiale și Agricole:</strong> Coordonate GPS ale parcelelor, limitele terenurilor (fișiere KML/GeoJSON), tipuri de culturi, istoricul lucrărilor, date de producție și detalii despre contractele de arendă.</li>
              <li><strong>Date Financiare:</strong> Informații de facturare (în cazul abonamentelor plătite). <em>Notă: Datele cardului bancar sunt procesate direct de procesatorul de plăți, Agral nu stochează aceste informații.</em></li>
              <li><strong>Date Tehnice (Jurnale):</strong> Adresa IP, tipul de browser, sistemul de operare și modul în care interacționați cu platforma pentru a asigura securitatea și optimizarea performanței.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">2. Temeiul Juridic și Scopul Prelucrării</h2>
            <p className="mb-4">Conform Articolului 6 din GDPR, prelucrăm datele dumneavoastră pe următoarele baze:</p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-border">
                <thead>
                  <tr className="bg-muted">
                    <th className="border border-border p-3 text-left font-bold">Scopul Prelucrării</th>
                    <th className="border border-border p-3 text-left font-bold">Temeiul Juridic</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-border p-3"><strong>Furnizarea Serviciilor:</strong> Crearea contului, gestionarea parcelelor, generarea contractelor de arendă.</td>
                    <td className="border border-border p-3">Executarea contractului (Art. 6 alin. 1 lit. b)</td>
                  </tr>
                  <tr>
                    <td className="border border-border p-3"><strong>Suport Tehnic:</strong> Rezolvarea problemelor semnalate și comunicarea cu utilizatorul.</td>
                    <td className="border border-border p-3">Executarea contractului</td>
                  </tr>
                  <tr>
                    <td className="border border-border p-3"><strong>Facturare și Contabilitate:</strong> Emiterea facturilor și respectarea legilor fiscale.</td>
                    <td className="border border-border p-3">Obligație legală (Art. 6 alin. 1 lit. c)</td>
                  </tr>
                  <tr>
                    <td className="border border-border p-3"><strong>Securitate:</strong> Prevenirea fraudelor și protejarea infrastructurii Agral.</td>
                    <td className="border border-border p-3">Interes legitim (Art. 6 alin. 1 lit. f)</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div className="mt-6 p-4 bg-amber-50 border-l-4 border-amber-400 text-amber-900 rounded-r-xl">
              <p className="font-black uppercase tracking-wider text-xs mb-1">IMPORTANT</p>
              <p className="text-sm font-bold italic">
                Agral NU vinde, NU închiriază și NU transferă datele dumneavoastră agricole sau personale către companii de marketing, traderi de cereale sau input-uri fără acordul dumneavoastră explicit.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">3. Destinatarii Datelor (Sub-procesatori)</h2>
            <p>Pentru a opera platforma, utilizăm parteneri de încredere (terțe părți) care respectă standardele GDPR:</p>
            <ul className="list-disc pl-5 mt-2 space-y-2">
              <li><strong>Furnizori de Cloud:</strong> Stocarea datelor se face pe serverer securizate din Uniunea Europeană (ex: AWS Frankfurt, Google Cloud Belgia sau Azure Germania).</li>
              <li><strong>Procesatori de Plăți:</strong> Pentru gestionarea abonamentelor.</li>
              <li><strong>Servicii de Email/Notificări:</strong> Pentru trimiterea alertelor meteo sau a confirmărilor de cont.</li>
              <li><strong>Autorități Publice:</strong> Doar în cazul unei obligații legale sau a unei solicitări judecătorești oficiale.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">4. Perioada de Retenție a Datelor</h2>
            <div className="space-y-4">
              <p><strong>Datele Contului:</strong> Sunt păstrate pe durata existenței contului activ.</p>
              <p><strong>Date Fiscale:</strong> Facturile și documentele contabile sunt păstrate timp de 10 ani, conform legislației fiscale din România.</p>
              <p><strong>Datele Utilizatorului după închiderea contului:</strong> La cererea de ștergere a contului, datele agricole sunt anonimizate sau șterse în termen de maxim 30 de zile, cu excepția cazului în care există un interes legitim sau o obligație legală de păstrare.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">5. Securitatea Datelor</h2>
            <p>Implementăm măsuri tehnice și organizatorice de ultimă generație:</p>
            <ul className="list-disc pl-5 mt-2 space-y-2">
              <li><strong>Criptare TLS/SSL:</strong> Toate comunicațiile dintre browserul dumneavoastră și serverele noastre sunt criptate.</li>
              <li><strong>Criptarea Datelor la Repaus:</strong> Datele sensibile sunt stocate criptat în bazele de date.</li>
              <li><strong>Backup-uri Zilnice:</strong> Copii de rezervă redundante pentru a preveni pierderea accidentală a informațiilor în caz de dezastru.</li>
              <li><strong>Controlul Accesului:</strong> Accesul angajaților noștri la datele utilizatorilor este strict restricționat și monitorizat prin jurnale de audit.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">6. Drepturile Dumneavoastră (GDPR)</h2>
            <p>În calitate de persoană vizată, aveți următoarele drepturi:</p>
            <ul className="list-disc pl-5 mt-2 space-y-2">
              <li><strong>Dreptul de Acces:</strong> Puteți solicita o copie a tuturor datelor pe care le deținem despre dumneavoastră.</li>
              <li><strong>Dreptul la Rectificare:</strong> Puteți corecta orice date inexacte direct din setările profilului sau contactându-ne.</li>
              <li><strong>Dreptul la Ștergere ("Dreptul de a fi uitat"):</strong> Puteți solicita ștergerea integrală a contului și a datelor asociate.</li>
              <li><strong>Dreptul la Portabilitate:</strong> Puteți solicita exportul datelor într-un format structurat (CSV, JSON, Excel) pentru a le muta la alt furnizor.</li>
              <li><strong>Dreptul de Opoziție:</strong> Vă puteți opune prelucrării datelor în scopuri de interes legitim.</li>
              <li><strong>Dreptul de a depune o plângere:</strong> La ANSPDCP (Autoritatea Națională de Supraveghere a Prelucrării Datelor cu Caracter Personal).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">7. Politica privind Cookie-urile</h2>
            <p>Platforma Agral utilizează cookie-uri exclusiv pentru funcționalitate:</p>
            <ul className="list-disc pl-5 mt-2 space-y-2">
              <li><strong>Cookie-uri Esențiale:</strong> Necesare pentru autentificare și securitatea sesiunii (fără ele, nu ați putea rămâne logat în aplicație).</li>
              <li><strong>Cookie-uri de Performanță:</strong> Utilizăm instrumente de analiză (anonimizate) pentru a vedea ce funcționalități sunt cele mai folosite și pentru a îmbunătăți viteza platformei.</li>
            </ul>
            <p className="mt-4 font-bold italic">NU utilizăm cookie-uri de tracking publicitar sau de profilare pentru terți.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">8. Actualizări ale Politicii</h2>
            <p>Putem actualiza periodic această Politică. Orice schimbare majoră va fi notificată prin email sau printr-o alertă în interiorul aplicației Agral.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
