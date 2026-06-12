const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

// ─── Configuration ──────────────────────────────────────────────────────────
const SOURCES = [
  { name: 'TechCrunch AI', url: 'https://techcrunch.com/category/artificial-intelligence/feed', maxItems: 30 },
  { name: 'The Verge AI', url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml', maxItems: 20 },
  { name: 'HuggingFace Blog', url: 'https://huggingface.co/blog/feed.xml', maxItems: 20 },
  { name: 'arXiv AI', url: 'https://arxiv.org/rss/cs.AI', maxItems: 30 },
  { name: 'VentureBeat AI', url: 'https://feeds.feedburner.com/venturebeat/SZYF', maxItems: 20 },
  { name: 'AI News', url: 'https://www.artificialintelligence-news.com/feed', maxItems: 20 },
  { name: 'Synced Review', url: 'https://syncedreview.com/feed', maxItems: 20 },
  { name: 'MIT Tech Review AI', url: 'https://www.technologyreview.com/topic/artificial-intelligence/feed', maxItems: 20 },
  { name: 'Wired AI', url: 'https://www.wired.com/feed/tag/ai/latest/rss', maxItems: 20 },
  { name: 'Google AI Blog', url: 'https://blog.google/technology/ai/rss/', maxItems: 20 },
];

const LLM_API_KEY = process.env.LLM_API_KEY || '';
const DATA_DIR = path.join(__dirname, '..', 'data');
const NEWS_FILE = path.join(DATA_DIR, 'news.json');
const TRENDING_FILE = path.join(DATA_DIR, 'trending_topics.json');

// ─── Helpers ────────────────────────────────────────────────────────────────
function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 60);
}

function nowISO() {
  return new Date().toISOString();
}

// ─── RSS Fetch ──────────────────────────────────────────────────────────────
async function fetchRSS(source, maxItems) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(source.url, {
      headers: { 'User-Agent': 'AIAutoTune/1.0' },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return { items: [], error: `HTTP ${res.status}` };
    const xml = await res.text();

    // Simple RSS item extraction
    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    let match;
    let count = 0;
    while ((match = itemRegex.exec(xml)) !== null && count < maxItems) {
      const itemXml = match[1];
      items.push({
        title: extractTag(itemXml, 'title') || '',
        link: extractTag(itemXml, 'link') || '',
        description: stripHtml(extractTag(itemXml, 'description') || ''),
        pubDate: extractTag(itemXml, 'pubDate') || '',
        category: extractTags(itemXml, 'category'),
      });
      count++;
    }

    // Atom fallback
    if (items.length === 0) {
      const entryRegex = /<entry>([\s\S]*?)<\/entry>/gi;
      while ((match = entryRegex.exec(xml)) !== null && count < maxItems) {
        const entryXml = match[1];
        items.push({
          title: extractTag(entryXml, 'title') || '',
          link: extractAtomLink(entryXml),
          description: stripHtml(extractTag(entryXml, 'summary') || ''),
          pubDate: extractTag(entryXml, 'published') || extractTag(entryXml, 'updated') || '',
          category: [],
        });
        count++;
      }
    }

    return { items, error: null };
  } catch (e) {
    return { items: [], error: e.message };
  }
}

