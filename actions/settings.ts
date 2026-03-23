"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  mandalartCells,
  mandalarts,
  routines,
  settings,
  tasks,
  transactions,
} from "@/drizzle/schema";
import { db, hasDatabaseUrl } from "@/lib/db";
import {
  backupPayloadSchema,
  iconPreferencesSchema,
  resolveIconPreferences,
  type FullBackupPayload,
} from "@/lib/settings";

async function requireSettingsUserId() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    throw new Error("로그인이 필요해요.");
  }

  if (!hasDatabaseUrl) {
    throw new Error("데이터베이스 연결을 확인해 주세요.");
  }

  return userId;
}

function parseBackupInput(input: string | FullBackupPayload) {
  let payload: unknown;

  try {
    payload = typeof input === "string" ? JSON.parse(input) : input;
  } catch {
    throw new Error("백업 파일 형식을 다시 확인해 주세요.");
  }

  const parsed = backupPayloadSchema.parse(payload);

  if (parsed.mandalarts.length > 1) {
    throw new Error("만다라트 백업은 한 개의 보드만 복구할 수 있어요.");
  }

  return parsed;
}

export async function updateIcons(input: {
  scheduleIcon: string;
  todoIcon: string;
}) {
  const userId = await requireSettingsUserId();
  const values = resolveIconPreferences(iconPreferencesSchema.parse(input));

  const [savedSettings] = await db
    .insert(settings)
    .values({
      scheduleIcon: values.scheduleIcon,
      todoIcon: values.todoIcon,
      userId,
    })
    .onConflictDoUpdate({
      set: {
        scheduleIcon: values.scheduleIcon,
        todoIcon: values.todoIcon,
      },
      target: settings.userId,
    })
    .returning({
      scheduleIcon: settings.scheduleIcon,
      todoIcon: settings.todoIcon,
      userId: settings.userId,
    });

  revalidatePath("/settings");

  return savedSettings ?? {
    scheduleIcon: values.scheduleIcon,
    todoIcon: values.todoIcon,
    userId,
  };
}

export async function restoreBackup(input: string | FullBackupPayload) {
  const userId = await requireSettingsUserId();
  const backup = parseBackupInput(input);

  await db.transaction(async (tx) => {
    await tx.delete(settings).where(eq(settings.userId, userId));
    await tx.delete(tasks).where(eq(tasks.userId, userId));
    await tx.delete(routines).where(eq(routines.userId, userId));
    await tx.delete(mandalarts).where(eq(mandalarts.userId, userId));
    await tx.delete(transactions).where(eq(transactions.userId, userId));

    const transactionIdMap = new Map<string, string>();
    const mandalartIdMap = new Map<string, string>();

    const rootTransactions = backup.transactions.filter(
      (transaction) => transaction.sourceTransactionId === null,
    );
    const derivedTransactions = backup.transactions.filter(
      (transaction) => transaction.sourceTransactionId !== null,
    );

    for (const transaction of rootTransactions) {
      const [inserted] = await tx
        .insert(transactions)
        .values({
          amount: transaction.amount,
          category: transaction.category,
          date: new Date(transaction.date),
          derivedYearMonth: transaction.derivedYearMonth,
          isRecurring: transaction.isRecurring,
          note: transaction.note,
          recurrenceDate: transaction.recurrenceDate,
          sourceTransactionId: null,
          type: transaction.type,
          userId,
        })
        .returning({ id: transactions.id });

      transactionIdMap.set(transaction.id, inserted.id);
    }

    for (const transaction of derivedTransactions) {
      const mappedSourceTransactionId = transaction.sourceTransactionId
        ? transactionIdMap.get(transaction.sourceTransactionId)
        : null;

      if (!mappedSourceTransactionId) {
        throw new Error("반복 거래 원본을 복구하는 중에 매핑이 끊어졌어요.");
      }

      const [inserted] = await tx
        .insert(transactions)
        .values({
          amount: transaction.amount,
          category: transaction.category,
          date: new Date(transaction.date),
          derivedYearMonth: transaction.derivedYearMonth,
          isRecurring: transaction.isRecurring,
          note: transaction.note,
          recurrenceDate: transaction.recurrenceDate,
          sourceTransactionId: mappedSourceTransactionId,
          type: transaction.type,
          userId,
        })
        .returning({ id: transactions.id });

      transactionIdMap.set(transaction.id, inserted.id);
    }

    if (backup.tasks.length > 0) {
      await tx.insert(tasks).values(
        backup.tasks.map((task) => ({
          date: new Date(task.date),
          priority: task.priority,
          progress: task.progress,
          status: task.status,
          title: task.title,
          type: task.type,
          userId,
        })),
      );
    }

    if (backup.routines.length > 0) {
      await tx.insert(routines).values(
        backup.routines.map((routine) => ({
          friCheck: routine.friCheck,
          monCheck: routine.monCheck,
          satCheck: routine.satCheck,
          sunCheck: routine.sunCheck,
          thuCheck: routine.thuCheck,
          title: routine.title,
          tueCheck: routine.tueCheck,
          userId,
          wedCheck: routine.wedCheck,
        })),
      );
    }

    for (const board of backup.mandalarts) {
      const [insertedBoard] = await tx
        .insert(mandalarts)
        .values({
          coreGoal: board.coreGoal,
          userId,
        })
        .returning({ id: mandalarts.id });

      mandalartIdMap.set(board.id, insertedBoard.id);
      const mappedBoardId = mandalartIdMap.get(board.id);

      if (!mappedBoardId) {
        throw new Error("만다라트 보드 복구 중에 ID 매핑이 끊어졌어요.");
      }

      await tx.insert(mandalartCells).values(
        board.cells.map((cell) => ({
          goal: cell.goal,
          isCompleted: cell.isCompleted,
          mandalartId: mappedBoardId,
          position: cell.position,
        })),
      );
    }

    if (backup.settings) {
      await tx
        .insert(settings)
        .values({
          scheduleIcon: backup.settings.scheduleIcon,
          todoIcon: backup.settings.todoIcon,
          userId,
        })
        .onConflictDoUpdate({
          set: {
            scheduleIcon: backup.settings.scheduleIcon,
            todoIcon: backup.settings.todoIcon,
          },
          target: settings.userId,
        });
    }
  });

  revalidatePath("/analytics");
  revalidatePath("/calendar");
  revalidatePath("/finance");
  revalidatePath("/mandalart");
  revalidatePath("/settings");
  revalidatePath("/todo-routine");

  return { restored: true };
}
