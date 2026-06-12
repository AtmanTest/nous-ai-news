# Nous AI News — Global AI Coverage

Premium international AI news platform covering models, research, business, policy, open source, startups, hardware, and AI agents.

**Live:** [nous-ai-news.vercel.app](https://nous-ai-news.vercel.app)

---

## Architecture

### Stack
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript strict
- **Styling:** Tailwind CSS + shadcn/ui
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **Fonts:** Geist (by Vercel)
- **Deployment:** Vercel (Git integration — auto-deploy on push to `main`)

### Routes
| Route | Type | Description |
|-------|------|-------------|
| `/` | Dynamic | Homepage — hero, trending, infinite latest feed |
| `/article/[id]` | Dynamic | Premium article detail page with JSON-LD |
| `/search` | Dynamic | Full-text search with filters (category, sort) |
| `/trending` | Static | Trending stories |
| `/topics/[slug]` | Dynamic | Topic landing pages |
| `/countries/[slug]` | Dynamic | Country/region pages |
| `/entities/[slug]` | Dynamic | Entity pages (OpenAI, Anthropic, etc.) |
| `/bookmarks` | Static | Saved articles (auth required) |
| `/profile` | Static | User profile |
| `/api/cron/ingest` | Edge | Daily ingestion cron endpoint |
| `/api/search` | Edge | Search API endpoint |
| `/api/social` | Edge | Social signals API |
| `/feed.xml` | Static | RSS output feed |
| `/sitemap.xml` | Static | Auto-generated sitemap |
| `/robots.txt` | Static | Robots configuration |

### Data Pipeline
1. **Ingestion** — RSS feeds + HN + Reddit via `/api/cron/ingest` (daily at 07:00 UTC)
2. **Normalization** — Clean HTML, extract images, auto-categorize, tag, entity detection
3. **Deduplication** — Multi-stage: URL exact → title similarity → MinHash content fingerprint
4. **Scoring** — Freshness (35%) + source authority (25%) + content quality (20%) + social signals (10%) + entity relevance (10%)
5. **Images** — Cascade pipeline: RSS native → OG image → Twitter image → category fallback

### Key Modules
- `lib/content/` — Pipeline: engine, normalize, dedupe, rank, store, sources, types
- `lib/rss/` — RSS parser with image extraction
- `lib/social/` — HN and Reddit signal fetchers
- `lib/seo/` — JSON-LD schema generators
- `lib/supabase/` — DB clients (auth + admin)
- `lib/monitoring.ts` — Structured logging + source freshness tracking + analytics
- `lib/content/images.ts` — Image fallback cascade pipeline

## Environment Variables

Create `.env.local` from `.env.example`:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (admin) |
| `NEXT_PUBLIC_SITE_URL` | Site URL (e.g. `https://nous-ai-news.vercel.app`) |
| `CRON_SECRET` | Secret for cron endpoint authentication |

## Local Development

```bash
npm install
npm run dev    # Start dev server on localhost:3000
npm run build  # Production build
npm run lint   # ESLint check
```

## Data Ingestion

Trigger manual ingestion:
```bash
curl -X POST https://nous-ai-news.vercel.app/api/cron/ingest \
  -H "Authorization: Bearer $CRON_SECRET"
```

Scheduled: Daily at 07:00 UTC (Vercel Hobby — 1 cron job limit).

## Future Priorities

1. **Live updates** — SSE or smart polling with "new articles available" indicator
2. **Push notifications** — Web Push + topic following
3. **Newsletter** — Email digest via cron
4. **Personalization** — Saved topics, favorite sources, reading history
5. **Analytics dashboard** — Top articles, sources, topics, traffic
6. **Scaling** — Move ingestion to external cron worker (Vercel Hobby limit = 1 cron/day)
7. **Multilingual** — Add FR/CN/JP sources, language routing
8. **Image enrichment** — OG image extractor on ingestion + AI-generated fallbacks
9. **API monetization** — Premium RSS feed, trend data API
10. **Infra upgrade** — PostHog/Plausible analytics, Sentry error tracking
