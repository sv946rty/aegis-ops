import { z } from "zod";
import { RiskLevel } from "@/lib/ai/types";

export type ToolCategory = "database" | "logs" | "system" | "manufacturing";

export interface ToolDefinition {
  name: string;
  category: ToolCategory;
  description: string;
  riskLevel: RiskLevel;
  schema: z.ZodSchema;
  execute: (args: unknown) => Promise<unknown>;
}

export interface ToolExecution {
  tool: string;
  args: Record<string, unknown>;
  result: unknown;
  durationMs: number;
  status: "success" | "error";
  error?: string;
}
