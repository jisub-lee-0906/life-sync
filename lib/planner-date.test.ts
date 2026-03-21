import test from "node:test";
import assert from "node:assert/strict";
import {
  parseValidatedCalendarDate,
  parseValidatedYearMonth,
} from "./planner-date.ts";

test("parseValidatedCalendarDate rejects impossible dates", () => {
  assert.throws(
    () => parseValidatedCalendarDate("2026-02-31"),
    /Invalid calendar date/,
  );
});

test("parseValidatedCalendarDate preserves valid dates", () => {
  const parsed = parseValidatedCalendarDate("2026-02-28");

  assert.equal(parsed.dateString, "2026-02-28");
  assert.equal(parsed.date.getFullYear(), 2026);
  assert.equal(parsed.date.getMonth(), 1);
  assert.equal(parsed.date.getDate(), 28);
});

test("parseValidatedYearMonth rejects month 13", () => {
  assert.throws(
    () => parseValidatedYearMonth("2026-13"),
    /Invalid calendar month/,
  );
});
