import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../config/dbConfig.ts";
import { getProviderService } from "../service/providerRegistry.ts";
import type { ChatRequest, ChatResponse } from "../types/index.ts";

const chatSchema = z.object({
    model: z.string().min(1, { message: "Model is required" }),
    messages: z.array(z.object({
        role: z.enum(["user", "assistant", "system", "developer"]),
        content: z.string().min(1),
    })).min(1, { message: "At least one message is required" }),
});

export const chat = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
        const parsedBody = chatSchema.safeParse(req.body);

        if (!parsedBody.success) {
            return res.status(400).json({ msg: "Invalid request body" });
        }

        const { model, messages } = parsedBody.data as ChatRequest;
        const userId = req.user!.userId;
        const apiKey = req.user!.apiKey as string;

        const mapping = await prisma.modelProviderMapping.findFirst({
            where: { model: { slug: model } },
            include: { model: { include: { company: true } }, provider: true },
        });

        if (!mapping) {
            return res.status(404).json({ msg: "Model not found" });
        }

        const [user, apiKeyRecord] = await Promise.all([
            prisma.user.findUnique({ where: { id: userId } }),
            prisma.apiKey.findUnique({ where: { apiKey }, select: { id: true } }),
        ]);

        if (!user || !apiKeyRecord) {
            return res.status(404).json({ msg: "User not found" });
        }

        const providerService = getProviderService(mapping.model.company.name);

        if (!providerService) {
            return res.status(400).json({ msg: "Model not supported yet" });
        }

        const aiResponse = await providerService({ model, messages });

        const totalCreditCost =
            aiResponse.input_tokens * mapping.inputTokenCost +
            aiResponse.output_tokens * mapping.outputTokenCost;

        if (user.credits < totalCreditCost) {
            return res.status(402).json({ msg: "Insufficient credits" });
        }

        const inputText = messages.map((m) => m.content).join("\n");

        await prisma.$transaction([
            prisma.user.update({
                where: { id: userId },
                data: { credits: { decrement: totalCreditCost } },
            }),
            prisma.apiKey.update({
                where: { apiKey },
                data: {
                    creditsConsumed: { increment: totalCreditCost },
                    lastUsed: new Date(),
                },
            }),
            prisma.conversation.create({
                data: {
                    userId,
                    apiKeyId: apiKeyRecord.id,
                    modelProviderMappingId: mapping.id,
                    input: inputText,
                    output: aiResponse.output,
                    inputTokenCount: aiResponse.input_tokens,
                    outputTokenCount: aiResponse.output_tokens,
                },
            }),
        ]);

        const response: ChatResponse = {
            output: aiResponse.output,
            total_tokens: aiResponse.total_tokens,
            total_credit_cost: totalCreditCost,
        };

        return res.status(200).json(response);
    } catch (error) {
        next(error);
    }
};
