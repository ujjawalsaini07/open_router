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

interface NewModelSeed {
    companyName: string;
    companyWebsite: string;
    providerName: string;
    providerWebsite: string;
    modelName: string;
    modelSlug: string;
    inputTokenCost: number;
    outputTokenCost: number;
}

const newModels: NewModelSeed[] = [
    {
        companyName: "Groq",
        companyWebsite: "https://groq.com/",
        providerName: "Groq",
        providerWebsite: "https://groq.com/",
        modelName: "GPT OSS 120B",
        modelSlug: "openai/gpt-oss-120b",
        inputTokenCost: 0,
        outputTokenCost: 1,
    },
];

export async function seedNewModels(prisma: PrismaClient): Promise<void> {
    for (const entry of newModels) {
        let company = await prisma.company.findFirst({ where: { name: entry.companyName } });

        if (!company) {
            company = await prisma.company.create({
                data: { name: entry.companyName, website: entry.companyWebsite },
            });
        }

        let provider = await prisma.provider.findFirst({ where: { name: entry.providerName } });

        if (!provider) {
            provider = await prisma.provider.create({
                data: { name: entry.providerName, website: entry.providerWebsite },
            });
        }

        const model = await prisma.model.upsert({
            where: { slug: entry.modelSlug },
            update: { name: entry.modelName, companyId: company.id },
            create: { name: entry.modelName, slug: entry.modelSlug, companyId: company.id },
        });

        await prisma.modelProviderMapping.upsert({
            where: { modelId_providerId: { modelId: model.id, providerId: provider.id } },
            update: {
                inputTokenCost: entry.inputTokenCost,
                outputTokenCost: entry.outputTokenCost,
            },
            create: {
                modelId: model.id,
                providerId: provider.id,
                inputTokenCost: entry.inputTokenCost,
                outputTokenCost: entry.outputTokenCost,
            },
        });
    }
}
