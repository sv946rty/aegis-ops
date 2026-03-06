import { z } from "zod";
import { ToolDefinition } from "./types";

function simulateLatency(): Promise<void> {
  const ms = Math.floor(Math.random() * 400) + 100;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const checkDatabaseHealthTool: ToolDefinition = {
  name: "checkDatabaseHealth",
  category: "database",
  description: "Check overall database health metrics",
  riskLevel: "READ_ONLY",
  schema: z.object({}),
  execute: async () => {
    await simulateLatency();
    return {
      status: "degraded",
      connections: {
        active: 87,
        idle: 13,
        max: 100,
        utilization: 0.87,
      },
      performance: {
        avgQueryTime: 245,
        slowQueries: 12,
        deadlocks: 0,
      },
      storage: {
        used: "42.3 GB",
        available: "57.7 GB",
        utilization: 0.42,
      },
      replication: {
        lag: 120,
        status: "active",
      },
    };
  },
};

const scanSlowQueriesSchema = z.object({
  limit: z.number().optional().default(10),
});

const scanSlowQueriesTool: ToolDefinition = {
  name: "scanSlowQueries",
  category: "database",
  description: "Identify slow database queries",
  riskLevel: "READ_ONLY",
  schema: scanSlowQueriesSchema,
  execute: async (args) => {
    await simulateLatency();
    const validated = scanSlowQueriesSchema.parse(args);

    const queries = [
      {
        query: "SELECT * FROM orders WHERE created_at > ? AND status = ?",
        avgDuration: 1250,
        executions: 1847,
        impact: "high",
        recommendation: "Add composite index on (created_at, status)",
      },
      {
        query: "SELECT u.*, COUNT(o.id) FROM users u LEFT JOIN orders o ON u.id = o.user_id GROUP BY u.id",
        avgDuration: 890,
        executions: 453,
        impact: "medium",
        recommendation: "Consider materialized view for user order counts",
      },
      {
        query: "UPDATE inventory SET quantity = quantity - ? WHERE product_id = ?",
        avgDuration: 567,
        executions: 3201,
        impact: "medium",
        recommendation: "Review locking strategy, consider optimistic locking",
      },
    ];

    return {
      totalAnalyzed: 15234,
      slowQueryCount: queries.length,
      queries: queries.slice(0, validated.limit),
    };
  },
};

const analyzeConnectionsTool: ToolDefinition = {
  name: "analyzeConnections",
  category: "database",
  description: "Analyze database connection pool usage",
  riskLevel: "READ_ONLY",
  schema: z.object({}),
  execute: async () => {
    await simulateLatency();
    return {
      poolSize: 100,
      activeConnections: 87,
      idleConnections: 13,
      waitingQueries: 23,
      connectionErrors: 5,
      avgConnectionAge: "4.2 minutes",
      longestConnection: "45 minutes",
      recommendations: [
        "Connection pool is near capacity (87% utilization)",
        "23 queries waiting for connections - consider increasing pool size",
        "5 connection errors in last hour - investigate connection stability",
      ],
    };
  },
};

export const databaseTools: ToolDefinition[] = [
  checkDatabaseHealthTool,
  scanSlowQueriesTool,
  analyzeConnectionsTool,
];
