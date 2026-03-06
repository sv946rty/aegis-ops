import { z } from "zod";

export type LLMProvider = "openai" | "anthropic" | "mock";

export type RiskLevel = "READ_ONLY" | "OPERATIONAL" | "DESTRUCTIVE";

export const ToolStepSchema = z.object({
  tool: z.string(),
  args: z.record(z.unknown()),
  reasoning: z.string(),
});

export const ExecutionPlanSchema = z.object({
  intent: z.string(),
  reasoning: z.string(),
  steps: z.array(ToolStepSchema),
  estimatedRisk: z.enum(["READ_ONLY", "OPERATIONAL", "DESTRUCTIVE"]),
});

export type ToolStep = z.infer<typeof ToolStepSchema>;
export type ExecutionPlan = z.infer<typeof ExecutionPlanSchema>;

export interface LLMConfig {
  provider: LLMProvider;
  model: string;
  apiKey?: string;
  maxRetries: number;
  timeout: number;
}

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  provider: LLMProvider;
  model: string;
}

export interface GeneratePlanRequest {
  userMessage: string;
  availableTools: string[];
}

export interface GenerateResponseRequest {
  userMessage: string;
  plan: ExecutionPlan;
  toolResults: Array<{
    tool: string;
    args: Record<string, unknown>;
    result: unknown;
    durationMs: number;
  }>;
}
