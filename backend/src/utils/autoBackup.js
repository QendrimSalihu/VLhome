import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { getResolvedDbPath } from "../database/connection.js";
import { getResolvedUploadsPath } from "../storage/uploadsPath.js";

const BACKUP_RETENTION_RULES = [
  { label: "daily db", pattern: /^vlera-db-.*-daily_auto\.sqlite$/i, keepLatest: 7 },
  { label: "daily uploads", pattern: /^vlera-uploads-.*-daily_auto\.tar\.gz$/i, keepLatest: 7 },
  { label: "daily manifest", pattern: /^vlera-manifest-.*-daily_auto\.json$/i, keepLatest: 7 },
  { label: "manual db", pattern: /^vlera-db-.*-manual_now\.sqlite$/i, keepLatest: 5 },
  { label: "manual uploads", pattern: /^vlera-uploads-.*-manual_now\.tar\.gz$/i, keepLatest: 5 },
  { label: "manual manifest", pattern: /^vlera-manifest-.*-manual_now\.json$/i, keepLatest: 5 },
  // High-frequency change snapshots (product/category/order/like/slide etc).
  { label: "change snapshots", pattern: /^vlera-\d{8}-?\d{6}-.+\.sqlite$/i, keepLatest: 120 },
  // Legacy sidecar files from previous backup style are not needed.
  { label: "legacy wal snapshots", pattern: /^vlera-.*\.sqlite-wal$/i, keepLatest: 0 },
  { label: "legacy shm snapshots", pattern: /^vlera-.*\.sqlite-shm$/i, keepLatest: 0 }
];

let retentionTick = 0;

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

function toSqliteLiteral(value) {
  return String(value).replace(/'/g, "''");
}

async function createConsistentSqliteSnapshot(sourceDbPath, targetDbPath) {
  if (!fs.existsSync(sourceDbPath)) {
    throw new Error(`DB file not found: ${sourceDbPath}`);
  }
  if (fs.existsSync(targetDbPath)) {
    fs.unlinkSync(targetDbPath);
  }

  const db = await open({
    filename: sourceDbPath,
    driver: sqlite3.Database
  });

  try {
    const targetLiteral = toSqliteLiteral(targetDbPath);
    await db.exec(`VACUUM INTO '${targetLiteral}'`);
  } finally {
    await db.close();
  }
}

export function createDatabaseBackup(reason = "auto-change") {
  void (async () => {
    const dbFile = getResolvedDbPath();
    const dbDir = path.dirname(dbFile);
    const backupDir = path.resolve(dbDir, "backups");
    fs.mkdirSync(backupDir, { recursive: true });

    const ts = stamp();
    const baseName = `vlera-${ts}-${reason.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
    const dbTarget = path.join(backupDir, `${baseName}.sqlite`);
    await createConsistentSqliteSnapshot(dbFile, dbTarget);
    maybeApplyBackupRetention(backupDir, { keepDays: 30 });
  })().catch((error) => {
    console.error("Auto-backup failed:", error?.message || error);
  });
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

export async function createFullProjectBackup(reason = "manual") {
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

  await createConsistentSqliteSnapshot(dbFile, dbTarget);

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

  maybeApplyBackupRetention(backupDir, { force: true, keepDays: 30 });

  return {
    dbTarget,
    uploadsTarget,
    manifestTarget
  };
}

function cleanupOldDailyBackups(backupDir, keepDays = 30) {
  let removed = 0;
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
        removed += 1;
      }
    }
  } catch (error) {
    console.warn("Daily backup cleanup skipped:", error.message);
  }
  return removed;
}

function pruneByCount(backupDir, { pattern, keepLatest = 0 }) {
  let removed = 0;
  const entries = fs
    .readdirSync(backupDir, { withFileTypes: true })
    .filter((e) => e.isFile() && pattern.test(e.name))
    .map((e) => {
      const filePath = path.join(backupDir, e.name);
      const stat = fs.statSync(filePath);
      return {
        filePath,
        mtimeMs: Number(stat.mtimeMs || 0)
      };
    })
    .sort((a, b) => b.mtimeMs - a.mtimeMs);

  const safeKeep = Math.max(0, Number(keepLatest || 0));
  for (const entry of entries.slice(safeKeep)) {
    fs.unlinkSync(entry.filePath);
    removed += 1;
  }
  return removed;
}

function applyBackupRetention(backupDir, { keepDays = 30 } = {}) {
  if (!backupDir || !fs.existsSync(backupDir)) return;
  let totalRemoved = 0;
  totalRemoved += cleanupOldDailyBackups(backupDir, keepDays);

  try {
    for (const rule of BACKUP_RETENTION_RULES) {
      totalRemoved += pruneByCount(backupDir, rule);
    }
  } catch (error) {
    console.warn("Backup retention rule pass skipped:", error.message);
  }

  if (totalRemoved > 0) {
    console.log(`Backup retention cleanup removed ${totalRemoved} file(s).`);
  }
}

function maybeApplyBackupRetention(backupDir, { force = false, keepDays = 30 } = {}) {
  retentionTick += 1;
  if (!force && retentionTick % 25 !== 0) return;
  try {
    applyBackupRetention(backupDir, { keepDays });
  } catch (error) {
    console.warn("Backup retention cleanup failed:", error.message);
  }
}

export function startDailyBackupScheduler({
  keepDays = 30,
  intervalMs = 24 * 60 * 60 * 1000
} = {}) {
  const run = async () => {
    let backupDir = "";
    try {
      const result = await createFullProjectBackup("daily_auto");
      backupDir = path.dirname(result.dbTarget);
    } catch (error) {
      console.warn("Daily full backup failed:", error.message);
      return;
    }
    try {
      const dbFile = getResolvedDbPath();
      const targetDir = backupDir || path.resolve(path.dirname(dbFile), "backups");
      maybeApplyBackupRetention(targetDir, { force: true, keepDays });
    } catch (error) {
      console.warn("Daily backup cleanup failed:", error.message);
    }
  };

  void run();
  const timer = setInterval(() => {
    void run();
  }, intervalMs);
  timer.unref?.();
  return timer;
}
