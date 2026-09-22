"use server";

import { and, asc, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireApprovedUser } from "@/lib/server-auth";
import {
  buildDaySummary,
  formatDateOnlyValue,
  formatSeoulDateOnlyValue,
  mandalartCellUpdateSchema,
  mandalartCoreGoalSchema,
  mandalartFormSchema,
  mandalartToggleSchema,
  parseCalendarDate,
  parseYearMonthRange,
  routineDaySchema,
  routineFormSchema,
  taskFormSchema,
  taskToOverviewItem,
  type CalendarMonthSummary,
  type ExpenseCategoryDatum,
  type MandalartState,
  type PlannerPanelData,
  type RoutineOverviewItem,
  type TaskCompletionDatum,
  type TaskOverviewItem,
} from "@/lib/planner";
import {
  buildTimeZoneDayRange,
  buildTimeZoneMonthRange,
  SEOUL_TIME_ZONE,
} from "@/lib/timezone-date";
import { mandalartCells, mandalarts, routines, tasks } from "@/drizzle/schema";

async function requirePlannerUserId() {
  return (await requireApprovedUser()).id;
}

export async function getCalendarData(yearMonth: string): Promise<CalendarMonthSummary> {
  const userId = await requirePlannerUserId();
  const { endExclusive, start } = buildTimeZoneMonthRange(yearMonth, SEOUL_TIME_ZONE);
  const taskMonthRange = parseYearMonthRange(yearMonth);

  const [monthTransactions, monthTasks] = await Promise.all([
    db.query.transactions.findMany({
      columns: { amount: true, date: true, type: true },
      orderBy: (table) => [desc(table.date)],
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
          operators.gte(table.date, taskMonthRange.start),
          operators.lt(table.date, taskMonthRange.endExclusive),
        ),
    }),
  ]);

  const summary: CalendarMonthSummary = {};

  for (const transaction of monthTransactions) {
    const dayKey = formatSeoulDateOnlyValue(transaction.date);
    const current = summary[dayKey] ?? buildDaySummary(dayKey);

    if (transaction.type === "EXPENSE") current.totalExpense += transaction.amount;
    else current.totalIncome += transaction.amount;

    summary[dayKey] = current;
  }

  for (const task of monthTasks) {
    const dayKey = formatDateOnlyValue(task.date);
    const current = summary[dayKey] ?? buildDaySummary(dayKey);
    current.tasksCount += 1;
    if (task.progress >= 100) current.completedTasksCount += 1;
    summary[dayKey] = current;
  }

  return summary;
}

