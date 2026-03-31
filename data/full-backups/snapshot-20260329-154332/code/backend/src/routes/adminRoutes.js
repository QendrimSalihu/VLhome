import { Router } from "express";
import { adminController } from "../controllers/adminController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = Router();

router.post("/login", asyncHandler(adminController.login));

export default router;
