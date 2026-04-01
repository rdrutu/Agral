import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let { cui } = body;

    if (!cui) {
      return NextResponse.json({ error: 'CUI lipsă' }, { status: 400 });
    }

    // Eliminăm prefixul "RO" dacă există și spațiile
    cui = String(cui).replace(/\s/g, '').replace(/^RO/i, '');
    const cuiNumber = parseInt(cui, 10);

    if (isNaN(cuiNumber) || cuiNumber < 100) {
      return NextResponse.json({ error: 'CUI invalid' }, { status: 400 });
    }

    // Data interogării = azi
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    const callAnaf = async (dateStr: string) => {
      console.log(`[ANAF Request] CUI: ${cuiNumber}, Date: ${dateStr}`);
      const response = await fetch(
        'https://webservicesp.anaf.ro/api/PlatitorTvaRest/v9/tva',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify([{ cui: cuiNumber, data: dateStr }]),
          signal: AbortSignal.timeout(15000),
        }
      );
      
      if (!response.ok) {
        throw new Error(`ANAF API returned ${response.status}`);
      }
      return await response.json();
    };

    let anafData = await callAnaf(today);
    console.log(`[ANAF Response] Raw: ${JSON.stringify(anafData).substring(0, 500)}...`);

    // Fallback la data de ieri dacă nu e găsită (uneori baza de date nu e gata pt azi)
    if ((!anafData.found || anafData.found.length === 0) && (!anafData.notFound || anafData.notFound.length === 0)) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      console.log(`[ANAF] Retrying with yesterday: ${yesterday}`);
      anafData = await callAnaf(yesterday);
    }

    if (!anafData.found || anafData.found.length === 0) {
      console.warn(`[ANAF] CUI ${cuiNumber} not found. Response:`, JSON.stringify(anafData));
      return NextResponse.json(
        { error: 'CUI negăsit în baza de date ANAF', notFound: true, partial: anafData },
        { status: 404 }
      );
    }

    const company = anafData.found[0];
    const dg = company.date_generale || {};
    
    if (!dg.denumire) {
       console.error("[ANAF] Found but missing general data:", company);
       return NextResponse.json({ error: "Date incomplete primite de la ANAF" }, { status: 500 });
    }
    const sediu = company.adresa_sediu_social || {};
    const domFiscal = company.adresa_domiciliu_fiscal || {};
    const tva = company.inregistrare_scop_Tva || {};
    const inactiv = company.stare_inactiv || {};

    // Construim răspunsul normalizat
    const result = {
      cui: dg.cui,
      denumire: dg.denumire,
      adresa: dg.adresa,
      nrRegCom: dg.nrRegCom,
      telefon: dg.telefon,
      fax: dg.fax,
      codPostal: dg.codPostal,
      stareInregistrare: dg.stare_inregistrare,
      dataInregistrare: dg.data_inregistrare,
      codCAEN: dg.cod_CAEN,
      iban: dg.iban,
      formaJuridica: dg.forma_juridica,
      formaOrganizare: dg.forma_organizare,
      formaProprietate: dg.forma_de_proprietate,
      organFiscal: dg.organFiscalCompetent,
      // Adresa sediu social
      sediu: {
        strada: sediu.sdenumire_Strada,
        numar: sediu.snumar_Strada,
        localitate: sediu.sdenumire_Localitate,
        codLocalitate: sediu.scod_Localitate,
        judet: sediu.sdenumire_Judet,
        codJudet: sediu.scod_Judet,
        codJudetAuto: sediu.scod_JudetAuto,
        tara: sediu.stara,
        detalii: sediu.sdetalii_Adresa,
        codPostal: sediu.scod_Postal,
      },
      // Adresa domiciliu fiscal
      domiciliuFiscal: {
        strada: domFiscal.ddenumire_Strada,
        numar: domFiscal.dnumar_Strada,
        localitate: domFiscal.ddenumire_Localitate,
        judet: domFiscal.ddenumire_Judet,
        codJudet: domFiscal.dcod_Judet,
        codJudetAuto: domFiscal.dcod_JudetAuto,
        detalii: domFiscal.ddetalii_Adresa,
        codPostal: domFiscal.dcod_Postal,
      },
      // Status TVA
      platitorTVA: tva.scpTVA === true,
      // Status inactiv
      statusInactiv: inactiv.statusInactivi === true,
      statusRoEFactura: dg.statusRO_e_Factura === true,
    };

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('[ANAF Lookup] Error:', error.message);
    return NextResponse.json(
      { error: 'Eroare internă', message: error.message },
      { status: 500 }
    );
  }
}
