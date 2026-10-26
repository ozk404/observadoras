ALTER TABLE intake_analyses ALTER COLUMN synthetic_confirmed SET DEFAULT false;
ALTER TABLE intake_analyses ADD COLUMN ai_consent boolean NOT NULL DEFAULT false;
ALTER TABLE intake_analyses ADD COLUMN consent_version text;
ALTER TABLE intake_analyses ADD COLUMN consented_at timestamptz;
ALTER TABLE intake_analyses ADD CONSTRAINT intake_consent_record CHECK(
  (ai_consent AND consent_version IS NOT NULL AND consented_at IS NOT NULL)
  OR (NOT ai_consent AND consent_version IS NULL AND consented_at IS NULL)
);
