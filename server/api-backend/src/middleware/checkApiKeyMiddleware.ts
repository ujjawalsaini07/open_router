import type { Request, Response, NextFunction } from "express";
import { prisma } from "../config/dbConfig.ts";

export const checkApiKey = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
        const apiKey = req.user?.apiKey;
        const userId = req.user?.userId;

        if (!apiKey || typeof apiKey !== "string" || !userId) {
            return res.status(401).json({ msg: "Api key is required" });
        }

        const key = await prisma.apiKey.findUnique({
            where: { apiKey }
        });

        if (!key || key.userId !== userId || key.deleted || key.disabled) {
            return res.status(401).json({ msg: "Invalid api key" });
        }

        req.user!.apiKey = key.apiKey;
        next();
    } catch (error) {
        next(error);
    }
};
