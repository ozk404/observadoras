ALTER TABLE reports DROP CONSTRAINT reports_status_check;
ALTER TABLE reports ADD CONSTRAINT reports_status_check CHECK (status IN ('draft','pending','needs_adjustments','validated','published'));
ALTER TABLE reports DROP CONSTRAINT reports_validation_check;
ALTER TABLE reports ADD CONSTRAINT reports_validation_check CHECK (
  (status IN ('validated','published') AND validated_by IS NOT NULL AND validated_at IS NOT NULL AND validation_source IS NOT NULL)
  OR (status IN ('draft','pending','needs_adjustments') AND validated_by IS NULL AND validated_at IS NULL AND validation_source IS NULL)
);
ALTER TABLE reports ADD CONSTRAINT reports_adjustments_author_check CHECK (status<>'needs_adjustments' OR author_id IS NOT NULL);
CREATE TABLE report_adjustments (
  id uuid PRIMARY KEY,
  report_id uuid NOT NULL REFERENCES reports(id),
  note text NOT NULL CHECK (char_length(note) BETWEEN 10 AND 2000),
  requested_by uuid NOT NULL REFERENCES users(id),
  requested_at timestamptz NOT NULL DEFAULT now(),
  resolved_by uuid REFERENCES users(id),
  resolved_at timestamptz,
  CHECK ((resolved_at IS NULL) = (resolved_by IS NULL))
);
CREATE UNIQUE INDEX report_one_open_adjustment ON report_adjustments(report_id) WHERE resolved_at IS NULL;
CREATE INDEX adjustments_recent ON report_adjustments(report_id,requested_at DESC);
ALTER TABLE report_events DROP CONSTRAINT report_events_action_check;
ALTER TABLE report_events ADD CONSTRAINT report_events_action_check CHECK (action IN ('created','submitted','validated','published','adjustments_requested','resubmitted'));
ALTER TABLE ai_analyses ADD COLUMN superseded_at timestamptz;
