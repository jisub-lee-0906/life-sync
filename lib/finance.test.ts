import test from "node:test";
import assert from "node:assert/strict";
import { quickAddTransactionSchema } from "./finance.ts";

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
