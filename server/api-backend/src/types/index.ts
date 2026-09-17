

export interface AiResponse {
    output: string;
    output_tokens: number;
    input_tokens: number;
    total_tokens: number;
}

export interface AiRequest {
    model: string;
    messages: {
        role: 'user' | 'assistant' | 'system' | 'developer';
        content: string;
    }[];
}


export type ChatRequest = AiRequest;

export interface ChatResponse {
    output: string;
    total_tokens: number;
    total_credit_cost: number;
}