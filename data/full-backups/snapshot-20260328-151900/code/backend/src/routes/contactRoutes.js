import { Router } from "express";
import { contactController } from "../controllers/contactController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = Router();

router.get("/", asyncHandler(contactController.list));
router.post("/", asyncHandler(contactController.create));

export default router;

