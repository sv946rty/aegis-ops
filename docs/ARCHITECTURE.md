# Architecture Documentation

## System Overview

Aegis Ops is a focused demonstration of AI-native enterprise operations, implementing intelligent incident orchestration with governance-first design.

**Core Principle**: Platform thinking over chatbot features.

---

## Architecture Layers

### 1. Presentation Layer (UI)

**Chat Interface** (`src/app/page.tsx`, `src/components/chat-interface.tsx`)

Professional operations interface with:
- Real-time execution visualization
- Inline tool status indicators
- Risk level badges
- Governance blocking alerts

**Audit Viewer** (`src/app/logs/page.tsx`, `src/components/audit-viewer.tsx`)

Enterprise audit interface with:
- Filterable table (risk level, status)
- URL search param persistence (shareable filtered views)
- Expandable execution traces
- Full JSON inspection

**Design Principles**:
- High information density without clutter
- Professional enterprise aesthetic (NOT playful chatbot)
- Accessibility (ARIA labels, keyboard navigation)
- Responsive layout

---

### 2. API Layer

**Agent Orchestration** (`src/app/api/agent/route.ts`)

The core orchestration pipeline:

```typescript
POST /api/agent
Request: { message: string, sessionId?: string }

Pipeline:
1. Validate input (Zod schema)
2. Generate execution plan (LLM)
3. Evaluate governance policy
4. If BLOCKED → audit log → 403 response
5. If ALLOWED → execute tools → generate response
6. Audit log complete execution
7. Return structured response
```

**Error Handling**:
- Structured errors (no stack traces exposed)
- Proper HTTP status codes (400, 403, 500)
- Error code classification (VALIDATION_ERROR, GOVERNANCE_BLOCKED, etc.)
- Sanitized error details

**Response Structure**:
```typescript
Success: {
  success: true,
  response: string,
  plan: ExecutionPlan,
  governanceDecision: GovernanceDecision,
  toolExecutions: ToolExecution[],
  auditId: string
}

Error: {
  success: false,
  error: {
    code: string,
    message: string,
    details?: Record<string, any>
  },
  auditId?: string
}
```

---

### 3. AI Layer

**LLM Wrapper** (`src/lib/ai/llm.ts`)

Multi-provider abstraction with:
- OpenAI (gpt-4o-mini) - primary
- Anthropic (claude-3-5-sonnet-20241022) - fallback
- Mock mode - deterministic testing

**Features**:
- Automatic retry (max 2 attempts with exponential backoff)
- 30-second timeout
- Token usage tracking
- Provider selection priority (OpenAI → Anthropic → Mock)

**Planner** (`src/lib/ai/planner.ts`)

Structured plan generation:

```typescript
generatePlan(request) → ExecutionPlan {
  intent: string,
  reasoning: string,
  steps: ToolStep[],
  estimatedRisk: RiskLevel
}
```

**Validation**:
- Zod schema validation
- JSON parsing with markdown cleanup
- Rejection of invalid plans
- Structured error reporting

---

### 4. Governance Layer

**Policy Evaluator** (`src/lib/governance/policy.ts`)

Multi-signal risk assessment:

1. **Phrase Detection**: Subtle destructive pattern matching
2. **Tool Risk**: Inherent tool risk levels
3. **Argument Heuristics**: Wildcards, date ranges, batch operations

**Risk Levels**:
- `READ_ONLY`: No system changes (allowed)
- `OPERATIONAL`: Operational changes (allowed with monitoring)
- `DESTRUCTIVE`: Data loss or security risk (blocked)

**Destructive Patterns** (`src/lib/governance/rules.ts`):
- Bulk cleanup: "clean up last quarter"
- Mass deletion: "remove all inactive users"
- Permission changes: "standardize permissions"
- Security reduction: "reduce security during migration"
- Credential exposure: "export credentials"
- And 5 more patterns...

**Argument Heuristics**:
- Wildcards (`*`, `%`) → DESTRUCTIVE
- Date ranges >90 days → Flag
- Batch operations >100 records → Flag

**Decision Format**:
```typescript
{
  allowed: boolean,
  riskLevel: RiskLevel,
  reason: string,
  flags: string[]
}
```

---

### 5. Tool Layer

**Tool Registry** (`src/lib/tools/registry.ts`)

Centralized tool management:
- Tool registration and lookup
- Schema validation (Zod)
- Sequential execution with early termination
- Execution timing and status tracking

**Tool Categories**:

**Database Tools** (`src/lib/tools/db.ts`):
- `checkDatabaseHealth`: Health metrics, connections, performance
- `scanSlowQueries`: Slow query identification with recommendations
- `analyzeConnections`: Connection pool analysis

**Log Tools** (`src/lib/tools/logs.ts`):
- `scanErrorLogs`: Service error log analysis
- `analyzeLogPatterns`: Pattern detection and trends

**System Tools** (`src/lib/tools/system.ts`):
- `restartService`: Rolling restart with zero downtime
- `scaleService`: Replica scaling
- `checkServiceHealth`: Service health status

**Mock Implementation**:
- Realistic latency simulation (100-500ms random)
- Structured JSON responses
- Enterprise-appropriate data (connection pools, error rates, etc.)

