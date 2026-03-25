"use client";

import { addMonths, format } from "date-fns";
import { useEffect, useState } from "react";
import { syncRecurringTransactions } from "@/actions/finance";
import { getAnalyticsData } from "@/actions/planner";
import { Button } from "@/components/ui/button";
import { AnalyticsDashboard } from "@/components/planner/analytics-dashboard";
import type { ExpenseCategoryDatum, TaskCompletionDatum } from "@/lib/planner";
import { formatKoreanMonthLabel } from "@/lib/timezone-date";
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
  const [selectedMonth, setSelectedMonth] = useState(yearMonth);
  const [expenseByCategory, setExpenseByCategory] = useState(initialExpenseByCategory);
  const [taskCompletion, setTaskCompletion] = useState(initialTaskCompletion);
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isMonthSynced = useRecurringSyncStore((state) => state.syncedMonths.has(selectedMonth));
  const markMonthSynced = useRecurringSyncStore((state) => state.markMonthSynced);
  const canMoveForward = selectedMonth < yearMonth;

  useEffect(() => {
    if (isMonthSynced) {
      return;
    }

    let isActive = true;

    void (async () => {
      setIsPending(true);
      try {
        await syncRecurringTransactions(selectedMonth);
        markMonthSynced(selectedMonth);
        const nextAnalytics = await getAnalyticsData(selectedMonth);
        if (!isActive) {
          return;
        }
        setExpenseByCategory(nextAnalytics.expenseByCategory);
        setTaskCompletion(nextAnalytics.taskCompletion);
      } catch (error) {
        if (isActive) {
          setErrorMessage(error instanceof Error ? error.message : "분석 데이터를 불러오지 못했어요.");
        }
      } finally {
        if (isActive) {
          setIsPending(false);
        }
      }
    })();

    return () => {
      isActive = false;
    };
  }, [isMonthSynced, markMonthSynced, selectedMonth]);

  async function changeMonth(offset: number) {
    const nextMonth = format(addMonths(new Date(`${selectedMonth}-01T00:00:00`), offset), "yyyy-MM");

    if (offset > 0 && nextMonth > yearMonth) {
      return;
    }

    setSelectedMonth(nextMonth);
    setErrorMessage(null);

    try {
      setIsPending(true);
      if (!useRecurringSyncStore.getState().syncedMonths.has(nextMonth)) {
        await syncRecurringTransactions(nextMonth);
        markMonthSynced(nextMonth);
      }
      const nextAnalytics = await getAnalyticsData(nextMonth);
      setExpenseByCategory(nextAnalytics.expenseByCategory);
      setTaskCompletion(nextAnalytics.taskCompletion);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "분석 데이터를 불러오지 못했어요.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.8rem] border border-slate-200/70 bg-white px-5 py-5 shadow-sm">
        <div>
          <p className="text-sm text-slate-400">분석 기준 월</p>
          <h2 className="mt-1 text-[1.8rem] font-semibold tracking-tight text-slate-900">
            {formatKoreanMonthLabel(selectedMonth)}
          </h2>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => void changeMonth(-1)}>
            이전 달
          </Button>
          <Button type="button" variant="outline" disabled={!canMoveForward} onClick={() => void changeMonth(1)}>
            다음 달
          </Button>
        </div>
      </div>
      {errorMessage ? (
        <p className="text-sm text-destructive">{errorMessage}</p>
      ) : isPending ? (
        <p className="text-sm text-muted-foreground">반복 내역을 동기화하고 있어요.</p>
      ) : null}
      <AnalyticsDashboard expenseByCategory={expenseByCategory} taskCompletion={taskCompletion} />
    </div>
  );
}
