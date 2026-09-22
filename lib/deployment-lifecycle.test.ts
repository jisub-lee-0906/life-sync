import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("build lifecycle never pushes database schema", () => {
  const packageJson = JSON.parse(
    readFileSync(new URL("../package.json", import.meta.url), "utf8"),
  ) as { scripts: Record<string, string | undefined> };

  assert.equal(packageJson.scripts.prebuild, undefined);
  assert.equal(packageJson.scripts.build, "next build --webpack");
  assert.equal(packageJson.scripts["db:migrate"], "drizzle-kit migrate");
  assert.equal(packageJson.scripts["db:push:force"], undefined);

  const deployScript = readFileSync(
    new URL("../scripts/run-deploy-db-sync.mjs", import.meta.url),
    "utf8",
  );
  assert.equal(deployScript.includes('push --force'), false);
  assert.match(deployScript, /RUN_DB_MIGRATIONS/);
});
