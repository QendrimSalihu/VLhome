import app from "./app.js";
import { env } from "./config/env.js";
import { initDatabase } from "./database/init.js";

async function start() {
  await initDatabase();
  app.listen(env.port, () => {
    console.log(`Backend running on http://localhost:${env.port}`);
  });
}

start().catch((error) => {
  console.error("Failed to start backend:", error);
  process.exit(1);
});
