import { ExecutionPlan } from "@/lib/ai/types";
import { GovernanceDecision } from "@/lib/governance/types";
import { ToolExecution } from "@/lib/tools/types";

export interface AuditEvent {
  id: string;
  timestamp: string;
  input: string;
  sessionId?: string;
  plan?: ExecutionPlan;
  governanceDecision: GovernanceDecision;
  toolExecutions?: ToolExecution[];
  finalResponse?: string;
  metadata: {
    provider?: string;
    model?: string;
    totalDurationMs?: number;
  };
}

export interface AuditFilter {
  riskLevel?: string;
  status?: "allowed" | "blocked";
  limit?: number;
}
