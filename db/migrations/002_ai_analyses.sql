CREATE TABLE ai_analyses (
  id uuid PRIMARY KEY,
  report_id uuid NOT NULL REFERENCES reports(id),
  report_version integer NOT NULL,
  requested_by uuid NOT NULL REFERENCES users(id),
  input_hash text NOT NULL,
  model text NOT NULL,
  transport text NOT NULL CHECK (transport IN ('openai','simulation')),
  status text NOT NULL CHECK (status IN ('running','succeeded','failed')),
  result jsonb,
  error_code text CHECK (error_code IN ('unavailable','timeout','invalid_response','refused','stale')),
  created_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  CHECK ((status='succeeded' AND result IS NOT NULL) OR (status<>'succeeded' AND result IS NULL))
);
CREATE UNIQUE INDEX ai_one_running ON ai_analyses(report_id) WHERE status='running';
CREATE INDEX ai_report_recent ON ai_analyses(report_id,created_at DESC);
