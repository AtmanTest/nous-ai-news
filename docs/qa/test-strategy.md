# QA Test Strategy — Nous AI News

## Objectif

Garantir que Nous AI News reste utilisable en production, sans fake UX, sans route cassée, sans 500 client après hydration, et avec des tests de non-régression avant chaque commit.

## Périmètre

- Next.js 14 App Router : pages, layouts, middleware, server/client components.
- Supabase : articles, auth, bookmarks, ingestion, push/newsletter selon features actives.
- Ingestion RSS + enrichissement + ranking + re-scoring.
- Widgets live : HuggingFace Trending Models, Auto Evolve, DeepMind / IA Auto News.
- SEO : metadata, feed.xml, sitemap.xml, robots.txt.
- PWA : manifest, service worker, offline/update/install.
- Déploiement Vercel : production `https://nous-daily.vercel.app`.

## Niveaux de test

1. Unit — Vitest : utils, hooks, composants, scoring, routes API mockées.
2. Integration — Vitest : API routes, Supabase query contracts, cache/fallback behavior.
3. E2E smoke — Playwright : parcours utilisateur P0 contre local ou prod.
4. Exploratory QA — navigateur réel : console, responsive, data quality, fake UX.
5. Release smoke — post-déploiement sur l’URL cible.

## Stratégie TDD / bug fix

1. Reproduire le bug.
2. Écrire un test qui échoue pour ce bug.
3. Corriger le code.
4. Vérifier le test ciblé vert.
5. Lancer `npm run tnr` complet.
6. Seulement ensuite commit/push/déploiement.

## Commandes obligatoires

```bash
npm run tnr
```

Production smoke :

```bash
E2E_BASE_URL=https://nous-daily.vercel.app npx playwright test tests/e2e/smoke-critical.spec.ts --project=chromium --reporter=line
```

Build local si nécessaire :

```bash
npm run build
```

## Priorités

### P0 — Bloquant, 100% obligatoire

- Homepage : HTTP < 400, pas de 500 visuel, pas d’erreur console.
- Navigation : aucun lien interne principal en 404/500.
- Article : parcours homepage → article réel.
- Feed/search/trending/daily/bookmarks/settings/topics : route réelle et utilisable.
- Widgets clés : pas de données fake ou périmées sans fallback explicite.
- SEO public : feed.xml, sitemap.xml, robots.txt OK.

### P1 — Important, 100% avant release

- Pagination, filters, auth, bookmarks logged-in, theme, PWA, newsletter/push si activés.
- API endpoints critiques avec schémas valides.
- Responsive desktop/mobile.

### P2 — Edge, ≥80% avant release

- Empty states, timeouts externes, Supabase/HF indisponible, bad RSS, images nulles, dates futures.

## Entry criteria avant commit

- Test ciblé du changement vert.
- `npm run tnr` vert.
- Pas de fichier oublié (`git status`).
- Si bug fixé : nouveau test dans `tests/` ou cas documenté dans `tests/test-cases/`.

## Exit criteria avant livraison

- P0 automatisé vert sur cible ou bug clairement identifié comme KO.
- Browser check réel : pas de 500 client, pas d’erreur console.
- Résultat communiqué avec pass/fail exact.
- URL live fournie : `https://nous-daily.vercel.app`.

## Référentiel

- Cas vitaux : `tests/test-cases/p0-vital.md`.
- Smoke mensuel : `tests/test-cases/smoke-monthly.md`.
- Matrice de régression : `tests/test-cases/regression-matrix.md`.
- Tests automatisés P0 : `tests/e2e/smoke-critical.spec.ts`.
