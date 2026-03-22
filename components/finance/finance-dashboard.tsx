import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getCurrentMonthExpenseTotal, getTransactions } from "@/actions/finance";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="space-y-6">
      <Card className="bg-[linear-gradient(180deg,#ffffff,#f8fbff)]">
        <CardHeader>
          <CardTitle>이번 달 지출은 {monthExpenseTotal.toLocaleString("ko-KR")}원이에요</CardTitle>
          <CardDescription>
            내역 추가부터 CSV 가져오기까지, 필요한 작업을 이 화면에서 바로 할 수 있어요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FinanceClientShell initialPage={initialPage} />
        </CardContent>
      </Card>
    </div>
  );
}
