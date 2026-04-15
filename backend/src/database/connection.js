import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { env } from "../config/env.js";

let dbPromise;
const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
let resolvedDbPathCache = "";
let fallbackDbPathCache = "";

export function resolveAppPath(inputPath) {
  return path.isAbsolute(inputPath) ? inputPath : path.resolve(backendRoot, inputPath);
}

export function getResolvedDbPath() {
  if (!resolvedDbPathCache) {
    resolvedDbPathCache = resolveAppPath(env.dbPath);
  }
  return resolvedDbPathCache;
}

function getFallbackDbPath() {
  if (!fallbackDbPathCache) {
    fallbackDbPathCache = path.resolve(backendRoot, "data", "vlera-fallback.sqlite");
  }
  return fallbackDbPathCache;
}

export function getDb() {
  if (!dbPromise) {
    const requestedResolvedPath = getResolvedDbPath();
    const openAtPath = async (filePath) =>
      open({
        filename: filePath,
        driver: sqlite3.Database
      });

    dbPromise = (async () => {
      // First try the configured DB path (Render disk path in production).
      try {
        const requestedDir = path.dirname(requestedResolvedPath);
        // Create directory only when path is not /var/data production mount.
        if (!(env.isProduction && requestedResolvedPath.replace(/\\/g, "/").startsWith("/var/data/"))) {
          fs.mkdirSync(requestedDir, { recursive: true });
        }
        return await openAtPath(requestedResolvedPath);
      } catch (error) {
        if (!env.isProduction) throw error;

        // Production fallback only if configured storage is unavailable.
        const fallback = getFallbackDbPath();
        const fallbackDir = path.dirname(fallback);
        fs.mkdirSync(fallbackDir, { recursive: true });
        resolvedDbPathCache = fallback;
        console.warn(`DB storage path unavailable (${requestedResolvedPath}). Using fallback DB: ${fallback}`);
        return openAtPath(fallback);
      }
    })();
  }
  return dbPromise;
}
