import assert from "node:assert/strict";
import test from "node:test";
import { neutralizeCsvCell, toCsv } from "./csv-export.ts";

test("neutralizes spreadsheet formula prefixes in exported cells", () => {
  for (const value of ["=SUM(A1:A2)", "+1", "-1", "@cmd"]) {
    assert.equal(neutralizeCsvCell(value), `'${value}`);
  }
  assert.equal(neutralizeCsvCell("normal note"), "normal note");
});

test("CSV export applies formula neutralization before escaping", () => {
  assert.equal(toCsv([{ note: '=HYPERLINK("https://example.test")' }]), 'note\n"\'=HYPERLINK(""https://example.test"")"');
});
