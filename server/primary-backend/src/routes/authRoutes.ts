import {Router} from "express";
import { loginController ,logout,signupController } from "../controllers/authController.ts";
import { authenticate } from "../middleware/authMiddleware.ts";


export const router: Router = Router();

router.post("/login", loginController);
router.post("/signup", signupController);
router.post("/logout",authenticate,logout);
