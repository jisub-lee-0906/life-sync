import { spawnSync } from "node:child_process";

function isTruthy(value) {
  return value === "1" || value === "true" || value === "yes";
}

if (!isTruthy(process.env.RUN_DB_MIGRATIONS ?? "")) {
  process.stdout.write(
    "[db:deploy] no migration ran; use npm run db:migrate in an approved deploy step.\n",
  );
  process.exit(0);
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required when RUN_DB_MIGRATIONS is enabled.");
}

process.stdout.write("[db:deploy] applying reviewed Drizzle migrations\n");
const command = process.platform === "win32" ? "npx.cmd" : "npx";
const result = spawnSync(command, ["drizzle-kit", "migrate"], {
  env: process.env,
  stdio: "inherit",
});

if (result.error) throw result.error;
if (typeof result.status === "number" && result.status !== 0) process.exit(result.status);