CREATE TABLE alert_generations (
  id uuid PRIMARY KEY,
  report_id uuid NOT NULL REFERENCES reports(id),
  report_version integer NOT NULL CHECK(report_version>0),
  draft_version integer NOT NULL CHECK(draft_version>=0),
  requested_by uuid NOT NULL REFERENCES users(id),
  input_hash text NOT NULL,
  model text NOT NULL,
  transport text NOT NULL CHECK(transport IN ('openai','simulation')),
  status text NOT NULL CHECK(status IN ('running','succeeded','failed')),
  result jsonb,
  error_code text CHECK(error_code IN ('unavailable','timeout','invalid_response','refused','stale')),
  created_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  CHECK((status='succeeded' AND result IS NOT NULL) OR (status<>'succeeded' AND result IS NULL))
);
CREATE UNIQUE INDEX alert_generation_running ON alert_generations(report_id) WHERE status='running';
CREATE INDEX alert_generation_recent ON alert_generations(report_id,created_at DESC,id);
ALTER TABLE alert_drafts ADD COLUMN alert_generation_id uuid REFERENCES alert_generations(id);
ALTER TABLE alert_drafts DROP CONSTRAINT alert_drafts_check;
ALTER TABLE alert_drafts ADD CONSTRAINT alert_drafts_source_check CHECK(num_nonnulls(intake_analysis_id,prepared_analysis_id,alert_generation_id)<=1);
