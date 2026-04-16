import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { env } from "../config/env.js";

let dbPromise;
const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
let resolvedDbPathCache = "";

export function resolveAppPath(inputPath) {
  return path.isAbsolute(inputPath) ? inputPath : path.resolve(backendRoot, inputPath);
}

export function getResolvedDbPath() {
  if (!resolvedDbPathCache) {
    resolvedDbPathCache = resolveAppPath(env.dbPath);
  }
  return resolvedDbPathCache;
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
      const requestedDir = path.dirname(requestedResolvedPath);
      const normalizedPath = requestedResolvedPath.replace(/\\/g, "/");

      if (env.isProduction) {
        if (!normalizedPath.startsWith("/var/data/")) {
          throw new Error(`Unsafe production DB path: ${requestedResolvedPath}. Must be under /var/data/.`);
        }
      } else {
        fs.mkdirSync(requestedDir, { recursive: true });
      }

      try {
        return await openAtPath(requestedResolvedPath);
      } catch (error) {
        if (env.isProduction) {
          throw new Error(`Production DB open failed at ${requestedResolvedPath}: ${error?.message || error}`);
        }
        throw error;
      }
    })();
  }
  return dbPromise;
}
