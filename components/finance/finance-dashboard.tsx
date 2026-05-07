import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  getFinanceSummary,
  getTransactionCategories,
  getTransactions,
} from "@/actions/finance";
import { getAnalyticsData } from "@/actions/planner";
import { FinanceClientShell } from "@/components/finance/finance-client-shell";
import { formatTimeZoneYearMonthValue, SEOUL_TIME_ZONE } from "@/lib/timezone-date";

export async function FinanceDashboard() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const currentMonth = formatTimeZoneYearMonthValue(new Date(), SEOUL_TIME_ZONE);
  const [initialAnalytics, initialCategories, initialPage, initialSummary] = await Promise.all([
    getAnalyticsData(currentMonth),
    getTransactionCategories(),
    getTransactions(),
    getFinanceSummary(currentMonth),
  ]);

  return (
    <FinanceClientShell
      initialExpenseByCategory={initialAnalytics.expenseByCategory}
      currentMonth={currentMonth}
      initialCategories={initialCategories}
      initialPage={initialPage}
      initialSummary={initialSummary}
    />
  );
}