function extractTag(xml, tag) {
  const regex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[(.*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>(.*?)<\\/${tag}>`, 'is');
  const match = regex.exec(xml);
  return match ? (match[1] || match[2] || '').trim() : '';
}

function extractTags(xml, tag) {
  const tags = [];
  const regex = new RegExp(`<${tag}[^>]*>(.*?)<\\/${tag}>`, 'gi');
  let match;
  while ((match = regex.exec(xml)) !== null) tags.push(match[1].trim());
  return tags;
}

function extractAtomLink(xml) {
  const regex = /<link[^>]*href=["']([^"']*?)["'][^>]*\/?>|<link[^>]*href=["']([^"']*?)["'][^>]*>(.*?)<\/link>/i;
  const match = regex.exec(xml);
  return match ? (match[1] || match[2] || '').trim() : '';
}

function stripHtml(html) {
  return html.replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
}

// ─── LLM Classification ─────────────────────────────────────────────────────
async function classifyArticles(articles) {
  if (!LLM_API_KEY || articles.length === 0) return articles;

  const batchSize = 10;
  const classified = [];

  for (let i = 0; i < articles.length; i += batchSize) {
    const batch = articles.slice(i, i + batchSize);
    const prompt = `Classify each article into exactly one category: Models|Research|Business|Policy|OpenSource|Hardware|Startups|General.
Also assign a relevance score 0-100 (how important for an AI news site).

Articles:
${batch.map((a, idx) => `${idx + 1}. "${a.title}" — ${(a.description || '').slice(0, 200)}`).join('\n')}

Respond ONLY as JSON array: [{"title": "...", "category": "...", "score": 0, "reason": "..."}]`;

    try {
      const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LLM_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'mistralai/mistral-nemotron',
          messages: [
            { role: 'system', content: 'You are a news classifier. Return ONLY valid JSON.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.1,
          max_tokens: 2000,
        }),
      });
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content || '[]';
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

      parsed.forEach((p, idx) => {
        if (batch[idx]) {
          batch[idx].category = p.category || 'General';
          batch[idx].score = Math.min(100, Math.max(0, p.score || 50));
          batch[idx].reason = p.reason || '';
        }
      });
    } catch (e) {
      batch.forEach((a) => { a.category = 'General'; a.score = 50; a.reason = ''; });
    }

    classified.push(...batch);
  }

  return classified;
}

// ─── Dedup ───────────────────────────────────────────────────────────────────
function dedup(articles) {
  const seen = new Set();
  return articles.filter((a) => {
    const key = a.title.toLowerCase().slice(0, 80);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ─── Trending Topics ────────────────────────────────────────────────────────
function computeTrending(articles) {
  const wordCounts = {};
  const stopwords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been', 'has', 'have', 'had',
    'will', 'would', 'could', 'should', 'may', 'might', 'this', 'that', 'these', 'those']);

  articles.forEach((a) => {
    const words = (a.title + ' ' + (a.description || '')).toLowerCase().split(/\W+/);
    const phrases = [];
    for (let i = 0; i < words.length; i++) {
      if (words[i] && !stopwords.has(words[i]) && words[i].length > 3) {
        phrases.push(words[i]);
        if (i + 1 < words.length && words[i + 1] && words[i + 1].length > 2) {
          phrases.push(`${words[i]} ${words[i + 1]}`);
        }
      }
    }
    phrases.forEach((p) => {
      wordCounts[p] = (wordCounts[p] || 0) + (a.score || 50) / 50;
    });
  });

  return Object.entries(wordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([topic, weight]) => ({ topic, weight: Math.round(weight * 10) / 10 }));
}

// ─── Supabase Upsert ──────────────────────────────────────────────────────────
async function upsertToSupabase(articles) {
  const supabaseUrl = 'https://wlxtulibsipesxpwkhyz.supabase.co';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE;
  
  if (!serviceRoleKey) {
    console.log('⚠️  SUPABASE_SERVICE_ROLE not set — skipping DB upsert');
    return { upserted: 0, errors: 0 };
  }

  const BATCH_SIZE = 50;
  let upserted = 0;
  let errors = 0;

  for (let i = 0; i < articles.length; i += BATCH_SIZE) {
    const batch = articles.slice(i, i + BATCH_SIZE);
    const payload = batch.map(a => ({
      id: a.id,
      title: a.title,
      summary: a.description,
      url: a.url,
      source_id: slugify(a.source.toLowerCase()),
      source_name: a.source,
      source_type: 'rss',
      source_tier: 3,
      published_at: a.publishedAt,
      category: a.category || 'General',
      score: a.score || 50,
      tags: a.category ? [a.category] : [],
      status: 'published',
      language: a.language || 'en',
      fetched_at: a.collectedAt,
    }));

    try {
      const authHeader = `Bearer ${serviceRoleKey}`;
      
      const res = await fetch(`${supabaseUrl}/rest/v1/articles`, {
        method: 'POST',
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': authHeader,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates,return=minimal',
        },
        body: JSON.stringify(payload),
      });
      
      if (res.ok) {
        upserted += batch.length;
      } else {
        const err = await res.text();
        console.error(`  Batch ${i/BATCH_SIZE + 1} failed:`, res.status, err.slice(0, 200));
        errors += batch.length;
      }
    } catch (e) {
      console.error(`  Batch ${i/BATCH_SIZE + 1} exception:`, e.message);
      errors += batch.length;
    }
  }

  console.log(`  📊 Supabase: ${upserted} upserted, ${errors} errors`);
  return { upserted, errors };
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🌐 AI News Watcher — starting scan...');

  ensureDir(DATA_DIR);
  const allArticles = [];

  // Fetch all sources concurrently
  const results = await Promise.allSettled(SOURCES.map((s) => fetchRSS(s, s.maxItems)));

  results.forEach((r, i) => {
    const source = SOURCES[i];
    if (r.status === 'fulfilled' && r.value.items.length > 0) {
      console.log(`  ✓ ${source.name}: ${r.value.items.length} articles`);
      r.value.items.forEach((item) => {
        allArticles.push({
          id: randomUUID(),
          title: item.title,
          description: item.description.slice(0, 500),
          url: item.link,
          source: source.name,
          sourceUrl: source.url,
          publishedAt: item.pubDate || nowISO(),
          category: 'General',
          score: 50,
          reason: '',
          collectedAt: nowISO(),
        });
      });
    } else {
      console.log(`  ✗ ${source.name}: ${r.status === 'fulfilled' ? r.value.error : r.reason}`);
    }
  });

  console.log(`📦 Total raw articles: ${allArticles.length}`);

  // Dedup
  const unique = dedup(allArticles);
  console.log(`🔍 After dedup: ${unique.length}`);

  // Classify via LLM
  console.log('🤖 Classifying via LLM...');
  const classified = await classifyArticles(unique);
  const categorized = classified.filter((a) => a.category && a.category !== 'General');
  console.log(`  Classified: ${categorized.length}/${classified.length}`);

  // Score & sort
  classified.sort((a, b) => (b.score || 0) - (a.score || 0));

  // Trending
  const trending = computeTrending(classified);

  // Upsert to Supabase
  console.log('💾 Upserting to Supabase...');
  await upsertToSupabase(classified);

  // Save JSON files (for Auto Evolve page)
  const newsData = {
    updatedAt: nowISO(),
    total: classified.length,
    sourcesScanned: SOURCES.length,
    articles: classified.slice(0, 200),
  };
  fs.writeFileSync(NEWS_FILE, JSON.stringify(newsData, null, 2));
  fs.writeFileSync(TRENDING_FILE, JSON.stringify({ updatedAt: nowISO(), topics: trending }, null, 2));

  console.log(`✅ Done — ${classified.length} articles, ${trending.length} trending topics`);
}

main().catch(console.error);
