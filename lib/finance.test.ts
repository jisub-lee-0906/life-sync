import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  calculateMonthFinanceSummary,
  calculateMonthExpenseTotal,
  formatDateInputValue,
  formatTransactionDate,
  importCsvRowSchema,
  normalizeCsvUploadRow,
  normalizeQuickAddFormData,
  quickAddTransactionSchema,
  resolveRecurringDate,
  resolveTransactionYearMonth,
} from "./finance.ts";

test("quickAddTransactionSchema ignores recurrenceDate when a transaction is not recurring", () => {
  const parsed = quickAddTransactionSchema.parse({
    amount: 12500,
    category: "Salary",
    date: "2026-03-22",
    isRecurring: false,
    note: "One-off payment",
    recurrenceDate: 99,
    type: "INCOME",
  });

  assert.equal(parsed.isRecurring, false);
  assert.equal(parsed.recurrenceDate, null);
});

test("quickAddTransactionSchema still validates repeat day for recurring transactions", () => {
  assert.throws(
    () =>
      quickAddTransactionSchema.parse({
        amount: 3200,
        category: "Rent",
        date: "2026-03-22",
        isRecurring: true,
        note: "",
        recurrenceDate: 99,
        type: "EXPENSE",
      }),
    /반복일은 1일부터 31일 사이여야 해요/,
  );
});

test("importCsvRowSchema rejects blank CSV amounts instead of coercing them to zero", () => {
  assert.throws(
    () =>
      importCsvRowSchema.parse({
        amount: "   ",
        category: "Food",
        date: "2026-03-22",
        isRecurring: false,
        note: "",
        recurrenceDate: null,
        type: "EXPENSE",
      }),
    /금액은 필수 항목이에요/,
  );
});

test("normalizeCsvUploadRow preserves missing CSV amounts so validation can reject them", () => {
  assert.equal(
    normalizeCsvUploadRow({
      amount: undefined,
      category: "Food",
      date: "2026-03-22",
      isRecurring: "false",
      note: "",
      recurrenceDate: "",
      type: "expense",
    }).amount,
    "",
  );
});

test("normalizeQuickAddFormData preserves blank amounts so validation can reject them", () => {
  const formData = new FormData();
  formData.set("amount", "   ");
  formData.set("category", "Food");
  formData.set("date", "2026-03-22");
  formData.set("note", "");
  formData.set("type", "EXPENSE");

  assert.throws(
    () => quickAddTransactionSchema.parse(normalizeQuickAddFormData(formData)),
    /금액은 0원 이상이어야 해요|expected number, received undefined/i,
  );
});

test("calculateMonthExpenseTotal only counts expenses from the requested month", () => {
  assert.equal(
    calculateMonthExpenseTotal(
      [
        { amount: 12000, date: "2026-03-22", type: "EXPENSE" },
        { amount: 4500, date: "2026-03-07", type: "INCOME" },
        { amount: 8000, date: "2026-02-28", type: "EXPENSE" },
        { amount: 3000, date: "2026-03-01", type: "EXPENSE" },
      ],
      "2026-03",
    ),
    15000,
  );
});

test("quickAddTransactionSchema preserves calendar years below 0100", () => {
  const parsed = quickAddTransactionSchema.parse({
    amount: 12000,
    category: "Archive",
    date: "0099-12-31",
    isRecurring: false,
    note: "",
    recurrenceDate: null,
    type: "EXPENSE",
  });

  assert.equal(parsed.dateString, "0099-12-31");
  assert.equal(formatTransactionDate(parsed.date), "0099-12-31");
});

test("formatTransactionDate preserves four-digit years below 0100", () => {
  const date = new Date(0);
  date.setFullYear(99, 11, 31);
  date.setHours(0, 0, 0, 0);

  assert.equal(formatTransactionDate(date), "0099-12-31");
});

test("formatDateInputValue always returns an input-safe YYYY-MM-DD value", () => {
  const date = new Date(0);
  date.setFullYear(2026, 2, 22);
  date.setHours(0, 0, 0, 0);

  assert.match(formatDateInputValue(date), /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(formatDateInputValue(date), "2026-03-22");
});

test("quickAddTransactionSchema stores Seoul midnight as UTC on a non-Seoul server", () => {
  const stdout = execFileSync(
    process.execPath,
    [
      "--import",
      "./scripts/register-alias-loader.mjs",
      "--input-type=module",
      "--eval",
      [
        "import { quickAddTransactionSchema } from './lib/finance.ts';",
        "const parsed = quickAddTransactionSchema.parse({",
        "  amount: 1000,",
        "  category: 'Food',",
        "  date: '2026-03-22',",
        "  isRecurring: false,",
        "  note: '',",
        "  recurrenceDate: null,",
        "  type: 'EXPENSE',",
        "});",
        "process.stdout.write(parsed.date.toISOString());",
      ].join(" "),
    ],
    {
      cwd: process.cwd(),
      encoding: "utf8",
      env: { ...process.env, TZ: "America/Los_Angeles" },
    },
  );

  assert.equal(stdout, "2026-03-21T15:00:00.000Z");
});

test("calculateMonthExpenseTotal uses Seoul calendar boundaries at month edges", () => {
  assert.equal(
    calculateMonthExpenseTotal(
      [
        { amount: 9000, date: new Date("2026-03-31T14:59:59.000Z"), type: "EXPENSE" },
        { amount: 4000, date: new Date("2026-03-31T15:00:00.000Z"), type: "EXPENSE" },
        { amount: 1200, date: new Date("2026-03-01T00:00:00.000Z"), type: "INCOME" },
      ],
      "2026-03",
    ),
    9000,
  );
});

test("calculateMonthFinanceSummary returns expense, income, and net totals for the requested month", () => {
  assert.deepEqual(
    calculateMonthFinanceSummary(
      [
        { amount: 9000, date: "2026-03-02", type: "EXPENSE" },
        { amount: 15000, date: "2026-03-03", type: "INCOME" },
        { amount: 2500, date: "2026-02-27", type: "EXPENSE" },
      ],
      "2026-03",
    ),
    {
      netAmount: 6000,
      totalExpense: 9000,
      totalIncome: 15000,
      yearMonth: "2026-03",
    },
  );
});

test("resolveRecurringDate snaps overflowing recurrence days to the end of the month", () => {
  assert.equal(formatTransactionDate(resolveRecurringDate("2026-02", 31)), "2026-02-28");
  assert.equal(formatTransactionDate(resolveRecurringDate("2028-02", 31)), "2028-02-29");
});

test("resolveTransactionYearMonth uses Seoul calendar boundaries", () => {
  assert.equal(resolveTransactionYearMonth(new Date("2026-03-31T14:59:59.000Z")), "2026-03");
  assert.equal(resolveTransactionYearMonth(new Date("2026-03-31T15:00:00.000Z")), "2026-04");
});
