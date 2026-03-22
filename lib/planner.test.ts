import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

test("taskToOverviewItem preserves date-only task values across time zones", () => {
  const stdout = execFileSync(
    process.execPath,
    [
      "--import",
      "./scripts/register-alias-loader.mjs",
      "--input-type=module",
      "--eval",
      [
        "import { taskToOverviewItem } from './lib/planner.ts';",
        "const task = {",
        "  date: new Date('2026-03-22T00:00:00.000Z'),",
        "  id: 'task-1',",
        "  priority: 'HIGH',",
        "  progress: 25,",
        "  status: 'IN_PROGRESS',",
        "  title: 'Review',",
        "  type: 'TASK',",
        "};",
        "process.stdout.write(taskToOverviewItem(task).date);",
      ].join(" "),
    ],
    {
      cwd: process.cwd(),
      encoding: "utf8",
      env: { ...process.env, TZ: "America/Los_Angeles" },
    },
  );

  assert.equal(stdout, "2026-03-22");
});

test("formatSeoulDateOnlyValue preserves transaction calendar dates across server time zones", () => {
  const stdout = execFileSync(
    process.execPath,
    [
      "--import",
      "./scripts/register-alias-loader.mjs",
      "--input-type=module",
      "--eval",
      [
        "import { formatSeoulDateOnlyValue } from './lib/planner.ts';",
        "const transactionDate = new Date('2026-03-21T15:00:00.000Z');",
        "process.stdout.write(formatSeoulDateOnlyValue(transactionDate));",
      ].join(" "),
    ],
    {
      cwd: process.cwd(),
      encoding: "utf8",
      env: { ...process.env, TZ: "America/Los_Angeles" },
    },
  );

  assert.equal(stdout, "2026-03-22");
});
