import type { Request, Response, NextFunction } from 'express'
import { z } from "zod";
import { createApi as generateApikey } from "../service/apiService.ts";
import { prisma } from '../config/dbConfig.ts';
import { buildPaginationMeta, paginationSchema } from '../utils/paginationUtils.ts';

const createApiSchema = z.object(
    {
        name: z.string().min(1, { message: "Name is required" }),
    }
);

const updateApiSchema = z.object(
    {
        name: z.string({ message: "Name is invalid" }).min(1, { message: "Name is required" }).optional(),
        disabled: z.boolean({ message: "Disabled is invalid" }).optional(),
    }
);

const apiIdParamSchema = z.object(
    {
        id: z.coerce.number().int().positive({ message: "Id is required" })
    }
);

const apiKeySelect = {
    id: true,
    name: true,
    disabled: true,
    lastUsed: true,
    creditsConsumed: true
};

export const getAllapis = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const parsedQuery = paginationSchema.safeParse(req.query);

        if (!parsedQuery.success) {
            res.status(400).json({ message: "Invalid query parameters" });
            return;
        }

        const { page, pageSize } = parsedQuery.data;

        const where = {
            userId: req.user!.userId,
        };

        const [apis, totalApis] = await prisma.$transaction([
            prisma.apiKey.findMany({
                where,
                select: apiKeySelect,
                skip: (page - 1) * pageSize,
                take: pageSize
            }),
            prisma.apiKey.count({ where })
        ]);

        res.json({
            items: apis,
            pagination: buildPaginationMeta(page, pageSize, totalApis)
        });
    } catch (error) {
        next(error);
    }
}

export const getApiById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const parsedParams = apiIdParamSchema.safeParse(req.params);

        if (!parsedParams.success) {
            res.status(400).json({ message: "Invalid api id" });
            return;
        }

        const { id } = parsedParams.data;
        const userId = req.user!.userId;
        const api = await prisma.apiKey.findFirst({
            where: {
                id,
                userId: userId,
            },
            select: apiKeySelect
        });

        if (!api) {
            res.status(404).json({ message: "Api not found" });
            return;
        }

        res.json(api);
    } catch (error) {
        next(error);
    }
}

export const createApi = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const parsedBody = createApiSchema.safeParse(req.body);

        if (!parsedBody.success) {
            res.status(400).json({ message: "Invalid api name" });
            return;
        }

        const { name } = parsedBody.data;

        const apikey = generateApikey();
        const api = await prisma.apiKey.create({
            data: {
                apiKey: apikey,
                name: name,
                userId: req.user!.userId
            },
            select: apiKeySelect
        });

        res.status(201).json({ ...api, apiKey: apikey });
    } catch (error) {
        next(error);
    }
}

export const updateApi = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const parsedParams = apiIdParamSchema.safeParse(req.params);

        if (!parsedParams.success) {
            res.status(400).json({ message: "Invalid api id" });
            return;
        }

        const { id } = parsedParams.data;

        const parsedBody = updateApiSchema.safeParse(req.body);

        if (!parsedBody.success) {
            res.status(400).json({ message: "Invalid api update data" });
            return;
        }

        const { name, disabled } = parsedBody.data;
        const userId = req.user!.userId;
        const existing = await prisma.apiKey.findFirst({
            where: { id, userId: userId}
        });

        if (!existing) {
            res.status(404).json({ message: "Api not found" });
            return;
        }

        const updateData: { name?: string; disabled?: boolean } = {};
        if (name !== undefined) updateData.name = name;
        if (disabled !== undefined) updateData.disabled = disabled;

        const api = await prisma.apiKey.update({
            where: { id },
            data: updateData,
            select: apiKeySelect
        });

        res.status(200).json({ msg: "Api updated successfully", api });
    } catch (error) {
        next(error);
    }
}

export const deleteApi = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const parsedParams = apiIdParamSchema.safeParse(req.params);

        if (!parsedParams.success) {
            res.status(400).json({ message: "Invalid Api id" });
            return;
        }

        const { id } = parsedParams.data;
        const userId = req.user!.userId;
        const existing = await prisma.apiKey.findFirst({
            where: { id, userId: userId, deleted: false }
        });

        if (!existing) {
            res.status(404).json({ message: "Api not found" });
            return;
        }

        const api = await prisma.apiKey.update({
            where: { id },
            data: { disabled: true, deleted: true },
            select: apiKeySelect
        });

        res.status(200).json({ msg: "Api deleted successfully", api });
    } catch (error) {
        next(error);
    }
}
