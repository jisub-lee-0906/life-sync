import test from "node:test";
import assert from "node:assert/strict";
import { formatTimeZoneDateOnlyValue } from "./timezone-date.ts";

test("formatTimeZoneDateOnlyValue builds YYYY-MM-DD from date parts instead of locale punctuation", () => {
  const originalDateTimeFormat = Intl.DateTimeFormat;

  Intl.DateTimeFormat = class MockDateTimeFormat {
    formatToParts() {
      return [
        { type: "month", value: "03" },
        { type: "literal", value: "/" },
        { type: "day", value: "22" },
        { type: "literal", value: "/" },
        { type: "year", value: "2026" },
      ];
    }
  } as typeof Intl.DateTimeFormat;

  try {
    assert.equal(
      formatTimeZoneDateOnlyValue(new Date("2026-03-22T00:00:00.000Z"), "Asia/Seoul"),
      "2026-03-22",
    );
  } finally {
    Intl.DateTimeFormat = originalDateTimeFormat;
  }
});

test("formatTimeZoneDateOnlyValue preserves years below 0100", () => {
  const date = new Date(0);
  date.setUTCFullYear(99, 11, 31);
  date.setUTCHours(0, 0, 0, 0);

  assert.equal(formatTimeZoneDateOnlyValue(date, "UTC"), "0099-12-31");
});
