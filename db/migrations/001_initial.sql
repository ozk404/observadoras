CREATE TABLE users (
  id uuid PRIMARY KEY,
  username text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role text NOT NULL CHECK (role IN ('participant', 'reviewer')),
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE sessions (
  token_hash text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL
);
CREATE TABLE reports (
  id uuid PRIMARY KEY,
  submission_key uuid UNIQUE,
  author_id uuid REFERENCES users(id),
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 160),
  description text NOT NULL CHECK (char_length(description) <= 6000),
  status text NOT NULL CHECK (status IN ('draft', 'pending', 'published')),
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (status <> 'draft' OR author_id IS NOT NULL)
);
CREATE TABLE publications (
  id uuid PRIMARY KEY,
  report_id uuid NOT NULL UNIQUE REFERENCES reports(id),
  title text NOT NULL CHECK (char_length(title) BETWEEN 5 AND 160),
  body text NOT NULL CHECK (char_length(body) BETWEEN 20 AND 6000),
  published_by uuid NOT NULL REFERENCES users(id),
  published_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE report_events (
  id uuid PRIMARY KEY,
  report_id uuid NOT NULL REFERENCES reports(id),
  actor_id uuid REFERENCES users(id),
  action text NOT NULL CHECK (action IN ('created', 'submitted', 'published')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE rate_limits (
  key text PRIMARY KEY,
  count integer NOT NULL,
  expires_at timestamptz NOT NULL
);
CREATE INDEX reports_author ON reports(author_id, created_at DESC);
CREATE INDEX reports_queue ON reports(status, created_at DESC);
CREATE INDEX sessions_expiry ON sessions(expires_at);
CREATE INDEX limits_expiry ON rate_limits(expires_at);
