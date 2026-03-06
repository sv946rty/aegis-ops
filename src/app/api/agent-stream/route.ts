import { NextRequest } from "next/server";
import { z } from "zod";
import { generatePlan, generateFinalResponse } from "@/lib/ai/planner";
import { evaluatePolicy } from "@/lib/governance/policy";
import { toolRegistry } from "@/lib/tools/registry";
import { createAuditEvent } from "@/lib/audit/store";
import { llm } from "@/lib/ai/llm";

const RequestSchema = z.object({
  message: z.string().min(1, "Message cannot be empty"),
  sessionId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) => {
        controller.enqueue(encoder.encode(JSON.stringify(data) + "\n"));
      };

      try {
        const body = await request.json();
        const validated = RequestSchema.parse(body);
        const startTime = Date.now();

        send({ type: "status", message: "🤔 Analyzing your request..." });

        const availableTools = toolRegistry.getToolNames();
        const plan = await generatePlan({
          userMessage: validated.message,
          availableTools,
        });

        send({
          type: "plan",
          data: {
            intent: plan.intent,
            reasoning: plan.reasoning,
            steps: plan.steps,
            estimatedRisk: plan.estimatedRisk,
          },
        });

        send({ type: "status", message: "🛡️ Evaluating governance policies..." });

        const governanceDecision = evaluatePolicy({
          userMessage: validated.message,
          plan,
        });

        send({
          type: "governance",
          data: governanceDecision,
        });

        if (!governanceDecision.allowed) {
          const config = llm.getConfig();
          const auditId = await createAuditEvent({
            input: validated.message,
            sessionId: validated.sessionId,
            plan,
            governanceDecision,
            metadata: {
              provider: config.provider,
              model: config.model,
              totalDurationMs: Date.now() - startTime,
            },
          });

          send({
            type: "blocked",
            data: {
              reason: governanceDecision.reason,
              flags: governanceDecision.flags,
              auditId,
            },
          });

          controller.close();
          return;
        }

        send({ type: "status", message: "⚙️ Executing diagnostic tools..." });

        const toolExecutions = [];
        for (const step of plan.steps) {
          send({
            type: "tool-start",
            data: { tool: step.tool, args: step.args },
          });

          const execution = await toolRegistry.executeTool(step.tool, step.args);
          toolExecutions.push(execution);

          send({
            type: "tool-complete",
            data: execution,
          });
        }

        send({ type: "status", message: "📊 Generating analysis..." });

        const finalResponse = await generateFinalResponse({
          userMessage: validated.message,
          plan,
          toolResults: toolExecutions,
        });

        const config = llm.getConfig();
        const auditId = await createAuditEvent({
          input: validated.message,
          sessionId: validated.sessionId,
          plan,
          governanceDecision,
          toolExecutions,
          finalResponse,
          metadata: {
            provider: config.provider,
            model: config.model,
            totalDurationMs: Date.now() - startTime,
          },
        });

        send({
          type: "complete",
          data: {
            response: finalResponse,
            auditId,
          },
        });

        controller.close();
      } catch (error) {
        send({
          type: "error",
          data: {
            message: (error as Error).message,
          },
        });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
