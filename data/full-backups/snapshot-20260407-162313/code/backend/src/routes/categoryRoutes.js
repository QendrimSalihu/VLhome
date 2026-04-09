import { Router } from "express";
import { categoryController } from "../controllers/categoryController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAdminAuth } from "../middleware/requireAdminAuth.js";

const router = Router();

router.get("/", asyncHandler(categoryController.list));
router.post("/", requireAdminAuth, asyncHandler(categoryController.create));
router.put("/:id", requireAdminAuth, asyncHandler(categoryController.update));
router.delete("/:id", requireAdminAuth, asyncHandler(categoryController.remove));

export default router;
