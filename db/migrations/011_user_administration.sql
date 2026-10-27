ALTER TABLE users ADD COLUMN full_name text CHECK (full_name IS NULL OR char_length(full_name) BETWEEN 2 AND 120);
ALTER TABLE users ADD COLUMN can_manage_users boolean NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN version integer NOT NULL DEFAULT 1 CHECK(version > 0);
CREATE TABLE user_events (
 id uuid PRIMARY KEY,
 actor_id uuid REFERENCES users(id),
 target_id uuid NOT NULL REFERENCES users(id),
 action text NOT NULL CHECK(action IN ('created','updated','password_reset','disabled','admin_granted','name_updated')),
 origin text NOT NULL CHECK(origin IN ('web','operational')),
 changed_fields text[] NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX user_events_target ON user_events(target_id,created_at DESC);
