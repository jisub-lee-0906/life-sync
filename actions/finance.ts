"use server";

import { and, eq, isNull, lt, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db, hasDatabaseUrl } from "@/lib/db";
import {
  type CsvTransactionRow,
  calculateMonthExpenseTotal,
  formatTransactionDate,
  importCsvRowSchema,
  normalizeQuickAddFormData,
  quickAddTransactionSchema,
  recurringSyncSchema,
  resolveRecurringDate,
  resolveTransactionYearMonth,
  type QuickAddTransactionInput,
} from "@/lib/finance";
import { buildTransactionCursor } from "@/lib/transaction-cursor";
import {
  buildTimeZoneMonthRange,
  formatTimeZoneYearMonthValue,
  SEOUL_TIME_ZONE,
} from "@/lib/timezone-date";
import { transactions } from "@/drizzle/schema";

export type TransactionCursor = {
  date: string;
  id: string;
} | null;

export type FinanceTransactionViewModel = {
  amount: number;
  category: string;
  date: string;
  derivedYearMonth: string | null;
  id: string;
  isOptimistic?: boolean;
  isRecurring: boolean;
  note: string | null;
  recurrenceDate: number | null;
  sourceTransactionId: string | null;
  type: "INCOME" | "EXPENSE";
};

export type TransactionPage = {
  items: FinanceTransactionViewModel[];
  nextCursor: TransactionCursor;
};

async function requireUserId() {
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

function toViewModel(
  transaction: typeof transactions.$inferSelect,
): FinanceTransactionViewModel {
  return {
    amount: transaction.amount,
    category: transaction.category,
    date: formatTransactionDate(transaction.date),
    derivedYearMonth: transaction.derivedYearMonth,
    id: transaction.id,
    isRecurring: transaction.isRecurring,
    note: transaction.note,
    recurrenceDate: transaction.recurrenceDate,
    sourceTransactionId: transaction.sourceTransactionId,
    type: transaction.type,
  };
}

function normalizeQuickAddInput(input: FormData | QuickAddTransactionInput) {
  if (input instanceof FormData) {
    return normalizeQuickAddFormData(input);
  }

  return input;
}

export async function createTransaction(input: FormData | QuickAddTransactionInput) {
  const userId = await requireUserId();
  const parsed = quickAddTransactionSchema.parse(normalizeQuickAddInput(input));

  const [createdTransaction] = await db
    .insert(transactions)
    .values({
      amount: parsed.amount,
      category: parsed.category,
      date: parsed.date,
      derivedYearMonth: null,
      isRecurring: parsed.isRecurring,
      note: parsed.note,
      recurrenceDate: parsed.recurrenceDate,
      sourceTransactionId: null,
      type: parsed.type,
      userId,
    })
    .returning();

  revalidatePath("/finance");

  return toViewModel(createdTransaction);
}

export async function updateTransaction(input: {
  amount: number;
  category: string;
  date: string;
  id: string;
  isRecurring: boolean;
  note: string;
  recurrenceDate?: number | null;
  type: "INCOME" | "EXPENSE";
}) {
  const userId = await requireUserId();
  const parsed = quickAddTransactionSchema.parse(input);

  const [updatedTransaction] = await db
    .update(transactions)
    .set({
      amount: parsed.amount,
      category: parsed.category,
      date: parsed.date,
      isRecurring: parsed.isRecurring,
      note: parsed.note,
      recurrenceDate: parsed.recurrenceDate,
      type: parsed.type,
    })
    .where(and(eq(transactions.id, input.id), eq(transactions.userId, userId)))
    .returning();

  if (!updatedTransaction) {
    throw new Error("수정할 내역을 찾지 못했어요.");
  }

  revalidatePath("/analytics");
  revalidatePath("/calendar");
  revalidatePath("/finance");

  return toViewModel(updatedTransaction);
}

export async function getTransactions(params?: {
  cursor?: TransactionCursor;
  limit?: number;
}): Promise<TransactionPage> {
  const userId = await requireUserId();
  const limit = params?.limit ?? 20;
  const cursor = params?.cursor;
  const cursorDate = cursor ? new Date(cursor.date) : null;

  const rows = await db.query.transactions.findMany({
    limit: limit + 1,
    orderBy: (table, { desc }) => [desc(table.date), desc(table.id)],
    where: (table) =>
      and(
        eq(table.userId, userId),
        cursor && cursorDate
          ? or(
              lt(table.date, cursorDate),
              and(eq(table.date, cursorDate), lt(table.id, cursor.id)),
            )
          : undefined,
      ),
  });

  const hasMore = rows.length > limit;
  const items = rows.slice(0, limit).map(toViewModel);
  const lastRow = rows.slice(0, limit).at(-1);

  return {
    items,
    nextCursor: hasMore && lastRow ? buildTransactionCursor(lastRow.date, lastRow.id) : null,
  };
}

export async function deleteTransaction(id: string) {
  const userId = await requireUserId();

  await db
    .delete(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.userId, userId)));

  revalidatePath("/analytics");
  revalidatePath("/calendar");
  revalidatePath("/finance");

  return { deleted: true, id };
}

