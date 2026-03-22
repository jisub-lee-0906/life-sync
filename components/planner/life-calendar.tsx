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
import type { CalendarMonthSummary, PlannerPanelData } from "@/lib/planner";
import { formatKoreanDateLabel, formatKoreanMonthLabel } from "@/lib/timezone-date";
import { usePlannerStore } from "@/store";

type LifeCalendarProps = {
  initialMonth: string;
  initialPanelData: PlannerPanelData;
  initialSummary: CalendarMonthSummary;
};

const taskStatusLabel = {
  COMPLETED: "완료",
  IN_PROGRESS: "진행 중",
} as const;

const taskTypeLabel = {
  ROUTINE: "루틴",
  TASK: "할 일",
} as const;

const taskPriorityLabel = {
  HIGH: "중요",
  LOW: "가볍게",
  MEDIUM: "보통",
} as const;

export function LifeCalendar({
  initialMonth,
  initialPanelData,
  initialSummary,
}: LifeCalendarProps) {
  const [monthKey, setMonthKey] = useState(initialMonth);
  const [monthSummary, setMonthSummary] = useState(initialSummary);
  const [panelData, setPanelData] = useState(initialPanelData);
  const [isPending, startTransition] = useTransition();
  const hydratedDateRef = useRef<string | null>(initialPanelData.date);
  const selectedDate = usePlannerStore((state) => state.selectedDate);
  const isCalendarDrawerOpen = usePlannerStore((state) => state.isCalendarDrawerOpen);
  const selectDate = usePlannerStore((state) => state.selectDate);
  const closeCalendarDrawer = usePlannerStore((state) => state.closeCalendarDrawer);
  const monthDate = new Date(`${monthKey}-01T00:00:00`);
  const today = new Date();

  useEffect(() => {
    if (!selectedDate) return;
    if (hydratedDateRef.current === selectedDate) {
      hydratedDateRef.current = null;
      return;
    }

    startTransition(async () => {
      const nextPanelData = await getPlannerPanelData(selectedDate);
      setPanelData(nextPanelData);
    });
  }, [selectedDate]);

  function changeMonth(offset: number) {
    const nextMonth = format(addMonths(monthDate, offset), "yyyy-MM");

    startTransition(async () => {
      const nextSummary = await getCalendarData(nextMonth);
      setMonthKey(nextMonth);
      setMonthSummary(nextSummary);
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
          <p className="text-sm font-medium text-primary">캘린더</p>
          <h2 className="mt-2 font-heading text-3xl text-slate-800">
            {formatKoreanMonthLabel(monthKey)}
          </h2>
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
            <SheetDescription>
              선택한 날짜의 가계부와 할 일을 한 번에 볼 수 있어요.
            </SheetDescription>
          </SheetHeader>
          <div className="safe-pb space-y-6 px-4 pb-6 sm:px-6">
            {isPending ? (
              <p className="text-sm text-muted-foreground">상세 내용을 불러오고 있어요.</p>
            ) : null}

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
                    <p className="mt-2 text-sm text-muted-foreground">
                      {item.note || "메모가 없어요."}
                    </p>
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
                      {taskTypeLabel[task.type as keyof typeof taskTypeLabel] ?? task.type} ·{" "}
                      {taskPriorityLabel[task.priority as keyof typeof taskPriorityLabel] ?? task.priority} ·{" "}
                      {taskStatusLabel[task.status as keyof typeof taskStatusLabel] ?? task.status}
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
