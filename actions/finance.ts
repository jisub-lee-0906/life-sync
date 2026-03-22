"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db, hasDatabaseUrl } from "@/lib/db";
import {
  CsvTransactionRow,
  formatTransactionDate,
  importCsvRowSchema,
  normalizeQuickAddFormData,
  quickAddTransactionSchema,
  type QuickAddTransactionInput,
} from "@/lib/finance";
import { buildTransactionCursor } from "@/lib/transaction-cursor";
import { transactions } from "@/drizzle/schema";

export type TransactionCursor = {
  date: string;
  id: string;
} | null;

export type FinanceTransactionViewModel = {
  amount: number;
  category: string;
  date: string;
  id: string;
  isOptimistic?: boolean;
  isRecurring: boolean;
  note: string | null;
  recurrenceDate: number | null;
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
    throw new Error("Unauthorized");
  }

  if (!hasDatabaseUrl) {
    throw new Error("Database connection is not configured.");
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
    id: transaction.id,
    isRecurring: transaction.isRecurring,
    note: transaction.note,
    recurrenceDate: transaction.recurrenceDate,
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
      isRecurring: parsed.isRecurring,
      note: parsed.note,
      recurrenceDate: parsed.recurrenceDate,
      type: parsed.type,
      userId,
    })
    .returning();

  revalidatePath("/finance");

  return toViewModel(createdTransaction);
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
    where: (table, { and, eq, lt, or }) =>
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

  revalidatePath("/finance");
}

export async function importCSV(data: CsvTransactionRow[]) {
  const userId = await requireUserId();

  const normalizedRows = data.map((row, index) => {
    try {
      return importCsvRowSchema.parse(row);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Invalid CSV row.";
      throw new Error(`Row ${index + 1}: ${message}`);
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
      isRecurring: row.isRecurring,
      note: row.note,
      recurrenceDate: row.recurrenceDate,
      type: row.type,
      userId,
    })),
  );

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
