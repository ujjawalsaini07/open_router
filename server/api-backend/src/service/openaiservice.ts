import OpenAI from 'openai';
import type { AiRequest, AiResponse } from '../types/index.ts';

const client = new OpenAI({
    apiKey: process.env['OPENAI_API_KEY'],
});

export const openAiService = async (request: AiRequest): Promise<AiResponse> => {
    try {
        const response = await client.responses.create({
            model: request.model,
            input: request.messages,
        });

        if (response.error !== null) {
            throw new Error(response.error.message, { cause: response.error });
        }

        return {
            output: response.output_text,
            output_tokens: response.usage?.output_tokens || 0,
            input_tokens: response.usage?.input_tokens || 0,
            total_tokens: response.usage?.total_tokens || 0,
        };
    } catch (err) {
        console.error("OpenAI request failed:", err);
        throw new Error("AI request failed for OpenAI API", { cause: err });
    }
};
