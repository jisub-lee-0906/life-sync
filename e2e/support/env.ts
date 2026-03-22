import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadDotenv } from "dotenv";

let loaded = false;

function rootDir() {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
}

export function loadTestEnv() {
  if (loaded) {
    return;
  }

  const root = rootDir();
  for (const filename of [".env.local", ".env"]) {
    const fullPath = path.join(root, filename);
    if (existsSync(fullPath)) {
      loadDotenv({ path: fullPath, override: false });
    }
  }

  loaded = true;
}
