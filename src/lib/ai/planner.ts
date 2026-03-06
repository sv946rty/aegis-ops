import { llm } from "./llm";
import {
  ExecutionPlan,
  ExecutionPlanSchema,
  GeneratePlanRequest,
  GenerateResponseRequest,
} from "./types";
import { PlanGenerationError, ValidationError } from "@/lib/utils/errors";
import { z } from "zod";

const PLANNING_SYSTEM_PROMPT = `You are an AI operations assistant that generates structured execution plans for enterprise incident resolution.

Your job is to analyze user requests and generate a JSON execution plan with the following structure:

{
  "intent": "Brief description of what the user wants to accomplish",
  "reasoning": "Your analysis of the situation and approach",
  "steps": [
    {
      "tool": "toolName",
      "args": { "argName": "value" },
      "reasoning": "Why this step is needed"
    }
  ],
  "estimatedRisk": "READ_ONLY" | "OPERATIONAL" | "DESTRUCTIVE"
}

Risk Level Guidelines:
- READ_ONLY: Only reading data, no changes (health checks, logs, metrics)
- OPERATIONAL: Making operational changes (restart services, scale resources, reroute production)
- DESTRUCTIVE: Deleting data, removing resources, batch operations, or security changes

Available Tools by Category:

DATABASE TOOLS:
- checkDatabaseHealth: Check database health metrics
- scanSlowQueries: Find slow database queries (args: { limit?: number })
- analyzeConnections: Analyze database connection pool

LOG ANALYSIS TOOLS:
- scanErrorLogs: Scan application error logs (args: { service: string, hours?: number })

SYSTEM TOOLS:
- restartService: Restart a service (args: { service: string })
- scaleService: Scale service replicas (args: { service: string, replicas: number })

MANUFACTURING OPERATIONS TOOLS (Multi-System Integration):
- checkProductionMetrics: Query MES for production line metrics (args: { lineId: string, timeRange: string })
  → Returns: SAP MES data including defect rates, throughput, OEE, work orders
- checkEquipmentSensors: Query SCADA/PLC for equipment sensor data (args: { lineId: string })
  → Returns: Rockwell FactoryTalk data including temperature, pressure, vibration, alarms
- analyzeMaterialBatch: Query ERP/QMS for material quality data (args: { batchId: string })
  → Returns: Oracle ERP + TrackWise QMS data including supplier info, quality scores, lot traceability
- getProductionCapacity: Query MES for multi-line capacity analysis (args: {})
  → Returns: SAP MES capacity data for all production lines with utilization and availability
- rerouteProduction: Execute MES work order rescheduling (args: { fromLine: string, toLines: array, orderCount: number })
  → Returns: SAP MES + Oracle ERP rerouting confirmation with new schedules
- scheduleEquipmentMaintenance: Create CMMS maintenance work order (args: { lineId: string, maintenanceType: string, urgency: string })
  → Returns: IBM Maximo work order with ticket ID, parts, technician assignment

CRITICAL DECISION RULES:

1. MANUFACTURING SCENARIOS - Use manufacturing tools when request mentions:
   - "production line" + "defect" → Use: checkProductionMetrics, checkEquipmentSensors, analyzeMaterialBatch
   - "production" + "backing up" → Add: getProductionCapacity, rerouteProduction
   - "equipment" + "drift/elevated" → Add: scheduleEquipmentMaintenance
   - DO NOT use scanErrorLogs for manufacturing issues!

2. IT/SOFTWARE SCENARIOS - Use IT tools when request mentions:
   - "database" + "slow" → Use: checkDatabaseHealth, scanSlowQueries, analyzeConnections
   - "application" + "errors" → Use: scanErrorLogs
   - "service" + "restart" → Use: restartService

3. Platform Differentiation:
   - Manufacturing = Multi-system orchestration (MES, SCADA, ERP, QMS, CMMS)
   - IT Operations = Single-system diagnostics (database, logs, services)

IMPORTANT:
- Only use tools from the available list
- Match tool category to request domain (manufacturing vs IT)
- For manufacturing: Use manufacturing tools to demonstrate multi-system integration
- Provide specific, actionable steps
- Be conservative with risk estimation
- Respond ONLY with valid JSON, no markdown formatting
- If a request seems destructive (cleanup, delete, remove, archive, permissions, credentials), mark it as DESTRUCTIVE`;

