import { Router } from "express";
import { getAllModelProviderMappings, getModelProviderMappingById } from "../controllers/modelProviderMappingController.ts";

export const router: Router = Router();

router.get("/", getAllModelProviderMappings);
router.get("/:id", getModelProviderMappingById);
