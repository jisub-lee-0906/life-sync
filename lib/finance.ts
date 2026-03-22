import { z } from "zod";
import { insertTransactionSchema } from "@/schemas";
import {
  formatTimeZoneDateOnlyValue,
  SEOUL_TIME_ZONE,
  parseTimeZoneDateOnlyToUtc,
} from "@/lib/timezone-date";

export const transactionTypeValues = ["INCOME", "EXPENSE"] as const;

const calendarDateStringSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format.");

function parseCalendarDateString(dateString: string) {
  return parseTimeZoneDateOnlyToUtc(dateString, SEOUL_TIME_ZONE);
}

function validateRecurrenceDate(
  value: { isRecurring: boolean; recurrenceDate?: number | null },
  ctx: z.RefinementCtx,
) {
  if (!value.isRecurring || value.recurrenceDate == null) {
    return;
  }

  if (value.recurrenceDate < 1 || value.recurrenceDate > 31) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Recurring transactions must use a repeat day between 1 and 31.",
      path: ["recurrenceDate"],
    });
  }
}

export const quickAddTransactionFormSchema = z.object({
  amount: z.number().int().min(0),
  category: z.string().trim().min(1).max(120),
  date: calendarDateStringSchema,
  isRecurring: z.boolean(),
  note: z.string().trim().max(1000),
  recurrenceDate: z.union([z.number().int(), z.null(), z.undefined()]).optional(),
  type: z.enum(transactionTypeValues),
}).superRefine(validateRecurrenceDate);

export const quickAddTransactionSchema = insertTransactionSchema
  .omit({
    id: true,
    userId: true,
  })
  .extend({
    amount: quickAddTransactionFormSchema.shape.amount,
    category: quickAddTransactionFormSchema.shape.category,
    date: quickAddTransactionFormSchema.shape.date,
    isRecurring: quickAddTransactionFormSchema.shape.isRecurring,
    note: quickAddTransactionFormSchema.shape.note,
    recurrenceDate: quickAddTransactionFormSchema.shape.recurrenceDate,
    type: quickAddTransactionFormSchema.shape.type,
  })
  .superRefine(validateRecurrenceDate)
  .transform((value) => {
    const isRecurring = value.isRecurring ?? false;
    const normalizedNote = value.note?.trim() || null;
    const recurrenceDate =
      isRecurring && value.recurrenceDate != null ? value.recurrenceDate : null;

    return {
      amount: value.amount,
      category: value.category.trim(),
      date: parseCalendarDateString(value.date),
      dateString: value.date,
      isRecurring,
      note: normalizedNote,
      recurrenceDate,
      type: value.type,
    };
  });

export const csvTransactionRowSchema = z.object({
  amount: z.union([z.number(), z.string()]).transform((value) => {
    const sanitized =
      typeof value === "string" ? value.replace(/,/g, "").trim() : String(value);

    if (sanitized.length === 0) {
      throw new Error("Amount is required.");
    }

    const numericValue = Number(sanitized);

    if (!Number.isFinite(numericValue) || numericValue < 0) {
      throw new Error("Amount must be a non-negative number.");
    }

    return Math.trunc(numericValue);
  }),
  category: z.string().trim().min(1).max(120),
  date: calendarDateStringSchema,
  isRecurring: z
    .union([z.boolean(), z.string(), z.number(), z.null(), z.undefined()])
    .transform((value) => {
      if (typeof value === "boolean") return value;
      if (typeof value === "number") return value === 1;
      if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();
        return ["true", "1", "yes", "y"].includes(normalized);
      }
      return false;
    }),
  note: z.union([z.string(), z.null(), z.undefined()]).transform((value) =>
    typeof value === "string" ? value.trim() : "",
  ),
  recurrenceDate: z
    .union([z.number(), z.string(), z.null(), z.undefined()])
    .transform((value) => {
      if (value === null || value === undefined || value === "") return null;
      const numericValue = Number(value);
      if (!Number.isFinite(numericValue)) {
        throw new Error("recurrenceDate must be numeric.");
      }
      return Math.trunc(numericValue);
    })
    .nullable(),
  type: z.enum(transactionTypeValues),
});

export const importCsvRowSchema = csvTransactionRowSchema.transform((value) =>
  quickAddTransactionSchema.parse({
    amount: value.amount,
    category: value.category,
    date: value.date,
    isRecurring: value.isRecurring,
    note: value.note,
    recurrenceDate: value.recurrenceDate,
    type: value.type,
  }),
);

export const csvHeaderSchema = z.object({
  amount: z.string(),
  category: z.string(),
  date: z.string(),
  isRecurring: z.string(),
  note: z.string(),
  recurrenceDate: z.string(),
  type: z.string(),
});

const requiredCsvHeaders = [
  "date",
  "type",
  "category",
  "amount",
  "note",
  "isRecurring",
  "recurrenceDate",
] as const;

export type QuickAddTransactionInput = z.infer<typeof quickAddTransactionFormSchema>;
export type NormalizedTransactionInput = z.output<typeof quickAddTransactionSchema>;
export type CsvTransactionRow = {
  amount: number | string;
  category: string;
  date: string;
  isRecurring?: boolean | number | string | null;
  note?: string | null;
  recurrenceDate?: number | string | null;
  type: string;
};
export type FinanceTransactionType = (typeof transactionTypeValues)[number];

export function normalizeCsvUploadRow(row: Record<string, string | undefined>) {
  for (const header of requiredCsvHeaders) {
    if (!(header in row)) {
      throw new Error(`CSV must include the '${header}' header.`);
    }
  }

  return {
    amount: row.amount?.replace(/,/g, "") ?? "",
    category: row.category?.trim() ?? "",
    date: row.date?.trim() ?? "",
    isRecurring: row.isRecurring?.trim() ?? "false",
    note: row.note?.trim() ?? "",
    recurrenceDate: row.recurrenceDate?.trim() ?? "",
    type: row.type?.trim().toUpperCase() ?? "",
  } satisfies CsvTransactionRow;
}

function parseOptionalIntegerFormValue(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return undefined;
  }

  return Number(trimmed);
}

export function normalizeQuickAddFormData(input: FormData) {
  const rawRecurrenceDate = input.get("recurrenceDate");

  return {
    amount: parseOptionalIntegerFormValue(input.get("amount")),
    category: input.get("category"),
    date: input.get("date"),
    isRecurring: input.get("isRecurring") === "on",
    note: input.get("note"),
    recurrenceDate: parseOptionalIntegerFormValue(rawRecurrenceDate),
    type: input.get("type"),
  };
}

export function calculateMonthExpenseTotal(
  transactions: Array<{
    amount: number;
    date: Date | string;
    type: "INCOME" | "EXPENSE";
  }>,
  yearMonth: string,
) {
  return transactions.reduce((sum, transaction) => {
    if (transaction.type !== "EXPENSE") {
      return sum;
    }

    const transactionDate =
      typeof transaction.date === "string"
        ? transaction.date
        : formatTransactionDate(transaction.date);

    return transactionDate.startsWith(`${yearMonth}-`)
      ? sum + transaction.amount
      : sum;
  }, 0);
}

export function formatDateInputValue(date: Date) {
  return formatTransactionDate(date);
}

export function formatTransactionDate(date: Date) {
  return formatTimeZoneDateOnlyValue(date, SEOUL_TIME_ZONE);
}
