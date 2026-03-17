import { Suspense } from "react";
import { getFinancialTransactions, getFinancialSummary } from "@/lib/actions/finance";
import FinanceClient from "@/components/financiar/FinanceClient";
import { Loader2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function FinancePage() {
  const [transactions, summary] = await Promise.all([
    getFinancialTransactions(),
    getFinancialSummary()
  ]);

  return (
    <main className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <Suspense fallback={
        <div className="flex h-[400px] items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }>
        <FinanceClient 
          initialTransactions={transactions} 
          initialSummary={summary} 
        />
      </Suspense>
    </main>
  );
}
