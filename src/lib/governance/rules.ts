import { RiskLevel } from "@/lib/ai/types";

export interface DestructivePattern {
  pattern: RegExp;
  reason: string;
  examples: string[];
}

export const DESTRUCTIVE_PATTERNS: DestructivePattern[] = [
  {
    pattern: /clean\s*up\s+(last\s+)?(quarter|month|year|all|old|everything|data)/i,
    reason: "Bulk data cleanup operations are destructive and irreversible",
    examples: ["clean up last quarter", "clean up old data"],
  },
  {
    pattern: /archive\s+(everything|all|old|data|records|users)/i,
    reason: "Archival operations can cause data loss if not carefully scoped",
    examples: ["archive everything before 2023", "archive old users"],
  },
  {
    pattern: /(remove|delete|purge)\s+(all|old|inactive|unused|everything)/i,
    reason: "Bulk deletion operations are permanently destructive",
    examples: ["remove all inactive users", "delete old records", "purge unused data"],
  },
  {
    pattern: /(remove|delete|purge|erase|clear)\s+[\w\s]*(data|records|entries|files|documents|users|accounts)/i,
    reason: "Data deletion operations are permanently destructive and cannot be undone",
    examples: ["remove IBM data", "delete customer records", "purge old files", "clear user accounts"],
  },
  {
    pattern: /reset\s+(user|password|permissions|security|settings|credentials)/i,
    reason: "Resetting security-related settings can compromise system integrity",
    examples: ["reset user passwords", "reset permissions"],
  },
  {
    pattern: /temporarily\s+grant\s+(admin|access|permissions|privileges)/i,
    reason: "Temporary privilege escalation often becomes permanent and creates security risks",
    examples: ["temporarily grant admin access"],
  },
  {
    pattern: /(reduce|lower|disable|turn\s+off)\s+security/i,
    reason: "Reducing security controls exposes the system to attacks",
    examples: ["reduce security during migration", "disable security checks"],
  },
  {
    pattern: /standardize\s+permissions/i,
    reason: "Mass permission changes can grant unintended access",
    examples: ["standardize permissions across teams"],
  },
  {
    pattern: /export\s+(credentials|secrets|keys|passwords|tokens)/i,
    reason: "Exporting credentials creates security vulnerabilities",
    examples: ["export credentials for audit"],
  },
  {
    pattern: /(drop|truncate)\s+(table|database|collection)/i,
    reason: "Database structure changes are destructive and can cause data loss",
    examples: ["drop table users", "truncate database"],
  },
  {
    pattern: /(revoke|remove)\s+all\s+(access|permissions)/i,
    reason: "Mass permission revocation can lock out legitimate users",
    examples: ["revoke all access", "remove all permissions"],
  },
];

export interface ApprovalPattern {
  pattern: RegExp;
  reason: string;
  examples: string[];
}

export const APPROVAL_PATTERNS: ApprovalPattern[] = [
  {
    pattern: /(purchase|buy|order|procure)\s+[\w\s]*(laptop|hardware|equipment|software|license|subscription)/i,
    reason: "Purchasing decisions require budget approval and stakeholder sign-off",
    examples: ["purchase a new laptop", "buy software licenses", "order new equipment"],
  },
  {
    pattern: /(hire|recruit|onboard)\s+(new\s+)?(employee|contractor|staff|developer|engineer)/i,
    reason: "Hiring decisions require HR approval and budget allocation",
    examples: ["hire a new developer", "recruit a contractor", "onboard new staff"],
  },
  {
    pattern: /(increase|expand|upgrade)\s+(budget|spending|capacity|resources)/i,
    reason: "Budget and resource changes require financial approval",
    examples: ["increase budget for Q2", "expand server capacity", "upgrade team resources"],
  },
];

export interface ArgumentHeuristic {
  check: (args: Record<string, unknown>) => boolean;
  flag: string;
  severity: "high" | "medium" | "low";
}

export const ARGUMENT_HEURISTICS: ArgumentHeuristic[] = [
  {
    check: (args) => {
      return Object.values(args).some((val) =>
        typeof val === "string" && (val.includes("*") || val.includes("%"))
      );
    },
    flag: "Wildcard detected in arguments (potential for unintended scope)",
    severity: "high",
  },
  {
    check: (args) => {
      const dateRangeKeys = ["olderThan", "before", "dateRange", "since", "until"];
      return dateRangeKeys.some((key) => {
        const val = args[key];
        if (typeof val === "string") {
          const match = val.match(/(\d+)\s*d(ays?)?/);
          if (match && parseInt(match[1]) > 90) {
            return true;
          }
        }
        return false;
      });
    },
    flag: "Date range exceeds 90 days (high impact scope)",
    severity: "medium",
  },
  {
    check: (args) => {
      const countKeys = ["limit", "count", "records", "rows", "users"];
      return countKeys.some((key) => {
        const val = args[key];
        return typeof val === "number" && val > 100;
      });
    },
    flag: "Batch operation affecting >100 records",
    severity: "medium",
  },
  {
    check: (args) => {
      const batchKeys = ["all", "everything", "wildcard"];
      return batchKeys.some((key) => args[key] === true);
    },
    flag: "Batch operation flag detected",
    severity: "high",
  },
];

export function detectDestructiveIntent(message: string): {
  isDestructive: boolean;
  matchedPatterns: Array<{ reason: string; pattern: string }>;
} {
  const matchedPatterns: Array<{ reason: string; pattern: string }> = [];

  for (const { pattern, reason } of DESTRUCTIVE_PATTERNS) {
    if (pattern.test(message)) {
      matchedPatterns.push({
        reason,
        pattern: pattern.source,
      });
    }
  }

  return {
    isDestructive: matchedPatterns.length > 0,
    matchedPatterns,
  };
}

export function analyzeArguments(
  steps: Array<{ tool: string; args: Record<string, unknown> }>
): string[] {
  const flags: string[] = [];

  for (const step of steps) {
    for (const heuristic of ARGUMENT_HEURISTICS) {
      if (heuristic.check(step.args)) {
        flags.push(`${step.tool}: ${heuristic.flag}`);
      }
    }
  }

  return flags;
}

export function calculateRiskLevel(
  estimatedRisk: RiskLevel,
  hasDestructiveIntent: boolean,
  toolRisks: RiskLevel[],
  argumentFlags: string[]
): RiskLevel {
  if (hasDestructiveIntent) {
    return "DESTRUCTIVE";
  }

  if (toolRisks.includes("DESTRUCTIVE")) {
    return "DESTRUCTIVE";
  }

  if (argumentFlags.some((flag) => flag.includes("Wildcard") || flag.includes("Batch"))) {
    return "DESTRUCTIVE";
  }

  if (toolRisks.includes("OPERATIONAL") || estimatedRisk === "OPERATIONAL") {
    return "OPERATIONAL";
  }

  return "READ_ONLY";
}
