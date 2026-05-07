import { cpSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const runtimeFiles = [
  ["public", "public"],
  [path.join(".next", "static"), path.join(".next", "static")],
  [".env", ".env"],
  [".env.production", ".env.production"],
  [".env.local", ".env.local"],
  [".env.production.local", ".env.production.local"],
];

function copyIntoStandalone(source, destination) {
  if (!existsSync(source)) {
    return;
  }

  mkdirSync(path.dirname(destination), { recursive: true });
  cpSync(source, destination, { recursive: true, force: true });
}

export function prepareStandalone(root = process.cwd()) {
  const standaloneDir = path.join(root, ".next", "standalone");

  if (!existsSync(standaloneDir)) {
    return false;
  }

  for (const [sourceRelativePath, destinationRelativePath] of runtimeFiles) {
    copyIntoStandalone(
      path.join(root, sourceRelativePath),
      path.join(standaloneDir, destinationRelativePath),
    );
  }

  return true;
}

const entryUrl = process.argv[1] ? pathToFileURL(process.argv[1]).href : null;

if (entryUrl && import.meta.url === entryUrl) {
  prepareStandalone();
}
