import { Router } from "express";
import { sliderController } from "../controllers/sliderController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAdminAuth } from "../middleware/requireAdminAuth.js";

const router = Router();

router.get("/", asyncHandler(sliderController.list));
router.post("/", requireAdminAuth, asyncHandler(sliderController.create));
router.delete("/:id", requireAdminAuth, asyncHandler(sliderController.remove));

export default router;
