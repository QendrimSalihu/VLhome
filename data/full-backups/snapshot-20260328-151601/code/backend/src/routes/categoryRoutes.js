import { Router } from "express";
import { categoryController } from "../controllers/categoryController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = Router();

router.get("/", asyncHandler(categoryController.list));
router.post("/", asyncHandler(categoryController.create));
router.put("/:id", asyncHandler(categoryController.update));
router.delete("/:id", asyncHandler(categoryController.remove));

export default router;
