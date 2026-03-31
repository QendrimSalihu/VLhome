import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "node:path";
import { env } from "./config/env.js";
import healthRoutes from "./routes/healthRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import sliderRoutes from "./routes/sliderRoutes.js";
import deliveryZoneRoutes from "./routes/deliveryZoneRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import whatsappMessageRoutes from "./routes/whatsappMessageRoutes.js";
import settingRoutes from "./routes/settingRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import { notFound } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();
const configuredOrigins = String(env.frontendOrigin || "")
  .split(",")
  .map((x) => x.trim())
  .filter((x) => x && x !== "*");
const allowedOrigins = configuredOrigins.length
  ? configuredOrigins
  : ["http://localhost:5500", "http://127.0.0.1:5500"];

function isPrivateDevOrigin(origin) {
  if (!origin) return false;
  try {
    const url = new URL(origin);
    const host = String(url.hostname || "").toLowerCase();
    if (host === "localhost" || host === "127.0.0.1") return true;
    if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
    if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
    if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
    return false;
  } catch {
    return false;
  }
}

const corsOrigin = (origin, callback) => {
  if (!origin) return callback(null, true);
  if (allowedOrigins.includes(origin)) {
    return callback(null, true);
  }
  if (!env.isProduction && isPrivateDevOrigin(origin)) {
    return callback(null, true);
  }
  return callback(null, false);
};

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
  })
);
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(morgan("dev"));
app.use(express.json({ limit: "5mb" }));

app.use("/uploads", express.static(path.resolve(process.cwd(), env.uploadsPath)));

app.use("/api/health", healthRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/slides", sliderRoutes);
app.use("/api/delivery-zones", deliveryZoneRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/whatsapp-messages", whatsappMessageRoutes);
app.use("/api/settings", settingRoutes);
app.use("/api/admin", adminRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
