import { Suspense } from "react";
import { getFinancialTransactions, getFinancialSummary } from "@/lib/actions/finance";
import FinanceClient from "@/components/financiar/FinanceClient";
import { FinanceSkeleton } from "@/components/financiar/FinanceSkeleton";

export const dynamic = "force-dynamic";

export default async function FinancePage() {
  return (
    <main className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 mt-1 lg:mt-0">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black tracking-tight">Management Financiar</h1>
        <p className="text-muted-foreground">Monitorizează veniturile, cheltuielile și fluxul de numerar.</p>
      </div>

      <Suspense fallback={<FinanceSkeleton />}>
        <FinanceDynamicContent />
      </Suspense>
    </main>
  );
}

async function FinanceDynamicContent() {
  const [transactions, summary] = await Promise.all([
    getFinancialTransactions(),
    getFinancialSummary()
  ]);

  return (
    <FinanceClient 
      initialTransactions={transactions} 
      initialSummary={summary} 
      hideHeader
    />
  );
}
