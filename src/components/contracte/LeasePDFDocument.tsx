import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';
import { formatDate } from '@/lib/utils';

// Register Romanian-friendly font (JSDelivr TTF sources are very standard for react-pdf)
Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://cdn.jsdelivr.net/gh/google/fonts@main/apache/roboto/static/Roboto-Regular.ttf' },
    { src: 'https://cdn.jsdelivr.net/gh/google/fonts@main/apache/roboto/static/Roboto-Bold.ttf', fontWeight: 700 },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 60,
    fontFamily: 'Roboto',
    fontSize: 11,
    lineHeight: 1.6,
    color: '#000',
  },
  title: {
    fontSize: 16,
    fontWeight: 700,
    textAlign: 'center',
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 10,
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    marginTop: 20,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    paddingBottom: 2,
  },
  paragraph: {
    marginBottom: 10,
    textAlign: 'justify',
  },
  bold: {
    fontWeight: 700,
  },
  signatureContainer: {
    marginTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureBox: {
    width: '40%',
  },
  signatureLine: {
    marginTop: 30,
    borderTopWidth: 1,
    borderTopColor: '#000',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 60,
    right: 60,
    fontSize: 8,
    textAlign: 'center',
    color: '#999',
    borderTopWidth: 0.5,
    borderTopColor: '#eee',
    paddingTop: 5,
  }
});

interface LeasePDFDocumentProps {
  contract: any;
  organization: any;
}

export const LeasePDFDocument = ({ contract, organization }: LeasePDFDocumentProps) => {
  if (!contract || !organization) return (
    <Document title="Eroare Contract">
       <Page size="A4"><Text>Eroare: Date contract sau organizatie lipsă.</Text></Page>
    </Document>
  );

  const startDate = contract.startDate ? formatDate(contract.startDate) : "---";
  const endDate = contract.endDate ? formatDate(contract.endDate) : "---";
  const years = (contract.startDate && contract.endDate) 
    ? Math.round((new Date(contract.endDate).getTime() - new Date(contract.startDate).getTime()) / (1000 * 60 * 60 * 24 * 365)) 
    : "---";

  const landownerTitle = contract.landownerType === "company" ? "Unitatea (Persoana Juridică)" : "Subsemnatul/a";
  const orgName = organization.legalName || organization.name || "FERMA NECUNOSCUTĂ";
  const parcelName = contract.parcel?.name || "PARCELĂ NECUNOSCUTĂ";
  const parcelArea = contract.parcel?.areaHa || "0";

  return (
    <Document title={`Contract Arenda ${contract.contractNumber || 'Fara Numar'}`}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>CONTRACT DE ARENDARE</Text>
        <Text style={styles.subtitle}>Nr. {contract.contractNumber || "---"} din data {startDate}</Text>

        <View>
          <Text style={styles.sectionTitle}>I. PĂRȚILE CONTRACTANTE</Text>
          
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>{landownerTitle} {(contract.landownerName || "---").toUpperCase()}, </Text>
            {contract.landownerType === "company" ? (
              `cu sediul în ${contract.landownerAddress || "---"}, înregistrată la Registrul Comerțului sub nr. ${contract.landownerFiscalCode || "---"}, CUI/CIF ${contract.landownerCnp || "---"}, reprezentată legal de ${contract.landownerRepresentative || "---"}, în calitate de `
            ) : (
              `cu domiciliul în ${contract.landownerAddress || "---"}, posesor al BI/CI seria ${contract.landownerCiSeries || "---"} nr. ${contract.landownerCiNumber || "---"}, CNP ${contract.landownerCnp || "---"}, în calitate de `
            )}
            <Text style={styles.bold}>ARENDATOR</Text>, pe de o parte,
          </Text>

          <Text style={styles.paragraph}>
            Și <Text style={styles.bold}>Societatea {orgName.toUpperCase()}</Text>, 
            cu sediul în {organization.address || "---"}, {organization.county || ""}, CUI {organization.cui || "---"}, 
            înregistrată sub nr. {organization.registrationNumber || "---"}, reprezentată de {organization.representative || "Administrator"}, 
            în calitate de <Text style={styles.bold}>ARENDAȘ</Text>, pe de altă parte,
          </Text>
          <Text style={styles.paragraph}>
            Au convenit la încheierea prezentului contract de arendare în conformitate cu prevederile Codului Civil și ale legislației în vigoare.
          </Text>
        </View>

        <View>
          <Text style={styles.sectionTitle}>II. OBIECTUL CONTRACTULUI</Text>
          <Text style={styles.paragraph}>
            Obiectul contractului îl constituie arendarea terenului agricol în suprafață totală de 
            <Text style={styles.bold}> {parcelArea} ha</Text>, situat în extravilanul/intravilanul localității 
            <Text style={styles.bold}> {parcelName}</Text>, identificat cu nr. cadastral 
            <Text style={styles.bold}> {contract.parcel?.cadastralCode || "---"}</Text>. 
            Arendatorul declară că terenul este în proprietatea sa și nu face obiectul niciunui litigiu.
          </Text>
        </View>

        <View>
          <Text style={styles.sectionTitle}>III. DURATA CONTRACTULUI</Text>
          <Text style={styles.paragraph}>
            Prezentul contract se încheie pentru o durată de <Text style={styles.bold}>{years} ani</Text>, 
            începând cu data de <Text style={styles.bold}>{startDate}</Text> și până la data de <Text style={styles.bold}>{endDate}</Text>. 
            La expirarea acestui termen, contractul poate fi reînnoit prin acordul scris al ambelor părți.
          </Text>
        </View>

        <View>
          <Text style={styles.sectionTitle}>IV. NIVELUL ARENDEI ȘI TERMENE DE PLATĂ</Text>
          <Text style={styles.paragraph}>
            Nivelul arendei este de <Text style={styles.bold}>{contract.pricePerHa || "0"} RON/ha</Text> pe an, 
            totalizând suma anuală de <Text style={styles.bold}>{Number(contract.pricePerHa || 0) * Number(parcelArea)} RON</Text>. 
            Plata arendei în bani se face direct la sediul arendașului sau prin virament bancar, 
            până la data de 31 decembrie a fiecărui an agricol. În cazul plății în natură (cereale), 
            cantitatea și calitatea produselor se vor stabili prin act adițional.
          </Text>
        </View>

        <View>
          <Text style={styles.sectionTitle}>V. DISPOZIȚII FINALE</Text>
          <Text style={styles.paragraph}>
            Prezentul contract a fost încheiat în 3 (trei) exemplare originale, câte unul pentru fiecare parte 
            și unul pentru înregistrarea la consiliul local, în conformitate cu legea. 
            Orice modificare a prezentului contract se va face numai prin act adițional semnat de părți.
          </Text>
        </View>

        <View style={styles.signatureContainer}>
          <View style={styles.signatureBox}>
            <Text style={styles.bold}>ARENDATOR,</Text>
            <Text style={{ marginTop: 10 }}>{(contract.landownerName || "---")}</Text>
            <View style={styles.signatureLine} />
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.bold}>ARENDAȘ,</Text>
            <Text style={{ marginTop: 10 }}>{orgName}</Text>
            <View style={styles.signatureLine} />
          </View>
        </View>

        <Text style={styles.footer}>Generat automat de Agral - Management Agricol Profesional</Text>
      </Page>
    </Document>
  );
};
