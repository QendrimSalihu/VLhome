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
    const resolved = getResolvedDbPath();
    const dbDir = path.dirname(resolved);
    try {
      fs.mkdirSync(dbDir, { recursive: true });
    } catch (error) {
      const code = String(error?.code || "");
      // In production on Render, /var/data may already exist and mkdir can fail due fs policy.
      // If directory is present, continue safely instead of crashing startup.
      if (!["EACCES", "EPERM", "EROFS"].includes(code) || !fs.existsSync(dbDir)) {
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
