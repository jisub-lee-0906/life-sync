import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { prepareStandalone } from "./prepare-standalone.mjs";

test("prepareStandalone copies env files into the standalone runtime", () => {
  const root = mkdtempSync(path.join(tmpdir(), "lifesync-standalone-"));
  const standaloneDir = path.join(root, ".next", "standalone");

  mkdirSync(path.join(root, ".next", "static"), { recursive: true });
  mkdirSync(path.join(root, "public"), { recursive: true });
  mkdirSync(standaloneDir, { recursive: true });

  writeFileSync(path.join(root, ".env.local"), "AUTH_SECRET=test-secret\n");

  assert.equal(prepareStandalone(root), true);
  assert.equal(existsSync(path.join(standaloneDir, ".env.local")), true);
  assert.equal(
    readFileSync(path.join(standaloneDir, ".env.local"), "utf8"),
    "AUTH_SECRET=test-secret\n",
  );
});

test("prepareStandalone returns false when standalone output is missing", () => {
  const root = mkdtempSync(path.join(tmpdir(), "lifesync-standalone-missing-"));

  assert.equal(prepareStandalone(root), false);
});
