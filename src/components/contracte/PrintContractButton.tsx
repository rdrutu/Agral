"use client";

import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { LeaseContractPrintable } from './LeaseContractPrintable';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

interface PrintContractButtonProps {
  contract: any;
  organization: any;
}

export const PrintContractButton = ({ contract, organization }: PrintContractButtonProps) => {
  const componentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Contract_Arenda_${contract.contractNumber}_${contract.landownerName.replace(/\s+/g, '_')}`,
  });

  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        className="h-8 w-8 p-0" 
        onClick={() => handlePrint()}
        title="Printează / Salvează PDF"
      >
        <Printer className="w-4 h-4 text-blue-600" />
      </Button>

      {/* Hidden printable component */}
      <div style={{ display: 'none' }}>
        <LeaseContractPrintable 
          ref={componentRef} 
          contract={contract} 
          organization={organization} 
        />
      </div>
    </>
  );
};
