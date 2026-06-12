-- Nous AI News — Supabase Schema Migration
-- Run this in Supabase SQL Editor to initialize the database

-- 0. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 1. Sources table
CREATE TABLE IF NOT EXISTS sources (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('rss', 'api', 'social', 'newsapi')),
  url         TEXT NOT NULL UNIQUE,
  feed_url    TEXT,
  tier        INTEGER DEFAULT 3 CHECK (tier BETWEEN 1 AND 5),
  language    TEXT DEFAULT 'en',
  country     TEXT,
  category    TEXT,
  is_active   BOOLEAN DEFAULT true,
  last_fetch  TIMESTAMPTZ,
  fetch_interval INTEGER DEFAULT 30,
  error_count INTEGER DEFAULT 0,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Articles table
CREATE TABLE IF NOT EXISTS articles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id       UUID REFERENCES sources(id) ON DELETE SET NULL,
  external_id     TEXT,
  url             TEXT NOT NULL UNIQUE,
  title           TEXT NOT NULL,
  summary         TEXT,
  content         TEXT,
  author          TEXT,
  published_at    TIMESTAMPTZ,
  fetched_at      TIMESTAMPTZ DEFAULT NOW(),
  language        TEXT DEFAULT 'en',
  image_url       TEXT,
  source_name     TEXT,
  category        TEXT,
  tags            TEXT[] DEFAULT '{}',
  entities        JSONB DEFAULT '[]',
  score           REAL DEFAULT 0.0,
  trending_score  REAL DEFAULT 0.0,
  view_count      INTEGER DEFAULT 0,
  is_featured     BOOLEAN DEFAULT false,
  is_breaking     BOOLEAN DEFAULT false,
  status          TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  metadata        JSONB DEFAULT '{}',
  search_vector   TSVECTOR,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id                UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name      TEXT,
  avatar_url        TEXT,
  preferred_language TEXT DEFAULT 'en',
  preferred_countries TEXT[] DEFAULT '{}',
  followed_topics   TEXT[] DEFAULT '{}',
  email_alerts      BOOLEAN DEFAULT false,
  is_admin          BOOLEAN DEFAULT false,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Bookmarks
CREATE TABLE IF NOT EXISTS bookmarks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  article_id  UUID REFERENCES articles(id) ON DELETE CASCADE NOT NULL,
  note        TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, article_id)
);

-- 5. Tags taxonomy
CREATE TABLE IF NOT EXISTS tags (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  description   TEXT,
  category      TEXT,
  parent_id     UUID REFERENCES tags(id),
  article_count INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Reading history
CREATE TABLE IF NOT EXISTS reading_history (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  article_id  UUID REFERENCES articles(id) ON DELETE CASCADE NOT NULL,
  read_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, article_id)
);

-- 7. Ingestion logs
CREATE TABLE IF NOT EXISTS ingestion_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id   UUID REFERENCES sources(id) ON DELETE SET NULL,
  status      TEXT NOT NULL CHECK (status IN ('success', 'partial', 'error')),
  articles_count INTEGER DEFAULT 0,
  errors      TEXT[],
  duration_ms INTEGER,
  started_at  TIMESTAMPTZ NOT NULL,
  finished_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS articles_published_at_idx ON articles(published_at DESC);
CREATE INDEX IF NOT EXISTS articles_fetched_at_idx ON articles(fetched_at DESC);
CREATE INDEX IF NOT EXISTS articles_score_idx ON articles(score DESC);
CREATE INDEX IF NOT EXISTS articles_trending_score_idx ON articles(trending_score DESC);
CREATE INDEX IF NOT EXISTS articles_language_idx ON articles(language);
CREATE INDEX IF NOT EXISTS articles_tags_idx ON articles USING GIN(tags);
CREATE INDEX IF NOT EXISTS articles_search_idx ON articles USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS articles_source_id_idx ON articles(source_id);
CREATE INDEX IF NOT EXISTS articles_status_idx ON articles(status);
CREATE INDEX IF NOT EXISTS articles_url_hash_idx ON articles USING hash(url);
CREATE INDEX IF NOT EXISTS sources_active_idx ON sources(is_active) WHERE is_active = true;

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER articles_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER sources_updated_at
  BEFORE UPDATE ON sources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Full-text search trigger
CREATE OR REPLACE FUNCTION articles_search_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.summary, '') || ' ' || COALESCE(NEW.content, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER articles_search_vector
  BEFORE INSERT OR UPDATE OF title, summary, content ON articles
  FOR EACH ROW EXECUTE FUNCTION articles_search_update();

-- Row Level Security
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;

-- Articles: public read published, admin write all
DROP POLICY IF EXISTS "articles_public_read" ON articles;
CREATE POLICY "articles_public_read" ON articles
  FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS "articles_admin_all" ON articles;
CREATE POLICY "articles_admin_all" ON articles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Bookmarks: user owns their bookmarks
DROP POLICY IF EXISTS "bookmarks_self" ON bookmarks;
CREATE POLICY "bookmarks_self" ON bookmarks
  FOR ALL USING (auth.uid() = user_id);

-- Profiles: user can read/update their own, admin can read all
DROP POLICY IF EXISTS "profiles_self" ON profiles;
CREATE POLICY "profiles_self" ON profiles
  FOR ALL USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_admin_read" ON profiles;
CREATE POLICY "profiles_admin_read" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Reading history: user owns their history
DROP POLICY IF EXISTS "reading_history_self" ON reading_history;
CREATE POLICY "reading_history_self" ON reading_history
  FOR ALL USING (auth.uid() = user_id);

-- Sources: public read active, admin write all
DROP POLICY IF EXISTS "sources_public_read" ON sources;
CREATE POLICY "sources_public_read" ON sources
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "sources_admin_all" ON sources;
CREATE POLICY "sources_admin_all" ON sources
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );
