import fs from "node:fs";
import path from "node:path";
import { getResolvedDbPath } from "../database/connection.js";

function stamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

export function createDatabaseBackup(reason = "auto-change") {
  try {
    const dbFile = getResolvedDbPath();
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

function cleanupOldDailyBackups(backupDir, keepDays = 30) {
  try {
    const threshold = Date.now() - keepDays * 24 * 60 * 60 * 1000;
    const entries = fs.readdirSync(backupDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile()) continue;
      if (!entry.name.startsWith("vlera-") || !entry.name.includes("-daily_")) continue;
      const filePath = path.join(backupDir, entry.name);
      const stat = fs.statSync(filePath);
      if (stat.mtimeMs < threshold) {
        fs.unlinkSync(filePath);
      }
    }
  } catch (error) {
    console.warn("Daily backup cleanup skipped:", error.message);
  }
}

export function startDailyBackupScheduler({
  keepDays = 30,
  intervalMs = 24 * 60 * 60 * 1000
} = {}) {
  const run = () => {
    createDatabaseBackup("daily_auto");
    try {
      const dbFile = getResolvedDbPath();
      const backupDir = path.resolve(path.dirname(dbFile), "backups");
      cleanupOldDailyBackups(backupDir, keepDays);
    } catch (error) {
      console.warn("Daily backup cleanup failed:", error.message);
    }
  };

  run();
  const timer = setInterval(run, intervalMs);
  timer.unref?.();
  return timer;
}
