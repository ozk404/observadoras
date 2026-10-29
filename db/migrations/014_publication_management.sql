ALTER TABLE publications ADD COLUMN version integer NOT NULL DEFAULT 1 CHECK(version>0);
ALTER TABLE publications ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE publications ADD COLUMN withdrawn_at timestamptz;
CREATE TABLE publication_events (
 id uuid PRIMARY KEY,
 publication_id uuid NOT NULL REFERENCES publications(id),
 actor_id uuid NOT NULL REFERENCES users(id),
 action text NOT NULL CHECK(action IN ('published','corrected','withdrawn','republished')),
 version integer NOT NULL CHECK(version>0),
 reason text NOT NULL DEFAULT '' CHECK(char_length(reason)<=1000),
 snapshot jsonb,
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(publication_id,version)
);
CREATE INDEX publications_visible ON publications(published_at DESC,id) WHERE withdrawn_at IS NULL;
-- Preserve the existing approved copy privately, without inventing a new approval.
INSERT INTO publication_events(id,publication_id,actor_id,action,version,snapshot,created_at)
SELECT id,id,published_by,'published',1,
 jsonb_build_object('title',title,'body',body,'categories',categories,'summary',summary,
 'context',context,'findings',findings,'analysis',analysis,'limitations',limitations),published_at
FROM publications;
