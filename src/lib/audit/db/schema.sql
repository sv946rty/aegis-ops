-- Aegis Ops Audit Events Schema for Vercel Postgres
-- This schema stores audit logs for all agent executions with governance decisions

CREATE TABLE IF NOT EXISTS audit_events (
  -- Primary identifier
  id UUID PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL,

  -- User request context
  input TEXT NOT NULL,
  session_id VARCHAR(255),

  -- Normalized governance fields for efficient querying
  allowed BOOLEAN NOT NULL,
  risk_level VARCHAR(20) NOT NULL,
  governance_reason TEXT NOT NULL,

  -- Complex objects stored as JSONB for flexibility
  plan JSONB,
  governance_decision JSONB NOT NULL,
  tool_executions JSONB,
  final_response TEXT,

  -- Execution metadata
  provider VARCHAR(50),
  model VARCHAR(100),
  total_duration_ms INTEGER,

  -- Audit trail
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for sorting by timestamp (most recent first)
-- Used by logs page default view
CREATE INDEX IF NOT EXISTS idx_audit_events_timestamp
  ON audit_events(timestamp DESC);

-- Composite index for filtered queries
-- Used by logs page with risk level and status filters
CREATE INDEX IF NOT EXISTS idx_audit_events_filters
  ON audit_events(risk_level, allowed, timestamp DESC);

-- Index for session-based queries (when sessionId is present)
CREATE INDEX IF NOT EXISTS idx_audit_events_session_id
  ON audit_events(session_id)
  WHERE session_id IS NOT NULL;

-- GIN indexes for JSONB querying (optional, for future advanced filtering)
-- Uncomment if needed for complex JSON queries
-- CREATE INDEX IF NOT EXISTS idx_audit_events_plan
--   ON audit_events USING GIN (plan);
-- CREATE INDEX IF NOT EXISTS idx_audit_events_tool_executions
--   ON audit_events USING GIN (tool_executions);
