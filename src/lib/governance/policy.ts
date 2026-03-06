import { GovernanceDecision, PolicyContext } from "./types";
import { RiskLevel } from "@/lib/ai/types";
import {
  detectDestructiveIntent,
  analyzeArguments,
  calculateRiskLevel,
  APPROVAL_PATTERNS,
} from "./rules";
import { toolRegistry } from "@/lib/tools/registry";

function detectApprovalRequired(message: string): {
  requiresApproval: boolean;
  matchedPatterns: Array<{ reason: string; pattern: string }>;
} {
  const matchedPatterns: Array<{ reason: string; pattern: string }> = [];

  for (const { pattern, reason } of APPROVAL_PATTERNS) {
    if (pattern.test(message)) {
      matchedPatterns.push({
        reason,
        pattern: pattern.source,
      });
    }
  }

  return {
    requiresApproval: matchedPatterns.length > 0,
    matchedPatterns,
  };
}

export function evaluatePolicy(context: PolicyContext): GovernanceDecision {
  const { userMessage, plan } = context;

  const approvalAnalysis = detectApprovalRequired(userMessage);

  if (approvalAnalysis.requiresApproval) {
    const reason = approvalAnalysis.matchedPatterns[0].reason;
    return {
      allowed: false,
      riskLevel: "OPERATIONAL",
      reason: `⏸️ REQUIRES APPROVAL: ${reason}. This operation has been paused pending stakeholder approval.`,
      flags: ["Human-in-the-loop approval required", ...approvalAnalysis.matchedPatterns.map(p => p.reason)],
    };
  }

  const destructiveAnalysis = detectDestructiveIntent(userMessage);

  const toolRisks: RiskLevel[] = plan.steps.map((step) => {
    const tool = toolRegistry.getTool(step.tool);
    return tool?.riskLevel ?? "READ_ONLY";
  });

  const argumentFlags = analyzeArguments(plan.steps);

  const finalRiskLevel = calculateRiskLevel(
    plan.estimatedRisk,
    destructiveAnalysis.isDestructive,
    toolRisks,
    argumentFlags
  );

  const allowed = finalRiskLevel !== "DESTRUCTIVE";

  let reason: string;
  const flags: string[] = [];

  if (destructiveAnalysis.isDestructive) {
    reason = buildDestructiveReason(destructiveAnalysis.matchedPatterns);
    flags.push("Destructive intent detected in user message");
  } else if (toolRisks.includes("DESTRUCTIVE")) {
    reason = "Plan includes inherently destructive tools that are not allowed";
    flags.push("DESTRUCTIVE tool usage detected");
  } else if (argumentFlags.length > 0) {
    reason = buildArgumentReason(argumentFlags);
    flags.push(...argumentFlags);
  } else if (finalRiskLevel === "OPERATIONAL") {
    reason = "Operational changes approved - will modify system state";
    flags.push("Operational risk level - monitor execution carefully");
  } else {
    reason = "Read-only operations approved - no system changes";
  }

  return {
    allowed,
    riskLevel: finalRiskLevel,
    reason,
    flags,
  };
}

function buildDestructiveReason(
  patterns: Array<{ reason: string; pattern: string }>
): string {
  const reasons = patterns.map((p) => p.reason);
  const uniqueReasons = Array.from(new Set(reasons));

  if (uniqueReasons.length === 1) {
    return `BLOCKED: ${uniqueReasons[0]}. This operation has been blocked to prevent potential data loss or security compromise.`;
  }

  return `BLOCKED: Multiple destructive patterns detected. ${uniqueReasons.join(". ")}. This operation has been blocked to prevent potential data loss or security compromise.`;
}

function buildArgumentReason(flags: string[]): string {
  const severity = flags.some((f) => f.includes("Wildcard") || f.includes("Batch"))
    ? "DESTRUCTIVE"
    : "HIGH RISK";

  return `BLOCKED (${severity}): ${flags.join("; ")}. These argument patterns indicate a potentially destructive operation that requires additional review and approval.`;
}

export function formatGovernanceExplanation(decision: GovernanceDecision): string {
  if (decision.allowed) {
    return `✅ **${decision.riskLevel}** - ${decision.reason}`;
  }

  let explanation = `🚫 **Request Blocked - ${decision.riskLevel} Risk**\n\n`;
  explanation += `${decision.reason}\n\n`;

  if (decision.flags.length > 0) {
    explanation += `**Detection Details:**\n`;
    decision.flags.forEach((flag) => {
      explanation += `- ${flag}\n`;
    });
  }

  explanation += `\n**Why This Matters:**\n`;
  explanation += `Enterprise operations platforms must prevent accidental data loss and security compromises. `;
  explanation += `This request was blocked because it matches patterns associated with high-risk operations. `;
  explanation += `If this action is truly needed, please refine your request with specific, limited scope, `;
  explanation += `or contact your administrator for manual approval.\n`;

  return explanation;
}
