# Shield de Veille — Documentation

## Overview

The AI News Shield is a cron-based system that runs every 4 hours to:
1. Fetch news from 20+ sources
2. Fetch social signals (HN, Reddit)
3. Normalize, deduplicate, rank, enrich
4. Store in Supabase
5. Run health checks
6. Generate reports

## Architecture

```
Cron (0 */4 * * *)
  │
  └─ shield-cycle.ts
       ├─ 1. news-fetch.ts       → RSS feeds, APIs
       ├─ 2. signals-fetch.ts    → HN, Reddit
       ├─ 3. dedupe.ts           → MinHash + title + URL
       ├─ 4. rank.ts             → Freshness × Authority × Quality
       ├─ 5. enrich.ts           → Entity extraction
       ├─ 6. store.ts            → Supabase upsert
       ├─ 7. revalidate.ts       → ISR cache purge
       ├─ 8. health-check.ts     → Site endpoint checks
       └─ 9. report.ts           → Store shield_runs record
```

## Safety Rules

**Auto-allowed improvements:**
- Content refresh, ranking recalculation
- Metadata optimization
- Cache revalidation
- Orphan data cleanup
- Temporary source disablement on error
- Ranking weight adjustments (documented)
- Monitoring/logging improvements

**Requires QA + approval:**
- UI redesign
- Schema migration
- Mass content deletion
- Auth/security changes
- Global SEO changes
- Publishing engine changes
- Infrastructure changes

## Tables

| Table | Purpose |
|-------|---------|
| `shield_runs` | Run history, results, suggestions |
| `articles` | Stored news content |
| `ingestion_logs` | Per-source ingestion metrics |

## Cron Jobs

| Job | Schedule | Script |
|-----|----------|--------|
| shield-cycle | `0 */4 * * *` | `shield-cycle.ts` |
| recompute-trends | `30 */4 * * *` | TBD |
| cleanup-data | `0 2 * * *` | TBD |
| health-audit | `0 */6 * * *` | TBD |