export async function getPlannerPanelData(date: string): Promise<PlannerPanelData> {
  const userId = await requirePlannerUserId();
  const { date: taskDate, dateString } = parseCalendarDate(date);
  const { endExclusive: transactionDayEnd, start: transactionDayStart } =
    buildTimeZoneDayRange(dateString, SEOUL_TIME_ZONE);

  const [dayTransactions, dayTasks] = await Promise.all([
    db.query.transactions.findMany({
      columns: { amount: true, category: true, id: true, note: true, type: true },
      orderBy: (table) => [desc(table.date), desc(table.id)],
      where: (table, operators) =>
        and(
          operators.eq(table.userId, userId),
          operators.gte(table.date, transactionDayStart),
          operators.lt(table.date, transactionDayEnd),
        ),
    }),
    db.query.tasks.findMany({
      orderBy: (table) => [desc(table.progress), asc(table.title)],
      where: (table, operators) =>
        and(operators.eq(table.userId, userId), operators.eq(table.date, taskDate)),
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
    orderBy: (table, { asc, desc }) => [asc(table.date), desc(table.progress), asc(table.title)],
    where: (table, { eq }) => eq(table.userId, userId),
  });

  return taskRows.map(taskToOverviewItem);
}

export async function getAnalyticsData(yearMonth: string): Promise<{
  expenseByCategory: ExpenseCategoryDatum[];
  taskCompletion: TaskCompletionDatum;
}> {
  const userId = await requirePlannerUserId();
  const transactionMonthRange = buildTimeZoneMonthRange(yearMonth, SEOUL_TIME_ZONE);
  const taskMonthRange = parseYearMonthRange(yearMonth);

  const [monthTransactions, monthTasks] = await Promise.all([
    db.query.transactions.findMany({
      columns: { amount: true, category: true, type: true },
      where: (table, operators) =>
        and(
          operators.eq(table.userId, userId),
          operators.gte(table.date, transactionMonthRange.start),
          operators.lt(table.date, transactionMonthRange.endExclusive),
        ),
    }),
    db.query.tasks.findMany({
      columns: { progress: true },
      where: (table, operators) =>
        and(
          operators.eq(table.userId, userId),
          operators.gte(table.date, taskMonthRange.start),
          operators.lt(table.date, taskMonthRange.endExclusive),
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

export async function createTask(input: {
  date: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  title: string;
  type: "TASK" | "ROUTINE";
}) {
  const userId = await requirePlannerUserId();
  const parsed = taskFormSchema.parse(input);
  const { date } = parseCalendarDate(parsed.date);

  const [createdTask] = await db
    .insert(tasks)
    .values({
      date,
      priority: parsed.priority,
      progress: 0,
      status: "IN_PROGRESS",
      title: parsed.title,
      type: parsed.type,
      userId,
    })
    .returning();

  revalidatePath("/analytics");
  revalidatePath("/calendar");
  revalidatePath("/todo-routine");

  return taskToOverviewItem(createdTask);
}

export async function updateTask(taskId: string, input: {
  date: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  title: string;
  type: "TASK" | "ROUTINE";
}) {
  const userId = await requirePlannerUserId();
  const parsed = taskFormSchema.parse(input);
  const { date } = parseCalendarDate(parsed.date);

  const [updatedTask] = await db
    .update(tasks)
    .set({
      date,
      priority: parsed.priority,
      title: parsed.title,
      type: parsed.type,
    })
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
    .returning();

  revalidatePath("/analytics");
  revalidatePath("/calendar");
  revalidatePath("/todo-routine");

  if (!updatedTask) {
    throw new Error("수정할 할 일을 찾지 못했어요.");
  }

  return taskToOverviewItem(updatedTask);
}

export async function deleteTask(taskId: string) {
  const userId = await requirePlannerUserId();

  await db.delete(tasks).where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)));

  revalidatePath("/analytics");
  revalidatePath("/calendar");
  revalidatePath("/todo-routine");

  return { deleted: true, id: taskId };
}

export async function updateTaskProgress(taskId: string, progress: number) {
  const userId = await requirePlannerUserId();
  const clampedProgress = Math.min(100, Math.max(0, Math.round(progress)));
  const nextStatus = clampedProgress >= 100 ? "COMPLETED" : "IN_PROGRESS";

  const [updatedTask] = await db
    .update(tasks)
    .set({ progress: clampedProgress, status: nextStatus })
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
    .returning();

  revalidatePath("/analytics");
  revalidatePath("/calendar");
  revalidatePath("/todo-routine");

  if (!updatedTask) {
    throw new Error("진행률을 저장하지 못했어요.");
  }

  return taskToOverviewItem(updatedTask);
}

export async function createRoutine(input: { title: string }) {
  const userId = await requirePlannerUserId();
  const parsed = routineFormSchema.parse(input);

  const [createdRoutine] = await db
    .insert(routines)
    .values({
      title: parsed.title,
      userId,
    })
    .returning();

  revalidatePath("/todo-routine");

  return createdRoutine;
}

export async function updateRoutine(routineId: string, input: { title: string }) {
  const userId = await requirePlannerUserId();
  const parsed = routineFormSchema.parse(input);

  const [updatedRoutine] = await db
    .update(routines)
    .set({ title: parsed.title })
    .where(and(eq(routines.id, routineId), eq(routines.userId, userId)))
    .returning();

  revalidatePath("/todo-routine");

  if (!updatedRoutine) {
    throw new Error("수정할 루틴을 찾지 못했어요.");
  }

  return updatedRoutine;
}

export async function deleteRoutine(routineId: string) {
  const userId = await requirePlannerUserId();

  await db
    .delete(routines)
    .where(and(eq(routines.id, routineId), eq(routines.userId, userId)));

  revalidatePath("/todo-routine");

  return { deleted: true, id: routineId };
}

export async function toggleRoutineCheck(routineId: string, day: string, value: boolean) {
  const userId = await requirePlannerUserId();
  const dayKey = routineDaySchema.parse(day);

  const [updatedRoutine] = await db
    .update(routines)
    .set({ [dayKey]: value })
    .where(and(eq(routines.id, routineId), eq(routines.userId, userId)))
    .returning();

  revalidatePath("/todo-routine");

  if (!updatedRoutine) {
    throw new Error("루틴 상태를 바꾸지 못했어요.");
  }

  return updatedRoutine;
}

export async function createMandalart(input: { coreGoal: string; cellGoals: string[] }) {
  const userId = await requirePlannerUserId();
  const parsed = mandalartFormSchema.parse(input);

  const existingBoard = await db.query.mandalarts.findFirst({
    columns: { id: true },
    where: (table, { eq }) => eq(table.userId, userId),
  });

  if (existingBoard) {
    throw new Error("만다라트는 한 개만 만들 수 있어요.");
  }

  await db.transaction(async (tx) => {
    const [createdBoard] = await tx
      .insert(mandalarts)
      .values({
        coreGoal: parsed.coreGoal,
        userId,
      })
      .returning();

    await tx.insert(mandalartCells).values(
      parsed.cellGoals.map((goal, index) => ({
        goal,
        mandalartId: createdBoard.id,
        position: index + 1,
      })),
    );

  });

  revalidatePath("/mandalart");

  return getMandalart();
}

export async function updateMandalartCoreGoal(input: {
  coreGoal: string;
  mandalartId: string;
}) {
  const userId = await requirePlannerUserId();
  const parsed = mandalartCoreGoalSchema.parse(input);

  const [updatedBoard] = await db
    .update(mandalarts)
    .set({ coreGoal: parsed.coreGoal })
    .where(and(eq(mandalarts.id, parsed.mandalartId), eq(mandalarts.userId, userId)))
    .returning();

  revalidatePath("/mandalart");

  if (!updatedBoard) {
    throw new Error("만다라트를 수정하지 못했어요.");
  }

  return getMandalart();
}

export async function updateMandalartCell(input: { cellId: string; goal: string }) {
  const userId = await requirePlannerUserId();
  const parsed = mandalartCellUpdateSchema.parse(input);

  const ownedCell = await db.query.mandalartCells.findFirst({
    columns: { id: true, mandalartId: true },
    where: (table, { eq }) => eq(table.id, parsed.cellId),
  });

  const ownedBoard = ownedCell
    ? await db.query.mandalarts.findFirst({
        columns: { userId: true },
        where: (table, { eq }) => eq(table.id, ownedCell.mandalartId),
      })
    : null;

  if (!ownedCell || ownedBoard?.userId !== userId) {
    throw new Error("수정할 목표를 찾지 못했어요.");
  }

  await db.update(mandalartCells).set({ goal: parsed.goal }).where(eq(mandalartCells.id, parsed.cellId));

  revalidatePath("/mandalart");

  return getMandalart();
}

export async function toggleMandalartCellCompleted(input: {
  cellId: string;
  isCompleted: boolean;
}) {
  const userId = await requirePlannerUserId();
  const parsed = mandalartToggleSchema.parse(input);
  const ownedCell = await db.query.mandalartCells.findFirst({
    columns: { id: true, mandalartId: true },
    where: (table, { eq }) => eq(table.id, parsed.cellId),
  });

  const ownedBoard = ownedCell
    ? await db.query.mandalarts.findFirst({
        columns: { userId: true },
        where: (table, { eq }) => eq(table.id, ownedCell.mandalartId),
      })
    : null;

  if (!ownedCell || ownedBoard?.userId !== userId) {
    throw new Error("상태를 바꿀 목표를 찾지 못했어요.");
  }

  await db
    .update(mandalartCells)
    .set({ isCompleted: parsed.isCompleted })
    .where(eq(mandalartCells.id, parsed.cellId));

  revalidatePath("/mandalart");

  return getMandalart();
}

export async function deleteMandalart(mandalartId: string) {
  const userId = await requirePlannerUserId();

  await db
    .delete(mandalarts)
    .where(and(eq(mandalarts.id, mandalartId), eq(mandalarts.userId, userId)));

  revalidatePath("/mandalart");

  return { deleted: true, id: mandalartId };
}
