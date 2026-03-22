import { format } from "date-fns";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getTransactions } from "@/actions/finance";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FinanceClientShell } from "@/components/finance/finance-client-shell";
import { db } from "@/lib/db";
import { calculateMonthExpenseTotal } from "@/lib/finance";
import { parseYearMonthRange } from "@/lib/planner";

export async function FinanceDashboard() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const currentMonth = format(new Date(), "yyyy-MM");
  const { endExclusive, start } = parseYearMonthRange(currentMonth);
  const [initialPage, monthExpenses] = await Promise.all([
    getTransactions(),
    db.query.transactions.findMany({
      columns: { amount: true, date: true, type: true },
      where: (table, operators) =>
        operators.and(
          operators.eq(table.userId, session.user.id),
          operators.eq(table.type, "EXPENSE"),
          operators.gte(table.date, start),
          operators.lt(table.date, endExclusive),
        ),
    }),
  ]);
  const monthExpenseTotal = calculateMonthExpenseTotal(monthExpenses, currentMonth);

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
