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
import settingRoutes from "./routes/settingRoutes.js";
import { notFound } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
  })
);
app.use(cors({ origin: true }));
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
app.use("/api/settings", settingRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
