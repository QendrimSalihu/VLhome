import fs from "node:fs";
import path from "node:path";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { env } from "../config/env.js";

let dbPromise;

export function getDb() {
  if (!dbPromise) {
    const resolved = path.resolve(process.cwd(), env.dbPath);
    fs.mkdirSync(path.dirname(resolved), { recursive: true });
    dbPromise = open({
      filename: resolved,
      driver: sqlite3.Database
    });
  }
  return dbPromise;
}
