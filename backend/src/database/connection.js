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
    let resolved = requestedResolvedPath;
    let dbDir = path.dirname(resolved);
    try {
      fs.mkdirSync(dbDir, { recursive: true });
    } catch (error) {
      const code = String(error?.code || "");
      const permissionError = ["EACCES", "EPERM", "EROFS"].includes(code);
      const dirExists = fs.existsSync(dbDir);

      // In production, if /var/data is unavailable, keep service alive by switching
      // to a local fallback DB path instead of crashing startup.
      if (permissionError && !dirExists && env.isProduction) {
        const fallback = getFallbackDbPath();
        const fallbackDir = path.dirname(fallback);
        fs.mkdirSync(fallbackDir, { recursive: true });
        resolved = fallback;
        dbDir = fallbackDir;
        resolvedDbPathCache = fallback;
        console.warn(`DB storage path unavailable (${requestedResolvedPath}). Using fallback DB: ${fallback}`);
      } else if (!permissionError || !dirExists) {
        throw error;
      }
    }

    dbPromise = open({
      filename: resolved,
      driver: sqlite3.Database
    });
  }
  return dbPromise;
}
