import type { Request, Response, NextFunction } from 'express'
import { z } from "zod";
import { createApi as generateApikey } from "../service/apiService.ts";
import { prisma } from '../config/dbConfig.ts';

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
        const apis = await prisma.apiKey.findMany({
            where: {
                userId: req.user!.userId,
                deleted: false
            },
            select: apiKeySelect
        });
        res.json(apis);
    } catch (error) {
        next(error);
    }
}

export const getApiById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const parsedParams = apiIdParamSchema.safeParse(req.params);

        if (!parsedParams.success) {
            res.status(400).json({ message: "Invalid id" });
            return;
        }

        const { id } = parsedParams.data;

        const api = await prisma.apiKey.findFirst({
            where: {
                id,
                userId: req.user!.userId,
                deleted: false
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
            res.status(400).json({ message: "Invalid id" });
            return;
        }

        const { id } = parsedParams.data;

        const parsedBody = updateApiSchema.safeParse(req.body);

        if (!parsedBody.success) {
            res.status(400).json({ message: "Invalid api data" });
            return;
        }

        const { name, disabled } = parsedBody.data;

        const existing = await prisma.apiKey.findFirst({
            where: { id, userId: req.user!.userId, deleted: false }
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

        res.json(api);
    } catch (error) {
        next(error);
    }
}

export const deleteApi = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const parsedParams = apiIdParamSchema.safeParse(req.params);

        if (!parsedParams.success) {
            res.status(400).json({ message: "Invalid id" });
            return;
        }

        const { id } = parsedParams.data;

        const existing = await prisma.apiKey.findFirst({
            where: { id, userId: req.user!.userId, deleted: false }
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

        res.json(api);
    } catch (error) {
        next(error);
    }
}
