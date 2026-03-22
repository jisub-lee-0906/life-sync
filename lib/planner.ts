import { z } from "zod";
import {
  parseValidatedCalendarDate,
  parseValidatedYearMonth,
} from "@/lib/planner-date";

export type CalendarDaySummary = {
  completedTasksCount: number;
  date: string;
  tasksCount: number;
  totalExpense: number;
  totalIncome: number;
};

export type CalendarMonthSummary = Record<string, CalendarDaySummary>;

export type TaskOverviewItem = {
  date: string;
  id: string;
  priority: string;
  progress: number;
  status: string;
  title: string;
  type: string;
};

export type RoutineOverviewItem = {
  friCheck: boolean;
  id: string;
  monCheck: boolean;
  satCheck: boolean;
  sunCheck: boolean;
  thuCheck: boolean;
  title: string;
  tueCheck: boolean;
  userId: string;
  wedCheck: boolean;
};

export type PlannerPanelData = {
  date: string;
  tasks: TaskOverviewItem[];
  transactions: {
    amount: number;
    category: string;
    id: string;
    note: string | null;
    type: "EXPENSE" | "INCOME";
  }[];
};

export type MandalartState = {
  cells: {
    goal: string;
    id: string;
    isCompleted: boolean;
    position: number;
  }[];
  coreGoal: string;
  id: string;
};

export type ExpenseCategoryDatum = {
  name: string;
  value: number;
};

export type TaskCompletionDatum = {
  completedCount: number;
  completionRate: number;
  inProgressCount: number;
  totalCount: number;
};

export const yearMonthSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}$/)
  .refine((value) => {
    try {
      parseValidatedYearMonth(value);
      return true;
    } catch {
      return false;
    }
  }, "Use a real calendar month in YYYY-MM format.");
export const calendarDateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    try {
      parseValidatedCalendarDate(value);
      return true;
    } catch {
      return false;
    }
  }, "Use a real calendar date in YYYY-MM-DD format.");

export const routineDaySchema = z.enum([
  "monCheck",
  "tueCheck",
  "wedCheck",
  "thuCheck",
  "friCheck",
  "satCheck",
  "sunCheck",
]);

function buildLocalDate(year: number, monthIndex: number, day: number) {
  return new Date(year, monthIndex, day, 0, 0, 0, 0);
}

export function parseYearMonthRange(value: string) {
  const yearMonth = yearMonthSchema.parse(value);
  const { monthIndex, year } = parseValidatedYearMonth(yearMonth);

  return {
    endExclusive: buildLocalDate(year, monthIndex + 1, 1),
    start: buildLocalDate(year, monthIndex, 1),
    yearMonth,
  };
}

export function parseCalendarDate(value: string) {
  const dateString = calendarDateSchema.parse(value);
  return parseValidatedCalendarDate(dateString);
}

export function nextDay(date: Date) {
  return buildLocalDate(date.getFullYear(), date.getMonth(), date.getDate() + 1);
}

export function buildDaySummary(date: string): CalendarDaySummary {
  return {
    completedTasksCount: 0,
    date,
    tasksCount: 0,
    totalExpense: 0,
    totalIncome: 0,
  };
}

export function formatDateOnlyValue(date: Date) {
  const year = `${date.getUTCFullYear()}`.padStart(4, "0");
  const month = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  const day = `${date.getUTCDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

const seoulDateFormatter = new Intl.DateTimeFormat("en-CA", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "Asia/Seoul",
  year: "numeric",
});

export function formatSeoulDateOnlyValue(date: Date) {
  return seoulDateFormatter.format(date);
}

export function taskToOverviewItem(task: {
  date: Date;
  id: string;
  priority: string;
  progress: number;
  status: string;
  title: string;
  type: string;
}): TaskOverviewItem {
  return {
    date: formatDateOnlyValue(task.date),
    id: task.id,
    priority: task.priority,
    progress: task.progress,
    status: task.status,
    title: task.title,
    type: task.type,
  };
}
