ALTER TABLE publications
  ADD COLUMN categories text[] NOT NULL DEFAULT '{}' CHECK (cardinality(categories)<=4),
  ADD COLUMN summary text NOT NULL DEFAULT '' CHECK (char_length(summary)<=800),
  ADD COLUMN context text NOT NULL DEFAULT '' CHECK (char_length(context)<=1800),
  ADD COLUMN findings text NOT NULL DEFAULT '' CHECK (char_length(findings)<=1800),
  ADD COLUMN analysis text NOT NULL DEFAULT '' CHECK (char_length(analysis)<=1800),
  ADD COLUMN limitations text NOT NULL DEFAULT '' CHECK (char_length(limitations)<=1000);
