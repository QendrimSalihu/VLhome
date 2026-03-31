import { Router } from "express";
import { orderController } from "../controllers/orderController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = Router();

router.get("/", asyncHandler(orderController.list));
router.get("/:id", asyncHandler(orderController.get));
router.post("/", asyncHandler(orderController.create));
router.patch("/:id/status", asyncHandler(orderController.updateStatus));
router.delete("/:id", asyncHandler(orderController.remove));

export default router;
