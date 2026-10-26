CREATE TABLE alert_drafts (
  id uuid PRIMARY KEY,
  report_id uuid NOT NULL UNIQUE REFERENCES reports(id),
  title text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 5 AND 160),
  body text NOT NULL CHECK (char_length(btrim(body)) BETWEEN 20 AND 6000),
  version integer NOT NULL DEFAULT 1 CHECK (version>0),
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid NOT NULL REFERENCES users(id),
  updated_at timestamptz NOT NULL DEFAULT now(),
  intake_analysis_id uuid REFERENCES intake_analyses(id),
  prepared_analysis_id uuid REFERENCES ai_analyses(id),
  CHECK (num_nonnulls(intake_analysis_id,prepared_analysis_id)<=1)
);
