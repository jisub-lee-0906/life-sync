"use client";

import { addMonths, eachDayOfInterval, endOfMonth, format, startOfMonth } from "date-fns";
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
import { usePlannerStore } from "@/store";

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
  const hydratedDateRef = useRef<string | null>(initialPanelData.date);
  const selectedDate = usePlannerStore((state) => state.selectedDate);
  const isCalendarDrawerOpen = usePlannerStore((state) => state.isCalendarDrawerOpen);
  const selectDate = usePlannerStore((state) => state.selectDate);
  const closeCalendarDrawer = usePlannerStore((state) => state.closeCalendarDrawer);
  const monthDate = new Date(`${monthKey}-01T00:00:00`);

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
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Life Calendar</p>
          <h2 className="font-heading text-2xl sm:text-3xl">{format(monthDate, "MMMM yyyy")}</h2>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <Button type="button" variant="outline" onClick={() => changeMonth(-1)}>
            Prev
          </Button>
          <Button type="button" variant="outline" onClick={() => changeMonth(1)}>
            Next
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3 lg:grid-cols-7">
        {days.map((day) => {
          const dayKey = format(day, "yyyy-MM-dd");
          const summary = monthSummary[dayKey];

          return (
            <button
              key={dayKey}
              type="button"
              className="flex min-h-32 flex-col justify-between rounded-2xl border bg-background p-3 text-left transition hover:border-primary/30 hover:bg-muted/30 sm:min-h-36 sm:p-4"
              onClick={() => selectDate(dayKey)}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-semibold sm:text-base">{format(day, "d")}</span>
                {selectedDate === dayKey ? <Badge variant="secondary">Open</Badge> : null}
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-[0.7rem] text-muted-foreground sm:gap-2 sm:text-xs">
                  <ListChecks className="size-3.5" />
                  <span>{summary?.tasksCount ?? 0} tasks</span>
                </div>
                <div className="flex items-center gap-1.5 text-[0.7rem] text-muted-foreground sm:gap-2 sm:text-xs">
                  <CalendarDays className="size-3.5" />
                  <span>{summary?.completedTasksCount ?? 0} done</span>
                </div>
              </div>
              <div className="space-y-1 text-[0.7rem] sm:text-xs">
                <div className="flex items-center gap-1.5 text-foreground sm:gap-2">
                  <CircleDollarSign className="size-3.5" />
                  <span>-{(summary?.totalExpense ?? 0).toLocaleString("ko-KR")}원</span>
                </div>
                <p className="text-muted-foreground">
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
        <SheetContent side="right" className="w-full max-w-full sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{panelData.date}</SheetTitle>
            <SheetDescription>
              Daily finance and task details for the selected day.
            </SheetDescription>
          </SheetHeader>
          <div className="safe-pb space-y-5 px-4 pb-6 sm:space-y-6">
            {isPending ? <p className="text-sm text-muted-foreground">Loading details...</p> : null}

            <section className="space-y-3">
              <h3 className="font-medium">Transactions</h3>
              {panelData.transactions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No transactions for this day.</p>
              ) : (
                panelData.transactions.map((item) => (
                  <div key={item.id} className="rounded-2xl border p-3 sm:p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium">{item.category}</span>
                      <Badge variant={item.type === "EXPENSE" ? "outline" : "secondary"}>
                        {item.type}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{item.note || "No note"}</p>
                    <p className="mt-2 text-sm font-medium">
                      {item.amount.toLocaleString("ko-KR")}원
                    </p>
                  </div>
                ))
              )}
            </section>

            <section className="space-y-3">
              <h3 className="font-medium">Tasks</h3>
              {panelData.tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tasks scheduled for this day.</p>
              ) : (
                panelData.tasks.map((task) => (
                  <div key={task.id} className="rounded-2xl border p-3 sm:p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium">{task.title}</span>
                      <Badge variant="outline">{task.progress}%</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {task.type} · {task.priority} · {task.status}
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
