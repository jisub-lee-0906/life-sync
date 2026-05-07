import { spawnSync } from "node:child_process";

function isTruthy(value) {
  return value === "1" || value === "true" || value === "yes";
}

const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
const isExplicitSkip = isTruthy(process.env.SKIP_DB_PUSH ?? "");
const isExplicitRun = isTruthy(process.env.FORCE_DB_PUSH ?? "");
const isCoolify =
  Boolean(process.env.COOLIFY_BRANCH) ||
  Boolean(process.env.COOLIFY_RESOURCE_UUID) ||
  Boolean(process.env.SOURCE_COMMIT);
const isCi = process.env.CI === "true";
const shouldRun = hasDatabaseUrl && !isExplicitSkip && (isExplicitRun || isCoolify || isCi);

if (!shouldRun) {
  const reasons = [];

  if (!hasDatabaseUrl) reasons.push("DATABASE_URL 없음");
  if (isExplicitSkip) reasons.push("SKIP_DB_PUSH 활성화");
  if (!isExplicitRun && !isCoolify && !isCi) reasons.push("배포 환경 아님");

  process.stdout.write(
    `[db:deploy] 스키마 동기화를 건너뜁니다: ${reasons.join(", ")}\n`,
  );
  process.exit(0);
}

process.stdout.write("[db:deploy] drizzle-kit push --force 실행\n");

const command = process.platform === "win32" ? "npx.cmd" : "npx";
const result = spawnSync(command, ["drizzle-kit", "push", "--force"], {
  env: process.env,
  stdio: "inherit",
});

if (result.error) {
  throw result.error;
}

if (typeof result.status === "number" && result.status !== 0) {
  process.exit(result.status);
}
