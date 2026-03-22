import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const candidateExtensions = [".ts", ".tsx", ".js", ".mjs", ".cjs"];

function resolveAliasPath(specifier) {
  if (!specifier.startsWith("@/")) {
    return null;
  }

  const relativePath = specifier.slice(2);
  const directPath = path.join(projectRoot, relativePath);
  const candidates = [
    ...candidateExtensions.map((extension) => `${directPath}${extension}`),
    ...candidateExtensions.map((extension) => path.join(directPath, `index${extension}`)),
    directPath,
  ];

  const resolvedPath = candidates.find((candidate) => {
    if (!existsSync(candidate)) {
      return false;
    }

    return statSync(candidate).isFile();
  });
  return resolvedPath ? pathToFileURL(resolvedPath).href : null;
}

export function resolve(specifier, context, defaultResolve) {
  const aliasUrl = resolveAliasPath(specifier);

  if (aliasUrl) {
    return defaultResolve(aliasUrl, context, defaultResolve);
  }

  return defaultResolve(specifier, context, defaultResolve);
}
