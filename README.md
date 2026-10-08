# Nous AI News

Site de veille sur l'intelligence artificielle, alimenté automatiquement. Refonte complète (v2) : design moderne (thème clair/sombre), crons d'ingestion et un **workflow QA complet** — ISTQB Foundation + IA générative en test.

> En production : contenu réel ingéré par cron. En test : jeu de données fictif et déterministe.

## Stack

Next.js 14 (App Router) · TypeScript strict · Tailwind CSS · Vitest · Playwright (API + E2E) · axe-core.

## Démarrage

```bash
nvm use            # Node 20
npm ci
npm run dev        # http://localhost:3000
```

## Fonctionnalités (modules)

| Module | Contenu |
|---|---|
| `articles` | Liste paginée, filtre par thématique, tri, page détail, flux `/feed.xml` |
| `search` | Recherche plein texte (ET, insensible à la casse et aux accents, pondérée) |
| `topics` | 6 thématiques et pages dédiées |
| `bookmarks` | Favoris persistés dans le navigateur |
| `newsletter` | Inscription validée (e-mail, consentement, thématiques), idempotente |
| `platform` | Santé, en-têtes de sécurité, 404/erreurs, accessibilité, responsive |

API : `GET /api/health`, `/api/articles`, `/api/articles/[slug]`, `/api/search`, `/api/topics`, `POST /api/newsletter/subscribe`.

## Scripts

| Commande | Rôle |
|---|---|
| `npm run lint` / `typecheck` | Analyse statique |
| `npm run test:unit:cov` | Unitaires + seuils de couverture (90 % lignes, 85 % branches) |
| `npm run test:api` | Tests API Playwright |
| `npm run test:e2e` | E2E desktop + mobile |
| `npm run test:smoke` | Parcours critiques `@smoke` |
| `npm run test:module -- <module>` | Tous les niveaux d'un module |
| `npm run test:all` | Tout |
| `npm run qa:trace` | Vérifie la traçabilité exigences → tests |
| `npm run qa:prompt -- --req <ID> --technique <t>` | Génère un prompt de conception de tests |

## Workflow QA

Exigences (`docs/qa/requirements.json`) → analyse de risques → conception (PE, AVL, tables de décision, transitions, devinette d'erreurs) → implémentation par niveau → CI → porte qualité. L'IA propose, l'humain relit et décide.

Documentation : [docs/qa](docs/qa/README.md) (stratégie, plan, risques, techniques, GenAI, défauts, matrice de traçabilité). Conventions de test : [tests/README.md](tests/README.md).

## Contenu automatique et crons

Le site affiche de vraies actualités IA ingérées depuis des flux RSS (`content/sources.json`) : titre, court extrait et lien vers la source.

| Workflow | Fréquence | Rôle |
|---|---|---|
| `cron-ingest.yml` | toutes les 3 h | Ingestion des flux, commit de `content/ingested.json` → redéploiement Vercel |
| `cron-links.yml` | chaque jour | Retire les articles dont le lien source est mort (404/410) |
| `cron-health.yml` | toutes les 30 min | Contrôle le site en production, ouvre une issue en cas d'échec |
| `cron-nightly-qa.yml` | chaque nuit | Suite complète + audit des dépendances, issue si rouge |
| Dependabot | chaque semaine | Mises à jour npm et Actions |

Les tests tournent sur le jeu de démonstration fictif (`NOUS_CONTENT=seed`) pour rester déterministes. Lancer l'ingestion à la main : `npm run cron:ingest`.

## CI

`.github/workflows/qa.yml` : statique + traçabilité → unitaire/couverture → API → E2E (desktop, mobile) → porte qualité.

## Structure

```
src/app        pages et routes API        src/modules   logique métier par module
src/components UI                         src/lib       utilitaires transverses
tests/{unit,api,e2e,support}              scripts/qa    outillage QA
docs/qa        documentation QA
```

## Déploiement

Vercel, relié au dépôt : chaque push sur `main` (y compris les commits des crons) redéploie le site.
