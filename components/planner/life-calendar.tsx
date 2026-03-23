"use client";

import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameDay,
  startOfMonth,
} from "date-fns";
import { ko } from "date-fns/locale";
import { CalendarDays, CircleDollarSign, ListChecks } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { syncRecurringTransactions } from "@/actions/finance";
import { getCalendarData, getPlannerPanelData } from "@/actions/planner";
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
    if (isMonthSynced) return;

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
        setErrorMessage(error instanceof Error ? error.message : "선택한 날짜를 불러오지 못했어요.");
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
    <div className="space-y-5 sm:space-y-6">
      <section className="flex flex-col gap-4 rounded-[2rem] border border-slate-200/70 bg-white px-5 py-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:px-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="font-heading text-[1.9rem] font-semibold tracking-tight text-slate-900">
            {formatKoreanMonthLabel(monthKey)}
          </h2>
        </div>

        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => changeMonth(-1)}>
            이전 달
          </Button>
          <Button type="button" variant="outline" onClick={() => changeMonth(1)}>
            다음 달
          </Button>
        </div>
      </section>

      {errorMessage ? (
        <div className="rounded-[1.6rem] border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {errorMessage}
        </div>
      ) : null}

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {days.map((day) => {
          const dayKey = format(day, "yyyy-MM-dd");
          const summary = monthSummary[dayKey];
          const isToday = isSameDay(day, today);
          const isSelected = selectedDate === dayKey;

          return (
            <button
              key={dayKey}
              type="button"
              className={`flex min-h-32 flex-col justify-between rounded-[1.7rem] border px-4 py-4 text-left transition-all duration-200 sm:min-h-36 ${
                isSelected
                  ? "border-primary bg-primary text-primary-foreground shadow-[0_14px_30px_rgba(0,64,255,0.18)]"
                  : "border-slate-200/70 bg-white shadow-sm hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
              }`}
              onClick={() => selectDate(dayKey)}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs text-inherit/70">{format(day, "EEE", { locale: ko })}</p>
                  <p className="mt-1 text-xl font-semibold">{format(day, "d")}</p>
                </div>
                {isToday ? (
                  <span
                    className={`rounded-full px-2.5 py-1 text-[0.72rem] font-semibold ${
                      isSelected ? "bg-white/16 text-primary-foreground" : "bg-blue-50 text-primary"
                    }`}
                  >
                    오늘
                  </span>
                ) : null}
              </div>

              <div className={`space-y-2 text-xs ${isSelected ? "text-primary-foreground/80" : "text-slate-400"}`}>
                <div className="flex items-center gap-1.5">
                  <ListChecks className="size-3.5" />
                  <span>할 일 {summary?.tasksCount ?? 0}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CalendarDays className="size-3.5" />
                  <span>완료 {summary?.completedTasksCount ?? 0}</span>
                </div>
              </div>

              <div className={isSelected ? "text-primary-foreground" : "text-slate-700"}>
                <div className="flex items-center gap-1.5 text-sm font-semibold">
                  <CircleDollarSign className="size-3.5" />
                  <span>{(summary?.totalExpense ?? 0).toLocaleString("ko-KR")}원</span>
                </div>
                <p className={`mt-1 text-xs ${isSelected ? "text-primary-foreground/72" : "text-slate-400"}`}>
                  수입 {(summary?.totalIncome ?? 0).toLocaleString("ko-KR")}원
                </p>
              </div>
            </button>
          );
        })}
      </section>

      <Sheet
        open={isCalendarDrawerOpen}
        onOpenChange={(open) => {
          if (!open) closeCalendarDrawer();
        }}
      >
        <SheetContent side="right" className="w-full max-w-full bg-slate-50 sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{formatKoreanDateLabel(panelData.date)}</SheetTitle>
            <SheetDescription>거래와 할 일을 한 번에 정리해 볼 수 있어요.</SheetDescription>
          </SheetHeader>

          <div className="safe-pb space-y-6 px-4 pb-6 sm:px-6">
            {isPending ? (
              <p className="text-sm text-slate-400">상세 내용을 불러오고 있어요.</p>
            ) : null}

            <section className="space-y-3">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">가계부</h3>
                  <p className="mt-1 text-sm text-slate-400">그날 남긴 거래를 차분하게 확인해요.</p>
                </div>
              </div>

              {panelData.transactions.length === 0 ? (
                <div className="rounded-[1.8rem] border border-dashed border-slate-200 bg-white px-5 py-8 text-sm text-slate-400">
                  이날은 아직 거래 내역이 없어요.
                </div>
              ) : (
                <div className="space-y-3">
                  {panelData.transactions.map((item) => (
                    <div key={item.id} className="rounded-[1.8rem] border border-slate-200/70 bg-white p-5 shadow-sm">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">{item.category}</p>
                          <p className="mt-1 text-sm text-slate-400">{item.note || "메모 없음"}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-slate-400">
                            {item.type === "EXPENSE" ? "지출" : "수입"}
                          </p>
                          <p className="mt-1 text-lg font-semibold text-slate-900">
                            {item.amount.toLocaleString("ko-KR")}원
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">할 일</h3>
                <p className="mt-1 text-sm text-slate-400">그날 진행한 일도 함께 볼 수 있어요.</p>
              </div>

              {panelData.tasks.length === 0 ? (
                <div className="rounded-[1.8rem] border border-dashed border-slate-200 bg-white px-5 py-8 text-sm text-slate-400">
                  이날은 아직 할 일이 없어요.
                </div>
              ) : (
                <div className="space-y-3">
                  {panelData.tasks.map((task) => (
                    <div key={task.id} className="rounded-[1.8rem] border border-slate-200/70 bg-white p-5 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">{task.title}</p>
                          <p className="mt-1 text-sm leading-6 text-slate-400">
                            {formatTaskTypeLabel(task.type)} · {formatTaskPriorityLabel(task.priority)} ·{" "}
                            {formatTaskStatusLabel(task.status)}
                          </p>
                        </div>
                        <p className="text-lg font-semibold text-slate-900">{task.progress}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
