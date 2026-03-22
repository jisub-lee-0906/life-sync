import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateMonthExpenseTotal,
  importCsvRowSchema,
  normalizeQuickAddFormData,
  quickAddTransactionSchema,
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
    /repeat day between 1 and 31/,
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
    /Amount is required/,
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
    /expected number, received undefined/i,
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
