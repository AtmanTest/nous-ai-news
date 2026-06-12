-- Shield runs table for cron job tracking
CREATE TABLE IF NOT EXISTS shield_runs (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_type              TEXT NOT NULL DEFAULT 'full_cycle',
  started_at            TIMESTAMPTZ NOT NULL,
  ended_at              TIMESTAMPTZ,
  status                TEXT NOT NULL CHECK (status IN ('success', 'partial', 'failed')),
  articles_added        INTEGER DEFAULT 0,
  articles_updated      INTEGER DEFAULT 0,
  duplicates_removed    INTEGER DEFAULT 0,
  broken_sources        INTEGER DEFAULT 0,
  signals_fetched       INTEGER DEFAULT 0,
  health_score          INTEGER DEFAULT 100,
  errors                TEXT[] DEFAULT '{}',
  suggested_improvements TEXT[] DEFAULT '{}',
  applied_improvements  TEXT[] DEFAULT '{}',
  report_json           JSONB DEFAULT '{}',
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS shield_runs_status_idx ON shield_runs(status);
CREATE INDEX IF NOT EXISTS shield_runs_started_at_idx ON shield_runs(started_at DESC);

ALTER TABLE shield_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shield_runs_admin_all" ON shield_runs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "shield_runs_public_read" ON shield_runs
  FOR SELECT USING (true);
