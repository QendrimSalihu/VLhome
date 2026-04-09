import { Router } from "express";
import { deliveryZoneController } from "../controllers/deliveryZoneController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = Router();

router.get("/", asyncHandler(deliveryZoneController.list));

export default router;
