import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Helper to romanize text for PDF visibility (removes problematic diacritics if font support is missing)
 */
const romanize = (text: string) => {
  if (!text) return "";
  return text
    .replace(/[ăâ]/g, "a")
    .replace(/[ĂÂ]/g, "A")
    .replace(/[î]/g, "i")
    .replace(/[Î]/g, "I")
    .replace(/[ș]/g, "s")
    .replace(/[Ș]/g, "S")
    .replace(/[ț]/g, "t")
    .replace(/[Ț]/g, "T");
};

const LOGO_URL = "/logo_agral_clar_cropped.png";

/**
 * Generează un raport de Magazie (Input-uri) profesional.
 */
export const generateWarehouseReport = (inventory: any[], orgName: string) => {
  const doc = new jsPDF();
  const now = new Date();
  const dateStr = now.toLocaleDateString('ro-RO');

  // Header Branded
  try {
    doc.addImage(LOGO_URL, 'PNG', 14, 10, 40, 12);
  } catch (e) {
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("AGRAL - Portalul Fermierului", 14, 15);
  }

  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(romanize(`Document Oficial: Fisa de Magazie`), 196, 15, { align: "right" });

  // Titlu Raport
  doc.setFontSize(20);
  doc.setTextColor(30);
  doc.setFont("helvetica", "bold");
  doc.text(romanize("FISA DE MAGAZIE (INPUT-URI)"), 14, 35);

  // Info Firma
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60);
  doc.text(romanize(`Firma: ${orgName}`), 14, 45);
  doc.text(romanize(`Data Generarii: ${dateStr}`), 14, 51);
  doc.text(romanize(`Tip Raport: Inventar Input-uri Agricole`), 14, 57);

  // Linie separatoare
  doc.setDrawColor(230);
  doc.line(14, 62, 196, 62);

  // Tabel
  const tableData = inventory.map(item => [
    romanize(item.name),
    romanize(item.category.toUpperCase()),
    `${Number(item.stockQuantity).toLocaleString('ro-RO')} ${item.unit}`,
    `${Number(item.pricePerUnit).toFixed(2)} RON`,
    `${(Number(item.stockQuantity) * Number(item.pricePerUnit)).toLocaleString('ro-RO')} RON`
  ]);

  const totalValue = inventory.reduce((sum, item) => sum + (Number(item.stockQuantity) * Number(item.pricePerUnit)), 0);

  autoTable(doc, {
    startY: 70,
    head: [[romanize('Denumire Produs'), romanize('Categorie'), romanize('Stoc Disponibil'), romanize('Pret Mediu/Unit'), romanize('Valoare Est.')]],
    body: tableData,
    theme: 'striped',
    headStyles: { 
      fillColor: [20, 83, 45], // Dark agral green
      textColor: 255, 
      fontSize: 10,
      fontStyle: 'bold',
      halign: 'center'
    },
    styles: { 
      fontSize: 9, 
      cellPadding: 4, 
      textColor: 40,
      lineColor: [240, 240, 240],
      lineWidth: 0.1
    },
    columnStyles: {
      0: { cellWidth: 70 },
      2: { halign: 'right', fontStyle: 'bold' },
      3: { halign: 'right' },
      4: { halign: 'right', fontStyle: 'bold', textColor: [20, 83, 45] }
    },
    margin: { left: 14, right: 14 }
  });

  // Total
  const finalY = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30);
  doc.text(romanize(`VALOARE TOTALA MAGAZIE: ${totalValue.toLocaleString('ro-RO')} RON`), 196, finalY, { align: "right" });

  // Footer
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(150);
  doc.text(romanize("Generat prin Agral (agral.ro) - Management Agricol Digital"), 105, 285, { align: "center" });

  doc.save(`Fisa_Magazie_${orgName.replace(/\s+/g, '_')}_${dateStr.replace(/\./g, '-')}.pdf`);
};

