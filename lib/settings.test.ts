import assert from "node:assert/strict";
import test from "node:test";
import { settings } from "@/drizzle/schema";
import {
  BACKUP_PAYLOAD_VERSION,
  MAX_BACKUP_BYTES,
  MAX_BACKUP_NOTE_LENGTH,
  assertBackupInputSize,
  DEFAULT_SCHEDULE_ICON,
  DEFAULT_TODO_ICON,
  backupPayloadSchema,
  resolveIconPreferences,
  type FullBackupPayload,
} from "./settings.ts";

test("resolveIconPreferences falls back to the default icons", () => {
  assert.deepEqual(resolveIconPreferences(), {
    scheduleIcon: DEFAULT_SCHEDULE_ICON,
    todoIcon: DEFAULT_TODO_ICON,
  });
});

test("resolveIconPreferences trims provided icons and restores blanks", () => {
  assert.deepEqual(
    resolveIconPreferences({
      scheduleIcon: "  🗓️  ",
      todoIcon: "   ",
    }),
    {
      scheduleIcon: "🗓️",
      todoIcon: DEFAULT_TODO_ICON,
    },
  );
});

test("database defaults stay aligned with the runtime icon fallbacks", () => {
  assert.equal(settings.scheduleIcon.default, DEFAULT_SCHEDULE_ICON);
  assert.equal(settings.todoIcon.default, DEFAULT_TODO_ICON);
});

test("backup payload version stays aligned with the exported contract", () => {
  const version: FullBackupPayload["version"] = BACKUP_PAYLOAD_VERSION;

  assert.equal(version, "1.3");
});

test("backup payload schema preserves recurring source references for restore mapping", () => {
  const userId = "11111111-1111-4111-8111-111111111111";
  const boardId = "22222222-2222-4222-8222-222222222222";
  const rootTransactionId = "33333333-3333-4333-8333-333333333333";
  const derivedTransactionId = "44444444-4444-4444-8444-444444444444";
  const parsed = backupPayloadSchema.parse({
    exportedAt: "2026-03-23T00:00:00.000Z",
    mandalarts: [
      {
        cells: [
          { goal: "A", id: "55555555-5555-4555-8555-555555555551", isCompleted: false, position: 1 },
          { goal: "B", id: "55555555-5555-4555-8555-555555555552", isCompleted: false, position: 2 },
          { goal: "C", id: "55555555-5555-4555-8555-555555555553", isCompleted: false, position: 3 },
          { goal: "D", id: "55555555-5555-4555-8555-555555555554", isCompleted: false, position: 4 },
          { goal: "E", id: "55555555-5555-4555-8555-555555555555", isCompleted: false, position: 5 },
          { goal: "F", id: "55555555-5555-4555-8555-555555555556", isCompleted: false, position: 6 },
          { goal: "G", id: "55555555-5555-4555-8555-555555555557", isCompleted: false, position: 7 },
          { goal: "H", id: "55555555-5555-4555-8555-555555555558", isCompleted: false, position: 8 },
        ],
        coreGoal: "Core",
        id: boardId,
        userId,
      },
    ],
    routines: [],
    settings: {
      scheduleIcon: "🗓️",
      todoIcon: "✅",
    },
    tasks: [],
    transactionCategories: [],
    transactions: [
      {
        amount: 10000,
        category: "월급",
        date: "2026-03-01T00:00:00.000Z",
        derivedYearMonth: null,
        id: rootTransactionId,
        isRecurring: true,
        note: null,
        recurrenceDate: 1,
        sourceTransactionId: null,
        type: "INCOME",
        userId,
      },
      {
        amount: 10000,
        category: "월급",
        date: "2026-04-01T00:00:00.000Z",
        derivedYearMonth: "2026-04",
        id: derivedTransactionId,
        isRecurring: false,
        note: null,
        recurrenceDate: 1,
        sourceTransactionId: rootTransactionId,
        type: "INCOME",
        userId,
      },
    ],
    version: "1.3",
  });

  assert.equal(parsed.transactions[1]?.sourceTransactionId, rootTransactionId);
  assert.equal(parsed.mandalarts[0]?.cells.length, 8);
  assert.deepEqual(parsed.transactionCategories, []);
});


test("backup input rejects oversized byte payloads before JSON parsing", () => {
  assert.throws(() => assertBackupInputSize("x".repeat(MAX_BACKUP_BYTES + 1)));
});

test("backup schema rejects notes beyond the documented restore limit", () => {
  const valid = backupPayloadSchema.parse({
    exportedAt: "2026-03-23T00:00:00.000Z",
    mandalarts: [],
    routines: [],
    settings: null,
    tasks: [],
    transactionCategories: [],
    transactions: [],
    version: BACKUP_PAYLOAD_VERSION,
  });
  assert.equal(valid.transactions.length, 0);

  assert.throws(() =>
    backupPayloadSchema.parse({
      ...valid,
      transactions: [{
        amount: 1,
        category: "category",
        date: "2026-03-23T00:00:00.000Z",
        derivedYearMonth: null,
        id: "33333333-3333-4333-8333-333333333333",
        isRecurring: false,
        note: "x".repeat(MAX_BACKUP_NOTE_LENGTH + 1),
        recurrenceDate: null,
        sourceTransactionId: null,
        type: "EXPENSE",
        userId: "11111111-1111-4111-8111-111111111111",
      }],
    }),
  );
});
