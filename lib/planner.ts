import { z } from "zod";
import {
  parseValidatedCalendarDate,
  parseValidatedYearMonth,
} from "@/lib/planner-date";
import { formatTimeZoneDateOnlyValue, SEOUL_TIME_ZONE } from "@/lib/timezone-date";

export const taskTypeValues = ["TASK", "ROUTINE"] as const;
export const taskPriorityValues = ["LOW", "MEDIUM", "HIGH"] as const;
export const taskStatusValues = ["IN_PROGRESS", "COMPLETED"] as const;

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

export type MandalartCellState = {
  goal: string;
  id: string;
  isCompleted: boolean;
  position: number;
};

export type MandalartState = {
  cells: MandalartCellState[];
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
  }, "월 형식을 다시 확인해 주세요.");

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
  }, "날짜 형식을 다시 확인해 주세요.");

export const routineDaySchema = z.enum([
  "monCheck",
  "tueCheck",
  "wedCheck",
  "thuCheck",
  "friCheck",
  "satCheck",
  "sunCheck",
]);

export const taskFormSchema = z.object({
  date: calendarDateSchema,
  priority: z.enum(taskPriorityValues),
  title: z.string().trim().min(1, "제목을 입력해 주세요.").max(255),
  type: z.enum(taskTypeValues).default("TASK"),
});

export const routineFormSchema = z.object({
  title: z.string().trim().min(1, "루틴 이름을 입력해 주세요.").max(255),
});

export const mandalartFormSchema = z.object({
  cellGoals: z
    .array(z.string().trim().min(1, "목표를 입력해 주세요.").max(255))
    .length(8),
  coreGoal: z.string().trim().min(1, "핵심 목표를 입력해 주세요.").max(255),
});

export const mandalartCellUpdateSchema = z.object({
  cellId: z.string().uuid(),
  goal: z.string().trim().min(1, "목표를 입력해 주세요.").max(255),
});

export const mandalartToggleSchema = z.object({
  cellId: z.string().uuid(),
  isCompleted: z.boolean(),
});

export const mandalartCoreGoalSchema = z.object({
  coreGoal: z.string().trim().min(1, "핵심 목표를 입력해 주세요.").max(255),
  mandalartId: z.string().uuid(),
});

function buildUtcDate(year: number, monthIndex: number, day: number) {
  const date = new Date(0);
  date.setUTCFullYear(year, monthIndex, day);
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

export function parseYearMonthRange(value: string) {
  const yearMonth = yearMonthSchema.parse(value);
  const { monthIndex, year } = parseValidatedYearMonth(yearMonth);

  return {
    endExclusive: buildUtcDate(year, monthIndex + 1, 1),
    start: buildUtcDate(year, monthIndex, 1),
    yearMonth,
  };
}

export function parseCalendarDate(value: string) {
  const dateString = calendarDateSchema.parse(value);
  return parseValidatedCalendarDate(dateString);
}

export function nextDay(date: Date) {
  return buildUtcDate(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate() + 1,
  );
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

export function formatSeoulDateOnlyValue(date: Date) {
  return formatTimeZoneDateOnlyValue(date, SEOUL_TIME_ZONE);
}

export function formatTaskTypeLabel(type: string) {
  if (type === "ROUTINE") return "루틴";
  if (type === "TASK") return "할 일";
  return type;
}

export function formatTaskPriorityLabel(priority: string) {
  if (priority === "HIGH") return "중요";
  if (priority === "MEDIUM") return "보통";
  if (priority === "LOW") return "가볍게";
  return priority;
}

export function formatTaskStatusLabel(status: string) {
  if (status === "COMPLETED") return "완료";
  if (status === "IN_PROGRESS") return "진행 중";
  return status;
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
