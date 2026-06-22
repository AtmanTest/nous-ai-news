# Test Plan — Nous AI News

## Environnements

- Local : `http://localhost:3000`
- Production Vercel : `https://nous-daily.vercel.app`
- Supabase : projet `wlxtulibsipesxpwkhyz`

## Jeux de données

- Articles Supabase publiés sur les 7 derniers jours.
- Sources RSS AI configurées dans `lib/content/sources.ts`.
- Utilisateur guest par défaut.
- Utilisateur authentifié de test uniquement quand requis.

## Suites automatisées

| Suite | Commande | Objectif |
|---|---|---|
| TNR unit/integration | `npm run tnr` | Non-régression obligatoire avant commit |
| P0 production smoke | `E2E_BASE_URL=https://nous-daily.vercel.app npx playwright test tests/e2e/smoke-critical.spec.ts --project=chromium --reporter=line` | Routes vitales, 500 client, console errors, fake links |
| E2E complet local/prod | `npx playwright test` ou `E2E_BASE_URL=... npx playwright test` | Parcours complets par module |
| Build | `npm run build` | Validation Next.js production |

## Couverture des cas de test

| Zone | P0 | P1 | P2 | Auto actuel |
|---|---:|---:|---:|---|
| Homepage / app shell | 3 | 2 | 2 | Oui |
| Navigation / fake UX | 2 | 2 | 1 | Oui |
| Article detail | 2 | 2 | 2 | Oui |
| Feed / daily / trending | 4 | 4 | 4 | Oui |
| Search / topics | 3 | 3 | 2 | Oui |
| Bookmarks / auth | 2 | 4 | 3 | Partiel |
| Settings | 1 | 3 | 2 | Oui |
| Widgets live | 2 | 3 | 2 | Partiel |
| API / SEO | 3 | 4 | 2 | Partiel |
| PWA / responsive | 1 | 4 | 4 | Partiel |
| Data quality RSS | 1 | 3 | 4 | À renforcer |

## Cas P0 vitaux

Voir `tests/test-cases/p0-vital.md`.

Résumé :

- P0-HOME-001 : homepage sans crash applicatif.
- P0-NAV-001 : liens internes réels.
- P0-ARTICLE-001 : article depuis homepage.
- P0-FEED-001 : feed principal.
- P0-DAILY-001 : daily feed.
- P0-TRENDING-001 : trending.
- P0-SEARCH-001 : recherche.
- P0-BOOKMARKS-001 : bookmarks guest.
- P0-SETTINGS-001 : settings.
- P0-AUTOEVOLVE-001 : Auto Evolve.
- P0-DEEPMIND-001 : IA Auto News.
- P0-TOPICS-001 : pages topics.
- P0-API-001 : endpoints publics.
- P0-QUALITY-001 : contenu RSS nettoyé.

## Procédure bug

Pour chaque bug détecté :

1. Créer ou mettre à jour un cas dans `tests/test-cases/`.
2. Ajouter un test automatique si faisable immédiatement.
3. Lancer le test ciblé et vérifier l’échec attendu.
4. Corriger.
5. Relancer test ciblé + `npm run tnr`.
6. Browser smoke sur la route impactée.

## Statut baseline

- Baseline TNR du 2026-06-22 : 430/430 tests OK avant ajout des nouveaux cas.
- Bug production détecté : curl retourne 200 sur `/`, mais navigateur réel affiche une page 500 dans `main` après hydration. Le nouveau smoke P0 le détecte.
