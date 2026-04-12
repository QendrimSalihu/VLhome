import { Router } from "express";
import { categoryController } from "../controllers/categoryController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAdminAuth } from "../middleware/requireAdminAuth.js";
import { cacheGet, withCacheInvalidation } from "../middleware/responseCache.js";

const router = Router();

const categoryCachePrefixes = ["/api/categories", "/api/products"];

router.get("/", cacheGet({ ttlSeconds: 600 }), asyncHandler(categoryController.list));
router.post("/", requireAdminAuth, asyncHandler(withCacheInvalidation(categoryController.create, categoryCachePrefixes)));
router.put("/:id", requireAdminAuth, asyncHandler(withCacheInvalidation(categoryController.update, categoryCachePrefixes)));
router.delete("/:id", requireAdminAuth, asyncHandler(withCacheInvalidation(categoryController.remove, categoryCachePrefixes)));

export default router;
