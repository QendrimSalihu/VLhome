import { createFullProjectBackup } from "../utils/autoBackup.js";

try {
  const result = await createFullProjectBackup("manual_now");
  console.log("Manual backup created:");
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error("Manual backup failed:", error?.message || error);
  process.exit(1);
}
