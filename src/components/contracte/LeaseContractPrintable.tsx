import React from 'react';
import { formatDate } from "@/lib/utils";

interface LeaseContractPrintableProps {
  contract: any;
  organization: any;
}

export const LeaseContractPrintable = React.forwardRef<HTMLDivElement, LeaseContractPrintableProps>(
  ({ contract, organization }, ref) => {
    if (!contract || !organization) return (
      <div ref={ref} className="p-8 text-red-600 font-bold text-center bg-white min-h-screen">
        Eroare: Date insuficiente pentru generarea contractului.
      </div>
    );

    const startDate = contract.startDate ? formatDate(contract.startDate) : "_________";
    const endDate = contract.endDate ? formatDate(contract.endDate) : "_________";
    const today = formatDate(new Date());
    
    const years = (contract.startDate && contract.endDate) 
      ? Math.round((new Date(contract.endDate).getTime() - new Date(contract.startDate).getTime()) / (1000 * 60 * 60 * 24 * 365)) 
      : "5 (cinci)";

    const landownerName = (contract.landownerName || "........................").toUpperCase();
    const orgLegalName = (organization.legalName || organization.name || "________________").toUpperCase();
    const representative = (organization.representative || "-------------------").toUpperCase();
    const parcelArea = contract.parcel?.areaHa || ".............";
    const pricePerHa = contract.pricePerHa || "…………………";
    
    const regCouncil = contract.registrationCouncil || "Daia";
    const regCounty = contract.registrationCounty || "Giurgiu";

    return (
      <div ref={ref} className="print-container bg-white text-black leading-[1.6] max-w-[210mm] mx-auto min-h-[297mm]">
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            @page { 
              size: A4; 
              margin-top: 20mm;
              margin-bottom: 20mm;
              margin-left: 15mm;
              margin-right: 15mm;
            }
            body { 
              margin: 0; 
              -webkit-print-color-adjust: exact; 
            }
            .print-container { 
              padding: 0 !important;
              margin: 0 !important; 
              width: 100% !important; 
              min-height: auto !important;
              box-shadow: none !important;
            }
          }
          .tnr-font { 
            font-family: "Times New Roman", Times, serif; 
            font-size: 12pt; 
            color: black;
          }
          .justified { text-align: justify; text-justify: inter-word; }
          .font-bold { font-weight: bold; }
          .cap-title { 
            font-weight: bold; 
            text-align: center; 
            margin-top: 0.75rem; 
            margin-bottom: 0.25rem; 
            display: block; 
            text-transform: uppercase;
            font-size: 13pt;
          }
          .article-block { 
            margin-bottom: 0.4rem; 
            break-inside: avoid;
            text-align: justify;
          }
          .indent-item { 
            padding-left: 1.5rem; 
            position: relative; 
            margin-bottom: 0.15rem;
            text-align: justify;
          }
          .indent-item span { position: absolute; left: 0; font-weight: bold; }
        `}} />

        <div className="tnr-font">
          {/* Header */}
          <div className="mb-4">
            <p>Inregistrat la Consiliul Local {regCouncil}</p>
            <p>Judetul {regCounty}</p>
            <p>Nr. _______/_________</p>
          </div>

          <div className="text-center mb-6">
            <h1 className="font-bold text-lg">CONTRACT DE ARENDARE</h1>
            <p className="font-bold text-lg">Nr {contract.contractNumber || "____"}/{startDate}</p>
          </div>

          {/* CAP I */}
          <div className="article-block">
            <span className="cap-title">CAP I. Partile contractului</span>
            <p className="justified">
              <span className="font-bold">ART. 1.</span> Contractul de arendare se incheie si se executa in temeiul art. 1836 - 1850 din Codul civil, de catre si intre:
            </p>
            <p className="justified mt-2">
              <span className="font-bold">ART. 2.</span> <strong>{contract.landownerType === "company" ? "Unitatea " : "Domnul "} {landownerName}</strong>, 
              {contract.landownerType === "company" && contract.landownerRepresentative && (
                <> reprezentată prin <strong>{contract.landownerRepresentative.toUpperCase()}</strong>, </>
              )}
              cu domiciliul in {contract.landownerAddress || "………………………………………………………."}, 
              {contract.landownerCity ? ` loc. ${contract.landownerCity}, ` : ""}
              {contract.landownerCounty ? ` jud. ${contract.landownerCounty}, ` : ""}
              {contract.landownerCiSeries ? ` serie CI ${contract.landownerCiSeries}, ` : ""}
              {contract.landownerCiNumber ? ` nr. ${contract.landownerCiNumber}, ` : ""}
              {contract.landownerType === "company" ? "CUI " : "CNP "} {contract.landownerCnp || "____________________"}, 
              titular al dreptului de proprietate, denumit in continuare <strong>ARENDATOR</strong>
            </p>
            <p className="text-center my-1 font-bold italic">si</p>
            <p className="justified">
              <strong>{orgLegalName}</strong>, cu sediul in {organization.city || organization.address || "__________"}, 
              jud {organization.county || "_________"}, inregistrat la O.R.C. cu nr {organization.registrationNumber || "J__/____/____"}, 
              CUI {organization.cui || "RO___________"}, reprezentata prin titular, 
              domnul <strong>{representative}</strong>, in calitate de <strong>ARENDAS</strong>.
            </p>
          </div>

          {/* CAP II, III, IV */}
          <div className="article-block">
            <span className="cap-title">CAP II. Obiectul contractului</span>
            <p><strong>ART.3. (1)</strong> Suprafață teren: <strong>{parcelArea} ha</strong> situată în extravilanul {regCouncil}, {regCounty}, identificată: <strong>{contract.parcel?.name || ""}</strong>, cadastru <strong>{contract.parcel?.cadastralCode || "_________"}</strong>.</p>
            <p><strong>(2)</strong> Categoria de folosință: <strong>teren arabil</strong>.</p>
            <p><strong>(3)</strong> Predare-primire: terenul a fost predat arendașului la data semnării.</p>
            
            <span className="cap-title">CAP III. Scopul arendarii</span>
            <p><strong>ART. 4.</strong> Exploatare agricolă exclusiv.</p>

            <span className="cap-title">CAP IV. Durata contractului</span>
            <p><strong>ART. 5. (1)</strong> Durata: <strong>{years} ani</strong>, de la <strong>{startDate}</strong> până la <strong>{endDate}</strong>.</p>
            <p>(2) Reînnoire de drept conform art. 1848 alin. 1 Cod Civil, dacă nu se notifică refuzul cu un an înainte.</p>
          </div>

          {/* CAP V */}
          <div className="article-block">
            <span className="cap-title">CAP V. Nivelul arendei si plata</span>
            <p><strong>ART.6. (1)</strong> Nivel arendă: <strong>{pricePerHa} lei/Ha</strong>.</p>
            <p><strong>(2)</strong> Plata se face direct sau prin mandat poștal, în termen de 45 de zile de la recoltare, dar nu mai târziu de <strong>31 decembrie</strong>.</p>
            <p><strong>(3)</strong> Contractul constituie titlu executoriu pentru plata arendei.</p>
          </div>

          {/* CAP VI - FULL LIST */}
          <div className="mt-4">
            <span className="cap-title">CAP VI. Drepturile si obligatiile partilor</span>
            <div className="justified">
              <p className="font-bold">ART. 7. Drepturile si obligatiile arendatorului:</p>
              <div className="indent-item"><span>(a)</span> sa predea terenurile la termenul si in conditiile stabilite;</div>
              <div className="indent-item"><span>(b)</span> sa il garanteze pe arendas de evictiune si vicii ascunse;</div>
              <div className="indent-item"><span>(c)</span> sa nu ia masuri care sa-l tulbure pe arendas;</div>
              <div className="indent-item"><span>(d)</span> sa controleze modul de exploatare (insotit de arendas);</div>
              <div className="indent-item"><span>(e)</span> sa plateasca taxele si impozitele pe teren;</div>
              <div className="indent-item"><span>(f)</span> sa notifice intentia de vanzare (drept de preemptiune).</div>

              <p className="font-bold mt-2">ART. 8. Drepturile si obligatiile arendasului:</p>
              <div className="indent-item"><span>(a)</span> sa primeasca terenurile si sa le exploateze ca un bun proprietar;</div>
              <div className="indent-item"><span>(b)</span> sa mentina potentialul de productie;</div>
              <div className="indent-item"><span>(c)</span> sa plateasca arenda la termenul stabilit;</div>
              <div className="indent-item"><span>(d)</span> sa incheie contracte de asigurare a culturilor;</div>
              <div className="indent-item"><span>(e)</span> sa restituie terenurile la incetarea contractului;</div>
              <div className="indent-item"><span>(f)</span> are drept de preemptiune in cazul vanzarii terenurilor.</div>
            </div>
          </div>

          {/* FINAL CAPS */}
          <div className="article-block mt-4">
            <span className="cap-title">CAP VII. Raspunderea</span>
            <p><strong>ART. 9.</strong> Reziliere pentru neexecutare. Penalități de 0,1% pe zi pentru întârziere plată.</p>
            
            <span className="cap-title">CAP VIII. Incetarea contractului</span>
            <p><strong>ART. 10.</strong> La expirare sau prin decesul/falimentul arendașului.</p>
          </div>

          <div className="break-inside-avoid">
            <div className="mt-4 justified text-sm">
              Incheiat astazi <strong>{today}</strong> in 3 exemplare, la Primăria locală {regCouncil}, judeţul {regCounty}.
            </div>
  
            <div className="grid grid-cols-2 gap-12 mt-6 text-center max-w-[90%] mx-auto">
              <div>
                <p className="font-bold uppercase mb-1">ARENDATOR,</p>
                <p className="font-bold text-[11pt] min-h-[3rem]">{landownerName}</p>
                {contract.landownerType === "company" && contract.landownerRepresentative && (
                  <p className="text-[10pt] font-medium mt-[-2rem] mb-[1rem]">Prin: {contract.landownerRepresentative}</p>
                )}
                <div className="mt-8 border-t border-black pt-1">
                  <p className="text-[9pt] italic">(semnătura)</p>
                </div>
              </div>
              <div>
                <p className="font-bold uppercase mb-1">ARENDAŞ,</p>
                <p className="font-bold text-[11pt] min-h-[3rem]">{orgLegalName}</p>
                <div className="mt-8 border-t border-black pt-1">
                  <p className="text-[9pt] italic">L.S. (semnătura)</p>
                  <p className="text-[10pt] mt-1 font-medium">Reprezentat de: {representative}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

LeaseContractPrintable.displayName = "LeaseContractPrintable";
