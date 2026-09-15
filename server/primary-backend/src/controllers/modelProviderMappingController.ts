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
                take: pageSize,
                select: {
                    id: true,
                    inputTokenCost: true,
                    outputTokenCost: true,
                    model: {
                        select: {
                            name: true,
                            company: { select: { name: true, website: true } }
                        }
                    },
                    provider: { select: { name: true, website: true } }
                }
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


