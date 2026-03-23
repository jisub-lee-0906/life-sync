"use client";

import { useEffect, useState, useTransition } from "react";
import { syncRecurringTransactions } from "@/actions/finance";
import { getAnalyticsData } from "@/actions/planner";
import { AnalyticsDashboard } from "@/components/planner/analytics-dashboard";
import type { ExpenseCategoryDatum, TaskCompletionDatum } from "@/lib/planner";
import { useRecurringSyncStore } from "@/store";

type AnalyticsShellProps = {
  initialExpenseByCategory: ExpenseCategoryDatum[];
  initialTaskCompletion: TaskCompletionDatum;
  yearMonth: string;
};

export function AnalyticsShell({
  initialExpenseByCategory,
  initialTaskCompletion,
  yearMonth,
}: AnalyticsShellProps) {
  const [expenseByCategory, setExpenseByCategory] = useState(initialExpenseByCategory);
  const [taskCompletion, setTaskCompletion] = useState(initialTaskCompletion);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isMonthSynced = useRecurringSyncStore((state) => state.syncedMonths.has(yearMonth));
  const markMonthSynced = useRecurringSyncStore((state) => state.markMonthSynced);

  useEffect(() => {
    if (isMonthSynced) {
      return;
    }

    startTransition(async () => {
      try {
        await syncRecurringTransactions(yearMonth);
        markMonthSynced(yearMonth);
        const nextAnalytics = await getAnalyticsData(yearMonth);
        setExpenseByCategory(nextAnalytics.expenseByCategory);
        setTaskCompletion(nextAnalytics.taskCompletion);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "분석 데이터를 불러오지 못했어요.");
      }
    });
  }, [isMonthSynced, markMonthSynced, yearMonth]);

  return (
    <div className="space-y-4">
      {errorMessage ? (
        <p className="text-sm text-destructive">{errorMessage}</p>
      ) : isPending ? (
        <p className="text-sm text-muted-foreground">반복 내역을 동기화하고 있어요.</p>
      ) : null}
      <AnalyticsDashboard expenseByCategory={expenseByCategory} taskCompletion={taskCompletion} />
    </div>
  );
}
