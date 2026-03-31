import { Router } from "express";
import { productController } from "../controllers/productController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = Router();

router.get("/", asyncHandler(productController.list));
router.get("/:id", asyncHandler(productController.get));
router.post("/", asyncHandler(productController.create));
router.put("/:id", asyncHandler(productController.update));
router.delete("/:id", asyncHandler(productController.remove));
router.post("/:id/like", asyncHandler(productController.like));
router.post("/:id/unlike", asyncHandler(productController.unlike));

export default router;
