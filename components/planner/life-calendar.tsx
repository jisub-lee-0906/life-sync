"use client";

import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameDay,
  startOfMonth,
} from "date-fns";
import { CalendarDays, CircleDollarSign, ListChecks } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { syncRecurringTransactions } from "@/actions/finance";
import { getCalendarData, getPlannerPanelData } from "@/actions/planner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  formatTaskPriorityLabel,
  formatTaskStatusLabel,
  formatTaskTypeLabel,
  type CalendarMonthSummary,
  type PlannerPanelData,
} from "@/lib/planner";
import { formatKoreanDateLabel, formatKoreanMonthLabel } from "@/lib/timezone-date";
import { usePlannerStore, useRecurringSyncStore } from "@/store";

type LifeCalendarProps = {
  initialMonth: string;
  initialPanelData: PlannerPanelData;
  initialSummary: CalendarMonthSummary;
};

export function LifeCalendar({
  initialMonth,
  initialPanelData,
  initialSummary,
}: LifeCalendarProps) {
  const [monthKey, setMonthKey] = useState(initialMonth);
  const [monthSummary, setMonthSummary] = useState(initialSummary);
  const [panelData, setPanelData] = useState(initialPanelData);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hydratedDateRef = useRef<string | null>(initialPanelData.date);
  const selectedDate = usePlannerStore((state) => state.selectedDate);
  const isCalendarDrawerOpen = usePlannerStore((state) => state.isCalendarDrawerOpen);
  const selectDate = usePlannerStore((state) => state.selectDate);
  const closeCalendarDrawer = usePlannerStore((state) => state.closeCalendarDrawer);
  const isMonthSynced = useRecurringSyncStore((state) => state.syncedMonths.has(monthKey));
  const markMonthSynced = useRecurringSyncStore((state) => state.markMonthSynced);
  const monthDate = new Date(`${monthKey}-01T00:00:00`);
  const today = new Date();

  useEffect(() => {
    if (isMonthSynced) {
      return;
    }

    startTransition(async () => {
      try {
        await syncRecurringTransactions(monthKey);
        markMonthSynced(monthKey);
        const [nextSummary, nextPanelData] = await Promise.all([
          getCalendarData(monthKey),
          selectedDate ? getPlannerPanelData(selectedDate) : Promise.resolve(panelData),
        ]);
        setMonthSummary(nextSummary);
        setPanelData(nextPanelData);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "반복 내역을 불러오지 못했어요.");
      }
    });
  }, [isMonthSynced, markMonthSynced, monthKey, panelData, selectedDate]);

  useEffect(() => {
    if (!selectedDate) return;
    if (hydratedDateRef.current === selectedDate) {
      hydratedDateRef.current = null;
      return;
    }

    startTransition(async () => {
      try {
        const nextPanelData = await getPlannerPanelData(selectedDate);
        setPanelData(nextPanelData);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "상세 내용을 불러오지 못했어요.");
      }
    });
  }, [selectedDate]);

  function changeMonth(offset: number) {
    const nextMonth = format(addMonths(monthDate, offset), "yyyy-MM");

    startTransition(async () => {
      try {
        if (!useRecurringSyncStore.getState().syncedMonths.has(nextMonth)) {
          await syncRecurringTransactions(nextMonth);
          markMonthSynced(nextMonth);
        }
        const nextSummary = await getCalendarData(nextMonth);
        setMonthKey(nextMonth);
        setMonthSummary(nextSummary);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "달력을 불러오지 못했어요.");
      }
    });
  }

  const days = eachDayOfInterval({
    end: endOfMonth(monthDate),
    start: startOfMonth(monthDate),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-heading text-3xl text-slate-800">{formatKoreanMonthLabel(monthKey)}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            한 달 기록을 가볍게 훑어볼 수 있어요.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <Button type="button" variant="outline" onClick={() => changeMonth(-1)}>
            이전 달
          </Button>
          <Button type="button" variant="outline" onClick={() => changeMonth(1)}>
            다음 달
          </Button>
        </div>
      </div>

      {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {days.map((day) => {
          const dayKey = format(day, "yyyy-MM-dd");
          const summary = monthSummary[dayKey];
          const isToday = isSameDay(day, today);
          const isSelected = selectedDate === dayKey;

          return (
            <button
              key={dayKey}
              type="button"
              className={`flex min-h-36 flex-col justify-between rounded-3xl p-4 text-left shadow-sm transition-all duration-200 sm:min-h-40 ${
                isSelected
                  ? "bg-primary text-primary-foreground"
                  : "bg-white hover:-translate-y-0.5 hover:shadow-md"
              }`}
              onClick={() => selectDate(dayKey)}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-lg font-semibold">{format(day, "d")}</span>
                {isToday ? (
                  <Badge variant={isSelected ? "secondary" : "outline"}>오늘</Badge>
                ) : null}
              </div>

              <div
                className={`space-y-2 text-xs ${
                  isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
                }`}
              >
                <div className="flex items-center gap-2">
                  <ListChecks className="size-3.5" />
                  <span>할 일 {summary?.tasksCount ?? 0}개</span>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarDays className="size-3.5" />
                  <span>완료 {summary?.completedTasksCount ?? 0}개</span>
                </div>
              </div>

              <div
                className={`space-y-1 text-sm ${
                  isSelected ? "text-primary-foreground" : "text-slate-700"
                }`}
              >
                <div className="flex items-center gap-2">
                  <CircleDollarSign className="size-3.5" />
                  <span>-{(summary?.totalExpense ?? 0).toLocaleString("ko-KR")}원</span>
                </div>
                <p className={isSelected ? "text-primary-foreground/80" : "text-muted-foreground"}>
                  +{(summary?.totalIncome ?? 0).toLocaleString("ko-KR")}원
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <Sheet
        open={isCalendarDrawerOpen}
        onOpenChange={(open) => {
          if (!open) closeCalendarDrawer();
        }}
      >
        <SheetContent side="right" className="w-full max-w-full bg-slate-50 sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{formatKoreanDateLabel(panelData.date)}</SheetTitle>
            <SheetDescription>선택한 날짜의 가계부와 할 일을 한 번에 볼 수 있어요.</SheetDescription>
          </SheetHeader>
          <div className="safe-pb space-y-6 px-4 pb-6 sm:px-6">
            {isPending ? <p className="text-sm text-muted-foreground">상세 내용을 불러오고 있어요.</p> : null}

            <section className="space-y-3">
              <h3 className="font-semibold text-slate-800">가계부 내역</h3>
              {panelData.transactions.length === 0 ? (
                <p className="rounded-3xl bg-white p-5 text-sm text-muted-foreground shadow-sm">
                  이날은 아직 내역이 없어요.
                </p>
              ) : (
                panelData.transactions.map((item) => (
                  <div key={item.id} className="rounded-3xl bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium text-slate-800">{item.category}</span>
                      <Badge variant={item.type === "EXPENSE" ? "outline" : "secondary"}>
                        {item.type === "EXPENSE" ? "지출" : "수입"}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{item.note || "메모가 없어요."}</p>
                    <p className="mt-3 text-lg font-semibold text-slate-800">
                      {item.amount.toLocaleString("ko-KR")}원
                    </p>
                  </div>
                ))
              )}
            </section>

            <section className="space-y-3">
              <h3 className="font-semibold text-slate-800">할 일</h3>
              {panelData.tasks.length === 0 ? (
                <p className="rounded-3xl bg-white p-5 text-sm text-muted-foreground shadow-sm">
                  이날 일정이나 할 일이 없어요.
                </p>
              ) : (
                panelData.tasks.map((task) => (
                  <div key={task.id} className="rounded-3xl bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium text-slate-800">{task.title}</span>
                      <Badge variant="outline">{task.progress}%</Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {formatTaskTypeLabel(task.type)} · {formatTaskPriorityLabel(task.priority)} ·{" "}
                      {formatTaskStatusLabel(task.status)}
                    </p>
                  </div>
                ))
              )}
            </section>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
