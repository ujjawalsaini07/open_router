import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware.ts";
import { addCredit } from "../controllers/transactionsController.ts";
export const router : Router = Router();


router.post("/add-credit",authenticate,addCredit);