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

test("parseValidatedYearMonth rejects year 0000", () => {
  assert.throws(
    () => parseValidatedYearMonth("0000-01"),
    /Invalid calendar year/,
  );
});

test("parseValidatedYearMonth preserves years below 0100", () => {
  assert.deepEqual(parseValidatedYearMonth("0099-12"), {
    monthIndex: 11,
    year: 99,
    yearMonth: "0099-12",
  });
});

test("parseValidatedCalendarDate preserves years below 0100", () => {
  const parsed = parseValidatedCalendarDate("0099-12-31");

  assert.equal(parsed.dateString, "0099-12-31");
  assert.equal(parsed.date.getFullYear(), 99);
  assert.equal(parsed.date.getMonth(), 11);
  assert.equal(parsed.date.getDate(), 31);
});
