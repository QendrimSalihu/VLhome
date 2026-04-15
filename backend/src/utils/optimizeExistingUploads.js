import fs from "node:fs/promises";
import path from "node:path";

const ALLOWED_EXT = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const MIN_SIZE_BYTES = 350 * 1024; // skip tiny files
const MAX_DIMENSION = 1600;
const MARKER_FILE = ".optimized-v1";

let sharpModule = null;
async function getSharp() {
  if (sharpModule) return sharpModule;
  const imported = await import("sharp");
  sharpModule = imported?.default || imported;
  return sharpModule;
}

function buildEncoder(ext) {
  if (ext === ".jpg" || ext === ".jpeg") {
    return (img) => img.jpeg({ quality: 80, mozjpeg: true });
  }
  if (ext === ".png") {
    return (img) => img.png({ compressionLevel: 9, adaptiveFiltering: true, palette: true, quality: 80 });
  }
  return (img) => img.webp({ quality: 80, effort: 5 });
}

async function optimizeOne(filePath, ext) {
  const sharp = await getSharp();
  const stat = await fs.stat(filePath);
  if (!stat.isFile() || stat.size < MIN_SIZE_BYTES) return { changed: false, before: stat.size, after: stat.size };

  const tempPath = `${filePath}.tmp-opt`;
  const encode = buildEncoder(ext);

  await encode(
    sharp(filePath)
      .rotate()
      .resize({
        width: MAX_DIMENSION,
        height: MAX_DIMENSION,
        fit: "inside",
        withoutEnlargement: true
      })
  ).toFile(tempPath);

  const outStat = await fs.stat(tempPath);
  // Replace only when we actually save meaningful space.
  if (outStat.size < stat.size * 0.98) {
    await fs.rename(tempPath, filePath);
    return { changed: true, before: stat.size, after: outStat.size };
  }

  await fs.unlink(tempPath).catch(() => {});
  return { changed: false, before: stat.size, after: stat.size };
}

export async function optimizeExistingUploads({ uploadsPath }) {
  const root = path.resolve(process.cwd(), uploadsPath || "./uploads");
  await fs.mkdir(root, { recursive: true });

  try {
    await getSharp();
  } catch {
    return { skipped: true, reason: "sharp_unavailable", root };
  }

  const markerPath = path.join(root, MARKER_FILE);
  try {
    await fs.access(markerPath);
    return { skipped: true, reason: "already_optimized", root };
  } catch {
    // first run
  }

  const files = await fs.readdir(root);
  let scanned = 0;
  let optimized = 0;
  let beforeTotal = 0;
  let afterTotal = 0;

  for (const name of files) {
    const ext = path.extname(name).toLowerCase();
    if (!ALLOWED_EXT.has(ext)) continue;
    const filePath = path.join(root, name);
    scanned += 1;
    try {
      const result = await optimizeOne(filePath, ext);
      beforeTotal += Number(result.before || 0);
      afterTotal += Number(result.after || 0);
      if (result.changed) optimized += 1;
    } catch {
      // Continue safely on per-file errors.
    }
  }

  const markerBody = JSON.stringify(
    {
      version: 1,
      optimized_at: new Date().toISOString(),
      scanned,
      optimized,
      before_bytes: beforeTotal,
      after_bytes: afterTotal
    },
    null,
    2
  );
  await fs.writeFile(markerPath, markerBody, "utf8");

  return {
    skipped: false,
    root,
    scanned,
    optimized,
    beforeBytes: beforeTotal,
    afterBytes: afterTotal
  };
}
