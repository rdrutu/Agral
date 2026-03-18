import { jsPDF } from "jspdf";
import "jspdf-autotable";

export function generateLeasePDF(contract: any, organization: any) {
  const doc = new jsPDF();
  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 30;

  // Helper for text wrapping
  const addText = (text: string, x: number, yPos: number, options: any = {}) => {
    const splitText = doc.splitTextToSize(text, pageWidth - margin * 2);
    doc.text(splitText, x, yPos, options);
    return yPos + (splitText.length * 7);
  };

  // Title
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("CONTRACT DE ARENDARE", pageWidth / 2, y, { align: "center" });
  y += 10;
  doc.setFontSize(10);
  const formatDateLocal = (date: any) => {
    const d = new Date(date);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  };

  doc.text(`Nr. ${contract.contractNumber} din data ${formatDateLocal(contract.startDate)}`, pageWidth / 2, y, { align: "center" });
  y += 20;

  // Parties
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("I. PĂRȚILE CONTRACTANTE", margin, y);
  y += 10;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  
  // Arendator (Landowner)
  const landownerTitle = contract.landownerType === "company" ? "Unitatea (Persoana Juridică)" : "Subsemnatul/a";
  let landownerText = `${landownerTitle} ${contract.landownerName.toUpperCase()}, `;
  if (contract.landownerType === "company") {
    landownerText += `cu sediul în ${contract.landownerAddress || "---"}, CUI/CIF ${contract.landownerCnp || contract.landownerFiscalCode || "---"}, reprezentată de ${contract.landownerRepresentative || "---"}, în calitate de ARENDATOR.`;
  } else {
    landownerText += `cu domiciliul în ${contract.landownerAddress || "---"}, posesor al BI/CI seria ${contract.landownerCiSeries || "---"} nr. ${contract.landownerCiNumber || "---"}, CNP ${contract.landownerCnp || "---"}, în calitate de ARENDATOR.`;
  }
  y = addText(landownerText, margin, y);
  y += 5;

  // Arendas (Farm)
  let farmText = `Și Societatea ${organization.legalName || organization.name.toUpperCase()}, cu sediul în ${organization.address || "---"}, ${organization.county || ""}, CUI ${organization.cui || "---"}, Nr. Reg. Com. ${organization.registrationNumber || "---"}, reprezentată de ${organization.representative || "Administrator"}, în calitate de ARENDAȘ.`;
  y = addText(farmText, margin, y);
  y += 15;

  // Object
  doc.setFont("helvetica", "bold");
  doc.text("II. OBIECTUL CONTRACTULUI", margin, y);
  y += 10;
  doc.setFont("helvetica", "normal");
  const objectText = `Obiectul prezentului contract este arendarea terenului agricol în suprafață de ${contract.parcel.areaHa} ha, situat în extravilanul/intravilanul localității ${contract.parcel.name}, având codul cadastral ${contract.parcel.cadastralCode || "---"}.`;
  y = addText(objectText, margin, y);
  y += 15;

  // Duration
  doc.setFont("helvetica", "bold");
  doc.text("III. DURATA CONTRACTULUI", margin, y);
  y += 10;
  doc.setFont("helvetica", "normal");
  const durationText = `Prezentul contract este încheiat pe o durată de ${Math.round((new Date(contract.endDate).getTime() - new Date(contract.startDate).getTime()) / (1000 * 60 * 60 * 24 * 365))} ani, începând de la data de ${formatDateLocal(contract.startDate)} până la data de ${formatDateLocal(contract.endDate)}.`;
  y = addText(durationText, margin, y);
  y += 15;

  // Price
  doc.setFont("helvetica", "bold");
  doc.text("IV. NIVELUL ARENDEI, MODALITĂȚI ȘI TERMENE DE PLATĂ", margin, y);
  y += 10;
  doc.setFont("helvetica", "normal");
  const priceText = `Nivelul arendei este de ${contract.pricePerHa} RON/Ha, totalizând o sumă anuală de ${Number(contract.pricePerHa) * Number(contract.parcel.areaHa)} RON. Plata se face în ${contract.paymentType === "cash" ? "bani" : "natură (cereale)"} în termen de 45 de zile de la recoltare, dar nu mai târziu de data de 31 decembrie a fiecărui an.`;
  y = addText(priceText, margin, y);
  y += 30;

  // Signatures
  doc.setFont("helvetica", "bold");
  doc.text("ARENDATOR,", margin, y);
  doc.text("ARENDAȘ,", pageWidth - margin - 50, y);
  y += 10;
  doc.setFont("helvetica", "normal");
  doc.text("_______________________", margin, y);
  doc.text("_______________________", pageWidth - margin - 50, y);

  // Save the PDF
  doc.save(`Contract_Arenda_${contract.contractNumber}_${contract.landownerName.replace(/\s+/g, '_')}.pdf`);
}
