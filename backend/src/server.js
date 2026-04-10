import app from "./app.js";
import { env } from "./config/env.js";
import { initDatabase } from "./database/init.js";
import { optimizeExistingUploads } from "./utils/optimizeExistingUploads.js";

async function start() {
  await initDatabase();

  try {
    const stats = await optimizeExistingUploads({ uploadsPath: env.uploadsPath });
    if (stats?.skipped) {
      console.log(`Upload optimization skipped (${stats.reason}).`);
    } else {
      const savedKB = Math.max(0, (Number(stats.beforeBytes || 0) - Number(stats.afterBytes || 0)) / 1024);
      console.log(
        `Upload optimization done: scanned=${stats.scanned}, optimized=${stats.optimized}, saved=${savedKB.toFixed(1)}KB`
      );
    }
  } catch (error) {
    console.warn("Upload optimization skipped due to error:", error?.message || error);
  }

  app.listen(env.port, () => {
    console.log(`Backend running on http://localhost:${env.port}`);
  });
}

start().catch((error) => {
  console.error("Failed to start backend:", error);
  process.exit(1);
});
