import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_SCHEDULE_ICON,
  DEFAULT_TODO_ICON,
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
