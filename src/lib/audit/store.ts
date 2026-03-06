/**
 * Audit event storage interface
 * Delegates to filesystem or Postgres adapter based on environment
 */
import { getAdapter } from "./adapters";
import { AuditEvent, AuditFilter } from "./types";
import { ExecutionPlan } from "@/lib/ai/types";
import { GovernanceDecision } from "@/lib/governance/types";
import { ToolExecution } from "@/lib/tools/types";

const adapter = getAdapter();

export async function createAuditEvent(params: {
  input: string;
  sessionId?: string;
  plan?: ExecutionPlan;
  governanceDecision: GovernanceDecision;
  toolExecutions?: ToolExecution[];
  finalResponse?: string;
  metadata?: {
    provider?: string;
    model?: string;
    totalDurationMs?: number;
  };
}): Promise<string> {
  return adapter.createAuditEvent(params);
}

export async function readAuditEvents(
  filter?: AuditFilter
): Promise<AuditEvent[]> {
  return adapter.readAuditEvents(filter);
}

export async function getAuditEvent(id: string): Promise<AuditEvent | null> {
  return adapter.getAuditEvent(id);
}

export async function getAuditStats(): Promise<{
  total: number;
  allowed: number;
  blocked: number;
  byRiskLevel: Record<string, number>;
}> {
  return adapter.getAuditStats();
}

export async function clearAllAuditEvents(): Promise<{
  success: boolean;
  deletedCount: number;
  error?: string;
}> {
  return adapter.clearAllAuditEvents();
}
