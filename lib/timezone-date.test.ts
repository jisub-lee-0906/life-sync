import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  buildTimeZoneDayRange,
  buildTimeZoneMonthRange,
  formatTimeZoneDateOnlyValue,
  formatTimeZoneYearMonthValue,
  parseTimeZoneDateOnlyToUtc,
} from "./timezone-date.ts";

test("formatTimeZoneDateOnlyValue returns a stable YYYY-MM-DD string", () => {
  assert.equal(
    formatTimeZoneDateOnlyValue(new Date("2026-03-21T15:00:00.000Z"), "Asia/Seoul"),
    "2026-03-22",
  );
});

test("formatTimeZoneDateOnlyValue preserves years below 0100", () => {
  const date = new Date(0);
  date.setUTCFullYear(99, 11, 31);
  date.setUTCHours(0, 0, 0, 0);

  assert.equal(formatTimeZoneDateOnlyValue(date, "UTC"), "0099-12-31");
});

test("formatTimeZoneYearMonthValue returns the target timezone month", () => {
  assert.equal(
    formatTimeZoneYearMonthValue(new Date("2026-03-31T15:00:00.000Z"), "Asia/Seoul"),
    "2026-04",
  );
});

test("parseTimeZoneDateOnlyToUtc resolves Seoul midnight as a UTC instant", () => {
  assert.equal(
    parseTimeZoneDateOnlyToUtc("2026-03-22", "Asia/Seoul").toISOString(),
    "2026-03-21T15:00:00.000Z",
  );
});

test("buildTimeZoneDayRange returns Seoul day boundaries", () => {
  const range = buildTimeZoneDayRange("2026-03-22", "Asia/Seoul");

  assert.equal(range.start.toISOString(), "2026-03-21T15:00:00.000Z");
  assert.equal(range.endExclusive.toISOString(), "2026-03-22T15:00:00.000Z");
});

test("buildTimeZoneMonthRange returns Seoul month boundaries", () => {
  const range = buildTimeZoneMonthRange("2026-03", "Asia/Seoul");

  assert.equal(range.start.toISOString(), "2026-02-28T15:00:00.000Z");
  assert.equal(range.endExclusive.toISOString(), "2026-03-31T15:00:00.000Z");
});

test("Seoul date helpers stay stable on a non-Seoul server timezone", () => {
  const stdout = execFileSync(
    process.execPath,
    [
      "--import",
      "./scripts/register-alias-loader.mjs",
      "--input-type=module",
      "--eval",
      [
        "import { buildTimeZoneDayRange, formatTimeZoneDateOnlyValue, parseTimeZoneDateOnlyToUtc } from './lib/timezone-date.ts';",
        "const parsed = parseTimeZoneDateOnlyToUtc('2026-03-22', 'Asia/Seoul');",
        "const range = buildTimeZoneDayRange('2026-03-22', 'Asia/Seoul');",
        "process.stdout.write(JSON.stringify({",
        "  parsed: parsed.toISOString(),",
        "  formatted: formatTimeZoneDateOnlyValue(parsed, 'Asia/Seoul'),",
        "  start: range.start.toISOString(),",
        "  endExclusive: range.endExclusive.toISOString(),",
        "}));",
      ].join(" "),
    ],
    {
      cwd: process.cwd(),
      encoding: "utf8",
      env: { ...process.env, TZ: "America/Los_Angeles" },
    },
  );

  assert.deepEqual(JSON.parse(stdout), {
    endExclusive: "2026-03-22T15:00:00.000Z",
    formatted: "2026-03-22",
    parsed: "2026-03-21T15:00:00.000Z",
    start: "2026-03-21T15:00:00.000Z",
  });
});
