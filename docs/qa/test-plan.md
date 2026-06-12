# Test Plan — Nous AI News

## Environments
- **Local** — `localhost:3000`
- **Recipe** — `nous-ai-news-recipe.onrender.com`
- **Production** — `nous-ai-news.com`

## Test Data
- 20+ RSS sources configured in `lib/content/sources.ts`
- Supabase migrations with sample schema
- Auth users: test@example.com (password: test123456)

## Test Cases Summary

| Area | Cases | Auto | Manual |
|------|-------|------|--------|
| Homepage | 5 | 3 | 2 |
| Article | 4 | 3 | 1 |
| Search | 6 | 5 | 1 |
| Auth | 6 | 4 | 2 |
| Bookmarks | 4 | 3 | 1 |
| Social Signals | 3 | 2 | 1 |
| Ingestion | 5 | 4 | 1 |
| SEO | 6 | 5 | 1 |
| Responsive | 4 | 2 | 2 |
| Performance | 3 | 2 | 1 |
| Security | 4 | 3 | 1 |
| **Total** | **50** | **36** | **14** |

## Test Case Format
```
TC-[AREA]-[NUM]: Title
  Preconditions: ...
  Steps: 1. ... 2. ... 3. ...
  Expected: ...
  Priority: P0/P1/P2
  Auto: Yes/No
```

See `tests/test-cases/` for full test case library.
