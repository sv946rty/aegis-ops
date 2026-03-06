import { RiskLevel } from "@/lib/ai/types";
import { ExecutionPlan } from "@/lib/ai/types";

export interface GovernanceDecision {
  allowed: boolean;
  riskLevel: RiskLevel;
  reason: string;
  flags: string[];
}

export interface PolicyContext {
  userMessage: string;
  plan: ExecutionPlan;
}
