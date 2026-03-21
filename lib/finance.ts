import { z } from "zod";
import { insertTransactionSchema } from "@/schemas";

export const transactionTypeValues = ["INCOME", "EXPENSE"] as const;

const calendarDateStringSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format.");

function parseCalendarDateString(dateString: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString);

  if (!match) {
    throw new Error("Invalid date format.");
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsedDate = new Date(year, month - 1, day, 0, 0, 0, 0);

  if (
    parsedDate.getFullYear() !== year ||
    parsedDate.getMonth() !== month - 1 ||
    parsedDate.getDate() !== day
  ) {
    throw new Error("Invalid calendar date.");
  }

  return parsedDate;
}

export const quickAddTransactionFormSchema = z.object({
  amount: z.number().int().min(0),
  category: z.string().trim().min(1).max(120),
  date: calendarDateStringSchema,
  isRecurring: z.boolean(),
  note: z.string().trim().max(1000),
  recurrenceDate: z
    .union([z.number().int().min(1).max(31), z.null(), z.undefined()])
    .optional(),
  type: z.enum(transactionTypeValues),
});

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

export function formatTransactionDate(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}
