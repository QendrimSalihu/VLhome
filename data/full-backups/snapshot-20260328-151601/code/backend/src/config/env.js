import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 4000),
  dbPath: process.env.DB_PATH || "./data/vlera.sqlite",
  frontendOrigin: process.env.FRONTEND_ORIGIN || "*",
  uploadsPath: process.env.UPLOADS_PATH || "./uploads"
};
