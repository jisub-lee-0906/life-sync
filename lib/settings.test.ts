import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_SCHEDULE_ICON,
  DEFAULT_TODO_ICON,
  resolveIconPreferences,
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
      scheduleIcon: "  📅  ",
      todoIcon: "   ",
    }),
    {
      scheduleIcon: "📅",
      todoIcon: DEFAULT_TODO_ICON,
    },
  );
});
