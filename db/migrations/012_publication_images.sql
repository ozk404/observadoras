ALTER TABLE publications ADD COLUMN image_version integer NOT NULL DEFAULT 0 CHECK(image_version>=0);
CREATE TABLE publication_images (
 publication_id uuid PRIMARY KEY REFERENCES publications(id),
 asset_id uuid NOT NULL UNIQUE,
 content bytea NOT NULL CHECK(octet_length(content) BETWEEN 1 AND 5242880),
 width integer NOT NULL CHECK(width>0),height integer NOT NULL CHECK(height>0),
 description text NOT NULL CHECK(char_length(description) BETWEEN 5 AND 240),
 approved_by uuid NOT NULL REFERENCES users(id),approved_at timestamptz NOT NULL DEFAULT now(),
 authorization_version text NOT NULL
);
CREATE TABLE publication_image_events (
 id uuid PRIMARY KEY,publication_id uuid NOT NULL REFERENCES publications(id),actor_id uuid NOT NULL REFERENCES users(id),
 action text NOT NULL CHECK(action IN ('approved','replaced','removed')),image_version integer NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),authorization_version text NOT NULL
);
