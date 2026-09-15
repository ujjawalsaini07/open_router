import { Router } from "express";
import { getAllModelProviderMappings} from "../controllers/modelProviderMappingController.ts";

export const router: Router = Router();

router.get("/", getAllModelProviderMappings);

