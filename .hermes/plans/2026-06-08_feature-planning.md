# Daily AI — Feature Planning & Roadmap

> **Date:** June 8, 2026
> **Current State:** Live at [nous-daily.vercel.app](https://nous-daily.vercel.app) — Next.js 14, Supabase, Vercel, GitHub Actions CI/CD

## Current Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 14 App Router + TypeScript |
| Styling | Tailwind CSS + shadcn/ui + Geist font |
| DB | Supabase PostgreSQL |
| Auth | Supabase Auth (email + OAuth) |
| Hosting | Vercel (free tier, 2c/8GB) |
| CI/CD | GitHub Actions + TNR gates (43 vitest tests) |
| Image Pipeline | RSS native → OG → category fallback |
| Content | 86 RSS sources, 8 categories, 3 languages, ~2000 articles |
| Routes | /, /trending, /search, /topics/[slug], /countries/[slug], /entities/[slug], /article/[slug], /bookmarks, /profile, /settings, /auto-tune, /status/changelog, /status/releases |

---

## Phase 1 — Quick Wins (1–2 days each)

### 1.1 PWA — Progressive Web App

**Why:** Makes the site installable on mobile homescreen, offline-capable for cached articles, native app-like experience. Zero infra cost.

**What:**
- `/manifest.json` route (icons, theme color, display mode)
- `service-worker.ts` with cache-first for static assets, network-first for API
- Install prompt component on mobile visit
- Offline fallback page

**Files:**
- `app/manifest.ts`
- `public/sw.js` or Next.js service worker setup
- `components/pwa/InstallPrompt.tsx`
- Update `app/layout.tsx` with manifest link

**Effort:** ~2 days

---

### 1.2 Live "New Articles" Indicator (SSE)

**Why:** Users don't know new articles arrived unless they refresh. A subtle banner "12 new articles" with click-to-load feels premium.

**What:**
- Server-Sent Events endpoint `/api/live` polling for new article count since last check
- `LiveUpdateBar.tsx` component (already partially exists)
- Click to load fresh articles into feed
- Auto-dismiss after 30s

**Files:**
- `app/api/live/route.ts`
- `components/news/LiveUpdateBar.tsx` (enhance existing)
- Hook: `hooks/useLiveUpdates.ts`

**Effort:** ~1 day

---

### 1.3 Social Sharing — Share Cards

**Why:** Users share articles manually. One-click share to X/Twitter, LinkedIn, Telegram drives viral traffic.

**What:**
- `ShareButton.tsx` with native Web Share API (mobile) + fallback to platform links
- Pre-formatted tweet/linkedin text: `"Article Title" by Source — via DailyAI`
- Copy-link button with toast notification

**Files:**
- `components/news/ShareButton.tsx`
- Integrate into `StoryCard.tsx` and `article/[slug]/page.tsx`

**Effort:** 0.5 day

---

### 1.4 Source Filtering

**Why:** Users want to filter out certain sources (e.g., hide Bloomberg, show only arXiv). Persistent per-browser.

**What:**
- Source toggle list in Settings or sidebar
- `muted_sources` stored in `localStorage`
- Filter applied on feed rendering
- Plus button to add current source to muted list

**Files:**
- `components/news/SourceFilter.tsx`
- `hooks/useMutedSources.ts`
- Update feed queries to filter muted sources

**Effort:** ~1 day

---

## Phase 2 — User Features (3–5 days each)

### 2.1 Web Push Notifications

**Why:** Users leave site. Push brings them back for breaking stories in their followed topics.

**What:**
- `navigator.serviceWorker` + Push API subscription
- `POST /api/push/subscribe` — save subscription to Supabase
- `POST /api/push/send` — (admin) send push to subscribers
- Topic-based subscription: "Notify me on new Models articles"
- VAPID keys setup (web-push lib, free)

**Files:**
- `app/api/push/subscribe/route.ts`
- `app/api/push/send/route.ts`
- `components/notifications/PushPrompt.tsx`
- `lib/notifications/push.ts`
- `public/sw.js` (push event handler)

**Effort:** ~3 days

---

### 2.2 Email Digest — Weekly/Monthly Newsletter

**Why:** Users don't visit every day. Email digest with top 5 stories drives regular engagement.

**What:**
- Subscription form (email + preferences) → Supabase `newsletter_subscribers` table
- Cron-based email via Resend (free tier: 100 emails/day) or SendGrid
- Digest template (HTML email): top 5 scored stories + fresh content
- Unsubscribe link + preference management

**Files:**
- `app/api/newsletter/subscribe/route.ts`
- `lib/newsletter/template.ts`
- `.github/workflows/newsletter-weekly.yml`
- Settings: newsletter frequency selector

**Effort:** ~3 days

---

### 2.3 Personalization — Reading History & Recommendations

**Why:** "You liked articles about Models — here's more." Drives dwell time.

**What:**
- `reading_history` table (Supabase): user_id, article_id, read_at, read_duration
- Track article views on article pages (client-side POST)
- Recommended articles section on homepage: "Based on your reading"
- Trending in your interests section

**Files:**
- `app/api/track/read/route.ts`
- `components/news/RecommendedSection.tsx`
- `lib/recommendations/engine.ts`
- Supabase migration: `reading_history` table

**Effort:** ~4 days

---

## Phase 3 — Power Features (5–7 days each)

### 3.1 AI-Powered Article Summaries

**Why:** Users skim. A TL;DR banner at top of each article increases article consumption.

**What:**
- AI summary generation on ingestion (OpenAI GPT-4o-mini or similar)
- `summary` field in article DB
- `ArticleSummary.tsx` component — collapsible TL;DR at top of article pages
- Entity extraction during AI pass (already partially done)

**Files:**
- `lib/content/summarize.ts` — AI prompt + API call
- Update ingestion pipeline to call summarizer
- `components/news/ArticleSummary.tsx`
- Update article DB schema with `summary` column

**Effort:** ~5 days

---

### 3.2 Read-It-Later Queue

**Why:** Bookmarks are permanent. Read-It-Later is temporary — "read this tonight" queue.

**What:**
- `reading_queue` table: user_id, article_id, added_at, position
- Queue panel (slide-in drawer): current queue, reorder, mark done
- "Read Later" button on story cards (vs Bookmark which is permanent)
- Mobile-friendly draggable list

**Files:**
- `app/api/queue/route.ts`
- `components/news/ReadLaterButton.tsx`
- `components/news/ReadingQueue.tsx`
- Supabase migration: `reading_queue` table

**Effort:** ~3 days

---

### 3.3 User Preferences & Theme Persistence

**Why:** Users want to stay in dark/light mode, set font size, language preference. Currently theme resets on page load.

**What:**
- Preferences table: user_id → JSONB prefs (theme, font_size, language, muted_sources)
- `PUT /api/preferences` + `GET /api/preferences`
- Settings page with toggle panels:
  - Theme: system / light / dark
  - Font: default / large / extra-large
  - Language filter: EN / FR / ZH / all
  - Content density: compact / comfortable

**Files:**
- `app/api/preferences/route.ts`
- `app/settings/page.tsx` (enhance with preference panels)
- `lib/preferences/schema.ts`
- `hooks/usePreferences.ts`
- Update `ThemeProvider` to sync to DB

**Effort:** ~3 days

---

## Phase 4 — Infrastructure & Scaling (2–4 days each)

### 4.1 Automated QA Dashboard

**Why:** Current Settings page shows test count as static `43`. Live test results + deployment status + lint warnings on one page.

**What:**
- `POST /api/qa/run` — triggers test suite on Vercel, stores results
- QA dashboard at `/qa` with:
  - Test history (pass/fail over time)
  - Last CI run status
  - ESLint warning counts
  - Lighthouse scores (fetched from PageSpeed API)
  - Deploy times (from Vercel API)

**Files:**
- `app/api/qa/run/route.ts`
- `app/qa/page.tsx`
- `lib/qa/dashboard.ts`

**Effort:** ~2 days

---

### 4.2 Better Error Monitoring

**Why:** No Sentry/logging on frontend. Silent JS errors in prod go unnoticed.

**What:**
- Error boundary at layout level
- `POST /api/log/error` endpoint → Supabase `error_logs` table
- Client-side error handler: `window.onerror` + `unhandledrejection`
- Settings page shows recent errors count
- Optional: Sentry free tier setup

**Files:**
- `components/errors/ErrorBoundary.tsx`
- `app/api/log/error/route.ts`
- `lib/monitoring/client.ts`
- `lib/monitoring/error-handler.ts`
- Update `app/layout.tsx` with error boundary

**Effort:** ~1 day

---

### 4.3 Image Lazy Loading & Performance

**Why:** 86 RSS sources produce heavy images. Page load can be improved significantly.

**What:**
- `loading="lazy"` on all article images (already basic)
- `next/image` usage with proper `sizes` attribute
- Blur placeholder generation on ingestion
- Image dimensions stored in DB for aspect-ratio CSS

**Files:**
- `components/news/StoryCard.tsx` (optimize images)
- `lib/content/images.ts` (enhance with blurhash)
- Update ingestion to extract image dimensions

**Effort:** ~1 day

---

## Roadmap Visualization

```
Week 1-2      Week 3-4        Week 5-6         Week 7-8
──────────    ──────────      ──────────        ──────────
PWA          Push Notif       AI Summaries      QA Dashboard
Live SSE     Email Digest     Read-It-Later     Error Monitor
Share Cards  Preferences      Performance       Image Perf
Source Filter Reading History
```

---

## Decision Matrix — Next Feature to Build

| Feature | User Impact | Dev Effort | Complexity | Infra Cost | Priority |
|---------|:-----------:|:----------:|:----------:|:----------:|:--------:|
| PWA | ★★★★★ | ★★☆☆☆ | ★★☆☆☆ | $0 | **P1** |
| Live SSE | ★★★★☆ | ★☆☆☆☆ | ★★☆☆☆ | $0 | **P1** |
| Share Cards | ★★★★☆ | ★☆☆☆☆ | ★☆☆☆☆ | $0 | **P1** |
| Source Filter | ★★★☆☆ | ★☆☆☆☆ | ★☆☆☆☆ | $0 | **P1** |
| Push Notifs | ★★★★★ | ★★★☆☆ | ★★★☆☆ | $0 | **P2** |
| Email Digest | ★★★★☆ | ★★★☆☆ | ★★★☆☆ | $0 FF | **P2** |
| Reading History | ★★★☆☆ | ★★★☆☆ | ★★★☆☆ | $0 | **P2** |
| Preferences | ★★★★☆ | ★★☆☆☆ | ★★☆☆☆ | $0 | **P2** |
| AI Summaries | ★★★★★ | ★★★★★ | ★★★★★ | $5/mo AI | **P3** |
| Read-It-Later | ★★★☆☆ | ★★★☆☆ | ★★★☆☆ | $0 | **P3** |
| QA Dashboard | ★★☆☆☆ | ★★☆☆☆ | ★★☆☆☆ | $0 | **P3** |
| Error Monitor | ★★★☆☆ | ★☆☆☆☆ | ★☆☆☆☆ | $0 | **P3** |

**Legend:** FF = free tier limits may apply

---

## Immediate Next Steps (this sprint)

1. **PWA** — `/manifest.json`, `service-worker.ts`, install prompt → biggest UX impact, zero cost
2. **Live SSE** — small code change, makes homepage feel alive
3. **Share Cards** — copy-link + one-click share on every article
4. **Source Filter** — let users prune their feed without DB changes

---

## Open Questions

- [ ] Push notifications: free tier VAPID + web-push works, but iOS Safari supports Web Push? (Yes, since iOS 16.4)
- [ ] Email digest: Resend (100/mo free) vs SendGrid (100/day free) vs AWS SES (cheapest)?
- [ ] AI summaries: budget ~$5/mo at 2000 articles/day × 500 tokens = ~$0.07/day with GPT-4o-mini
- [ ] PWA offline: how to cache Supabase data? Service Worker + IndexedDB via idb library