export async function importCSV(data: CsvTransactionRow[]) {
  const userId = await requireUserId();

  const normalizedRows = data.map((row, index) => {
    try {
      return importCsvRowSchema.parse(row);
    } catch (error) {
      const message = error instanceof Error ? error.message : "CSV 형식을 확인해 주세요.";
      throw new Error(`${index + 1}번째 줄: ${message}`);
    }
  });

  if (normalizedRows.length === 0) {
    return { insertedCount: 0 };
  }

  await db.insert(transactions).values(
    normalizedRows.map((row) => ({
      amount: row.amount,
      category: row.category,
      date: row.date,
      derivedYearMonth: null,
      isRecurring: row.isRecurring,
      note: row.note,
      recurrenceDate: row.recurrenceDate,
      sourceTransactionId: null,
      type: row.type,
      userId,
    })),
  );

  revalidatePath("/analytics");
  revalidatePath("/calendar");
  revalidatePath("/finance");

  return { insertedCount: normalizedRows.length };
}

export async function exportTransactions() {
  const userId = await requireUserId();

  const rows = await db.query.transactions.findMany({
    orderBy: (table, { desc }) => [desc(table.date), desc(table.id)],
    where: (table, { eq }) => eq(table.userId, userId),
  });

  return rows.map((row) => ({
    amount: row.amount.toString(),
    category: row.category,
    date: formatTransactionDate(row.date),
    isRecurring: row.isRecurring ? "true" : "false",
    note: row.note ?? "",
    recurrenceDate: row.recurrenceDate?.toString() ?? "",
    type: row.type,
  }));
}

export async function getCurrentMonthExpenseTotal(yearMonth?: string) {
  const userId = await requireUserId();
  const resolvedYearMonth =
    yearMonth ?? formatTimeZoneYearMonthValue(new Date(), SEOUL_TIME_ZONE);
  const { endExclusive, start } = buildTimeZoneMonthRange(
    resolvedYearMonth,
    SEOUL_TIME_ZONE,
  );

  const rows = await db.query.transactions.findMany({
    columns: { amount: true, date: true, type: true },
    where: (table, operators) =>
      and(
        operators.eq(table.userId, userId),
        operators.eq(table.type, "EXPENSE"),
        operators.gte(table.date, start),
        operators.lt(table.date, endExclusive),
      ),
  });

  return calculateMonthExpenseTotal(rows, resolvedYearMonth);
}

export async function syncRecurringTransactions(yearMonth: string) {
  const userId = await requireUserId();
  const parsed = recurringSyncSchema.parse({ yearMonth });
  const recurringRoots = await db.query.transactions.findMany({
    where: (table) =>
      and(
        eq(table.userId, userId),
        eq(table.isRecurring, true),
        isNull(table.sourceTransactionId),
      ),
  });

  if (recurringRoots.length === 0) {
    return { insertedCount: 0, yearMonth: parsed.yearMonth };
  }

  const existingDerived = await db.query.transactions.findMany({
    columns: { sourceTransactionId: true },
    where: (table) =>
      and(
        eq(table.userId, userId),
        eq(table.derivedYearMonth, parsed.yearMonth),
      ),
  });

  const existingSourceIds = new Set(
    existingDerived
      .map((transaction) => transaction.sourceTransactionId)
      .filter((value): value is string => Boolean(value)),
  );

  const rowsToInsert = recurringRoots.flatMap((root) => {
    if (root.recurrenceDate == null) {
      return [];
    }

    const rootYearMonth = resolveTransactionYearMonth(root.date);

    if (parsed.yearMonth <= rootYearMonth) {
      return [];
    }

    if (existingSourceIds.has(root.id)) {
      return [];
    }

    return [
      {
        amount: root.amount,
        category: root.category,
        date: resolveRecurringDate(parsed.yearMonth, root.recurrenceDate),
        derivedYearMonth: parsed.yearMonth,
        isRecurring: false,
        note: root.note,
        recurrenceDate: root.recurrenceDate,
        sourceTransactionId: root.id,
        type: root.type,
        userId,
      },
    ];
  });

  if (rowsToInsert.length === 0) {
    return { insertedCount: 0, yearMonth: parsed.yearMonth };
  }

  await db.insert(transactions).values(rowsToInsert);

  revalidatePath("/analytics");
  revalidatePath("/calendar");
  revalidatePath("/finance");

  return { insertedCount: rowsToInsert.length, yearMonth: parsed.yearMonth };
}
