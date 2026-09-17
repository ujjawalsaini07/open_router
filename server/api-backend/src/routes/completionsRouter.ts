import { Router } from "express";
import { chat } from "../controllers/completionsController.ts";
import { authenticate, checkAuthHeader } from "../middleware/authMiddleware.ts";
import { checkApiKey } from "../middleware/checkApiKeyMiddleware.ts";

export const router: Router = Router();

router.use(authenticate); // verifies the JWT cookie and sets req.user
router.use(checkAuthHeader); // reads the Bearer api key and sets req.user.apikey; needs req.user from authenticate
router.use(checkApiKey); // looks up req.user.apikey in the db and checks it belongs to req.user.userId


router.post("/chat", chat); // handles the chat request
