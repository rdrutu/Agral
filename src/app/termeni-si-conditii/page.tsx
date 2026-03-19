import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Scale } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-end gap-6 mb-12">

          <div className="flex bg-muted p-1 rounded-xl shrink-0">
            <Link href="/termeni-si-conditii">
              <Button 
                variant={true ? "default" : "ghost"} 
                className={`rounded-lg px-6 font-bold ${true ? "bg-white text-foreground shadow-sm hover:bg-white" : "text-muted-foreground"}`}
              >
                Termeni & Condiții
              </Button>
            </Link>
            <Link href="/confidentialitate">
              <Button 
                variant={false ? "default" : "ghost"} 
                className={`rounded-lg px-6 font-bold ${false ? "bg-white text-foreground shadow-sm hover:bg-white" : "text-muted-foreground"}`}
              >
                Confidențialitate
              </Button>
            </Link>
          </div>
        </div>

        <h1 className="text-4xl md:text-6xl font-black text-foreground mb-8 tracking-tight">Termeni și Condiții</h1>
        
        <div className="prose prose-slate max-w-none space-y-8 text-muted-foreground leading-relaxed">
          <p className="text-sm font-bold">Ultima actualizare: 19 Martie 2026</p>
          
          <p>
            Prezentul document constituie un acord legal între dumneavoastră (numit în continuare „Utilizator”) și echipa/entitatea deținătoare a platformei Agral (numită în continuare „Furnizor”). Accesarea, înregistrarea sau utilizarea oricărei funcționalități a platformei Agral reprezintă acceptarea deplină și necondiționată a acestor Termeni și Condiții.
          </p>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">1. Obiectul Contractului și Descrierea Serviciului</h2>
            <p>Agral furnizează o soluție digitală de management agricol care permite utilizatorilor să:</p>
            <ul className="list-disc pl-5 mt-2 space-y-2">
              <li>Cartografieze și gestioneze parcele agricole;</li>
              <li>Monitorizeze activitățile din câmp și rotația culturilor;</li>
              <li>Gestioneze contractele de arendă și documentația aferentă;</li>
              <li>Analizeze date financiare, prognoze meteo și indicatori satelitari (unde este aplicabil).</li>
            </ul>
            <p className="mt-4 italic">Serviciul este oferit „ca atare”, fiind un instrument de suport tehnologic pentru eficientizarea deciziilor în fermă.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">2. Crearea Contului și Securitatea</h2>
            <div className="space-y-4">
              <p><strong>Eligibilitate:</strong> Utilizatorul trebuie să aibă vârsta legală (18 ani) și capacitatea juridică de a încheia contracte în numele său sau al entității pe care o reprezintă.</p>
              <p><strong>Acuratețea datelor:</strong> Vă obligați să furnizați informații reale, complete și actualizate la crearea contului.</p>
              <p><strong>Confidențialitate:</strong> Sunteți singurul responsabil pentru păstrarea secretului parolei și a datelor de acces. Orice activitate desfășurată sub contul dumneavoastră este responsabilitatea dumneavoastră exclusivă. Furnizorul nu va fi răspunzător pentru daune cauzate de utilizarea neautorizată a contului.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">3. Drepturi de Proprietate Intelectuală</h2>
            <div className="space-y-4">
              <p><strong>Proprietatea Agral:</strong> Interfața, designul, codul sursă, logoul, algoritmii proprii și toate materialele protejate de drepturi de autor prezente pe platformă aparțin exclusiv Furnizorului. Este interzisă orice formă de copiere, modificare, inginerie inversă (reverse engineering) sau distribuție neautorizată.</p>
              <p><strong>Proprietatea Utilizatorului:</strong> Toate datele introduse de dumneavoastră (hărți, limite de parcele, contracte scanate, date financiare, jurnale de bord) rămân proprietatea dumneavoastră exclusivă.</p>
              <p><strong>Licență de utilizare a datelor:</strong> Prin utilizarea platformei, acordați Furnizorului o licență limitată de a stoca și procesa aceste date strict în scopul furnizării serviciilor contractate și pentru realizarea de statistici agregate, anonimizate, în scopul îmbunătățirii platformei.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">4. Politica de Utilizare Acceptabilă</h2>
            <p>Utilizatorul se angajează să nu:</p>
            <ul className="list-disc pl-5 mt-2 space-y-2">
              <li>Utilizeze platforma pentru orice activități ilegale sau frauduloase conform legislației române și europene;</li>
              <li>Introducă malware, viruși sau să încerce compromiterea securității serverelor Agral;</li>
              <li>Colecteze date de la alți utilizatori fără consimțământul acestora;</li>
              <li>Încarce conținut care încalcă drepturile de autor ale terților.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">5. Abonamente, Plăți și Facturare</h2>
            <div className="space-y-4">
              <p><strong>Planuri tarifare:</strong> Accesul la anumite funcționalități se face pe bază de abonament (lunar sau anual), conform prețurilor afișate pe site.</p>
              <p><strong>Plăți:</strong> Toate plățile sunt procesate prin parteneri autorizați. Agral nu stochează datele complete ale cardurilor bancare.</p>
              <p><strong>Modificări de preț:</strong> Ne rezervăm dreptul de a modifica tarifele abonamentelor, cu o notificare prealabilă de cel puțin 30 de zile.</p>
              <p><strong>Politica de rambursare:</strong> În conformitate cu legislația privind serviciile digitale, plățile pentru perioadele de abonament consumate nu sunt rambursabile.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">6. Disponibilitatea Serviciului și Mentenanță (SLA)</h2>
            <p><strong>Garanția funcționării:</strong> Depunem toate eforturile pentru a asigura o disponibilitate a platformei de 99%. Totuși, nu putem garanta funcționarea neîntreruptă în caz de defecțiuni ale infrastructurii de internet globale.</p>
            <p><strong>Mentenanță:</strong> Furnizorul poate suspenda temporar accesul la platformă pentru actualizări sau mentenanță programată. Aceste intervenții vor fi anunțate utilizatorilor prin mesaje în aplicație sau email.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">7. Limitarea Răspunderii și Exonerări</h2>
            <div className="space-y-4">
              <p><strong>Decizii Agronomice:</strong> Agral este un instrument de asistare, nu un înlocuitor al expertizei profesionale. Furnizorul nu garantează succesul recoltelor, randamentele agricole sau validitatea juridică a contractelor în fața autorităților (ex: APIA), responsabilitatea finală aparținând utilizatorului.</p>
              <p><strong>Date de la Terți:</strong> Platforma poate integra date de la terți (prognoze meteo OpenWeather, hărți Google/Sentinel). Nu ne asumăm răspunderea pentru erori sau indisponibilități ale acestor servicii externe.</p>
              <p><strong>Daune Indirecte:</strong> În limitele maxime permise de lege, Agral nu va fi răspunzătoare pentru pierderi de profit, întreruperi de activitate sau pierderi de date rezultate din utilizarea platformei.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">8. Protecția Datelor cu Caracter Personal (GDPR)</h2>
            <ul className="list-disc pl-5 mt-2 space-y-2">
              <li>Prelucrarea datelor dumneavoastră se face în conformitate cu Regulamentul (UE) 2016/679.</li>
              <li>Agral colectează datele strict necesare funcționării serviciului.</li>
              <li>Aveți dreptul de acces, rectificare, ștergere (dreptul de a fi uitat) și portabilitate a datelor.</li>
            </ul>
            <p className="mt-4 italic">Detaliile complete se regăsesc în Politica de Confidențialitate, care este parte integrantă din acești termeni.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">9. Exportul Datelor și Rezilierea</h2>
            <p><strong>Portabilitate:</strong> Utilizatorul are dreptul de a-și exporta datele tehnice în format standard (Excel/CSV/PDF) în orice moment pe parcursul existenței unui abonament activ.</p>
            <p><strong>Închiderea contului:</strong> Utilizatorul poate solicita ștergerea contului în orice moment. La închiderea contului, datele vor fi arhivate sau șterse conform politicii de retenție, cu excepția datelor necesare pentru obligații fiscale sau legale.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">10. Dreptul de Retragere (pentru Persoane Fizice)</h2>
            <p>Conform OUG 34/2014, utilizatorii persoane fizice au dreptul de a se retrage din contract în termen de 14 zile de la achiziție, cu condiția ca furnizarea conținutului digital să nu fi început deja cu acordul utilizatorului, moment în care dreptul de retragere este pierdut.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">11. Forță Majoră</h2>
            <p>Niciuna dintre părți nu va fi răspunzătoare pentru neexecutarea obligațiilor contractuale dacă aceasta este cauzată de un eveniment de forță majoră (dezastre naturale, război, pandemii, atacuri cibernetice la nivel de infrastructură națională, defecțiuni majore ale rețelelor electrice sau de internet).</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">12. Modificări ale Termenilor</h2>
            <p>Agral își rezervă dreptul de a modifica acești Termeni și Condiții pentru a reflecta schimbările legislative sau funcționale. Utilizatorii vor fi notificați cu privire la modificările semnificative. Continuarea utilizării platformei după intrarea în vigoare a noilor termeni constituie acceptarea acestora.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">13. Legea Aplicabilă și Jurisdicție</h2>
            <p>Prezentul contract este guvernat de legislația din România. Orice litigiu care decurge din sau în legătură cu utilizarea Agral va fi soluționat pe cale amiabilă. Dacă acest lucru nu este posibil, litigiul va fi trimis spre soluționare instanțelor judecătorești competente de la sediul Furnizorului.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
