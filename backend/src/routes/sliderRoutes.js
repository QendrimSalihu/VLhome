import { Router } from "express";
import { sliderController } from "../controllers/sliderController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAdminAuth } from "../middleware/requireAdminAuth.js";
import { cacheGet, withCacheInvalidation } from "../middleware/responseCache.js";

const router = Router();

router.get("/", cacheGet({ ttlSeconds: 300 }), asyncHandler(sliderController.list));
router.post("/", requireAdminAuth, asyncHandler(withCacheInvalidation(sliderController.create, ["/api/slides"])));
router.delete("/:id", requireAdminAuth, asyncHandler(withCacheInvalidation(sliderController.remove, ["/api/slides"])));

export default router;
