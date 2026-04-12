import { Router } from "express";
import { settingController } from "../controllers/settingController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAdminAuth } from "../middleware/requireAdminAuth.js";
import { cacheGet, withCacheInvalidation } from "../middleware/responseCache.js";

const router = Router();

router.get("/", cacheGet({ ttlSeconds: 300 }), asyncHandler(settingController.get));
router.put("/", requireAdminAuth, asyncHandler(withCacheInvalidation(settingController.update, ["/api/settings"])));

export default router;
