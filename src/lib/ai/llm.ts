import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { LLMConfig, LLMProvider, LLMResponse } from "./types";
import { LLMError } from "@/lib/utils/errors";

class LLM {
  private config: LLMConfig;
  private openaiClient?: OpenAI;
  private anthropicClient?: Anthropic;

  constructor() {
    this.config = this.initializeConfig();
    this.initializeClients();
  }

  private initializeConfig(): LLMConfig {
    const mockMode = process.env.MOCK_LLM === "true";
    const openaiKey = process.env.OPENAI_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;

    let provider: LLMProvider;
    let model: string;
    let apiKey: string | undefined;

    if (mockMode) {
      provider = "mock";
      model = "mock-model";
    } else if (openaiKey) {
      provider = "openai";
      model = "gpt-4o-mini";
      apiKey = openaiKey;
    } else if (anthropicKey) {
      provider = "anthropic";
      model = "claude-3-5-sonnet-20241022";
      apiKey = anthropicKey;
    } else {
      throw new LLMError(
        "No LLM provider configured. Set OPENAI_API_KEY, ANTHROPIC_API_KEY, or MOCK_LLM=true"
      );
    }

    return {
      provider,
      model,
      apiKey,
      maxRetries: 2,
      timeout: 30000,
    };
  }

  private initializeClients(): void {
    if (this.config.provider === "openai" && this.config.apiKey) {
      this.openaiClient = new OpenAI({
        apiKey: this.config.apiKey,
        timeout: this.config.timeout,
      });
    } else if (this.config.provider === "anthropic" && this.config.apiKey) {
      this.anthropicClient = new Anthropic({
        apiKey: this.config.apiKey,
        timeout: this.config.timeout,
      });
    }
  }

