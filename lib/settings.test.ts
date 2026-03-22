import test from "node:test";
import assert from "node:assert/strict";
import {
  BACKUP_PAYLOAD_VERSION,
  DEFAULT_SCHEDULE_ICON,
  DEFAULT_TODO_ICON,
  type FullBackupPayload,
  resolveIconPreferences,
} from "./settings.ts";
import { settings } from "@/drizzle/schema";

test("resolveIconPreferences falls back to the default icons", () => {
  assert.deepEqual(resolveIconPreferences(), {
    scheduleIcon: DEFAULT_SCHEDULE_ICON,
    todoIcon: DEFAULT_TODO_ICON,
  });
});

test("resolveIconPreferences trims provided icons and restores blanks", () => {
  assert.deepEqual(
    resolveIconPreferences({
      scheduleIcon: "  📅  ",
      todoIcon: "   ",
    }),
    {
      scheduleIcon: "📅",
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

  assert.equal(version, "1.2");
});
