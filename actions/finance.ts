"use server";

import { and, eq, isNull, lt, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireApprovedUser } from "@/lib/server-auth";
import {
  type CsvTransactionRow,
  calculateMonthFinanceSummary,
  formatTransactionDate,
  importCsvRowSchema,
  normalizeTransactionText,
  normalizeQuickAddFormData,
  quickAddTransactionSchema,
  recurringSyncSchema,
  resolveRecurringDate,
  resolveTransactionYearMonth,
  transactionCategoryNameSchema,
  transactionTypeValues,
  type QuickAddTransactionInput,
} from "@/lib/finance";
import { getDefaultTransactionCategories } from "@/lib/settings";
import { buildTransactionCursor } from "@/lib/transaction-cursor";
import {
  buildTimeZoneMonthRange,
  formatTimeZoneYearMonthValue,
  SEOUL_TIME_ZONE,
} from "@/lib/timezone-date";
import { transactionCategories, transactions } from "@/drizzle/schema";

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

export type FinanceSummary = {
  netAmount: number;
  totalExpense: number;
  totalIncome: number;
  yearMonth: string;
};

export type TransactionCategoryViewModel = {
  archivedAt: string | null;
  id: string;
  name: string;
  sortOrder: number;
  type: "INCOME" | "EXPENSE";
};

const transactionCategoryInputSchema = z.object({
  name: transactionCategoryNameSchema,
  type: z.enum(transactionTypeValues),
});

const transactionCategoryUpdateSchema = z.object({
  id: z.string().uuid(),
  name: transactionCategoryNameSchema,
});

const transactionCategoryReorderSchema = z.object({
  orderedIds: z.array(z.string().uuid()),
  type: z.enum(transactionTypeValues),
});

