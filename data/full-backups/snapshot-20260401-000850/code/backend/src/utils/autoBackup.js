import fs from "node:fs";
import path from "node:path";
import { env } from "../config/env.js";

function stamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

export function createDatabaseBackup(reason = "auto-change") {
  try {
    const dbFile = path.resolve(process.cwd(), env.dbPath);
    const dbDir = path.dirname(dbFile);
    const backupDir = path.resolve(dbDir, "backups");
    fs.mkdirSync(backupDir, { recursive: true });

    const ts = stamp();
    const baseName = `vlera-${ts}-${reason.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
    const dbTarget = path.join(backupDir, `${baseName}.sqlite`);

    if (fs.existsSync(dbFile)) {
      fs.copyFileSync(dbFile, dbTarget);
    }
    const walFile = `${dbFile}-wal`;
    if (fs.existsSync(walFile)) {
      fs.copyFileSync(walFile, `${dbTarget}-wal`);
    }
    const shmFile = `${dbFile}-shm`;
    if (fs.existsSync(shmFile)) {
      fs.copyFileSync(shmFile, `${dbTarget}-shm`);
    }
  } catch (error) {
    console.error("Auto-backup failed:", error.message);
  }
}
