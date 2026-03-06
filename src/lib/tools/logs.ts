import { z } from "zod";
import { ToolDefinition } from "./types";

function simulateLatency(): Promise<void> {
  const ms = Math.floor(Math.random() * 400) + 100;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const scanErrorLogsSchema = z.object({
  service: z.string(),
  hours: z.number().optional().default(24),
});

const scanErrorLogsTool: ToolDefinition = {
  name: "scanErrorLogs",
  category: "logs",
  description: "Scan application error logs for a specific service",
  riskLevel: "READ_ONLY",
  schema: scanErrorLogsSchema,
  execute: async (args) => {
    await simulateLatency();
    const validated = scanErrorLogsSchema.parse(args);

    const errors = [
      {
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        level: "ERROR",
        message: "Database connection timeout",
        count: 47,
        stackTrace: "at ConnectionPool.acquire(pool.js:234)",
      },
      {
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        level: "ERROR",
        message: "Payment gateway timeout",
        count: 12,
        stackTrace: "at PaymentService.charge(payment.js:89)",
      },
      {
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        level: "WARN",
        message: "High memory usage detected",
        count: 8,
        stackTrace: "at HealthCheck.monitor(health.js:45)",
      },
    ];

    return {
      service: validated.service,
      timeRange: `Last ${validated.hours} hours`,
      totalErrors: 67,
      criticalErrors: 47,
      warnings: 8,
      errors,
      patterns: [
        "Database connection timeouts are the primary issue (70% of errors)",
        "Errors spike during peak hours (12pm-2pm, 6pm-8pm)",
        "Payment gateway timeouts correlate with DB issues",
      ],
    };
  },
};

const analyzeLogPatternsTool: ToolDefinition = {
  name: "analyzeLogPatterns",
  category: "logs",
  description: "Analyze log patterns to identify trends",
  riskLevel: "READ_ONLY",
  schema: z.object({
    service: z.string(),
  }),
  execute: async (args) => {
    await simulateLatency();
    const validated = z.object({ service: z.string() }).parse(args);

    return {
      service: validated.service,
      patterns: [
        {
          pattern: "Connection timeout",
          frequency: 47,
          trend: "increasing",
          severity: "high",
        },
        {
          pattern: "Slow query warning",
          frequency: 23,
          trend: "stable",
          severity: "medium",
        },
        {
          pattern: "Cache miss",
          frequency: 156,
          trend: "decreasing",
          severity: "low",
        },
      ],
      recommendations: [
        "Investigate database connection pool configuration",
        "Review and optimize slow queries",
        "Monitor cache hit rate trends",
      ],
    };
  },
};

export const logTools: ToolDefinition[] = [
  scanErrorLogsTool,
  analyzeLogPatternsTool,
];
