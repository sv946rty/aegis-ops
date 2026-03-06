import { promises as fs } from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import {
  AuditStorageAdapter,
  CreateAuditEventParams,
  ClearAuditEventsResult,
  AuditStats,
} from "./types";
import { AuditEvent, AuditFilter } from "../types";

const AUDIT_DIR = path.join(process.cwd(), "data", "audit-logs");

/**
 * Filesystem-based audit storage adapter
 * Stores audit events as JSON files in data/audit-logs/
 * Used for local development
 */
export class FilesystemAdapter implements AuditStorageAdapter {
  private async ensureDirectoryExists(dir: string): Promise<void> {
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  private async atomicWrite(filePath: string, content: string): Promise<void> {
    const tempPath = `${filePath}.tmp`;

    try {
      await fs.writeFile(tempPath, content, "utf-8");
      await fs.rename(tempPath, filePath);
    } catch (error) {
      try {
        await fs.unlink(tempPath);
      } catch {
        // Ignore cleanup errors
      }
      throw error;
    }
  }

  async createAuditEvent(params: CreateAuditEventParams): Promise<string> {
    const id = uuidv4();
    const timestamp = new Date().toISOString();

    const event: AuditEvent = {
      id,
      timestamp,
      input: params.input,
      sessionId: params.sessionId,
      plan: params.plan,
      governanceDecision: params.governanceDecision,
      toolExecutions: params.toolExecutions,
      finalResponse: params.finalResponse,
      metadata: params.metadata ?? {},
    };

    try {
      await this.ensureDirectoryExists(AUDIT_DIR);

      const date = new Date(timestamp);
      const filename = `${date.toISOString().split("T")[0]}_${id}.json`;
      const filePath = path.join(AUDIT_DIR, filename);

      const content = JSON.stringify(event, null, 2);
      await this.atomicWrite(filePath, content);

      return id;
    } catch (error) {
      console.error("Failed to write audit event:", error);
      return id;
    }
  }

  async readAuditEvents(filter?: AuditFilter): Promise<AuditEvent[]> {
    try {
      await this.ensureDirectoryExists(AUDIT_DIR);

      const files = await fs.readdir(AUDIT_DIR);
      const jsonFiles = files.filter((f) => f.endsWith(".json")).sort().reverse();

      const events: AuditEvent[] = [];

      for (const file of jsonFiles) {
        if (filter?.limit && events.length >= filter.limit) {
          break;
        }

        try {
          const filePath = path.join(AUDIT_DIR, file);
          const content = await fs.readFile(filePath, "utf-8");
          const event: AuditEvent = JSON.parse(content);

          if (this.shouldIncludeEvent(event, filter)) {
            events.push(event);
          }
        } catch (error) {
          console.error(`Failed to read audit file ${file}:`, error);
        }
      }

      return events;
    } catch (error) {
      console.error("Failed to read audit events:", error);
      return [];
    }
  }

  async getAuditEvent(id: string): Promise<AuditEvent | null> {
    try {
      await this.ensureDirectoryExists(AUDIT_DIR);

      const files = await fs.readdir(AUDIT_DIR);
      const targetFile = files.find((f) => f.includes(id));

      if (!targetFile) {
        return null;
      }

      const filePath = path.join(AUDIT_DIR, targetFile);
      const content = await fs.readFile(filePath, "utf-8");
      return JSON.parse(content);
    } catch (error) {
      console.error(`Failed to get audit event ${id}:`, error);
      return null;
    }
  }

  private shouldIncludeEvent(
    event: AuditEvent,
    filter?: AuditFilter
  ): boolean {
    if (!filter) {
      return true;
    }

    if (filter.riskLevel && event.governanceDecision.riskLevel !== filter.riskLevel) {
      return false;
    }

    if (filter.status === "allowed" && !event.governanceDecision.allowed) {
      return false;
    }

    if (filter.status === "blocked" && event.governanceDecision.allowed) {
      return false;
    }

    return true;
  }

  async getAuditStats(): Promise<AuditStats> {
    const events = await this.readAuditEvents();

    const stats: AuditStats = {
      total: events.length,
      allowed: 0,
      blocked: 0,
      byRiskLevel: {},
    };

    events.forEach((event) => {
      if (event.governanceDecision.allowed) {
        stats.allowed++;
      } else {
        stats.blocked++;
      }

      const risk = event.governanceDecision.riskLevel;
      stats.byRiskLevel[risk] = (stats.byRiskLevel[risk] || 0) + 1;
    });

    return stats;
  }

  async clearAllAuditEvents(): Promise<ClearAuditEventsResult> {
    try {
      await this.ensureDirectoryExists(AUDIT_DIR);

      const files = await fs.readdir(AUDIT_DIR);
      const jsonFiles = files.filter((f) => f.endsWith(".json"));

      let deletedCount = 0;

      for (const file of jsonFiles) {
        try {
          const filePath = path.join(AUDIT_DIR, file);
          await fs.unlink(filePath);
          deletedCount++;
        } catch (error) {
          console.error(`Failed to delete audit file ${file}:`, error);
        }
      }

      return {
        success: true,
        deletedCount,
      };
    } catch (error) {
      console.error("Failed to clear audit events:", error);
      return {
        success: false,
        deletedCount: 0,
        error: (error as Error).message,
      };
    }
  }
}
