import { Router } from "express";
import { orderController } from "../controllers/orderController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAdminAuth } from "../middleware/requireAdminAuth.js";

const router = Router();

router.get("/", requireAdminAuth, asyncHandler(orderController.list));
router.get("/:id", requireAdminAuth, asyncHandler(orderController.get));
router.post("/", asyncHandler(orderController.create));
router.delete("/", requireAdminAuth, asyncHandler(orderController.removeAll));
router.patch("/:id/status", requireAdminAuth, asyncHandler(orderController.updateStatus));
router.delete("/:id", requireAdminAuth, asyncHandler(orderController.remove));

export default router;
