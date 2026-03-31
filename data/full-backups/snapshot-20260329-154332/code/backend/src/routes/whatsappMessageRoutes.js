import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAdminAuth } from "../middleware/requireAdminAuth.js";
import { whatsappMessageController } from "../controllers/whatsappMessageController.js";

const router = Router();

router.get("/", requireAdminAuth, asyncHandler(whatsappMessageController.list));
router.post("/", asyncHandler(whatsappMessageController.create));
router.delete("/:id", requireAdminAuth, asyncHandler(whatsappMessageController.remove));

export default router;

