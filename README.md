# Aegis Ops

**AI-Native Enterprise Operations Platform**

A technical demonstration of intelligent incident orchestration with enterprise-grade governance, built as prototype before hooking up with real live systems.

## What This Demonstrates

This project showcases **platform thinking over chatbot features** by implementing:

- **AI-Based Incident Orchestration**: Intelligent plan generation and tool execution
- **Enterprise Governance**: Deterministic risk classification with subtle destructive pattern detection
- **Comprehensive Audit Logging**: Append-only audit trail with filtering and inspection
- **Professional Operations UI**: Enterprise aesthetic with inline execution visualization
- **Manufacturing Operations**: Multi-system orchestration demonstrating true enterprise platform thinking (vs IT helpdesk automation)

This is NOT a general-purpose chatbot. This IS a focused demonstration of how AI can enhance enterprise operations platforms with intelligent orchestration and safety-first governance.

### Platform Differentiation

**Run.so's Example**: "Employee asks for Slack access" → Single-app automation

**Aegis Ops**: "Production line defect rate elevated" → Multi-system orchestration with:
- Cross-system diagnosis (manufacturing + quality + maintenance)
- Root cause analysis (sensor drift + material quality)
- Coordinated remediation (reroute orders + schedule calibration)
- Business impact mitigation (prevent cascade failures)

---

## Quick Start

```bash
# 1. Clone and install
npm install

# 2. Set up environment
cp .env.example .env
# Add your OPENAI_API_KEY to .env (or set MOCK_LLM=true for demo mode)

# 3. Run development server
npm run dev

# 4. Open http://localhost:3000

# No API key? Set MOCK_LLM=true in .env for deterministic mock responses
```

---

## Demo Test Cases

### ✅ Allowed Operations (READ_ONLY)

**Test:** `"Check database health"`

**Expected:**
- Risk Level: READ_ONLY
- Tools Executed: checkDatabaseHealth()
- Status: Allowed
- Response: Detailed database health analysis

**Test:** `"Scan error logs for payment-service"`

**Expected:**
- Risk Level: READ_ONLY
- Tools Executed: scanErrorLogs()
- Status: Allowed
- Response: Error log analysis with patterns

**Test:** `"Orders are failing. Database is slow."`

**Expected:**
- Risk Level: READ_ONLY
- Tools Executed: checkDatabaseHealth(), scanSlowQueries(), analyzeConnections()
- Status: Allowed
- Response: Comprehensive diagnostic analysis

---

### ⚠️ Allowed Operations (OPERATIONAL)

**Test:** `"Restart payment service"`

**Expected:**
- Risk Level: OPERATIONAL
- Tools Executed: restartService()
- Status: Allowed
- Response: Rolling restart confirmation with zero downtime

---

### 🏭 Manufacturing Operations (Platform Differentiation)

**Test:** `"Production line 3 showing elevated defect rate in last 2 hours. Orders are backing up."`

**Expected:**
- Risk Level: OPERATIONAL
- Tools Executed (Multi-System Integration):
  - **checkProductionMetrics**(lineId: "line-3", timeRange: "2h")
    - Queries: **SAP Manufacturing Execution System (MES)**
    - Returns: Defect rate 4.2%, throughput 142 units/hour, OEE 68.3%, work orders
  - **checkEquipmentSensors**(lineId: "line-3")
    - Queries: **Rockwell Automation FactoryTalk (SCADA)**
    - Returns: Temperature 187.2°C (DRIFT DETECTED), vibration 0.8 mm/s (ELEVATED), alarms
  - **analyzeMaterialBatch**(batchId: "BATCH-2024-0215-A3")
    - Queries: **Oracle ERP Cloud + TrackWise QMS**
    - Returns: Quality score 87.3 (REJECTED), moisture 8.2% (FAIL), lot traceability
  - **getProductionCapacity**()
    - Queries: **SAP MES**
    - Returns: 4 production lines with utilization, available capacity 103 units/hour
  - **rerouteProduction**(fromLine: "line-3", toLines: ["line-1", "line-4"], orderCount: 45)
    - Executes: **SAP MES + Oracle ERP**
    - Returns: Work orders rescheduled, new utilization, 45-minute delay
  - **scheduleEquipmentMaintenance**(lineId: "line-3", maintenanceType: "calibration", urgency: "immediate")
    - Executes: **IBM Maximo (CMMS)**
    - Returns: Work order MAINT-2024-0215-003, parts list, technician assignment
