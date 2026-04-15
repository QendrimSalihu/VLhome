import dotenv from "dotenv";

dotenv.config();

const nodeEnv = process.env.NODE_ENV || "development";
const isProduction = nodeEnv === "production";
const SAFE_PRODUCTION_ORIGINS = ["https://www.vlerahome.com", "https://vlerafrontend.vercel.app"];

function readEnv(name, { fallback = "", requiredInProduction = false } = {}) {
  const raw = process.env[name];
  const value = typeof raw === "string" ? raw.trim() : "";
  if (value) return value;
  if (requiredInProduction && isProduction) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return fallback;
}

export const env = {
  nodeEnv,
  isProduction,
  port: Number(process.env.PORT || 4000),
  dbPath: readEnv("DB_PATH", { fallback: isProduction ? "/var/data/vlera.sqlite" : "./data/vlera.sqlite" }),
  frontendOrigin: readEnv("FRONTEND_ORIGIN", {
    fallback: isProduction ? SAFE_PRODUCTION_ORIGINS.join(",") : "http://localhost:5500,http://127.0.0.1:5500",
    requiredInProduction: false
  }),
  uploadsPath: readEnv("UPLOADS_PATH", { fallback: isProduction ? "/var/data/uploads" : "./uploads" }),
  adminEmail: readEnv("ADMIN_EMAIL", {
    fallback: "qendrim.salihu.tr@gmail.com",
    requiredInProduction: true
  }),
  adminPassword: readEnv("ADMIN_PASSWORD", {
    fallback: "qendraternoc1",
    requiredInProduction: true
  }),
  adminTokenSecret: readEnv("ADMIN_TOKEN_SECRET", {
    fallback: "dev-only-secret-change-me",
    requiredInProduction: true
  }),
  adminCookieName: readEnv("ADMIN_COOKIE_NAME", {
    fallback: "vlera_admin_session",
    requiredInProduction: false
  }),
  adminTokenTtlHours: Number(process.env.ADMIN_TOKEN_TTL_HOURS || 24)
};

if (env.isProduction) {
  const origins = String(env.frontendOrigin)
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean)
    .filter((x) => x !== "*");

  if (origins.length === 0) {
    env.frontendOrigin = SAFE_PRODUCTION_ORIGINS.join(",");
    console.warn(`FRONTEND_ORIGIN was invalid in production. Falling back to: ${env.frontendOrigin}`);
  } else {
    env.frontendOrigin = origins.join(",");
  }

  const prodDb = String(env.dbPath || "").replace(/\\/g, "/");
  if (!prodDb.startsWith("/var/data/")) {
    env.dbPath = "/var/data/vlera.sqlite";
    console.warn(`DB_PATH was invalid in production. Falling back to: ${env.dbPath}`);
  }

  const prodUploads = String(env.uploadsPath || "").replace(/\\/g, "/");
  if (!prodUploads.startsWith("/var/data/")) {
    env.uploadsPath = "/var/data/uploads";
    console.warn(`UPLOADS_PATH was invalid in production. Falling back to: ${env.uploadsPath}`);
  }
}
