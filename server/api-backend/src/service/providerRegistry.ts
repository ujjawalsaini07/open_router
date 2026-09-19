import type { AiRequest, AiResponse } from "../types/index.ts";
import { openAiService } from "./openaiservice.ts";
import { groqService } from "./groqservice.ts";

export type ProviderService = (request: AiRequest) => Promise<AiResponse>;

const registry: Record<string, ProviderService> = {
    "OpenAi": openAiService,
    "Groq": groqService,
};

export const getProviderService = (companyName: string): ProviderService | undefined => {
    return registry[companyName];
};