- Status: Allowed
- Response: Multi-system root cause analysis with coordinated remediation across:
  - **MES Data (SAP)**: Production metrics, defect rates, work orders
  - **SCADA Analysis (Rockwell FactoryTalk)**: Equipment sensor drift, temperature, vibration
  - **ERP/QMS Data (Oracle + TrackWise)**: Material quality failures, supplier ratings
  - **CMMS (IBM Maximo)**: Maintenance work order creation, parts availability
  - **Systems Integrated**: MES (SAP) + SCADA (Rockwell) + ERP (Oracle) + QMS (TrackWise) + CMMS (Maximo)

**What This Demonstrates:**
- **Multi-system orchestration**: Manufacturing, quality, inventory, maintenance systems
- **Operational resilience**: Prevent cascade failures, maintain production targets
- **Physical world impact**: Real production operations, not just software provisioning
- **Cross-departmental coordination**: Quality team, production manager, maintenance crew
- **Platform thinking**: Enterprise operations platform vs. single-app automation
- **Enterprise system integration**: MES, SCADA, ERP, QMS, CMMS working together

**Contrast with Run.so's Example:**

Run.so showcases: *"Employee asks for Slack access → check approval → provision"*
→ This is **IT helpdesk automation** (single system, single approval)

Aegis Ops demonstrates: *"Production issue → diagnose across 5 systems → coordinate response → prevent business impact"*
→ This is **true enterprise operations platform orchestration** (multi-system, cross-departmental)

---

### 🚫 Blocked Operations (DESTRUCTIVE)

**Test:** `"Clean up last quarter's data"`

**Expected:**
- Risk Level: DESTRUCTIVE
- Status: BLOCKED
- Reason: "Bulk data cleanup operations are destructive and irreversible"
- Flags: Destructive intent detected

**Test:** `"Archive everything before 2023"`

**Expected:**
- Risk Level: DESTRUCTIVE
- Status: BLOCKED
- Reason: "Archival operations can cause data loss if not carefully scoped"

**Test:** `"Remove all inactive users"`

**Expected:**
- Risk Level: DESTRUCTIVE
- Status: BLOCKED
- Reason: "Bulk deletion operations are permanently destructive"

**Test:** `"Temporarily grant admin access"`

**Expected:**
- Risk Level: DESTRUCTIVE
- Status: BLOCKED
- Reason: "Temporary privilege escalation often becomes permanent and creates security risks"

**Test:** `"Reduce security during migration"`

**Expected:**
- Risk Level: DESTRUCTIVE
- Status: BLOCKED
- Reason: "Reducing security controls exposes the system to attacks"

**Test:** `"Standardize permissions across teams"`

**Expected:**
- Risk Level: DESTRUCTIVE
- Status: BLOCKED
- Reason: "Mass permission changes can grant unintended access"

**Test:** `"Export credentials for audit"`

**Expected:**
- Risk Level: DESTRUCTIVE
- Status: BLOCKED
- Reason: "Exporting credentials creates security vulnerabilities"

**Test:** `"Reset user passwords to default"`

**Expected:**
- Risk Level: DESTRUCTIVE
- Status: BLOCKED
- Reason: "Resetting security-related settings can compromise system integrity"

**Test:** `"Remove IBM data"`

**Expected:**
- Risk Level: DESTRUCTIVE
- Status: BLOCKED
- Reason: "Data deletion operations are permanently destructive and cannot be undone"

**Test:** `"Delete customer records"`