---

### 6. Audit Layer

**Audit Store** (`src/lib/audit/store.ts`)

Append-only audit trail:

**Storage Format**:
- Individual JSON files per event
- Filename: `YYYY-MM-DD_UUID.json`
- Directory: `/data/audit-logs/` (gitignored)

**Atomic Writes**:
1. Write to `.tmp` file
2. Rename to final location
3. Automatic cleanup on failure

**Event Structure**:
```typescript
{
  id: string,
  timestamp: string,
  input: string,
  sessionId?: string,
  plan?: ExecutionPlan,
  governanceDecision: GovernanceDecision,
  toolExecutions?: ToolExecution[],
  finalResponse?: string,
  metadata: {
    provider?: string,
    model?: string,
    totalDurationMs?: number
  }
}
```

**Features**:
- Filtering by risk level and status
- Limit support (default: last 100 events)
- Graceful error handling (continues on write failure)
- Aggregated statistics

---

## Data Flow

### Successful Execution

```
User Input
  ↓
API Validation
  ↓
LLM Plan Generation
  ↓
Governance Evaluation → ALLOWED
  ↓
Tool Execution (sequential)
  ↓
LLM Response Generation
  ↓
Audit Logging
  ↓
Response to User
```

### Blocked Execution

```
User Input
  ↓
API Validation
  ↓
LLM Plan Generation
  ↓
Governance Evaluation → BLOCKED
  ↓
Audit Logging (blocked attempt)
  ↓
403 Error Response
  ↓
Governance Alert UI
```

---

## Type System

**Strict TypeScript Configuration**:
- `strict: true`
- `noUnusedLocals: true`
- `noUnusedParameters: true`
- `noFallthroughCasesInSwitch: true`

**Shared Types**:
- `src/lib/ai/types.ts` - AI/plan types
- `src/lib/governance/types.ts` - Governance types
- `src/lib/tools/types.ts` - Tool types
- `src/lib/audit/types.ts` - Audit types

**Custom Errors** (`src/lib/utils/errors.ts`):
- `AegisError` (base)
- `LLMError`
- `PlanGenerationError`
- `GovernanceError`
- `ValidationError`
- `ToolExecutionError`

---

## Security Considerations

### 1. No Stack Trace Exposure
All errors sanitized before returning to client.

### 2. Input Validation
Zod schemas validate all inputs (user messages, tool arguments).

### 3. Governance First
All plans evaluated before execution.

### 4. Audit Everything
Complete audit trail for compliance and forensics.

### 5. No Unsafe Operations
Mock tools only - no real system access in demo.

---

## Performance Characteristics

**Expected Latency**:
- Plan generation: 1-3 seconds (LLM dependent)
- Tool execution: 100-500ms per tool (mock latency)
- Total request: 2-5 seconds (typical)

**Scalability Considerations**:
- Stateless API (horizontal scaling)
- File-based audit (migrate to database for production)
- LLM provider rate limits (handle with queuing)

---

## Production Migration Path

### Immediate (Week 1-2)
1. Replace mock tools with real integrations
2. Add PostgreSQL for audit storage
3. Implement authentication/authorization
4. Add rate limiting and request queuing

### Short-term (Month 1-2)
1. Multi-level approval workflows
2. RBAC with policy engine
3. Real-time policy updates
4. Background job processing

### Long-term (Quarter 1-2)
1. Multi-agent coordination
2. Distributed tracing
3. Advanced error recovery
4. Compliance modules (SOC2, HIPAA)

---

## Testing Strategy

**Current Coverage**:
- Type safety via TypeScript strict mode
- Runtime validation via Zod
- Manual testing via demo test cases

**Production Requirements**:
- Unit tests: All core logic (planner, governance, tools)
- Integration tests: API pipeline end-to-end
- Governance tests: All destructive patterns verified
- UI tests: Critical user flows
- Load tests: Concurrent request handling

---

## Deployment

**Current**: Local development (`npm run dev`)

**Production Ready**:
```bash
npm run build
npm start
```

**Vercel Deployment**:
- Zero-config deployment
- Environment variables via Vercel dashboard
- Automatic HTTPS
- Global CDN

**Environment Variables**:
```bash
OPENAI_API_KEY=sk-...          # Optional
ANTHROPIC_API_KEY=sk-ant-...   # Optional
MOCK_LLM=true                  # Development mode
NODE_ENV=production            # Production flag
```

---

## Monitoring (Production)

**Required Metrics**:
- Request latency (p50, p95, p99)
- Governance block rate
- LLM provider errors
- Tool execution failures
- Audit write failures

**Alerting**:
- High block rate (potential attack or misconfiguration)
- LLM provider downtime
- Spike in execution errors

**Dashboards**:
- Real-time request volume
- Risk level distribution
- Tool usage patterns
- Provider performance comparison

---

## Conclusion

This architecture demonstrates enterprise-grade thinking in a focused MVP scope. Every component is designed for production extensibility while maintaining demo simplicity.

The governance-first approach ensures safety by default, while the audit system provides full transparency and accountability—critical requirements for enterprise operations platforms.
