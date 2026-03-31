import { Router } from "express";
import { settingController } from "../controllers/settingController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = Router();

router.get("/", asyncHandler(settingController.get));
router.put("/", asyncHandler(settingController.update));

export default router;

