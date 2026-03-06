import { AuditEvent, AuditFilter } from "../types";
import { ExecutionPlan } from "@/lib/ai/types";
import { GovernanceDecision } from "@/lib/governance/types";
import { ToolExecution } from "@/lib/tools/types";

/**
 * Parameters for creating a new audit event
 */
export interface CreateAuditEventParams {
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
}

/**
 * Result of clearing audit events
 */
export interface ClearAuditEventsResult {
  success: boolean;
  deletedCount: number;
  error?: string;
}

/**
 * Audit statistics
 */
export interface AuditStats {
  total: number;
  allowed: number;
  blocked: number;
  byRiskLevel: Record<string, number>;
}

/**
 * Storage adapter interface for audit events
 * Implementations: FilesystemAdapter (dev), PostgresAdapter (production)
 */
export interface AuditStorageAdapter {
  /**
   * Create a new audit event
   * @returns Event ID (UUID)
   */
  createAuditEvent(params: CreateAuditEventParams): Promise<string>;

  /**
   * Read audit events with optional filtering
   * @returns Array of audit events
   */
  readAuditEvents(filter?: AuditFilter): Promise<AuditEvent[]>;

  /**
   * Get a specific audit event by ID
   * @returns Event or null if not found
   */
  getAuditEvent(id: string): Promise<AuditEvent | null>;

  /**
   * Get aggregate statistics
   * @returns Statistics object
   */
  getAuditStats(): Promise<AuditStats>;

  /**
   * Clear all audit events
   * @returns Result with success status and deleted count
   */
  clearAllAuditEvents(): Promise<ClearAuditEventsResult>;
}
