import { neon } from "@neondatabase/serverless";
import { v4 as uuidv4 } from "uuid";
import {
  AuditStorageAdapter,
  CreateAuditEventParams,
  ClearAuditEventsResult,
  AuditStats,
} from "./types";
import { AuditEvent, AuditFilter } from "../types";

/**
 * Postgres-based audit storage adapter
 * Stores audit events in Neon Postgres database (Vercel's native integration)
 * Used for production deployment on Vercel
 */
export class PostgresAdapter implements AuditStorageAdapter {
  private sql: ReturnType<typeof neon> | null = null;

  /**
   * Get SQL client (lazy initialization)
   */
  private getSQL() {
    if (!this.sql) {
      const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
      if (!connectionString) {
        throw new Error("DATABASE_URL or POSTGRES_URL environment variable is required");
      }
      this.sql = neon(connectionString);
    }
    return this.sql;
  }
  private schemaInitialized = false;

  /**
   * Ensure database schema exists
   * Uses CREATE TABLE IF NOT EXISTS for idempotency
   */
  private async ensureSchema(): Promise<void> {
    if (this.schemaInitialized) {
      return;
    }

    try {
      const sql = this.getSQL();

      await sql`
        CREATE TABLE IF NOT EXISTS audit_events (
          id UUID PRIMARY KEY,
          timestamp TIMESTAMPTZ NOT NULL,
          input TEXT NOT NULL,
          session_id VARCHAR(255),
          allowed BOOLEAN NOT NULL,
          risk_level VARCHAR(20) NOT NULL,
          governance_reason TEXT NOT NULL,
          plan JSONB,
          governance_decision JSONB NOT NULL,
          tool_executions JSONB,
          final_response TEXT,
          provider VARCHAR(50),
          model VARCHAR(100),
          total_duration_ms INTEGER,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `;

      await sql`
        CREATE INDEX IF NOT EXISTS idx_audit_events_timestamp
          ON audit_events(timestamp DESC)
      `;

      await sql`
        CREATE INDEX IF NOT EXISTS idx_audit_events_filters
          ON audit_events(risk_level, allowed, timestamp DESC)
      `;

      await sql`
        CREATE INDEX IF NOT EXISTS idx_audit_events_session_id
          ON audit_events(session_id)
          WHERE session_id IS NOT NULL
      `;

      this.schemaInitialized = true;
    } catch (error) {
      console.error("Failed to initialize database schema:", error);
      // Don't throw - allow queries to proceed and fail if schema truly missing
    }
  }

  async createAuditEvent(params: CreateAuditEventParams): Promise<string> {
    const id = uuidv4();
    const timestamp = new Date().toISOString();

    try {
      await this.ensureSchema();
      const sql = this.getSQL();

      await sql`
        INSERT INTO audit_events (
          id,
          timestamp,
          input,
          session_id,
          allowed,
          risk_level,
          governance_reason,
          plan,
          governance_decision,
          tool_executions,
          final_response,
          provider,
          model,
          total_duration_ms
        ) VALUES (
          ${id},
          ${timestamp},
          ${params.input},
          ${params.sessionId || null},
          ${params.governanceDecision.allowed},
          ${params.governanceDecision.riskLevel},
          ${params.governanceDecision.reason},
          ${params.plan ? JSON.stringify(params.plan) : null},
          ${JSON.stringify(params.governanceDecision)},
          ${params.toolExecutions ? JSON.stringify(params.toolExecutions) : null},
          ${params.finalResponse || null},
          ${params.metadata?.provider || null},
          ${params.metadata?.model || null},
          ${params.metadata?.totalDurationMs || null}
        )
      `;
    } catch (error) {
      console.error("Failed to create audit event in Neon Postgres:", error);
      // Return ID anyway so application continues
    }

    return id;
  }

