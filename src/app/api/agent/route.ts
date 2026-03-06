import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generatePlan, generateFinalResponse } from "@/lib/ai/planner";
import { evaluatePolicy } from "@/lib/governance/policy";
import { toolRegistry } from "@/lib/tools/registry";
import { createAuditEvent } from "@/lib/audit/store";
import { llm } from "@/lib/ai/llm";
import {
  ValidationError,
  GovernanceError,
  PlanGenerationError,
  AegisError,
} from "@/lib/utils/errors";

const RequestSchema = z.object({
  message: z.string().min(1, "Message cannot be empty"),
  sessionId: z.string().optional(),
});

type RequestBody = z.infer<typeof RequestSchema>;

export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const validated = RequestSchema.parse(body);

    return await handleAgentRequest(validated, startTime);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request format",
            details: { errors: error.errors },
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred",
        },
      },
      { status: 500 }
    );
  }
}

async function handleAgentRequest(
  request: RequestBody,
  startTime: number
): Promise<NextResponse> {
  let auditId: string | undefined;

  try {
    const availableTools = toolRegistry.getToolNames();
    const plan = await generatePlan({
      userMessage: request.message,
      availableTools,
    });

    const governanceDecision = evaluatePolicy({
      userMessage: request.message,
      plan,
    });

    if (!governanceDecision.allowed) {
      const totalDurationMs = Date.now() - startTime;
      const config = llm.getConfig();

      auditId = await createAuditEvent({
        input: request.message,
        sessionId: request.sessionId,
        plan,
        governanceDecision,
        metadata: {
          provider: config.provider,
          model: config.model,
          totalDurationMs,
        },
      });

      throw new GovernanceError(governanceDecision.reason, {
        riskLevel: governanceDecision.riskLevel,
        flags: governanceDecision.flags,
      });
    }

    const toolExecutions = await toolRegistry.executeTools(plan.steps);

    const finalResponse = await generateFinalResponse({
      userMessage: request.message,
      plan,
      toolResults: toolExecutions,
    });

    const totalDurationMs = Date.now() - startTime;
    const config = llm.getConfig();

    auditId = await createAuditEvent({
      input: request.message,
      sessionId: request.sessionId,
      plan,
      governanceDecision,
      toolExecutions,
      finalResponse,
      metadata: {
        provider: config.provider,
        model: config.model,
        totalDurationMs,
      },
    });

    return NextResponse.json(
      {
        success: true,
        response: finalResponse,
        plan,
        governanceDecision,
        toolExecutions,
        auditId,
      },
      { status: 200 }
    );
  } catch (error) {
    return handleError(error, auditId);
  }
}

function handleError(
  error: unknown,
  auditId?: string
): NextResponse {
  if (error instanceof GovernanceError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
        auditId,
      },
      { status: 403 }
    );
  }

  if (error instanceof PlanGenerationError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: sanitizeDetails(error.details),
        },
      },
      { status: 500 }
    );
  }

  if (error instanceof ValidationError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: sanitizeDetails(error.details),
        },
      },
      { status: 400 }
    );
  }

  if (error instanceof AegisError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: sanitizeDetails(error.details),
        },
      },
      { status: 500 }
    );
  }

  console.error("Unhandled error in agent API:", error);

  return NextResponse.json(
    {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred. Please try again.",
      },
    },
    { status: 500 }
  );
}

function sanitizeDetails(
  details?: Record<string, unknown>
): Record<string, unknown> | undefined {
  if (!details) {
    return undefined;
  }

  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(details)) {
    if (
      key === "stack" ||
      key === "stackTrace" ||
      key === "originalError"
    ) {
      continue;
    }

    if (typeof value === "string" && value.includes("at ")) {
      continue;
    }

    sanitized[key] = value;
  }

  return Object.keys(sanitized).length > 0 ? sanitized : undefined;
}
