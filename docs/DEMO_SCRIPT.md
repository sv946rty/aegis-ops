# Demo Script

This guide provides a structured demonstration flow for the AI-native enterprise operations platform demo.

**Duration**: 15-20 minutes
**Focus**: Platform thinking, governance maturity, architectural decisions

---

## Pre-Demo Setup

### Environment Check
```bash
# Ensure dependencies are installed
npm install

# Set up environment (choose one)
# Option 1: Mock mode (no API keys needed)
echo "MOCK_LLM=true" > .env
echo "NODE_ENV=development" >> .env

# Option 2: OpenAI (recommended)
echo "OPENAI_API_KEY=sk-..." > .env
echo "NODE_ENV=development" >> .env

# Start development server
npm run dev
```

### Browser Prep
- Open http://localhost:3000 (chat interface)
- Open http://localhost:3000/logs in second tab (audit viewer)
- Clear any previous demo data: `rm -rf data/audit-logs/*`

---

## Demo Flow

### Part 1: Platform Introduction (2-3 minutes)

**Talking Points**:

> "This is Aegis Ops, a demonstration of AI-native enterprise operations. Unlike chatbots that focus on conversation, this platform demonstrates intelligent orchestration with governance as a first-class concern."

> "The key differentiator is how we handle operations that could be destructive. Rather than executing everything the AI suggests, we have deterministic governance that evaluates risk before execution."

**Show**: Main chat interface

**Point out**:
- Professional operations aesthetic (NOT chatbot)
- Example prompts showcase different risk levels
- Link to audit logs (transparency)

---

### Part 2: READ_ONLY Operations (3-4 minutes)

**Demo Flow 1**: Incident Diagnosis

**Input**: `"Orders are failing. Database is slow."`

**Wait for response**, then explain:

> "Notice how the system:
> 1. Analyzed the incident
> 2. Generated a multi-step execution plan
> 3. Classified as READ_ONLY risk
> 4. Executed diagnostic tools sequentially
> 5. Provided actionable analysis"

**Point out**:
- Risk level badge (READ_ONLY - green)
- Tool execution visualization with timing
- Professional response format
- No separate chat bubbles per tool (inline status)

**Switch to Audit Logs tab**

> "Every execution is logged to an append-only audit trail."

**Show**:
- New entry in audit table
- Click to expand full trace
- Metadata (provider, model, duration)
- Collapsible JSON view

---

### Part 3: OPERATIONAL Risk (2-3 minutes)

**Demo Flow 2**: Service Restart

**Return to chat tab**

**Input**: `"Restart payment service"`

**Explain during execution**:

> "This is an OPERATIONAL change—it modifies system state but isn't destructive. The governance system allows it but tracks it differently."

**Point out**:
- Risk level badge (OPERATIONAL - blue)
- Tool: restartService with zero downtime
- Monitoring note in governance decision

**Return to audit logs**

**Show**:
- Filter by Risk Level → OPERATIONAL
- URL changes to `/logs?risk=OPERATIONAL` (shareable filtered view)

---

### Part 4: Governance Blocking (5-6 minutes)

**This is the core demonstration of platform thinking.**

**Demo Flow 3**: Subtle Destructive Request

**Return to chat tab**

**Input**: `"Clean up last quarter's data"`

**Wait for BLOCKED response**

**Explain**:

> "This is where Aegis Ops differs from a simple chatbot. The system detected subtle destructive intent through pattern analysis."

**Point out the alert**:
- Prominent red blocking alert
- Detection details explaining WHY it's dangerous
- Educational tone explaining governance rationale
- No execution occurred

**Show governance details**:
- "Bulk data cleanup operations are destructive and irreversible"
- Flag: "Destructive intent detected in user message"
- Educational section about enterprise platform requirements

**Return to audit logs**

**Show**:
- Filter by Status → Blocked
- Blocked attempt is still logged (accountability)
- No tool executions (stopped at governance)

---

**Demo Flow 4**: More Destructive Patterns

**Return to chat, demonstrate 2-3 more**:

1. **Input**: `"Remove all inactive users"`
   - **Blocked**: "Bulk deletion operations are permanently destructive"

2. **Input**: `"Temporarily grant admin access"`
   - **Blocked**: "Temporary privilege escalation often becomes permanent"

3. **Input**: `"Export credentials for audit"`
   - **Blocked**: "Exporting credentials creates security vulnerabilities"

**Explain**:

> "The governance system isn't just keyword matching. It understands context:
> - 'Clean up' could be benign, but 'clean up last quarter' has high impact scope
> - 'Temporarily' sounds safe, but temporary privilege grants rarely get revoked
> - 'For audit' sounds legitimate, but credential export is never safe
>
> This kind of subtle pattern detection is critical for enterprise safety."

---

### Part 5: Architecture Deep Dive (3-5 minutes)

**Open code if appropriate, or discuss from architecture diagram**

**Key Points**:

**Multi-Provider LLM Strategy**:
> "I implemented provider abstraction with OpenAI as primary (fast + cheap), Anthropic as fallback (quality), and mock mode for deterministic testing. No vendor lock-in."