const RESPONSE_SYSTEM_PROMPT = `You are an AI operations assistant providing final analysis and recommendations.

The user made a request, you created an execution plan, and tools were executed.

RESPONSE FORMAT:

For MANUFACTURING operations (if tools include checkProductionMetrics, checkEquipmentSensors, etc.):
- Use "Multi-System Root Cause Analysis" heading
- Explicitly mention which enterprise system each data point came from:
  - MES Data (SAP Manufacturing Execution System): production metrics, throughput, defect rates
  - SCADA Analysis (Rockwell FactoryTalk): equipment sensors, temperature, vibration, alarms
  - ERP/QMS Data (Oracle ERP + TrackWise QMS): material quality, supplier info, lot traceability
  - CMMS (IBM Maximo): maintenance work orders, technician assignments
- Include "Automated Remediation Executed" section showing what was done via each system
- End with "Systems Integrated: MES (SAP) + SCADA (Rockwell) + ERP (Oracle) + QMS (TrackWise) + CMMS (Maximo)"

For IT/SOFTWARE operations (if tools include checkDatabaseHealth, scanErrorLogs, etc.):
- Standard incident response format
- Focus on database, logs, services
- Provide optimization recommendations

Provide a clear, professional summary that includes:
1. What the user asked for
2. What diagnostics were run (be specific about which systems were queried)
3. Key findings from the tool executions (include system names: MES, SCADA, ERP, QMS, CMMS)
4. Actionable recommendations

CRITICAL: For manufacturing scenarios, synthesize data across ALL enterprise systems (MES, SCADA, ERP, QMS, CMMS).
DO NOT talk about "database errors" or "payment gateway timeouts" for manufacturing issues!

Be concise but thorough. Use a professional, enterprise operations tone.`;

export async function generatePlan(
  request: GeneratePlanRequest
): Promise<ExecutionPlan> {
  const userPrompt = `User request: "${request.userMessage}"

Available tools: ${request.availableTools.join(", ")}

Generate an execution plan as JSON.`;

  try {
    const response = await llm.generateText(
      PLANNING_SYSTEM_PROMPT,
      userPrompt
    );

    const parsedPlan = parseAndValidatePlan(response.content);
    return parsedPlan;
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new PlanGenerationError(
      `Failed to generate plan: ${(error as Error).message}`,
      { originalError: (error as Error).message }
    );
  }
}

export async function generateFinalResponse(
  request: GenerateResponseRequest
): Promise<string> {
  const toolResultsSummary = request.toolResults
    .map(
      (tr) =>
        `- ${tr.tool}(${JSON.stringify(tr.args)}): ${JSON.stringify(tr.result)} (${tr.durationMs}ms)`
    )
    .join("\n");

  const userPrompt = `User request: "${request.userMessage}"

Execution plan: ${request.plan.intent}

Tool results:
${toolResultsSummary}

Provide a professional summary and recommendations.`;

  try {
    const response = await llm.generateText(
      RESPONSE_SYSTEM_PROMPT,
      userPrompt
    );
    return response.content;
  } catch (error) {
    throw new PlanGenerationError(
      `Failed to generate response: ${(error as Error).message}`,
      { originalError: (error as Error).message }
    );
  }
}

function parseAndValidatePlan(content: string): ExecutionPlan {
  let jsonContent = content.trim();

  if (jsonContent.startsWith("```json")) {
    jsonContent = jsonContent.replace(/```json\n?/g, "").replace(/```\n?$/g, "");
  } else if (jsonContent.startsWith("```")) {
    jsonContent = jsonContent.replace(/```\n?/g, "");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonContent);
  } catch (error) {
    throw new ValidationError(
      `Invalid JSON in plan: ${(error as Error).message}`,
      { content: jsonContent }
    );
  }

  try {
    return ExecutionPlanSchema.parse(parsed);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError("Plan validation failed", {
        errors: error.errors,
        content: jsonContent,
      });
    }
    throw new ValidationError(
      `Plan validation failed: ${(error as Error).message}`,
      { content: jsonContent }
    );
  }
}
