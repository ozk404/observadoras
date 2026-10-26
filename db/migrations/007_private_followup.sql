CREATE TABLE report_followup_events (
  id uuid PRIMARY KEY,
  report_id uuid NOT NULL REFERENCES reports(id),
  kind text NOT NULL CHECK (kind IN ('note','closed')),
  note text NOT NULL CHECK (char_length(btrim(note)) BETWEEN 10 AND 2000),
  reviewer_id uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX followup_history ON report_followup_events(report_id,created_at,id);
CREATE UNIQUE INDEX followup_single_closure ON report_followup_events(report_id) WHERE kind='closed';