**Governance Architecture**:
> "Governance uses three signals:
> 1. Phrase patterns (regex with contextual awareness)
> 2. Tool risk metadata (each tool has inherent risk level)
> 3. Argument heuristics (wildcards, large date ranges, batch operations)
>
> This multi-signal approach catches more edge cases than any single method."

**Audit Trail Design**:
> "Append-only JSON files with atomic writes. Each event is a separate file for:
> - Immutability (can't alter history)
> - Simplicity (no database required for demo)
> - Inspectability (every file is readable JSON)
>
> Production would use PostgreSQL, but the append-only principle remains."

**Tool Abstraction**:
> "Tools are mock but realistic. Each simulates latency (100-500ms) to demonstrate async orchestration. In production, these would be replaced with real database connectors, cloud APIs, monitoring systems."

---

### Part 6: Production Roadmap (2-3 minutes)

**Discuss future enhancements** (from README.md):

**Near-term**:
- LLM-based plan analysis (semantic understanding beyond patterns)
- Multi-level approval workflows (stakeholder consensus)
- RBAC with policy engine (who can do what)

**Long-term**:
- Real tool integrations (AWS, GCP, Datadog, PagerDuty)
- Multi-agent coordination (specialized agents collaborating)
- Compliance modules (SOC2, HIPAA, GDPR)
- Distributed tracing (OpenTelemetry)

**Emphasize**:

> "This roadmap demonstrates production-level thinking. Each enhancement addresses real enterprise requirements:
> - Approval workflows → enterprise governance
> - RBAC → least privilege access
> - Compliance modules → regulatory requirements
> - Multi-agent coordination → scaling complexity
>
> This isn't 'add more features'—it's systematic platform evolution."

---

## Key Messages to Emphasize

### 1. Platform Thinking Over Features
- Governance is first-class, not an afterthought
- Audit trail provides accountability
- Risk classification guides operational policy

### 2. Engineering Judgment
- TypeScript strict mode (catch errors early)
- Zod validation (never trust LLM output)
- No stack traces exposed (security)
- Graceful error handling

### 3. Enterprise Context
- ServiceNow alternative positioning
- Operations platform, not productivity tool
- Safety-first design
- Compliance-ready architecture

### 4. Demo Scope Awareness
- Focused on demonstrating principles, not building full platform
- Mock tools show orchestration without complexity
- 1-2 day build demonstrates execution speed
- Production roadmap shows scale understanding

---

## Handling Questions

### "Why not use [framework X]?"
> "Next.js provides the right balance for this demo: API routes + UI in one codebase, Vercel deployment, server components for optimal performance. For a larger platform, I'd evaluate adding a separate backend service, but that's overengineering for this scope."

### "How would you handle [production scenario Y]?"
> "Great question. [Explain using production roadmap context]. For example, for long-running operations, I'd implement async job processing with Redis for state management and webhooks for completion notification."

### "What about security?"
> "Security is layered:
> 1. Input validation (Zod schemas)
> 2. Governance blocks destructive operations
> 3. No stack traces exposed
> 4. Complete audit trail
> 5. In production: add authentication, RBAC, rate limiting, encryption at rest"

### "Why mock tools instead of real integrations?"
> "Time-boxing. Real integrations would add 3-5 days without demonstrating new concepts. The mock tools show orchestration patterns and latency handling. The tool registry abstraction means swapping in real tools is just implementing the interface."

---

## Backup Demos (If Time Permits)

### Filter Persistence Demo
1. Apply filters in audit logs
2. Copy URL: `http://localhost:3000/logs?risk=DESTRUCTIVE&status=blocked`
3. Open in new tab → filters preserved
4. Explain: "Shareable filtered views for team collaboration"

### Type Safety Demo
1. Open `src/lib/ai/types.ts`
2. Show Zod schemas
3. Explain: "LLM output is validated at runtime. If the AI returns invalid JSON, we catch it before execution."

### Error Handling Demo
1. Trigger an error (e.g., malformed request)
2. Show structured error response
3. Point out: "No stack traces, clean error codes, helpful messages"

---

## Closing

**Summary**:

> "Aegis Ops demonstrates how AI can enhance enterprise operations with:
> - Intelligent orchestration (multi-step plans, tool execution)
> - Governance first (safety before execution)
> - Complete transparency (audit everything)
> - Platform thinking (not just a chatbot)
>
> This is the foundation for a modern alternative to ServiceNow—where AI doesn't just assist, it orchestrates, with enterprise-grade safety and accountability."

**Ask for feedback**:

> "What questions do you have about the architecture, implementation choices, or production roadmap?"

---

## Post-Demo

If showing code:
- `src/lib/governance/rules.ts` - Pattern detection
- `src/lib/ai/planner.ts` - Structured plan generation
- `src/app/api/agent/route.ts` - Orchestration pipeline
- `src/lib/audit/store.ts` - Atomic writes

**Be ready to discuss**:
- Scaling strategies
- Real-world edge cases
- Integration complexity
- Team collaboration workflows
- Monitoring and observability
