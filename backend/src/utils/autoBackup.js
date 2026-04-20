import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { getResolvedDbPath } from "../database/connection.js";
import { getResolvedUploadsPath } from "../storage/uploadsPath.js";

function stamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

function prettyStamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(d.getHours())}-${p(d.getMinutes())}-${p(d.getSeconds())}`;
}

function safeReason(reason = "auto") {
  return String(reason || "auto").replace(/[^a-zA-Z0-9_-]/g, "_");
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

function archiveUploads(uploadsDir, archivePath) {
  const run = spawnSync("tar", ["-czf", archivePath, "-C", uploadsDir, "."], {
    stdio: "pipe"
  });
  if (run.status !== 0) {
    const stderr = String(run.stderr || "").trim();
    throw new Error(stderr || "tar command failed");
  }
}

function writeManifest(filePath, payload) {
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), "utf8");
}

export function createFullProjectBackup(reason = "manual") {
  const dbFile = getResolvedDbPath();
  const uploadsDir = getResolvedUploadsPath();
  const backupDir = path.resolve(path.dirname(dbFile), "backups");
  fs.mkdirSync(backupDir, { recursive: true });

  const ts = prettyStamp();
  const reasonSafe = safeReason(reason);
  const dbBaseName = `vlera-db-${ts}-${reasonSafe}.sqlite`;
  const uploadsBaseName = `vlera-uploads-${ts}-${reasonSafe}.tar.gz`;
  const manifestBaseName = `vlera-manifest-${ts}-${reasonSafe}.json`;

  const dbTarget = path.join(backupDir, dbBaseName);
  const uploadsTarget = path.join(backupDir, uploadsBaseName);
  const manifestTarget = path.join(backupDir, manifestBaseName);

  if (fs.existsSync(dbFile)) {
    fs.copyFileSync(dbFile, dbTarget);
  } else {
    throw new Error(`DB file not found: ${dbFile}`);
  }

  const walFile = `${dbFile}-wal`;
  const shmFile = `${dbFile}-shm`;
  if (fs.existsSync(walFile)) fs.copyFileSync(walFile, `${dbTarget}-wal`);
  if (fs.existsSync(shmFile)) fs.copyFileSync(shmFile, `${dbTarget}-shm`);

  archiveUploads(uploadsDir, uploadsTarget);

  const payload = {
    created_at: new Date().toISOString(),
    reason: reasonSafe,
    db_source: dbFile,
    uploads_source: uploadsDir,
    db_backup: dbTarget,
    uploads_backup: uploadsTarget
  };
  writeManifest(manifestTarget, payload);

  return {
    dbTarget,
    uploadsTarget,
    manifestTarget
  };
}

function cleanupOldDailyBackups(backupDir, keepDays = 30) {
  try {
    const threshold = Date.now() - keepDays * 24 * 60 * 60 * 1000;
    const entries = fs.readdirSync(backupDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile()) continue;
      if (!entry.name.startsWith("vlera-") || !entry.name.includes("-daily_auto")) continue;
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
    let backupDir = "";
    try {
      const result = createFullProjectBackup("daily_auto");
      backupDir = path.dirname(result.dbTarget);
    } catch (error) {
      console.warn("Daily full backup failed:", error.message);
      return;
    }
    try {
      const dbFile = getResolvedDbPath();
      const targetDir = backupDir || path.resolve(path.dirname(dbFile), "backups");
      cleanupOldDailyBackups(targetDir, keepDays);
    } catch (error) {
      console.warn("Daily backup cleanup failed:", error.message);
    }
  };

  run();
  const timer = setInterval(run, intervalMs);
  timer.unref?.();
  return timer;
}
