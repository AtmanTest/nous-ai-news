# Analyse QA — 2026-06-22

## Résumé exécutif

- Production testée : `https://nous-daily.vercel.app`.
- HTTP/curl : routes principales en 200.
- Navigateur réel : homepage affiche une erreur applicative 500 dans `main` après hydration.
- Nouveau test P0 ajouté : `tests/e2e/smoke-critical.spec.ts` pour détecter ce cas automatiquement.
- Nouveau fix testabilité : `playwright.config.ts` ne démarre plus le serveur local quand `E2E_BASE_URL` cible une URL déployée.

## Bugs détectés

### BUG-P0-001 — Homepage production affiche 500 côté navigateur malgré HTTP 200

- Sévérité : P0
- Catégorie : Functional / Client hydration / Release blocker
- URL : `https://nous-daily.vercel.app/`
- Preuve : navigateur réel affiche `500` + `Something went wrong` dans `main`.
- Contraste : `curl` retourne HTTP 200 avec HTML complet.
- Impact : utilisateur voit une page cassée même si les checks HTTP passent.
- Hypothèse probable : mismatch hydration / cache Vercel edge / bundle JS stale vs HTML SSR frais.
- Test ajouté : `tests/e2e/smoke-critical.spec.ts` vérifie `main` sans `500` et sans `Something went wrong`.

### BUG-P1-002 — Playwright production smoke impossible sans build local

- Sévérité : P1
- Catégorie : QA tooling
- Symptôme : `E2E_BASE_URL=https://nous-daily.vercel.app npx playwright test ...` essayait quand même `npm run start` et échouait si `.next` absent.
- Impact : impossible de lancer rapidement un smoke prod depuis une machine propre.
- Correction : `playwright.config.ts` désactive `webServer` quand `E2E_BASE_URL` est une URL HTTP(S).
- Test ajouté : `tests/unit/config/playwright-config.test.ts`.

### BUG-P2-003 — Données RSS brutes visibles dans le HTML SSR

- Sévérité : P2 / Data quality
- Catégorie : Content hygiene
- Observé dans le HTML : titres avec `<![CDATA[...]]>` et summaries pouvant contenir HTML brut.
- Impact : qualité perçue faible, risque d’affichage sale dans cartes/top stories.
- Cas ajouté : `P0-QUALITY-001` pour renforcer ensuite avec test data quality automatique.

## Routes vérifiées en HTTP

Toutes les routes suivantes ont retourné HTTP 200 via requête directe :

- `/`
- `/feed`
- `/daily`
- `/trending`
- `/search`
- `/bookmarks`
- `/settings`
- `/auto-tune`
- `/ia-auto-news`
- `/topics/models`
- `/topics/research`
- `/topics/business`
- `/topics/policy`
- `/feed.xml`
- `/sitemap.xml`
- `/robots.txt`

## Gap de test fermé

Avant : les checks HTTP pouvaient passer alors que le navigateur affichait 500.

Après : le smoke P0 vérifie le DOM hydraté, les erreurs console/pageerror et les liens internes.

## Prochaine action recommandée

- Lancer le nouveau smoke P0 contre prod.
- Si BUG-P0-001 persiste : forcer un rebuild/deploy Vercel sans cache et revérifier navigateur.
- Ajouter ensuite un test data quality automatisé pour CDATA/HTML brut dans titres visibles.
