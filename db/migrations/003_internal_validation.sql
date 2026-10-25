ALTER TABLE reports DROP CONSTRAINT reports_status_check;
ALTER TABLE reports ADD CONSTRAINT reports_status_check CHECK (status IN ('draft','pending','validated','published'));
ALTER TABLE reports ADD COLUMN validated_by uuid REFERENCES users(id);
ALTER TABLE reports ADD COLUMN validated_at timestamptz;
ALTER TABLE reports ADD COLUMN validation_source text CHECK (validation_source IN ('explicit','legacy_publication'));

-- Existing publications already required human approval. Preserve that evidence
-- without inventing a separate historical validation action or timestamp.
UPDATE reports r SET validated_by=p.published_by,validated_at=p.published_at,validation_source='legacy_publication'
FROM publications p WHERE p.report_id=r.id AND r.status='published';

ALTER TABLE reports ADD CONSTRAINT reports_validation_check CHECK (
  (status IN ('validated','published') AND validated_by IS NOT NULL AND validated_at IS NOT NULL AND validation_source IS NOT NULL)
  OR (status IN ('draft','pending') AND validated_by IS NULL AND validated_at IS NULL AND validation_source IS NULL)
);
ALTER TABLE report_events DROP CONSTRAINT report_events_action_check;
ALTER TABLE report_events ADD CONSTRAINT report_events_action_check CHECK (action IN ('created','submitted','validated','published'));