  async generateText(
    systemPrompt: string,
    userPrompt: string
  ): Promise<LLMResponse> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
      try {
        return await this.executeGeneration(systemPrompt, userPrompt);
      } catch (error) {
        lastError = error as Error;
        if (attempt < this.config.maxRetries - 1) {
          await this.delay(1000 * (attempt + 1));
        }
      }
    }

    throw new LLMError(
      `Failed after ${this.config.maxRetries} attempts: ${lastError?.message}`,
      {
        provider: this.config.provider,
        model: this.config.model,
        originalError: lastError?.message,
      }
    );
  }

  private async executeGeneration(
    systemPrompt: string,
    userPrompt: string
  ): Promise<LLMResponse> {
    switch (this.config.provider) {
      case "openai":
        return await this.generateWithOpenAI(systemPrompt, userPrompt);
      case "anthropic":
        return await this.generateWithAnthropic(systemPrompt, userPrompt);
      case "mock":
        return this.generateWithMock(systemPrompt, userPrompt);
      default:
        throw new LLMError(`Unsupported provider: ${this.config.provider}`);
    }
  }

  private async generateWithOpenAI(
    systemPrompt: string,
    userPrompt: string
  ): Promise<LLMResponse> {
    if (!this.openaiClient) {
      throw new LLMError("OpenAI client not initialized");
    }

    const response = await this.openaiClient.chat.completions.create({
      model: this.config.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new LLMError("Empty response from OpenAI");
    }

    return {
      content,
      usage: response.usage
        ? {
            promptTokens: response.usage.prompt_tokens,
            completionTokens: response.usage.completion_tokens,
            totalTokens: response.usage.total_tokens,
          }
        : undefined,
      provider: "openai",
      model: this.config.model,
    };
  }

  private async generateWithAnthropic(
    systemPrompt: string,
    userPrompt: string
  ): Promise<LLMResponse> {
    if (!this.anthropicClient) {
      throw new LLMError("Anthropic client not initialized");
    }

    const response = await this.anthropicClient.messages.create({
      model: this.config.model,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
      temperature: 0.7,
    });

    const content = response.content[0];
    if (content.type !== "text") {
      throw new LLMError("Unexpected response type from Anthropic");
    }

    return {
      content: content.text,
      usage: {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      },
      provider: "anthropic",
      model: this.config.model,
    };
  }

  private generateWithMock(
    systemPrompt: string,
    userPrompt: string
  ): LLMResponse {
    const lowerPrompt = userPrompt.toLowerCase();

    let content: string;

    if (systemPrompt.includes("execution plan")) {
      if (
        lowerPrompt.includes("database") &&
        (lowerPrompt.includes("slow") || lowerPrompt.includes("performance"))
      ) {
        content = JSON.stringify({
          intent: "Diagnose database performance issues",
          reasoning:
            "User reports slow database performance. Will check health, scan for slow queries, and analyze connections.",
          steps: [
            {
              tool: "checkDatabaseHealth",
              args: {},
              reasoning: "First check overall database health metrics",
            },
            {
              tool: "scanSlowQueries",
              args: { limit: 10 },
              reasoning: "Identify slow queries that may be causing issues",
            },
            {
              tool: "analyzeConnections",
              args: {},
              reasoning: "Check for connection pool exhaustion",
            },
          ],
          estimatedRisk: "READ_ONLY",
        });
      } else if (
        lowerPrompt.includes("clean") ||
        lowerPrompt.includes("delete") ||
        lowerPrompt.includes("remove") ||
        lowerPrompt.includes("archive")
      ) {
        content = JSON.stringify({
          intent: "Clean up or delete data",
          reasoning:
            "User wants to remove data. This is a destructive operation.",
          steps: [
            {
              tool: "deleteOldRecords",
              args: { olderThan: "90d" },
              reasoning: "Remove old data as requested",
            },
          ],
          estimatedRisk: "DESTRUCTIVE",
        });
      } else if (lowerPrompt.includes("restart")) {
        content = JSON.stringify({
          intent: "Restart service",
          reasoning:
            "User wants to restart a service. This is an operational change.",
          steps: [
            {
              tool: "restartService",
              args: { service: "payment-service" },
              reasoning: "Restart the specified service",
            },
          ],
          estimatedRisk: "OPERATIONAL",
        });
      } else if (
        lowerPrompt.includes("production line") &&
        (lowerPrompt.includes("defect") || lowerPrompt.includes("elevated"))
      ) {
        content = JSON.stringify({
          intent: "Diagnose and remediate production line quality issue",
          reasoning:
            "Elevated defect rate on production line indicates potential equipment, material, or process issue. Need to identify root cause and coordinate response across manufacturing, quality, and operations.",
          steps: [
            {
              tool: "checkProductionMetrics",
              args: { lineId: "line-3", timeRange: "2h" },
              reasoning: "Get current production metrics to quantify issue",
            },
            {
              tool: "checkEquipmentSensors",
              args: { lineId: "line-3" },
              reasoning: "Check for equipment drift or sensor anomalies",
            },
            {
              tool: "analyzeMaterialBatch",
              args: { batchId: "BATCH-2024-0215-A3" },
              reasoning: "Verify material quality in current batch",
            },
            {
              tool: "getProductionCapacity",
              args: {},
              reasoning: "Assess capacity on other lines for rerouting",
            },
            {
              tool: "rerouteProduction",
              args: {
                fromLine: "line-3",
                toLines: ["line-1", "line-4"],
                orderCount: 45,
              },
              reasoning: "Reroute backed-up orders to available capacity",
            },
            {
              tool: "scheduleEquipmentMaintenance",
              args: {
                lineId: "line-3",
                maintenanceType: "calibration",
                urgency: "immediate",
              },
              reasoning: "Schedule recalibration based on sensor drift",
            },
          ],
          estimatedRisk: "OPERATIONAL",
        });
      } else {
        content = JSON.stringify({
          intent: "Check system status",
          reasoning: "General system health check requested",
          steps: [
            {
              tool: "checkDatabaseHealth",
              args: {},
              reasoning: "Verify database is healthy",
            },
          ],
          estimatedRisk: "READ_ONLY",
        });
      }
    } else {
      // Final response generation
      if (
        lowerPrompt.includes("production line") &&
        (lowerPrompt.includes("defect") || lowerPrompt.includes("elevated"))
      ) {
        content =
          "## Multi-System Root Cause Analysis\n\n**MES Data (SAP Manufacturing Execution System):**\n- Line 3 defect rate: 4.2% (baseline: 0.8%) - **5x normal rate**\n- Throughput: 142 units/hour (target: 180) - **21% below capacity**\n- Current batch: BATCH-2024-0215-A3\n- Backlog: 45 units\n- Work orders: WO-2024-0215-001, WO-2024-0215-002, WO-2024-0215-003\n\n**SCADA Analysis (Rockwell FactoryTalk):**\n- Equipment PRESS-003 temperature: **187.2°C (spec: 180-185°C) - DRIFT DETECTED**\n- Vibration: 0.8 mm/s (baseline: 0.3 mm/s) - **ELEVATED**\n- Cycle time: 8.2s (target: 7.5s) - Contributing to throughput loss\n- Alarms: TEMP-001 (WARNING), VIB-003 (CAUTION)\n- Root cause: **Sensor calibration drift + possible bearing wear**\n\n**ERP/QMS Data (Oracle ERP Cloud + TrackWise QMS):**\n- Material batch BATCH-2024-0215-A3: Quality score **87.3 (spec: ≥95.0) - REJECTED**\n- Moisture content: 8.2% (spec: <5.0%) - **FAIL**\n- Particle size: ±12μm (spec: ±5μm) - **FAIL**\n- Supplier: Acme Materials Co (vendor rating: B - Declining)\n- Disposition: **QUARANTINE - Quality hold pending supplier review**\n\n**Root Cause:**\nDual failure mode identified:\n1. **Equipment**: Temperature sensor drift causing out-of-spec processing\n2. **Materials**: Substandard batch from supplier failing quality specifications\n\n---\n\n## Automated Remediation Executed\n\n**Via MES (SAP):**\n✅ Rerouted 45 backed-up orders to Lines 1 and 4\n✅ Work orders WO-2024-0215-001, WO-2024-0215-002, WO-2024-0215-003 rescheduled\n✅ Line 1: +25 orders (92% utilization), Line 4: +20 orders (87% utilization)\n✅ Estimated delay: **45 minutes average**\n✅ Inventory adjusted in Oracle ERP Cloud\n\n**Via CMMS (IBM Maximo):**\n✅ Created urgent maintenance work order **MAINT-2024-0215-003**\n✅ Type: Corrective Maintenance - Recalibration\n✅ Priority: **URGENT** (immediate)\n✅ Assigned to: Maintenance Team Alpha - Mike Thompson (Lead)\n✅ Scheduled for: End of Day Shift (18:00) - **2 hours estimated duration**\n✅ Parts confirmed in stock: Temperature sensors, calibration kit\n\n**Notifications Sent:**\n✅ Line 1 & 4 Supervisors (new work orders)\n✅ Maintenance Team Alpha (urgent calibration)\n✅ Production Manager Sarah Johnson (status update)\n✅ Quality Team Lead Dr. Lisa Wong (batch quarantine)\n✅ Customer Service (ETA updates for affected orders)\n\n---\n\n## Impact Assessment\n\n**Governance Classification:** OPERATIONAL (approved for autonomous execution)\n**Systems Integrated:** MES (SAP) + SCADA (Rockwell) + ERP (Oracle) + QMS (TrackWise) + CMMS (Maximo)\n**Customer Impact:** 45-minute delay on 45 orders (minimal - proactive rerouting prevented longer delays)\n**Production Continuity:** Maintained via multi-line capacity optimization\n**Expected Resolution:** 2 hours (equipment recalibration during shift change)\n\nThis demonstrates **true enterprise operations platform orchestration** - not IT incident management, but coordinated multi-system response to physical production challenges.";
      } else {
        content =
          "I've analyzed the incident and executed the diagnostic tools. The database is experiencing high load due to several slow queries. I recommend optimizing the identified queries and monitoring connection pool usage.";
      }
    }

    return {
      content,
      provider: "mock",
      model: "mock-model",
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  getConfig(): LLMConfig {
    return { ...this.config };
  }
}

export const llm = new LLM();
