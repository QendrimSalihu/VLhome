import { Router } from "express";
import { deliveryZoneController } from "../controllers/deliveryZoneController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { cacheGet } from "../middleware/responseCache.js";

const router = Router();

router.get("/", cacheGet({ ttlSeconds: 300 }), asyncHandler(deliveryZoneController.list));

export default router;