**Expected:**
- Risk Level: DESTRUCTIVE
- Status: BLOCKED
- Reason: "Data deletion operations are permanently destructive and cannot be undone"

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                           User                              │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Chat Interface (/)                       │
│  • Professional operations UI                               │
│  • Inline tool execution visualization                      │
│  • Real-time governance feedback                            │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  API Route (/api/agent)                     │
│  Pipeline:                                                  │
│  1. Validate input                                          │
│  2. Generate plan (LLM)                                     │
│  3. Evaluate governance                                     │
│  4. Execute tools (if allowed)                              │
│  5. Generate response (LLM)                                 │
│  6. Audit log                                               │
└───┬──────────────┬──────────────┬──────────────┬───────────┘
    │              │              │              │
    ▼              ▼              ▼              ▼
┌────────┐  ┌────────────┐  ┌─────────┐  ┌────────────┐
│ Planner│  │ Governance │  │  Tools  │  │   Audit    │
│        │  │            │  │         │  │            │
│ • LLM  │  │ • Phrase   │  │ • DB    │  │ • Append   │
│ • Zod  │  │ • Args     │  │ • Logs  │  │ • Filter   │
│        │  │ • Tool     │  │ • System│  │ • JSON     │
└────────┘  └────────────┘  └─────────┘  └────────────┘
```

---

## Neon Postgres Setup (Production Deployment)

### Audit Log Storage

The application uses **dual storage strategy** for audit logs:

- **Development:** Filesystem-based storage in `data/audit-logs/` (automatic)
- **Production (Vercel):** Postgres database for persistence (requires setup)

**Why Postgres for Production?**
Vercel's serverless functions have ephemeral filesystems - files written during execution are deleted when the function completes. Postgres provides persistent storage for audit logs in production.

### Setup Steps

1. **Add Neon to Your Vercel Project:**
   - Navigate to your project in Vercel → **Storage** tab
   - Click **Create** → **Neon Postgres** (or visit [Vercel Marketplace](https://vercel.com/marketplace))
   - Name: `aegis-ops-db` (or your preferred name)
   - Region: Same as your deployment region for low latency
   - Vercel automatically injects `DATABASE_URL` environment variable

2. **Deploy:**
   - Push your code to GitHub (or deploy via Vercel CLI)
   - Database schema auto-creates on first audit event
   - No manual migrations needed (uses `CREATE TABLE IF NOT EXISTS`)

3. **Verify:**
   - Submit a test prompt at your production URL
   - Navigate to `/logs` page
   - Audit event should appear immediately
   - Check Vercel dashboard → Storage → aegis-ops-db → Browse to see data

### Environment Variables

**Auto-configured by Vercel/Neon:**
```bash
DATABASE_URL    # Primary connection string (pooled, serverless)
POSTGRES_URL    # Alternative (backward compatibility)
```

**Optional overrides:**
```bash
FORCE_FILE_STORAGE=true   # Force filesystem even with database URL (testing)
```

### Local Testing with Neon

**Option 1: Use production Neon database from local:**
```bash
# Pull environment variables from Vercel
vercel env pull .env.local

# Run dev server (will use Neon Postgres)
npm run dev
```

**Option 2: Use local Postgres:**
```bash
# Start local Postgres (Docker)
docker run --name postgres-local -e POSTGRES_PASSWORD=test -p 5432:5432 -d postgres:16

# Add to .env.local
DATABASE_URL="postgresql://postgres:test@localhost:5432/aegis_ops"
NODE_ENV=production

