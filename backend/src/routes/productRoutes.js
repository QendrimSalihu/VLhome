import { Router } from "express";
import { productController } from "../controllers/productController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAdminAuth } from "../middleware/requireAdminAuth.js";
import { withCacheInvalidation } from "../middleware/responseCache.js";

const router = Router();

const productCachePrefixes = ["/api/products", "/api/categories"];

router.get("/", asyncHandler(productController.list));
router.get("/:id", asyncHandler(productController.get));
router.post("/", requireAdminAuth, asyncHandler(withCacheInvalidation(productController.create, productCachePrefixes)));
router.put("/:id", requireAdminAuth, asyncHandler(withCacheInvalidation(productController.update, productCachePrefixes)));
router.delete("/:id", requireAdminAuth, asyncHandler(withCacheInvalidation(productController.remove, productCachePrefixes)));
router.post("/:id/like", asyncHandler(withCacheInvalidation(productController.like, ["/api/products"])));
router.post("/:id/unlike", asyncHandler(withCacheInvalidation(productController.unlike, ["/api/products"])));

export default router;
