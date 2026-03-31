import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAdminAuth } from "../middleware/requireAdminAuth.js";
import { whatsappMessageController } from "../controllers/whatsappMessageController.js";
import { createRateLimiter } from "../middleware/rateLimit.js";

const router = Router();

const whatsappRateLimit = createRateLimiter({
  keyPrefix: "whatsapp-create",
  windowMs: 10 * 60 * 1000,
  max: 20,
  message: "Shume kerkesave WhatsApp ne kohe te shkurter. Provo perseri pas pak."
});

router.get("/", requireAdminAuth, asyncHandler(whatsappMessageController.list));
router.post("/", whatsappRateLimit, asyncHandler(whatsappMessageController.create));
router.delete("/:id", requireAdminAuth, asyncHandler(whatsappMessageController.remove));

export default router;
