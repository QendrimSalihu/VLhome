import { Router } from "express";
import { sliderController } from "../controllers/sliderController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = Router();

router.get("/", asyncHandler(sliderController.list));
router.post("/", asyncHandler(sliderController.create));
router.delete("/:id", asyncHandler(sliderController.remove));

export default router;
