import type { Response, Request, NextFunction } from "express";
import { prisma } from "../config/dbConfig.ts";
import { z } from "zod";
import { buildPaginationMeta, paginationSchema } from "../utils/paginationUtils.ts";

const getAllModelProviderMappingsSchema = paginationSchema.extend({
    modelId: z.coerce.number().int().positive().optional()
});

export const getAllModelProviderMappings = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
        const parsed = getAllModelProviderMappingsSchema.safeParse(req.query);
        if (!parsed.success) {
            res.status(400).json({ message: "Invalid query parameters" });
            return;
        }
        const { page, pageSize, modelId } = parsed.data;

        const where = modelId !== undefined ? { modelId } : {};

        const [mappings, totalMappings] = await Promise.all([
            prisma.modelProviderMapping.findMany({
                where,
                skip: (page - 1) * pageSize,
                take: pageSize
            }),
            prisma.modelProviderMapping.count({ where })
        ]);

        res.json({
            items: mappings,
            pagination: buildPaginationMeta(page, pageSize, totalMappings)
        });
    } catch (error) {
        next(error);
    }
};

const getModelProviderMappingByIdSchema = z.object({
    id: z.coerce.number().int().positive({ message: "Mapping ID must be a positive integer" })
});

export const getModelProviderMappingById = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
        const parsed = getModelProviderMappingByIdSchema.safeParse(req.params);

        if (!parsed.success) {
            res.status(400).json({ message: "Invalid mapping ID" });
            return;
        }

        const { id } = parsed.data;

        const mapping = await prisma.modelProviderMapping.findUnique({
            where: { id }
        });

        if (!mapping) {
            res.status(404).json({ message: "Mapping not found" });
            return;
        }

        res.status(200).json(mapping);
    } catch (error) {
        next(error);
    }
};
