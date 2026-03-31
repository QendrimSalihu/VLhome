import { Router } from "express";
import { customerController } from "../controllers/customerController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = Router();

router.get("/", asyncHandler(customerController.list));
router.delete("/:id", asyncHandler(customerController.remove));

export default router;
