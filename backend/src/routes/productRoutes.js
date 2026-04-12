import { Router } from "express";
import { productController } from "../controllers/productController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAdminAuth } from "../middleware/requireAdminAuth.js";
import { cacheGet, withCacheInvalidation } from "../middleware/responseCache.js";

const router = Router();

const productCachePrefixes = ["/api/products", "/api/categories"];

router.get("/", cacheGet({ ttlSeconds: 90 }), asyncHandler(productController.list));
router.get("/:id", cacheGet({ ttlSeconds: 300 }), asyncHandler(productController.get));
router.delete("/", requireAdminAuth, asyncHandler(withCacheInvalidation(productController.removeAll, productCachePrefixes)));
router.post("/", requireAdminAuth, asyncHandler(withCacheInvalidation(productController.create, productCachePrefixes)));
router.put("/:id", requireAdminAuth, asyncHandler(withCacheInvalidation(productController.update, productCachePrefixes)));
router.delete("/:id", requireAdminAuth, asyncHandler(withCacheInvalidation(productController.remove, productCachePrefixes)));
router.post("/:id/like", asyncHandler(withCacheInvalidation(productController.like, ["/api/products"])));
router.post("/:id/unlike", asyncHandler(withCacheInvalidation(productController.unlike, ["/api/products"])));

export default router;
