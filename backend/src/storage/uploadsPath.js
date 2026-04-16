import fs from "node:fs";
import path from "node:path";
import { env } from "../config/env.js";

let resolvedUploadsPathCache = "";

function tryEnsureDir(dirPath) {
  try {
    fs.mkdirSync(dirPath, { recursive: true });
    fs.accessSync(dirPath, fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

export function getResolvedUploadsPath() {
  if (resolvedUploadsPathCache) return resolvedUploadsPathCache;

  const requested = path.resolve(process.cwd(), env.uploadsPath || "./uploads");
  if (tryEnsureDir(requested)) {
    resolvedUploadsPathCache = requested;
    return resolvedUploadsPathCache;
  }

  if (env.isProduction) {
    throw new Error(`Production uploads path unavailable: ${requested}. Must be writable under /var/data/uploads.`);
  }

  const fallback = path.resolve(process.cwd(), "./uploads");
  tryEnsureDir(fallback);
  resolvedUploadsPathCache = fallback;
  return resolvedUploadsPathCache;
}
