import {Router} from "express";
import {getAllapis,getApiById,createApi,updateApi,deleteApi} from "../controllers/apiController.ts";
import {authenticate } from "../middleware/authMiddleware.ts";
export const router: Router = Router();

router.get("/",authenticate,getAllapis);
router.get("/:id",authenticate,getApiById);
router.post("/",authenticate,createApi);
router.put("/:id",authenticate,updateApi);
router.delete("/:id",authenticate,deleteApi);
