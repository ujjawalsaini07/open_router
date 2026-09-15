import {Router} from "express";
import {getAllCompanies,getCompanyById} from "../controllers/companyController.ts";
export const router: Router = Router();


router.get("/",getAllCompanies);
router.get("/:companyId",getCompanyById);

