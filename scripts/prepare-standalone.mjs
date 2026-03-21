import { cpSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const standaloneDir = path.join(root, ".next", "standalone");

if (!existsSync(standaloneDir)) {
  process.exit(0);
}

const copyIntoStandalone = (source, destination) => {
  if (!existsSync(source)) {
    return;
  }

  mkdirSync(path.dirname(destination), { recursive: true });
  cpSync(source, destination, { recursive: true, force: true });
};

copyIntoStandalone(path.join(root, "public"), path.join(standaloneDir, "public"));
copyIntoStandalone(
  path.join(root, ".next", "static"),
  path.join(standaloneDir, ".next", "static"),
);
