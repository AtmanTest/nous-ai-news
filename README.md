# Nous AI News

Site d'actualités sur l'intelligence artificielle, en français. Refonte complète (v2) : application Next.js minimale et un **workflow QA complet** — ISTQB Foundation + IA générative en test.

> Le contenu des articles est **entièrement fictif** (jeu de données de démonstration).

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

## CI

`.github/workflows/qa.yml` : statique + traçabilité → unitaire/couverture → API → E2E (desktop, mobile) → porte qualité.

## Structure

```
src/app        pages et routes API        src/modules   logique métier par module
src/components UI                         src/lib       utilitaires transverses
tests/{unit,api,e2e,support}              scripts/qa    outillage QA
docs/qa        documentation QA
```

## Note de migration

Les anciens workflows (déploiement Vercel, veille automatique par cron) ont été supprimés avec l'ancien code. À reconfigurer séparément si nécessaire.
