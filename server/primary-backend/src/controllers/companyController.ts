import type {Response, Request,NextFunction} from "express";
import {prisma} from "../config/dbConfig.ts";
import {z} from "zod";
import { buildPaginationMeta, paginationSchema } from "../utils/paginationUtils.ts";

const getAllCompaniesSchema = paginationSchema;

export const getAllCompanies = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
        const parsed = getAllCompaniesSchema.safeParse(req.query);
        if (!parsed.success) {
            res.status(400).json({ message: "Invalid query parameters" });
            return;
        }
        const { page, pageSize } = parsed.data;

        const [companies, totalCompanies] = await Promise.all([
            prisma.company.findMany({
                skip: (page - 1) * pageSize,
                take: pageSize
            }),
            prisma.company.count()
        ]);

        res.json({
            items: companies,
            pagination: buildPaginationMeta(page, pageSize, totalCompanies)
        });
    } catch (error) {
        next(error);
    }
};


const getCompanyByIdSchema = z.object({
    companyId: z.coerce.number().int().positive({ message: "Company ID must be a positive integer" })
}); 

export const getCompanyById = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
        const parsed = getCompanyByIdSchema.safeParse(req.params);

        if (!parsed.success) {
            res.status(400).json({ message: "Invalid company ID" });
            return;
        }   

        const { companyId } = parsed.data;

        const company = await prisma.company.findUnique({
            where: { id: companyId }
        });

        if (!company) {
            res.status(404).json({ message: "Company not found" });
            return;
        }

        res.status(200).json(company);
    } catch (error) {
        next(error);
    }
};