import { ToolDefinition, ToolExecution } from "./types";
import { databaseTools } from "./db";
import { logTools } from "./logs";
import { systemTools } from "./system";
import { manufacturingTools } from "./manufacturing";
import { ToolExecutionError } from "@/lib/utils/errors";

class ToolRegistry {
  private tools: Map<string, ToolDefinition>;

  constructor() {
    this.tools = new Map();
    this.registerTools([
      ...databaseTools,
      ...logTools,
      ...systemTools,
      ...manufacturingTools,
    ]);
  }

  private registerTools(tools: ToolDefinition[]): void {
    tools.forEach((tool) => {
      this.tools.set(tool.name, tool);
    });
  }

  getTool(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  getAllTools(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  getToolNames(): string[] {
    return Array.from(this.tools.keys());
  }

  async executeTool(
    name: string,
    args: Record<string, unknown>
  ): Promise<ToolExecution> {
    const tool = this.getTool(name);
    if (!tool) {
      throw new ToolExecutionError(`Tool not found: ${name}`, { toolName: name });
    }

    const startTime = Date.now();

    try {
      const validated = tool.schema.parse(args);
      const result = await tool.execute(validated);
      const durationMs = Date.now() - startTime;

      return {
        tool: name,
        args,
        result,
        durationMs,
        status: "success",
      };
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const errorMessage = (error as Error).message;

      return {
        tool: name,
        args,
        result: null,
        durationMs,
        status: "error",
        error: errorMessage,
      };
    }
  }

  async executeTools(
    steps: Array<{ tool: string; args: Record<string, unknown> }>
  ): Promise<ToolExecution[]> {
    const results: ToolExecution[] = [];

    for (const step of steps) {
      const result = await this.executeTool(step.tool, step.args);
      results.push(result);

      if (result.status === "error") {
        break;
      }
    }

    return results;
  }
}

export const toolRegistry = new ToolRegistry();
