import { Router } from "express";
import { siteAnalyticsController } from "../controllers/siteAnalyticsController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAdminAuth } from "../middleware/requireAdminAuth.js";
import { createRateLimiter } from "../middleware/rateLimit.js";

const router = Router();
const eventRateLimit = createRateLimiter({
  keyPrefix: "site-analytics",
  windowMs: 10 * 60 * 1000,
  max: 120
});

router.post("/events", eventRateLimit, asyncHandler(siteAnalyticsController.record));
router.get("/summary", requireAdminAuth, asyncHandler(siteAnalyticsController.summary));

export default router;
