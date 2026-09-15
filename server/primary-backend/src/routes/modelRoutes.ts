import { Router } from "express";
import { getAllModels, getModelById } from "../controllers/modelController.ts";

export const router: Router = Router();

router.get("/", getAllModels);
router.get("/:id", getModelById);
