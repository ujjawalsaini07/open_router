import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware.ts";
import { getAllConversations, getConversationById } from "../controllers/conversationsController.ts";

export const router: Router = Router();

router.get("/", authenticate, getAllConversations);
router.get("/:id", authenticate, getConversationById);
