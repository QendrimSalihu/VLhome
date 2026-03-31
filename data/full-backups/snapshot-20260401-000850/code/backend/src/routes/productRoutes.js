import { Router } from "express";
import { productController } from "../controllers/productController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAdminAuth } from "../middleware/requireAdminAuth.js";

const router = Router();

router.get("/", asyncHandler(productController.list));
router.get("/:id", asyncHandler(productController.get));
router.delete("/", requireAdminAuth, asyncHandler(productController.removeAll));
router.post("/", requireAdminAuth, asyncHandler(productController.create));
router.put("/:id", requireAdminAuth, asyncHandler(productController.update));
router.delete("/:id", requireAdminAuth, asyncHandler(productController.remove));
router.post("/:id/like", asyncHandler(productController.like));
router.post("/:id/unlike", asyncHandler(productController.unlike));

export default router;
