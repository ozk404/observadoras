ALTER TABLE reports ADD COLUMN reviewed_categories text[] NOT NULL DEFAULT '{}';
ALTER TABLE reports ADD COLUMN review_observation text CHECK(char_length(review_observation)<=2000);
CREATE TABLE intake_analyses (
  id uuid PRIMARY KEY,
  report_id uuid NOT NULL UNIQUE REFERENCES reports(id),
  report_version integer NOT NULL,
  synthetic_confirmed boolean NOT NULL,
  state text NOT NULL CHECK(state IN ('queued','processing','completed','failed','blocked','superseded')),
  attempts integer NOT NULL DEFAULT 0 CHECK(attempts BETWEEN 0 AND 2),
  available_at timestamptz NOT NULL DEFAULT now(),
  lease_token uuid,
  lease_until timestamptz,
  result jsonb,
  error_code text CHECK(error_code IN ('configuration','privacy','unavailable','timeout','invalid_response','refused','quota','stale')),
  model text,
  transport text CHECK(transport IN ('openai','simulation')),
  last_retry_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  CHECK(state<>'completed' OR result IS NOT NULL),
  CHECK((state='processing' AND lease_token IS NOT NULL AND lease_until IS NOT NULL) OR (state<>'processing' AND lease_token IS NULL AND lease_until IS NULL))
);
CREATE INDEX intake_pending ON intake_analyses(state,available_at);
