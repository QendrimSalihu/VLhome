import fs from "node:fs";
import path from "node:path";
import { env } from "../config/env.js";
import { createDatabaseBackup } from "./autoBackup.js";

function stamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copyFileSafe(src, dest) {
  if (!fs.existsSync(src)) return;
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

function copyDirRecursive(src, dest, skip = new Set()) {
  if (!fs.existsSync(src)) return;
  ensureDir(dest);
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (skip.has(entry.name)) continue;
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath, skip);
    } else if (entry.isFile()) {
      copyFileSafe(srcPath, destPath);
    }
  }
}

function writeManifest(targetDir, payload) {
  const file = path.join(targetDir, "manifest.json");
  fs.writeFileSync(file, JSON.stringify(payload, null, 2), "utf8");
}

function runFullBackup() {
  const ts = stamp();
  const backendRoot = process.cwd();
  const projectRoot = path.resolve(backendRoot, "..");

  const backupsRoot = path.resolve(projectRoot, "data", "full-backups");
  const backupDir = path.join(backupsRoot, `snapshot-${ts}`);
  ensureDir(backupDir);

  // 1) DB backup (reuses existing auto-backup logic)
  createDatabaseBackup("manual_full_backup");

  const dbFile = path.resolve(backendRoot, env.dbPath);
  const dbMirrorDir = path.join(backupDir, "database");
  ensureDir(dbMirrorDir);
  copyFileSafe(dbFile, path.join(dbMirrorDir, "vlera.sqlite"));
  copyFileSafe(`${dbFile}-wal`, path.join(dbMirrorDir, "vlera.sqlite-wal"));
  copyFileSafe(`${dbFile}-shm`, path.join(dbMirrorDir, "vlera.sqlite-shm"));

  // 2) Uploads backup
  const uploadsDir = path.resolve(backendRoot, env.uploadsPath);
  copyDirRecursive(uploadsDir, path.join(backupDir, "uploads"));

  // 3) Code snapshot backup (without heavy/runtime folders)
  const skip = new Set(["node_modules", ".git", "data", "dist", "build", ".vercel"]);
  copyDirRecursive(path.join(projectRoot, "backend"), path.join(backupDir, "code", "backend"), skip);
  copyDirRecursive(path.join(projectRoot, "vlera-frontend"), path.join(backupDir, "code", "vlera-frontend"), skip);
  copyFileSafe(path.join(projectRoot, "render.yaml"), path.join(backupDir, "code", "render.yaml"));
  copyFileSafe(path.join(projectRoot, "vercel.json"), path.join(backupDir, "code", "vercel.json"));

  writeManifest(backupDir, {
    created_at: new Date().toISOString(),
    backup_dir: backupDir,
    includes: {
      database: dbFile,
      uploads: uploadsDir,
      code_paths: [path.join(projectRoot, "backend"), path.join(projectRoot, "vlera-frontend")]
    }
  });

  console.log(`Full backup completed: ${backupDir}`);
}

runFullBackup();

