import { Router } from "express";
import { contactController } from "../controllers/contactController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAdminAuth } from "../middleware/requireAdminAuth.js";
import { createRateLimiter } from "../middleware/rateLimit.js";

const router = Router();

const contactRateLimit = createRateLimiter({
  keyPrefix: "contact-create",
  windowMs: 10 * 60 * 1000,
  max: 20,
  message: "Shume mesazhe ne kohe te shkurter. Provo perseri pas pak."
});

router.get("/", requireAdminAuth, asyncHandler(contactController.list));
router.post("/", contactRateLimit, asyncHandler(contactController.create));
router.post("/delete", requireAdminAuth, asyncHandler(contactController.removeByBody));
router.delete("/", requireAdminAuth, asyncHandler(contactController.removeByQuery));
router.delete("/:id", requireAdminAuth, asyncHandler(contactController.remove));

export default router;