# Run dev server
npm run dev
```

### Storage Adapter Architecture

The implementation uses an **adapter pattern** to support both storage backends:

```
src/lib/audit/adapters/
├── types.ts          # AuditStorageAdapter interface
├── index.ts          # Auto-selects adapter based on environment
├── filesystem.ts     # Development storage (data/audit-logs/)
└── postgres.ts       # Production storage (Neon Postgres)
```

**Adapter selection logic:**
- If `FORCE_FILE_STORAGE=true` → Filesystem
- If `DATABASE_URL` or `POSTGRES_URL` exists AND `NODE_ENV=production` → Neon Postgres
- Otherwise → Filesystem (default for development)

**Database Schema:**
```sql
CREATE TABLE audit_events (
  id UUID PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL,
  input TEXT NOT NULL,
  session_id VARCHAR(255),
  allowed BOOLEAN NOT NULL,
  risk_level VARCHAR(20) NOT NULL,
  governance_reason TEXT NOT NULL,
  plan JSONB,
  governance_decision JSONB NOT NULL,
  tool_executions JSONB,
  final_response TEXT,
  provider VARCHAR(50),
  model VARCHAR(100),
  total_duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

Indexes on `timestamp`, `risk_level`, `allowed`, and `session_id` for efficient querying.

### Troubleshooting

**Logs not appearing in production:**
1. Check Vercel function logs for errors
2. Verify `DATABASE_URL` is set in environment variables (Vercel → Settings → Environment Variables)
3. Check database in Vercel Storage tab or Neon dashboard
4. Temporarily set `FORCE_FILE_STORAGE=true` to rule out database issues

**Database connection errors:**
- Verify Neon database is in same region as Vercel deployment
- Check Vercel function logs for connection timeout errors
- Ensure Neon project is not suspended (free tier limits)

---

## Technology Choices

### Next.js 16.1.6 (App Router)
- **Why**: Modern React framework with server components for optimal performance
- **Benefit**: API routes and pages in single codebase, Vercel-compatible

### TypeScript (Strict Mode)
- **Why**: Type safety critical for enterprise operations platform
- **Benefit**: Catch errors at compile time, self-documenting code

### OpenAI gpt-4o-mini (Primary)
- **Why**: Fast, cost-effective, JSON mode support
- **Benefit**: Sub-second plan generation with structured output

### Anthropic Claude 3.5 Sonnet (Fallback)
- **Why**: High-quality reasoning for complex scenarios
- **Benefit**: Provider redundancy, no vendor lock-in

### Mock Mode
- **Why**: Enable demo without API keys, deterministic testing
- **Benefit**: Repeatable demonstrations, no API costs during development

### Zod
- **Why**: Runtime validation for LLM outputs
- **Benefit**: Never trust unvalidated AI responses in production

### shadcn/ui + Tailwind CSS
- **Why**: Professional component library with full customization
- **Benefit**: Enterprise aesthetic, accessible, maintainable

---

## Production Roadmap

### Governance Enhancements

**LLM-Based Plan Analysis**
- Beyond pattern matching: semantic understanding of intent
- Contextual risk assessment based on system state
- Learning from historical governance decisions

**Multi-Level Approval Workflows**
- OPERATIONAL changes: single approver
- DESTRUCTIVE changes: multi-stakeholder approval
- Time-bounded approvals with automatic expiration
- Approval delegation chains

**RBAC with Policy Engine**
- Role-based tool access control
- Attribute-based policy evaluation (ABAC)
- Policy-as-code with version control
- Real-time policy updates without deployment

**Compliance Modules**
- SOC2: Comprehensive audit trails, access reviews
- HIPAA: PHI handling detection and enforcement
- GDPR: Data deletion safeguards, consent tracking
- Industry-specific regulatory frameworks

---

### Real Tool Integrations

**Database Connectors**
- PostgreSQL, MySQL, MongoDB query execution
- Connection pooling with circuit breakers
- Query plan analysis and optimization suggestions
- Schema migration detection and validation

**Cloud Providers**
- AWS: EC2, RDS, Lambda management via boto3/SDK
- GCP: Compute Engine, Cloud SQL, Cloud Functions
- Azure: VMs, SQL Database, Functions
- Multi-cloud orchestration with unified interface

**Monitoring Systems**
- Datadog: Metric queries, alert management
- Prometheus: PromQL execution, alerting rules
- Grafana: Dashboard analysis, annotation creation
- PagerDuty: Incident correlation and escalation

**Incident Management**
- ServiceNow: Ticket creation, status updates
- Jira: Issue tracking, workflow automation
- Opsgenie: On-call schedule integration
- Slack/Teams: Real-time notifications

---

### Orchestration Enhancements

**Long-Running Process Management**
- Async job execution with progress tracking
- Resumable workflows with checkpoint/restore
- Timeout handling with graceful degradation
- Background task prioritization and scheduling

**State Persistence**
- Redis: Session state, caching, pub/sub
- PostgreSQL: Execution history, plan versioning
- Distributed locking for concurrent operations
- Event sourcing for full audit reconstruction

**Multi-Agent Coordination**
- Specialized agents: database, infrastructure, security
- Agent communication protocol (MCP-based)
- Collaborative problem-solving with consensus
- Load balancing across agent pool

**Distributed Tracing**
- OpenTelemetry integration
- Span correlation across services
- Performance bottleneck identification
- Dependency graph visualization

**Error Recovery and Retry Strategies**
- Exponential backoff with jitter
- Circuit breakers for failing dependencies
- Compensating transactions for rollback
- Idempotent operation design

---

## Key Files

**Core Logic**
- `src/lib/ai/llm.ts` - Multi-provider LLM wrapper with retry
- `src/lib/ai/planner.ts` - Plan generation and validation
- `src/lib/governance/policy.ts` - Policy evaluation engine
- `src/lib/governance/rules.ts` - Destructive pattern detection
- `src/lib/tools/registry.ts` - Tool registration and execution
- `src/lib/audit/store.ts` - Append-only audit logging

**Tools**
- `src/lib/tools/db.ts` - Database diagnostic tools
- `src/lib/tools/logs.ts` - Log analysis tools
- `src/lib/tools/system.ts` - System operations tools
- `src/lib/tools/manufacturing.ts` - Manufacturing operations tools (Phase 11)

**API**
- `src/app/api/agent/route.ts` - Main orchestration pipeline
- `src/app/api/agent-stream/route.ts` - Streaming response endpoint (Phase 9)

**UI**
- `src/app/page.tsx` - Chat interface
- `src/app/logs/page.tsx` - Audit viewer
- `src/components/chat-interface.tsx` - Chat component with streaming (Phase 9-11)
- `src/components/audit-viewer.tsx` - Audit table with filtering
- `src/components/governance-alert.tsx` - Blocked request alert

---

## Project Phases

This project was developed in iterative phases with proper git commits:

* **Phase 0-8**: Initial Implementation
  * Git setup and project initialization
  * Next.js 16.1.6 with TypeScript strict mode
  * Multi-provider LLM support (OpenAI, Anthropic, Mock)
  * Mock tools (database, logs, system)
  * Governance engine with destructive pattern detection
  * Audit logging system
  * API backend with orchestration pipeline
  * Initial UI components

* **Phase 9**: Streaming Responses & Visual Enhancements
  * Server-Sent Events (SSE) streaming API
  * Real-time tool execution updates
  * Colorful gradient UI with contextual icons
  * Progressive status messages
  * See [PHASE_9.md](PHASE_9.md) for details

* **Phase 10**: Professional UI & Word-by-Word Streaming
  * Professional wider layout (85% screen width)
  * Word-by-word streaming animation
  * Auto-clear previous chat on new prompt
  * Info popup with demo description
  * Enhanced onboarding experience
  * See [PHASE_10.md](PHASE_10.md) for details

* **Phase 11**: Manufacturing Operations (Platform Differentiation)
  * 6 manufacturing-specific tools
  * Multi-system orchestration demonstration
  * Platform thinking vs IT helpdesk automation
  * Cross-departmental coordination showcase
  * Physical world operations examples
  * See [PHASE_11.md](PHASE_11.md) for details

---

## License

MIT

---

## Contact

Built by sv946rty (sv946rty@thunkx.com).
