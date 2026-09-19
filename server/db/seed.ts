import { PrismaClient } from "./generated/prisma/client.ts";

interface ModelPricing {
    slug: string;
    inputTokenCost: number;
    outputTokenCost: number;
}

const pricing: ModelPricing[] = [
    { slug: "openai/gpt-6-astra", inputTokenCost: 10, outputTokenCost: 50 },
    { slug: "openai/gpt-5.6-sol", inputTokenCost: 4, outputTokenCost: 20 },
    { slug: "anthropic/claude-sonnet-5", inputTokenCost: 2, outputTokenCost: 10 },
    { slug: "anthropic/claude-fable-5.1", inputTokenCost: 10, outputTokenCost: 50 },
    { slug: "google/gemini-3.8-flash", inputTokenCost: 1, outputTokenCost: 4 },
    { slug: "google/gemini-2.5-pro", inputTokenCost: 1, outputTokenCost: 10 },
];

export async function seedPricing(prisma: PrismaClient): Promise<void> {
    for (const entry of pricing) {
        const model = await prisma.model.findUnique({ where: { slug: entry.slug } });

        if (!model) {
            continue;
        }

        await prisma.modelProviderMapping.updateMany({
            where: { modelId: model.id },
            data: {
                inputTokenCost: entry.inputTokenCost,
                outputTokenCost: entry.outputTokenCost,
            },
        });
    }
}
