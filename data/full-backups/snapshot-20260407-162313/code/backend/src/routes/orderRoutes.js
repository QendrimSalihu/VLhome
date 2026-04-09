import { Router } from "express";
import { orderController } from "../controllers/orderController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAdminAuth } from "../middleware/requireAdminAuth.js";
import { createRateLimiter } from "../middleware/rateLimit.js";

const router = Router();

const createOrderRateLimit = createRateLimiter({
  keyPrefix: "create-order",
  windowMs: 10 * 60 * 1000,
  max: 25,
  message: "Shume kerkesa porosie. Provo perseri pas pak."
});

router.get("/", requireAdminAuth, asyncHandler(orderController.list));
router.get("/:id", requireAdminAuth, asyncHandler(orderController.get));
router.post("/", createOrderRateLimit, asyncHandler(orderController.create));
router.delete("/", requireAdminAuth, asyncHandler(orderController.removeAll));
router.patch("/:id/status", requireAdminAuth, asyncHandler(orderController.updateStatus));
router.delete("/:id", requireAdminAuth, asyncHandler(orderController.remove));

export default router;