  async readAuditEvents(filter?: AuditFilter): Promise<AuditEvent[]> {
    try {
      await this.ensureSchema();
      const sql = this.getSQL();

      const limit = filter?.limit || 100;
      let results: any;

      // Build dynamic query based on filters
      if (filter?.riskLevel && filter?.status) {
        // Both filters applied
        const allowed = filter.status === "allowed";
        results = await sql`
          SELECT * FROM audit_events
          WHERE risk_level = ${filter.riskLevel}
            AND allowed = ${allowed}
          ORDER BY timestamp DESC
          LIMIT ${limit}
        `;
      } else if (filter?.riskLevel) {
        // Only risk level filter
        results = await sql`
          SELECT * FROM audit_events
          WHERE risk_level = ${filter.riskLevel}
          ORDER BY timestamp DESC
          LIMIT ${limit}
        `;
      } else if (filter?.status) {
        // Only status filter
        const allowed = filter.status === "allowed";
        results = await sql`
          SELECT * FROM audit_events
          WHERE allowed = ${allowed}
          ORDER BY timestamp DESC
          LIMIT ${limit}
        `;
      } else {
        // No filters
        results = await sql`
          SELECT * FROM audit_events
          ORDER BY timestamp DESC
          LIMIT ${limit}
        `;
      }

      // Transform database rows to AuditEvent objects
      // Neon returns results as an array
      return (results as any[]).map((row) => this.rowToAuditEvent(row));
    } catch (error) {
      console.error("Failed to read audit events from Neon Postgres:", error);
      return [];
    }
  }

  async getAuditEvent(id: string): Promise<AuditEvent | null> {
    try {
      await this.ensureSchema();
      const sql = this.getSQL();

      const result: any = await sql`
        SELECT * FROM audit_events
        WHERE id = ${id}
      `;

      const rows = result as any[];
      if (rows.length === 0) {
        return null;
      }

      return this.rowToAuditEvent(rows[0]);
    } catch (error) {
      console.error(`Failed to get audit event ${id} from Neon Postgres:`, error);
      return null;
    }
  }

  async getAuditStats(): Promise<AuditStats> {
    try {
      await this.ensureSchema();
      const sql = this.getSQL();

      const result: any = await sql`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN allowed THEN 1 ELSE 0 END) as allowed,
          SUM(CASE WHEN NOT allowed THEN 1 ELSE 0 END) as blocked
        FROM audit_events
      `;

      const riskResult: any = await sql`
        SELECT risk_level, COUNT(*) as count
        FROM audit_events
        GROUP BY risk_level
      `;

      const byRiskLevel: Record<string, number> = {};
      (riskResult as any[]).forEach((row) => {
        byRiskLevel[row.risk_level as string] = Number(row.count);
      });

      const rows = result as any[];
      return {
        total: Number(rows[0].total),
        allowed: Number(rows[0].allowed),
        blocked: Number(rows[0].blocked),
        byRiskLevel,
      };
    } catch (error) {
      console.error("Failed to get audit stats from Neon Postgres:", error);
      return {
        total: 0,
        allowed: 0,
        blocked: 0,
        byRiskLevel: {},
      };
    }
  }

  async clearAllAuditEvents(): Promise<ClearAuditEventsResult> {
    try {
      await this.ensureSchema();
      const sql = this.getSQL();

      const result: any = await sql`
        DELETE FROM audit_events
        RETURNING id
      `;

      return {
        success: true,
        deletedCount: (result as any[]).length,
      };
    } catch (error) {
      console.error("Failed to clear audit events from Neon Postgres:", error);
      return {
        success: false,
        deletedCount: 0,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Parse JSON field that might already be an object (JSONB) or a string
   */
  private parseJsonField(value: any): any {
    if (!value) return undefined;
    // If it's already an object, return it as-is
    if (typeof value === "object") return value;
    // If it's a string, parse it
    if (typeof value === "string") return JSON.parse(value);
    return value;
  }

  /**
   * Transform database row to AuditEvent object
   */
  private rowToAuditEvent(row: any): AuditEvent {
    return {
      id: row.id,
      timestamp: row.timestamp,
      input: row.input,
      sessionId: row.session_id || undefined,
      plan: this.parseJsonField(row.plan),
      governanceDecision: this.parseJsonField(row.governance_decision),
      toolExecutions: this.parseJsonField(row.tool_executions),
      finalResponse: row.final_response || undefined,
      metadata: {
        provider: row.provider || undefined,
        model: row.model || undefined,
        totalDurationMs: row.total_duration_ms || undefined,
      },
    };
  }
}
