import { Suspense } from "react";
import { 
  getFinancialTransactions, 
  getFinancialSummary,
  getCropFinancialReport
} from "@/lib/actions/finance";
import FinanceClient from "@/components/financiar/FinanceClient";
import { FinanceSkeleton } from "@/components/financiar/FinanceSkeleton";

export const dynamic = "force-dynamic";

export default async function FinancePage() {
  return (
    <main className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 mt-1 lg:mt-0" suppressHydrationWarning>
      <Suspense fallback={<FinanceSkeleton />}>
        <FinanceDynamicContent />
      </Suspense>
    </main>
  );
}

async function FinanceDynamicContent() {
  const [transactions, summary, cropReport] = await Promise.all([
    getFinancialTransactions(),
    getFinancialSummary(),
    getCropFinancialReport()
  ]);

  return (
    <FinanceClient 
      initialTransactions={transactions} 
      initialSummary={summary} 
      initialCropReport={cropReport}
    />
  );
}
