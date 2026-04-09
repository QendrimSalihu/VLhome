import dotenv from "dotenv";

dotenv.config();

const nodeEnv = process.env.NODE_ENV || "development";
const isProduction = nodeEnv === "production";

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
  dbPath: readEnv("DB_PATH", { fallback: "./data/vlera.sqlite" }),
  frontendOrigin: readEnv("FRONTEND_ORIGIN", {
    fallback: "http://localhost:5500,http://127.0.0.1:5500",
    requiredInProduction: true
  }),
  uploadsPath: readEnv("UPLOADS_PATH", { fallback: "./uploads" }),
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

if (env.isProduction && String(env.frontendOrigin).split(",").map((x) => x.trim()).includes("*")) {
  throw new Error("FRONTEND_ORIGIN cannot use '*' in production. Set your real frontend domain.");
}
