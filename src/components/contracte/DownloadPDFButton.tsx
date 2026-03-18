"use client";

import React, { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { LeasePDFDocument } from './LeasePDFDocument';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface DownloadPDFButtonProps {
  contract: any;
  organization: any;
}

export const DownloadPDFButton = ({ contract, organization }: DownloadPDFButtonProps) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    if (!contract || !organization) {
      toast.error("Date insuficiente pentru generarea contractului.");
      return;
    }

    setIsGenerating(true);
    try {
      // Manual blob generation is more stable in Next.js than PDFDownloadLink
      const doc = <LeasePDFDocument contract={contract} organization={organization} />;
      const blob = await pdf(doc).toBlob();
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Contract_Arenda_${contract.contractNumber}_${contract.landownerName.replace(/\s+/g, '_')}.pdf`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Cleanup URL object
      setTimeout(() => URL.revokeObjectURL(url), 100);
      
      toast.success("Contract descărcat cu succes.");
    } catch (error) {
      console.error("PDF Generation Error:", error);
      toast.error("Eroare la generarea PDF-ului. Te rugăm să încerci din nou.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      className="h-8 w-8 p-0" 
      onClick={handleDownload}
      disabled={isGenerating}
      title="Descarcă Contract PDF"
    >
      {isGenerating ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Download className="w-4 h-4 text-blue-600" />
      )}
    </Button>
  );
};
