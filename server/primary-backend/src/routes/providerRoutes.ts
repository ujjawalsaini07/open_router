import { Router } from "express";
import { getAllProviders, getProviderById } from "../controllers/providerController.ts";

export const router : Router = Router();

router.get("/" , getAllProviders);
router.get("/:id" , getProviderById);
