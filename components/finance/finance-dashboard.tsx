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
      <Card>
        <CardHeader>
          <CardTitle>이번 달 총 지출은 {monthExpenseTotal.toLocaleString("ko-KR")}원이에요</CardTitle>
          <CardDescription>
            빠른 입력, 사용자 격리 CRUD, 무한 스크롤, CSV 이관까지 이 화면에서 처리합니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FinanceClientShell initialPage={initialPage} />
        </CardContent>
      </Card>
    </div>
  );
}
