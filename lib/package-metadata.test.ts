import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("package.json declares ESM to avoid typeless-module warnings", () => {
  const packageJson = JSON.parse(
    readFileSync(new URL("../package.json", import.meta.url), "utf8"),
  ) as { type?: string };

  assert.equal(packageJson.type, "module");
});
