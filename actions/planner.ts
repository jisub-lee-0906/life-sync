"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db, hasDatabaseUrl } from "@/lib/db";
import {
  buildDaySummary,
  nextDay,
  parseCalendarDate,
  parseYearMonthRange,
  routineDaySchema,
  taskToOverviewItem,
  type CalendarMonthSummary,
  type ExpenseCategoryDatum,
  type MandalartState,
  type PlannerPanelData,
  type RoutineOverviewItem,
  type TaskCompletionDatum,
  type TaskOverviewItem,
} from "@/lib/planner";
import { routines, tasks } from "@/drizzle/schema";

async function requirePlannerUserId() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    throw new Error("Unauthorized");
  }

  if (!hasDatabaseUrl) {
    throw new Error("Database connection is not configured.");
  }

  return userId;
}

export async function getCalendarData(yearMonth: string): Promise<CalendarMonthSummary> {
  const userId = await requirePlannerUserId();
  const { endExclusive, start } = parseYearMonthRange(yearMonth);

  const [monthTransactions, monthTasks] = await Promise.all([
    db.query.transactions.findMany({
      columns: { amount: true, date: true, type: true },
      orderBy: (table, { desc }) => [desc(table.date)],
      where: (table, operators) =>
        and(
          operators.eq(table.userId, userId),
          operators.gte(table.date, start),
          operators.lt(table.date, endExclusive),
        ),
    }),
    db.query.tasks.findMany({
      columns: { date: true, progress: true },
      where: (table, operators) =>
        and(
          operators.eq(table.userId, userId),
          operators.gte(table.date, start),
          operators.lt(table.date, endExclusive),
        ),
    }),
  ]);

  const summary: CalendarMonthSummary = {};

  for (const transaction of monthTransactions) {
    const dayKey = transaction.date.toLocaleDateString("en-CA");
    const current = summary[dayKey] ?? buildDaySummary(dayKey);

    if (transaction.type === "EXPENSE") current.totalExpense += transaction.amount;
    else current.totalIncome += transaction.amount;

    summary[dayKey] = current;
  }

  for (const task of monthTasks) {
    const dayKey = task.date.toLocaleDateString("en-CA");
    const current = summary[dayKey] ?? buildDaySummary(dayKey);
    current.tasksCount += 1;
    if (task.progress >= 100) current.completedTasksCount += 1;
    summary[dayKey] = current;
  }

  return summary;
}

export async function getPlannerPanelData(date: string): Promise<PlannerPanelData> {
  const userId = await requirePlannerUserId();
  const { date: dayStart, dateString } = parseCalendarDate(date);
  const dayEnd = nextDay(dayStart);

  const [dayTransactions, dayTasks] = await Promise.all([
    db.query.transactions.findMany({
      columns: { amount: true, category: true, id: true, note: true, type: true },
      orderBy: (table, { desc }) => [desc(table.date), desc(table.id)],
      where: (table, operators) =>
        and(
          operators.eq(table.userId, userId),
          operators.gte(table.date, dayStart),
          operators.lt(table.date, dayEnd),
        ),
    }),
    db.query.tasks.findMany({
      orderBy: (table, { asc, desc }) => [desc(table.progress), asc(table.title)],
      where: (table, operators) =>
        and(operators.eq(table.userId, userId), operators.eq(table.date, dayStart)),
    }),
  ]);

  return {
    date: dateString,
    tasks: dayTasks.map(taskToOverviewItem),
    transactions: dayTransactions,
  };
}

export async function getMandalart(): Promise<MandalartState | null> {
  const userId = await requirePlannerUserId();
  const board = await db.query.mandalarts.findFirst({
    orderBy: (table, { asc }) => [asc(table.coreGoal)],
    where: (table, { eq }) => eq(table.userId, userId),
    with: {
      cells: {
        columns: { goal: true, id: true, isCompleted: true, position: true },
        orderBy: (table, { asc }) => [asc(table.position)],
      },
    },
  });

  if (!board) return null;

  return { cells: board.cells, coreGoal: board.coreGoal, id: board.id };
}

export async function getRoutineOverview(): Promise<RoutineOverviewItem[]> {
  const userId = await requirePlannerUserId();
  return db.query.routines.findMany({
    orderBy: (table, { asc }) => [asc(table.title)],
    where: (table, { eq }) => eq(table.userId, userId),
  });
}

export async function getTaskOverview(): Promise<TaskOverviewItem[]> {
  const userId = await requirePlannerUserId();
  const taskRows = await db.query.tasks.findMany({
    orderBy: (table, { asc, desc }) => [asc(table.date), desc(table.progress)],
    where: (table, { eq }) => eq(table.userId, userId),
  });

  return taskRows.map(taskToOverviewItem);
}

export async function getAnalyticsData(yearMonth: string): Promise<{
  expenseByCategory: ExpenseCategoryDatum[];
  taskCompletion: TaskCompletionDatum;
}> {
  const userId = await requirePlannerUserId();
  const { endExclusive, start } = parseYearMonthRange(yearMonth);

  const [monthTransactions, monthTasks] = await Promise.all([
    db.query.transactions.findMany({
      columns: { amount: true, category: true, type: true },
      where: (table, operators) =>
        and(
          operators.eq(table.userId, userId),
          operators.gte(table.date, start),
          operators.lt(table.date, endExclusive),
        ),
    }),
    db.query.tasks.findMany({
      columns: { progress: true },
      where: (table, operators) =>
        and(
          operators.eq(table.userId, userId),
          operators.gte(table.date, start),
          operators.lt(table.date, endExclusive),
        ),
    }),
  ]);

  const expenseMap = new Map<string, number>();

  for (const transaction of monthTransactions) {
    if (transaction.type !== "EXPENSE") continue;
    expenseMap.set(
      transaction.category,
      (expenseMap.get(transaction.category) ?? 0) + transaction.amount,
    );
  }

  const totalCount = monthTasks.length;
  const completedCount = monthTasks.filter((task) => task.progress >= 100).length;

  return {
    expenseByCategory: [...expenseMap.entries()].map(([name, value]) => ({ name, value })),
    taskCompletion: {
      completedCount,
      completionRate: totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100),
      inProgressCount: totalCount - completedCount,
      totalCount,
    },
  };
}

export async function updateTaskProgress(taskId: string, progress: number) {
  const userId = await requirePlannerUserId();
  const clampedProgress = Math.min(100, Math.max(0, Math.round(progress)));
  const nextStatus = clampedProgress >= 100 ? "COMPLETED" : "IN_PROGRESS";

  await db
    .update(tasks)
    .set({ progress: clampedProgress, status: nextStatus })
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)));

  revalidatePath("/todo-routine");
  revalidatePath("/calendar");
  revalidatePath("/analytics");
}

export async function toggleRoutineCheck(routineId: string, day: string, value: boolean) {
  const userId = await requirePlannerUserId();
  const dayKey = routineDaySchema.parse(day);

  await db
    .update(routines)
    .set({ [dayKey]: value })
    .where(and(eq(routines.id, routineId), eq(routines.userId, userId)));

  revalidatePath("/todo-routine");
}