/**
 * Generează un raport de Stoc Recoltă profesional.
 */
export const generateHarvestReport = (inventory: any[], orgName: string) => {
  const doc = new jsPDF();
  const now = new Date();
  const dateStr = now.toLocaleDateString('ro-RO');

  // Header Branded
  try {
    doc.addImage(LOGO_URL, 'PNG', 14, 10, 40, 12);
  } catch (e) {
    doc.text("AGRAL", 14, 15);
  }

  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text(romanize("STOC PRODUCTIE RECOLTA"), 14, 35);

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(romanize(`Organizație: ${orgName}`), 14, 45);
  doc.text(romanize(`Data: ${dateStr}`), 14, 51);

  const tableData = inventory.map(item => [
    romanize(item.name),
    romanize(item.cropType || "-"),
    `${Number(item.stockQuantity).toLocaleString('ro-RO')} ${item.unit}`,
    `${Number(item.pricePerUnit).toFixed(2)} RON`,
    `${(Number(item.stockQuantity) * Number(item.pricePerUnit)).toLocaleString('ro-RO')} RON`
  ]);

  autoTable(doc, {
    startY: 60,
    head: [[romanize('Cultura'), romanize('Tip'), romanize('Cantitate'), romanize('Valoare/Unit'), romanize('Valoare Totala')]],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [180, 83, 9], textColor: 255 }, // Amber for harvest
    styles: { fontSize: 10, cellPadding: 5 },
    columnStyles: {
      2: { halign: 'right', fontStyle: 'bold' },
      4: { halign: 'right', fontStyle: 'bold' }
    }
  });

  doc.setFontSize(8);
  doc.text(romanize("Prezentul document serveste ca evidenta interna a stocurilor de cereale si productie vegetala."), 14, 285);

  doc.save(`Stoc_Recolta_${orgName.replace(/\s+/g, '_')}.pdf`);
};

/**
 * Generează Registrul de Evidență a Tratamentelor (format official).
 */
