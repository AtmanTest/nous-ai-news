# Versioning & Release Process

## Semantic Versioning

**Format:** `vMAJOR.MINOR.PATCH`

- **MAJOR** — Breaking changes, UI redesigns, schema migrations
- **MINOR** — New features, new sources, new pages, non-breaking enhancements
- **PATCH** — Bug fixes, security patches, content updates, cron adjustments

## Branch Model

| Branch | Purpose | Deploys to |
|--------|---------|------------|
| `main` | Production | Render Production |
| `develop` | Integration | Render Recipe |
| `feature/*` | Feature work | — |
| `hotfix/*` | Urgent fixes | — |
| `release/*` | Release prep | Render Recipe |

## Release Flow

1. Branch from `develop` → `release/vX.Y.Z`
2. Run QA suite (lint, typecheck, tests, TNR)
3. If green → merge `release/vX.Y.Z` → `main`
4. Tag: `git tag -a vX.Y.Z -m "Release vX.Y.Z"`
5. Push tag: `git push origin vX.Y.Z`
6. GitHub Release created automatically via workflow
7. Render Production deploys from tagged commit

## Rollback

**3 ways:**

1. **By tag:** `git checkout vX.Y.Z-1` → deploy that commit
2. **By release:** Select previous release in GitHub → deploy
3. **By Render:** Deploy previous successful deploy via Render Dashboard

Always run QA smoke tests after rollback.
