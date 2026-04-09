import { Router } from "express";
import { customerController } from "../controllers/customerController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAdminAuth } from "../middleware/requireAdminAuth.js";

const router = Router();

router.get("/", requireAdminAuth, asyncHandler(customerController.list));
router.delete("/:id", requireAdminAuth, asyncHandler(customerController.remove));

export default router;
