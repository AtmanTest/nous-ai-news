# Release Checklist

## Pre-Release

- [ ] Version bump in docs/versioning.md
- [ ] CHANGELOG updated
- [ ] All PRs merged to develop
- [ ] `npm run build` — no errors
- [ ] `npx tsc --noEmit` — no errors
- [ ] Unit tests pass: `npx vitest run`
- [ ] TNR P0 — 100%
- [ ] TNR P1 — 100%
- [ ] TNR P2 — ≥80%
- [ ] Playwright smoke tests pass

## Release Steps

1. `git checkout develop && git pull`
2. `git checkout -b release/vX.Y.Z`
3. Run full QA suite
4. If green: `git checkout main && git merge release/vX.Y.Z`
5. `git tag -a vX.Y.Z -m "Release vX.Y.Z"`
6. `git push origin main --tags`
7. GitHub Release created automatically
8. Render Production deploys from tag

## Post-Release

- [ ] Smoke test production
- [ ] Check Render logs
- [ ] Verify cron jobs
- [ ] Update /status/deployments
- [ ] Notify team
