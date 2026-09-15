import type { Response, Request, NextFunction } from "express";
import { prisma } from "../config/dbConfig.ts";
import { z } from "zod";
import { buildPaginationMeta, paginationSchema } from "../utils/paginationUtils.ts";

const getAllModelsSchema = paginationSchema;

export const getAllModels = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
        const parsed = getAllModelsSchema.safeParse(req.query);
        if (!parsed.success) {
            res.status(400).json({ message: "Invalid query parameters" });
            return;
        }
        const { page, pageSize } = parsed.data;

        const [models, totalModels] = await Promise.all([
            prisma.model.findMany({
                skip: (page - 1) * pageSize,
                take: pageSize
            }),
            prisma.model.count()
        ]);

        res.json({
            items: models,
            pagination: buildPaginationMeta(page, pageSize, totalModels)
        });
    } catch (error) {
        next(error);
    }
};

const getModelByIdSchema = z.object({
    id: z.coerce.number().int().positive({ message: "Model ID must be a positive integer" })
});

export const getModelById = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
        const parsed = getModelByIdSchema.safeParse(req.params);

        if (!parsed.success) {
            res.status(400).json({ message: "Invalid model ID" });
            return;
        }

        const { id } = parsed.data;

        const model = await prisma.model.findUnique({
            where: { id }
        });

        if (!model) {
            res.status(404).json({ message: "Model not found" });
            return;
        }

        res.status(200).json(model);
    } catch (error) {
        next(error);
    }
};