export const generateTreatiesRegister = (operations: any[], orgName: string) => {
  const doc = new jsPDF({ orientation: "landscape" });
  const dateStr = new Date().toLocaleDateString('ro-RO');

  // Antet Profesional & Sobru
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(romanize("REGISTRU DE EVIDENTA A TRATAMENTELOR CU PRODUSE DE PROTECTIE A PLANTELOR"), 150, 20, { align: "center" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(romanize(`Utilizator (Firma): ${orgName}`), 14, 35);
  doc.text(romanize(`Adresa exploatatiei: Sediul Social / Punct Lucru`), 14, 41);
  doc.text(romanize(`Data listarii: ${dateStr}`), 280, 41, { align: "right" });

  const treatmentOps = operations.filter(op => 
    op.type === "tratament" || op.type === "erbicidat" || 
    op.resources?.some((r: any) => r.type === "chimic")
  );

  const tableData: any[][] = [];
  treatmentOps.forEach(op => {
    const products = op.resources?.filter((r: any) => r.type === "chimic") || [];
    const parcelsStr = op.parcels?.map((p: any) => p.parcel.name).join(", ") || "-";
    const area = Number(op.totalAreaHa).toFixed(2);
    const date = new Date(op.date).toLocaleDateString('ro-RO');

    products.forEach((p: any) => {
      tableData.push([
        date,
        romanize(parcelsStr),
        area,
        romanize(op.cropName || op.name.split("-")[1]?.trim() || "-"),
        romanize("Agent daunator/Buruieni"),
        romanize(p.name),
        `${Number(p.quantityPerHa).toFixed(2)} ${p.unit}/ha`,
        `${Number(p.totalConsumed || (p.quantityPerHa * op.totalAreaHa)).toFixed(2)} ${p.unit}`,
        romanize("Responsabil Tehnic")
      ]);
    });
  });

  autoTable(doc, {
    startY: 50,
    head: [[
      romanize('Data'), 
      romanize('Parcele'), 
      romanize('Suprafata (ha)'), 
      romanize('Cultura'), 
      romanize('Cauza (Agent)'), 
      romanize('Produs'), 
      romanize('Doza/Ha'), 
      romanize('Cant. Totala'), 
      romanize('Semnatura')
    ]],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [50, 50, 50], textColor: 255, fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 40 },
      5: { fontStyle: 'bold' }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(7);
  doc.setFont("helvetica", "italic");
  doc.text(romanize("* Conform Ordinului MADR. Acest document trebuie pastrat in arhiva exploatatiei agricole timp de 3 ani."), 14, finalY);

  doc.save(`Registru_Tratamente_${orgName.replace(/\s+/g, '_')}.pdf`);
};

/**
 * Generează un Deviz de Lucrare (Cost Breakdown) profesional pentru o operațiune.
 */
export const generateOperationDeviz = (op: any, orgName: string) => {
  const doc = new jsPDF();
  const dateStr = new Date(op.date).toLocaleDateString('ro-RO');

  // Header Branded
  try {
    doc.addImage(LOGO_URL, 'PNG', 14, 10, 40, 12);
  } catch (e) {
    doc.text("AGRAL", 14, 15);
  }

  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(romanize(`Nr. Deviz: ${op.id.substring(0, 8).toUpperCase()}`), 196, 15, { align: "right" });

  doc.setFontSize(22);
  doc.setTextColor(30);
  doc.setFont("helvetica", "bold");
  doc.text(romanize("DEVIZ LUCRARE AGRICOLA"), 14, 35);

  // Info Lucrare
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60);
  doc.text(romanize(`Firma: ${orgName}`), 14, 45);
  doc.text(romanize(`Tip Lucrare: ${op.type.toUpperCase()}`), 14, 51);
  doc.text(romanize(`Data Executiei: ${dateStr}`), 14, 57);
  doc.text(romanize(`Parcele: ${op.parcels?.map((p: any) => p.parcel.name).join(", ")}`), 14, 63);
  doc.text(romanize(`Suprafata Totala: ${Number(op.totalAreaHa).toFixed(2)} ha`), 14, 69);

  // Tabel Resurse
  const tableData = op.resources?.map((r: any) => [
    romanize(r.name),
    romanize(r.type.toUpperCase()),
    `${Number(r.totalConsumed).toLocaleString('ro-RO')} ${r.unit}`,
    `${Number(r.unitPrice || 0).toFixed(2)} Lei`,
    `${(Number(r.tvaRate || 0) * 100).toFixed(0)}%`,
    `${(Number(r.totalConsumed) * Number(r.unitPrice || 0)).toLocaleString('ro-RO')} Lei`
  ]) || [];

  autoTable(doc, {
    startY: 75,
    head: [[romanize('Resursa / Produs'), romanize('Tip'), romanize('Cantitate'), romanize('Pret Unit (Net)'), romanize('TVA'), romanize('Subtotal (Net)')]],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [31, 41, 55], textColor: 255, fontSize: 9 },
    styles: { fontSize: 8, cellPadding: 4 },
    columnStyles: {
      0: { cellWidth: 50 },
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'center' },
      5: { halign: 'right', fontStyle: 'bold' }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 15;
  const totalNet = op.resources?.reduce((sum: number, r: any) => sum + (Number(r.totalConsumed) * Number(r.unitPrice || 0)), 0) || 0;
  
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30);
  doc.text(romanize(`COST TOTAL LUCRARE (NET): ${totalNet.toLocaleString('ro-RO')} Lei`), 196, finalY, { align: "right" });

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(150);
  doc.text(romanize("Acest deviz reprezinta o evidenta interna a consumurilor. Preturile sunt calculate pe baza loturilor FIFO din magazie."), 14, 285);

  doc.save(`Deviz_${op.type}_${dateStr.replace(/\./g, '-')}.pdf`);
};

