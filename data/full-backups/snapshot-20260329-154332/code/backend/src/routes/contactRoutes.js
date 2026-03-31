import { Router } from "express";
import { contactController } from "../controllers/contactController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAdminAuth } from "../middleware/requireAdminAuth.js";

const router = Router();

router.get("/", requireAdminAuth, asyncHandler(contactController.list));
router.post("/", asyncHandler(contactController.create));
router.post("/delete", requireAdminAuth, asyncHandler(contactController.removeByBody));
router.delete("/", requireAdminAuth, asyncHandler(contactController.removeByQuery));
router.delete("/:id", requireAdminAuth, asyncHandler(contactController.remove));

export default router;
