# Rollback Procedure

## When to Rollback

- Critical bug in production
- Performance regression >20%
- Data integrity issue
- Auth/security vulnerability
- SEO breakage (missing pages, 404s on core routes)

## Rollback Methods

### Method 1: Git Tag (Recommended)

```bash
# List available tags
git tag -l "v*" --sort=-v:refname

# Checkout previous version
git checkout v1.2.3

# Verify
npm run build

# Deploy to Render via tag
```

### Method 2: GitHub Release

1. Go to GitHub → Releases
2. Find the last known good version
3. Click "Deploy to Render" (if workflow configured)

### Method 3: Render Dashboard

1. Go to Render Dashboard → your-service
2. Click "Manual Deploy" → "Deploy existing commit"
3. Select the commit/tag from the dropdown
4. Click "Deploy"

## Post-Rollback Checklist

- [ ] Smoke test homepage loads
- [ ] Smoke test article page
- [ ] Smoke test search
- [ ] Verify auth
- [ ] Check API endpoints
- [ ] Verify cron jobs
- [ ] Check Render logs for errors
- [ ] Log the rollback in deployments table
- [ ] Create bug ticket/issue for the original problem
