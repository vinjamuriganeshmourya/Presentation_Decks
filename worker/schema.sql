-- Temporary shared layer: saved edits not yet in the deployed build.
-- One row per (deck, slide, field) so concurrent editors merge per slide.
CREATE TABLE IF NOT EXISTS pending (
  deck       TEXT    NOT NULL,
  slide      TEXT    NOT NULL,
  field      TEXT    NOT NULL,   -- 'status' | 'comment'
  value      TEXT    NOT NULL,   -- JSON-encoded value
  sha        TEXT    NOT NULL,   -- commit that carries this value into the repo
  editor     TEXT,
  updated_at INTEGER NOT NULL,   -- ms epoch; rows older than 24h expire
  PRIMARY KEY (deck, slide, field)
);
CREATE INDEX IF NOT EXISTS pending_sha ON pending (sha);
CREATE INDEX IF NOT EXISTS pending_updated ON pending (updated_at);
CREATE TABLE IF NOT EXISTS meta (k TEXT PRIMARY KEY, v TEXT NOT NULL);
