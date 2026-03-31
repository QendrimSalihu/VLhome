import { Router } from "express";
import { settingController } from "../controllers/settingController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAdminAuth } from "../middleware/requireAdminAuth.js";

const router = Router();

router.get("/", asyncHandler(settingController.get));
router.put("/", requireAdminAuth, asyncHandler(settingController.update));

export default router;
