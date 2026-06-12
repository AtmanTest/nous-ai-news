-- Nous AI News — Schema fixes and enhancements
-- Run after 00001_initial_schema.sql

-- 1. Make ingestion_logs store-compatible: use text source_id instead of FK
ALTER TABLE ingestion_logs ALTER COLUMN source_id TYPE TEXT USING source_id::TEXT;
ALTER TABLE ingestion_logs ALTER COLUMN source_id DROP NOT NULL;
ALTER TABLE ingestion_logs
  ADD COLUMN IF NOT EXISTS source_name TEXT,
  ADD COLUMN IF NOT EXISTS new_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS duplicates INTEGER DEFAULT 0;

-- 2. Add source_type and is_breaking to articles if not present
ALTER TABLE articles ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'rss'
  CHECK (source_type IN ('rss', 'api', 'social', 'newsapi'));
ALTER TABLE articles ADD COLUMN IF NOT EXISTS slug TEXT;

-- 3. Index for slug lookups (article pages)
CREATE INDEX IF NOT EXISTS articles_slug_idx ON articles(slug);

-- 4. Index for category filtering
CREATE INDEX IF NOT EXISTS articles_category_idx ON articles(category);
