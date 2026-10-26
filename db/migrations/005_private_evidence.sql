ALTER TABLE reports ADD COLUMN source_url text CHECK (char_length(source_url)<=2048);
CREATE TABLE report_evidence (
  report_id uuid PRIMARY KEY REFERENCES reports(id),
  content bytea NOT NULL CHECK (octet_length(content) BETWEEN 1 AND 5242880),
  content_type text NOT NULL DEFAULT 'image/webp' CHECK(content_type='image/webp'),
  width integer NOT NULL CHECK(width>0),
  height integer NOT NULL CHECK(height>0),
  sha256 text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK(width::bigint*height::bigint<=20000000)
);
