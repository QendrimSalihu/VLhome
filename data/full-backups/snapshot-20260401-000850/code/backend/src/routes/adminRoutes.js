import { Router } from "express";
import { adminController } from "../controllers/adminController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { createRateLimiter } from "../middleware/rateLimit.js";
import { requireAdminAuth } from "../middleware/requireAdminAuth.js";

const router = Router();

const loginRateLimit = createRateLimiter({
  keyPrefix: "admin-login",
  windowMs: 15 * 60 * 1000,
  max: 8,
  message: "Shume tentativa login. Provo perseri pas 15 minutash."
});

router.post("/login", loginRateLimit, asyncHandler(adminController.login));
router.get("/session", requireAdminAuth, asyncHandler(adminController.session));
router.post("/logout", asyncHandler(adminController.logout));

export default router;