async function requireUserId() {
  return (await requireApprovedUser()).id;
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

function toCategoryViewModel(
  category: typeof transactionCategories.$inferSelect,
): TransactionCategoryViewModel {
  return {
    archivedAt: category.archivedAt?.toISOString() ?? null,
    id: category.id,
    name: category.name,
    sortOrder: category.sortOrder,
    type: category.type,
  };
}

function buildCategoryKey(type: "INCOME" | "EXPENSE", name: string) {
  return `${type}:${name}`;
}

async function ensureTransactionCategories(userId: string) {
  const existing = await db.query.transactionCategories.findMany({
    orderBy: (table, { asc }) => [asc(table.type), asc(table.sortOrder), asc(table.name)],
    where: (table, operators) => operators.eq(table.userId, userId),
  });
  const historical = await db.query.transactions.findMany({
    columns: { category: true, type: true },
    where: (table, operators) => operators.eq(table.userId, userId),
  });
  const defaults = getDefaultTransactionCategories();
  const existingKeys = new Set(existing.map((item) => buildCategoryKey(item.type, item.name)));
  const nextSortOrder = {
    EXPENSE:
      existing.filter((item) => item.type === "EXPENSE").reduce((max, item) => Math.max(max, item.sortOrder), -1) +
      1,
    INCOME:
      existing.filter((item) => item.type === "INCOME").reduce((max, item) => Math.max(max, item.sortOrder), -1) + 1,
  };
  const rowsToInsert: Array<typeof transactionCategories.$inferInsert> = [];

  for (const name of defaults.expense) {
    const normalizedName = normalizeTransactionText(name);
    const key = buildCategoryKey("EXPENSE", normalizedName);
    if (existingKeys.has(key)) continue;
    existingKeys.add(key);
    rowsToInsert.push({
      archivedAt: null,
      name: normalizedName,
      sortOrder: nextSortOrder.EXPENSE++,
      type: "EXPENSE",
      updatedAt: new Date(),
      userId,
    });
  }

  for (const name of defaults.income) {
    const normalizedName = normalizeTransactionText(name);
    const key = buildCategoryKey("INCOME", normalizedName);
    if (existingKeys.has(key)) continue;
    existingKeys.add(key);
    rowsToInsert.push({
      archivedAt: null,
      name: normalizedName,
      sortOrder: nextSortOrder.INCOME++,
      type: "INCOME",
      updatedAt: new Date(),
      userId,
    });
  }

  for (const item of historical) {
    const normalizedName = normalizeTransactionText(item.category);
    const key = buildCategoryKey(item.type, normalizedName);
    if (normalizedName.length === 0 || existingKeys.has(key)) continue;
    existingKeys.add(key);
    rowsToInsert.push({
      archivedAt: null,
      name: normalizedName,
      sortOrder: nextSortOrder[item.type]++,
      type: item.type,
      updatedAt: new Date(),
      userId,
    });
  }

  if (rowsToInsert.length > 0) {
    await db.insert(transactionCategories).values(rowsToInsert).onConflictDoNothing();
  }

  return db.query.transactionCategories.findMany({
    orderBy: (table, { asc }) => [asc(table.type), asc(table.sortOrder), asc(table.name)],
    where: (table, operators) => operators.eq(table.userId, userId),
  });
}

async function ensureTransactionCategory(
  userId: string,
  type: "INCOME" | "EXPENSE",
  category: string,
) {
  const normalizedCategory = normalizeTransactionText(category);

  if (normalizedCategory.length === 0) {
    return;
  }

  const existing = await db.query.transactionCategories.findFirst({
    where: (table, operators) =>
      and(
        operators.eq(table.userId, userId),
        operators.eq(table.type, type),
        operators.eq(table.name, normalizedCategory),
      ),
  });

  if (existing) {
    if (existing.archivedAt) {
      await db
        .update(transactionCategories)
        .set({ archivedAt: null, updatedAt: new Date() })
        .where(eq(transactionCategories.id, existing.id));
    }
    return;
  }

  const currentCategories = await ensureTransactionCategories(userId);
  const currentSortOrder =
    currentCategories
      .filter((item) => item.type === type)
      .reduce((max, item) => Math.max(max, item.sortOrder), -1) + 1;

  await db.insert(transactionCategories).values({
    archivedAt: null,
    name: normalizedCategory,
    sortOrder: currentSortOrder,
    type,
    updatedAt: new Date(),
    userId,
  }).onConflictDoNothing();
}

export async function createTransaction(input: FormData | QuickAddTransactionInput) {
  const userId = await requireUserId();
  const parsed = quickAddTransactionSchema.parse(normalizeQuickAddInput(input));
  await ensureTransactionCategory(userId, parsed.type, parsed.category);

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
  await ensureTransactionCategory(userId, parsed.type, parsed.category);

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

  for (const row of normalizedRows) {
    await ensureTransactionCategory(userId, row.type, row.category);
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
  const summary = await getFinanceSummary(yearMonth);
  return summary.totalExpense;
}

export async function getFinanceSummary(yearMonth?: string): Promise<FinanceSummary> {
  const userId = await requireUserId();
  const resolvedYearMonth =
    yearMonth ?? formatTimeZoneYearMonthValue(new Date(), SEOUL_TIME_ZONE);
  const { endExclusive, start } = buildTimeZoneMonthRange(resolvedYearMonth, SEOUL_TIME_ZONE);

  const rows = await db.query.transactions.findMany({
    columns: { amount: true, date: true, type: true },
    where: (table, operators) =>
      and(
        operators.eq(table.userId, userId),
        operators.gte(table.date, start),
        operators.lt(table.date, endExclusive),
      ),
  });

  return calculateMonthFinanceSummary(rows, resolvedYearMonth);
}

export async function getTransactionCategories(includeArchived = false) {
  const userId = await requireUserId();
  const categories = await ensureTransactionCategories(userId);

  return categories
    .filter((item) => includeArchived || !item.archivedAt)
    .map(toCategoryViewModel);
}

export async function createTransactionCategory(input: {
  name: string;
  type: "INCOME" | "EXPENSE";
}) {
  const userId = await requireUserId();
  const parsed = transactionCategoryInputSchema.parse(input);
  const existingCategories = await ensureTransactionCategories(userId);
  const nextSortOrder =
    existingCategories
      .filter((item) => item.type === parsed.type)
      .reduce((max, item) => Math.max(max, item.sortOrder), -1) + 1;

  await db
    .insert(transactionCategories)
    .values({
      archivedAt: null,
      name: normalizeTransactionText(parsed.name),
      sortOrder: nextSortOrder,
      type: parsed.type,
      updatedAt: new Date(),
      userId,
    })
    .onConflictDoUpdate({
      set: {
        archivedAt: null,
        updatedAt: new Date(),
      },
      target: [
        transactionCategories.userId,
        transactionCategories.type,
        transactionCategories.name,
      ],
    });

  revalidatePath("/finance");
  revalidatePath("/settings/categories");

  return getTransactionCategories(true);
}

export async function updateTransactionCategory(input: { id: string; name: string }) {
  const userId = await requireUserId();
  const parsed = transactionCategoryUpdateSchema.parse(input);
  const category = await db.query.transactionCategories.findFirst({
    where: (table, operators) =>
      and(operators.eq(table.id, parsed.id), operators.eq(table.userId, userId)),
  });

  if (!category) {
    throw new Error("수정할 분류를 찾지 못했어요.");
  }

  const nextName = normalizeTransactionText(parsed.name);
  const previousName = category.name;

  await db.transaction(async (tx) => {
    await tx
      .update(transactionCategories)
      .set({ name: nextName, updatedAt: new Date() })
      .where(eq(transactionCategories.id, category.id));

    await tx
      .update(transactions)
      .set({ category: nextName })
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.type, category.type),
          eq(transactions.category, previousName),
        ),
      );
  });

  revalidatePath("/analytics");
  revalidatePath("/calendar");
  revalidatePath("/finance");
  revalidatePath("/settings/categories");

  return getTransactionCategories(true);
}

export async function archiveTransactionCategory(id: string) {
  const userId = await requireUserId();
  const category = await db.query.transactionCategories.findFirst({
    where: (table, operators) =>
      and(operators.eq(table.id, id), operators.eq(table.userId, userId)),
  });

  if (!category) {
    throw new Error("보관할 분류를 찾지 못했어요.");
  }

  await db
    .update(transactionCategories)
    .set({ archivedAt: new Date(), updatedAt: new Date() })
    .where(eq(transactionCategories.id, id));

  revalidatePath("/finance");
  revalidatePath("/settings/categories");

  return getTransactionCategories(true);
}

export async function reorderTransactionCategories(
  input: { orderedIds: string[]; type: "INCOME" | "EXPENSE" },
) {
  const userId = await requireUserId();
  const parsed = transactionCategoryReorderSchema.parse(input);
  const categories = await db.query.transactionCategories.findMany({
    columns: { id: true },
    where: (table, operators) =>
      and(operators.eq(table.userId, userId), operators.eq(table.type, parsed.type)),
  });
  const ownedIds = new Set(categories.map((item) => item.id));

  if (parsed.orderedIds.some((id) => !ownedIds.has(id))) {
    throw new Error("정렬할 수 없는 분류가 포함되어 있어요.");
  }

  await db.transaction(async (tx) => {
    for (const [index, id] of parsed.orderedIds.entries()) {
      await tx
        .update(transactionCategories)
        .set({ sortOrder: index, updatedAt: new Date() })
        .where(eq(transactionCategories.id, id));
    }
  });

  revalidatePath("/finance");
  revalidatePath("/settings/categories");

  return getTransactionCategories(true);
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
