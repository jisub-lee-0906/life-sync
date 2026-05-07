import test from "node:test";
import assert from "node:assert/strict";
import { buildTransactionCursor } from "./transaction-cursor.ts";

test("buildTransactionCursor preserves the transaction timestamp", () => {
  const date = new Date("2026-03-22T15:34:12.789Z");

  assert.deepEqual(buildTransactionCursor(date, "txn-123"), {
    date: "2026-03-22T15:34:12.789Z",
    id: "txn-123",
  });
});
