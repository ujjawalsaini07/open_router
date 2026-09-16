import { Router } from "express";
import { chat } from "../controllers/completionsController.ts";

export const router: Router = Router();

router.post("/", chat);

