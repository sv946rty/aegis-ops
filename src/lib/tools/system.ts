import { z } from "zod";
import { ToolDefinition } from "./types";

function simulateLatency(): Promise<void> {
  const ms = Math.floor(Math.random() * 400) + 100;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const restartServiceSchema = z.object({
  service: z.string(),
});

const restartServiceTool: ToolDefinition = {
  name: "restartService",
  category: "system",
  description: "Restart a service (rolling restart with zero downtime)",
  riskLevel: "OPERATIONAL",
  schema: restartServiceSchema,
  execute: async (args) => {
    await simulateLatency();
    const validated = restartServiceSchema.parse(args);

    return {
      service: validated.service,
      status: "success",
      action: "rolling_restart",
      duration: "45s",
      replicas: {
        total: 3,
        restarted: 3,
        healthy: 3,
      },
      downtime: "0s",
      message: `Service ${validated.service} restarted successfully with zero downtime`,
    };
  },
};

const scaleServiceSchema = z.object({
  service: z.string(),
  replicas: z.number().min(1).max(10),
});

const scaleServiceTool: ToolDefinition = {
  name: "scaleService",
  category: "system",
  description: "Scale service replica count",
  riskLevel: "OPERATIONAL",
  schema: scaleServiceSchema,
  execute: async (args) => {
    await simulateLatency();
    const validated = scaleServiceSchema.parse(args);

    return {
      service: validated.service,
      status: "success",
      previousReplicas: 3,
      currentReplicas: validated.replicas,
      action: validated.replicas > 3 ? "scaled_up" : "scaled_down",
      message: `Service ${validated.service} scaled to ${validated.replicas} replicas`,
    };
  },
};

const checkServiceHealthSchema = z.object({
  service: z.string(),
});

const checkServiceHealthTool: ToolDefinition = {
  name: "checkServiceHealth",
  category: "system",
  description: "Check health status of a service",
  riskLevel: "READ_ONLY",
  schema: checkServiceHealthSchema,
  execute: async (args) => {
    await simulateLatency();
    const validated = checkServiceHealthSchema.parse(args);

    return {
      service: validated.service,
      status: "degraded",
      replicas: {
        desired: 3,
        running: 3,
        healthy: 2,
        unhealthy: 1,
      },
      metrics: {
        cpu: "78%",
        memory: "62%",
        requestRate: "1247 req/s",
        errorRate: "2.3%",
        avgLatency: "245ms",
      },
      issues: [
        "1 replica failing health checks",
        "Error rate above threshold (2.3% > 1%)",
        "High CPU utilization (78%)",
      ],
    };
  },
};

export const systemTools: ToolDefinition[] = [
  restartServiceTool,
  scaleServiceTool,
  checkServiceHealthTool,
];
