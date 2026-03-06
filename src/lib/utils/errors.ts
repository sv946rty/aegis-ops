export class AegisError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "AegisError";
  }
}

export class LLMError extends AegisError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, "LLM_ERROR", details);
    this.name = "LLMError";
  }
}

export class PlanGenerationError extends AegisError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, "PLAN_GENERATION_FAILED", details);
    this.name = "PlanGenerationError";
  }
}

export class GovernanceError extends AegisError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, "GOVERNANCE_BLOCKED", details);
    this.name = "GovernanceError";
  }
}

export class ValidationError extends AegisError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, "VALIDATION_ERROR", details);
    this.name = "ValidationError";
  }
}

export class ToolExecutionError extends AegisError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, "TOOL_EXECUTION_ERROR", details);
    this.name = "ToolExecutionError";
  }
}
