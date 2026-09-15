import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware.ts";
import { addCredit, getPaymentHistory } from "../controllers/transactionsController.ts";
export const router : Router = Router();


router.post("/add-credit",authenticate,addCredit);
router.get("/",authenticate,getPaymentHistory);