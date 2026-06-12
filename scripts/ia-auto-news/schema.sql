-- IA AUTO NEWS - Tables Supabase
-- Exécuter dans l'éditeur SQL de Supabase

-- Table principale pour les articles IA
CREATE TABLE IF NOT EXISTS ia_auto_news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT NOT NULL,
  published_date DATE NOT NULL DEFAULT CURRENT_DATE,
  theme TEXT,
  sources_analyzed TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_ia_auto_news_published_date 
  ON ia_auto_news(published_date DESC);
CREATE INDEX IF NOT EXISTS idx_ia_auto_news_created_at 
  ON ia_auto_news(created_at DESC);

-- Table de métadonnées pour le suivi des exécutions
CREATE TABLE IF NOT EXISTS news_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  articles_count INTEGER NOT NULL,
  run_date DATE NOT NULL DEFAULT CURRENT_DATE,
  deepseek_prompt_used TEXT,
  sources_scraped TEXT[],
  articles_scraped_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les métadonnées
CREATE INDEX IF NOT EXISTS idx_news_metadata_run_date 
  ON news_metadata(run_date DESC);

-- Activer RLS (Row Level Security)
ALTER TABLE ia_auto_news ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_metadata ENABLE ROW LEVEL SECURITY;

-- Politique : lecture publique pour les articles
CREATE POLICY "Public read access for ia_auto_news" 
  ON ia_auto_news FOR SELECT 
  USING (true);

-- Politique : lecture publique pour les métadonnées
CREATE POLICY "Public read access for news_metadata" 
  ON news_metadata FOR SELECT 
  USING (true);

-- Politique : insertion uniquement via service role (cron)
CREATE POLICY "Service role insert for ia_auto_news" 
  ON ia_auto_news FOR INSERT 
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role insert for news_metadata" 
  ON news_metadata FOR INSERT 
  WITH CHECK (auth.role() = 'service_role');