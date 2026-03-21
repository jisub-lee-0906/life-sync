import { z } from "zod";
import { formatTransactionDate } from "@/lib/finance";

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

export const yearMonthSchema = z.string().trim().regex(/^\d{4}-\d{2}$/);
export const calendarDateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/);

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
  const [yearString, monthString] = yearMonth.split("-");
  const year = Number(yearString);
  const monthIndex = Number(monthString) - 1;

  return {
    endExclusive: buildLocalDate(year, monthIndex + 1, 1),
    start: buildLocalDate(year, monthIndex, 1),
    yearMonth,
  };
}

export function parseCalendarDate(value: string) {
  const dateString = calendarDateSchema.parse(value);
  const [yearString, monthString, dayString] = dateString.split("-");

  return {
    date: buildLocalDate(
      Number(yearString),
      Number(monthString) - 1,
      Number(dayString),
    ),
    dateString,
  };
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
    date: formatTransactionDate(task.date),
    id: task.id,
    priority: task.priority,
    progress: task.progress,
    status: task.status,
    title: task.title,
    type: task.type,
  };
}
