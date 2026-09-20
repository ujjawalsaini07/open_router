import type { Request, Response, NextFunction } from "express";
import { prisma } from "../config/dbConfig.ts";
import { z } from "zod";
import { buildPaginationMeta, paginationSchema } from "../utils/paginationUtils.ts";

const conversationSelect = {
    id: true,
    input: true,
    output: true,
    inputTokenCount: true,
    outputTokenCount: true,
    modelProviderMapping: {
        select: {
            model: { select: { name: true, slug: true } },
            provider: { select: { name: true } },
        },
    },
};

const getAllConversationsSchema = paginationSchema;

export const getAllConversations = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
        const parsed = getAllConversationsSchema.safeParse(req.query);
        if (!parsed.success) {
            return res.status(400).json({ msg: "Invalid query parameters" });
        }

        const { page, pageSize } = parsed.data;
        const where = { userId: req.user!.userId };

        const [conversations, totalConversations] = await prisma.$transaction([
            prisma.conversation.findMany({
                where,
                select: conversationSelect,
                orderBy: { id: "desc" },
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
            prisma.conversation.count({ where }),
        ]);

        return res.status(200).json({
            items: conversations,
            pagination: buildPaginationMeta(page, pageSize, totalConversations),
        });
    } catch (error) {
        next(error);
    }
};

const conversationIdParamSchema = z.object({
    id: z.coerce.number().int().positive({ message: "Id is required" }),
});

export const getConversationById = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
        const parsedParams = conversationIdParamSchema.safeParse(req.params);
        if (!parsedParams.success) {
            return res.status(400).json({ msg: "Invalid conversation id" });
        }

        const { id } = parsedParams.data;
        const userId = req.user!.userId;

        const conversation = await prisma.conversation.findFirst({
            where: { id, userId },
            select: conversationSelect,
        });

        if (!conversation) {
            return res.status(404).json({ msg: "Conversation not found" });
        }

        return res.status(200).json(conversation);
    } catch (error) {
        next(error);
    }
};
