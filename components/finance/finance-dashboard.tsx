import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getCurrentMonthExpenseTotal, getTransactions } from "@/actions/finance";
import { FinanceClientShell } from "@/components/finance/finance-client-shell";
import { formatTimeZoneYearMonthValue, SEOUL_TIME_ZONE } from "@/lib/timezone-date";

export async function FinanceDashboard() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const currentMonth = formatTimeZoneYearMonthValue(new Date(), SEOUL_TIME_ZONE);
  const [initialPage, monthExpenseTotal] = await Promise.all([
    getTransactions(),
    getCurrentMonthExpenseTotal(currentMonth),
  ]);

  return (
    <FinanceClientShell
      currentMonth={currentMonth}
      initialMonthExpenseTotal={monthExpenseTotal}
      initialPage={initialPage}
    />
  );
}
