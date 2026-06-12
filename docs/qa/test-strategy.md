# QA Test Strategy — Nous AI News

## Scope
- Full-stack Next.js app (14 routes, API, middleware)
- Supabase DB (articles, auth, bookmarks, ingestion_logs, shield_runs)
- RSS ingestion pipeline (20+ sources)
- Social signals (HN, Reddit)
- Auth (Supabase Auth: email, OAuth)
- Deployment (Render recipe + prod)
- SEO (meta, OG, schema.org, sitemap, robots.txt)

## Test Levels
1. **Unit** — Vitest (lib/, utils, content pipeline)
2. **Integration** — Vitest (API routes, Supabase queries)
3. **E2E** — Playwright (user flows)
4. **Manual TNR** — Pre-release checklist

## Test Types
- Functional
- Regression (TNR)
- Performance
- Security
- SEO
- Responsive
- Accessibility (basic)

## Entry Criteria (pre-deploy)
- [ ] `npm run build` succeeds
- [ ] All unit tests pass
- [ ] TypeScript strict — 0 errors
- [ ] ESLint — 0 errors, warnings reviewed
- [ ] TNR P0 — 100% pass
- [ ] TNR P1 — 100% pass
- [ ] TNR overall — ≥95% pass

## Exit Criteria (post-deploy)
- [ ] Smoke test on target env
- [ ] Health check passes
- [ ] No console errors in browser
- [ ] Pages load within 3s

## TNR Priorities
| Priority | Scope | Required |
|----------|-------|----------|
| P0 | Core flows: homepage, article, search, auth, bookmarks | 100% pass |
| P1 | Secondary: topics, countries, trending, social signals | 100% pass |
| P2 | Edge: pagination, empty states, errors, i18n | ≥80% pass |
