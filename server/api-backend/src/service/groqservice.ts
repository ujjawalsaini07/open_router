import Groq from "groq-sdk";
import type { AiRequest, AiResponse } from "../types/index.ts";

export const groqService = async (request: AiRequest): Promise<AiResponse> => {
    try {
        const client = new Groq({
            apiKey: process.env["GROQ_API_KEY"],
        });

        const response = await client.chat.completions.create({
            model: request.model,
            messages: request.messages,
        });

        const output = response.choices[0]?.message.content || "";

        return {
            output,
            input_tokens: response.usage?.prompt_tokens || 0,
            output_tokens: response.usage?.completion_tokens || 0,
            total_tokens: response.usage?.total_tokens || 0,
        };
    } catch (err) {
        console.error("Groq request failed:", err);
        throw new Error("AI request failed for Groq API", { cause: err });
    }
};
