import { z } from "zod";
import {
  buildTimeZoneMonthRange,
  formatTimeZoneDateOnlyValue,
  formatTimeZoneYearMonthValue,
  parseTimeZoneDateOnlyToUtc,
  SEOUL_TIME_ZONE,
} from "@/lib/timezone-date";

export const transactionTypeValues = ["INCOME", "EXPENSE"] as const;
export const transactionCategoryNameSchema = z.string().trim().min(1).max(120);

const calendarDateStringSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "날짜 형식을 확인해 주세요.");

function parseCalendarDateString(dateString: string) {
  return parseTimeZoneDateOnlyToUtc(dateString, SEOUL_TIME_ZONE);
}

function normalizeIntegerInput(value: unknown) {
  if (typeof value === "number") {
    return Number.isNaN(value) ? undefined : value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return undefined;
    }

    const numericValue = Number(trimmed.replace(/,/g, ""));
    return Number.isNaN(numericValue) ? undefined : numericValue;
  }

  return value;
}

export function normalizeTransactionText(value: string) {
  return value.normalize("NFC").trim();
}

const amountSchema = z.preprocess(
  normalizeIntegerInput,
  z.number().int().min(0, "금액은 0원 이상이어야 해요."),
);

const recurrenceDateSchema = z.preprocess(
  (value) => {
    const normalizedValue = normalizeIntegerInput(value);
    return normalizedValue === undefined ? undefined : normalizedValue;
  },
  z.union([z.number().int(), z.null(), z.undefined()]),
);

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
      message: "반복일은 1일부터 31일 사이여야 해요.",
      path: ["recurrenceDate"],
    });
  }
}

export const quickAddTransactionFormSchema = z
  .object({
    amount: amountSchema,
    category: transactionCategoryNameSchema.refine((value) => value.length > 0, {
      message: "분류를 입력해 주세요.",
    }),
    date: calendarDateStringSchema,
    isRecurring: z.boolean(),
    note: z.string().max(1000).transform((value) => normalizeTransactionText(value)),
    recurrenceDate: recurrenceDateSchema.optional(),
    type: z.enum(transactionTypeValues),
  })
  .superRefine(validateRecurrenceDate);

export const recurringSyncSchema = z.object({
  yearMonth: z.string().trim().regex(/^\d{4}-\d{2}$/, "월 형식을 확인해 주세요."),
});

export const quickAddTransactionSchema = quickAddTransactionFormSchema.transform((value) => {
  const isRecurring = value.isRecurring ?? false;
  const normalizedNote = value.note?.trim() || null;
  const recurrenceDate =
    isRecurring && value.recurrenceDate != null ? value.recurrenceDate : null;

  return {
    amount: value.amount,
    category: normalizeTransactionText(value.category),
    date: parseCalendarDateString(value.date),
    dateString: value.date,
    isRecurring,
    note: normalizedNote,
    recurrenceDate,
    type: value.type,
  };
});

export const updateTransactionSchema = quickAddTransactionFormSchema.extend({
  id: z.string().uuid(),
});

export const csvTransactionRowSchema = z.object({
  amount: z.union([z.number(), z.string()]).transform((value) => {
    const sanitized =
      typeof value === "string" ? value.replace(/,/g, "").trim() : String(value);

    if (sanitized.length === 0) {
      throw new Error("금액은 필수 항목이에요.");
    }

    const numericValue = Number(sanitized);

    if (!Number.isFinite(numericValue) || numericValue < 0) {
      throw new Error("금액은 0원 이상으로 입력해 주세요.");
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
        throw new Error("반복일은 숫자로 입력해 주세요.");
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

const requiredCsvHeaders = [
  "date",
  "type",
  "category",
  "amount",
  "note",
  "isRecurring",
  "recurrenceDate",
] as const;

export type QuickAddTransactionFormValues = z.input<typeof quickAddTransactionFormSchema>;
export type QuickAddTransactionInput = z.output<typeof quickAddTransactionFormSchema>;
export type TransactionUpdateInput = z.infer<typeof updateTransactionSchema>;
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
      throw new Error(`CSV 파일에 '${header}' 항목이 필요해요.`);
    }
  }

  return {
    amount: row.amount?.replace(/,/g, "") ?? "",
    category: normalizeTransactionText(row.category ?? ""),
    date: row.date?.trim() ?? "",
    isRecurring: row.isRecurring?.trim() ?? "false",
    note: normalizeTransactionText(row.note ?? ""),
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
  return {
    amount: parseOptionalIntegerFormValue(input.get("amount")),
    category: input.get("category"),
    date: input.get("date"),
    isRecurring: input.get("isRecurring") === "on",
    note: input.get("note"),
    recurrenceDate: parseOptionalIntegerFormValue(input.get("recurrenceDate")),
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

export function calculateMonthFinanceSummary(
  transactions: Array<{
    amount: number;
    date: Date | string;
    type: "INCOME" | "EXPENSE";
  }>,
  yearMonth: string,
) {
  return transactions.reduce(
    (summary, transaction) => {
      const transactionDate =
        typeof transaction.date === "string"
          ? transaction.date
          : formatTransactionDate(transaction.date);

      if (!transactionDate.startsWith(`${yearMonth}-`)) {
        return summary;
      }

      if (transaction.type === "EXPENSE") {
        summary.totalExpense += transaction.amount;
      } else {
        summary.totalIncome += transaction.amount;
      }

      summary.netAmount = summary.totalIncome - summary.totalExpense;
      return summary;
    },
    {
      netAmount: 0,
      totalExpense: 0,
      totalIncome: 0,
      yearMonth,
    },
  );
}

export function formatDateInputValue(date: Date) {
  return formatTransactionDate(date);
}

export function formatTransactionDate(date: Date) {
  return formatTimeZoneDateOnlyValue(date, SEOUL_TIME_ZONE);
}

export function resolveRecurringDate(yearMonth: string, recurrenceDate: number) {
  const { endExclusive } = buildTimeZoneMonthRange(yearMonth, SEOUL_TIME_ZONE);
  const lastDay = new Date(endExclusive.getTime() - 1).getUTCDate();
  const safeDay = Math.min(Math.max(recurrenceDate, 1), lastDay);
  return parseTimeZoneDateOnlyToUtc(
    `${yearMonth}-${`${safeDay}`.padStart(2, "0")}`,
    SEOUL_TIME_ZONE,
  );
}

export function resolveTransactionYearMonth(date: Date) {
  return formatTimeZoneYearMonthValue(date, SEOUL_TIME_ZONE);
}
