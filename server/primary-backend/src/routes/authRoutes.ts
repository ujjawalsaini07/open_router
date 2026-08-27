import {Router} from "express";
import { loginController ,logout,signupController } from "../controller/authController.ts";
import { authenticate } from "../middlewares/authMiddleware.ts";


export const router: Router = Router();

router.post("/login", loginController);
router.post("/signup", signupController);
router.get("/logout",authenticate,logout);
