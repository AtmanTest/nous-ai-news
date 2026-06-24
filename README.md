# Nous AI News — Global AI Coverage

Premium international AI news platform covering models, research, business, policy, open source, startups, hardware, and AI agents.

**Live:** [nous-daily.vercel.app](https://nous-daily.vercel.app)

---

## About

**Nous AI News** est un agrégateur d'actualités IA temps réel développé en tant que projet open-source personnel. Il ingère, catégorise et classe automatiquement des centaines d'articles provenant de sources globales.

### Stack principale
- **Frontend :** Next.js 14 (App Router), TypeScript strict, Tailwind CSS + shadcn/ui
- **Backend :** API Routes Next.js, Supabase (PostgreSQL + Auth + Edge Functions)
- **Tests :** 465+ tests unitaires + E2E (Playwright)
- **CI/CD :** GitHub Actions (lint, tests, build, déploiement Vercel automatique)
- **Déploiement :** Vercel (auto-deploy on push to `main`)

### Pipeline de données
1. **Ingestion** — 86+ flux RSS + HN + Reddit via `/api/cron/ingest`
2. **Normalisation** — extraction titre, résumé, image, auteurs, entités (organisations, personnes, modèles)
3. **Scoring** — classement par pertinence (score, trending, breaking)
4. **Catégorisation** — LLM (GPT-5 nano) pour classification thématique
5. **Déduplication** — détection et fusion des doublons

### Moteur d'auto-amélioration continue
- **Re-scoring** — ajustement dynamique des scores articles
- **RLHF** — boucles de feedback humain pour affiner la pertinence
- **Optimisation de prompts** — prompts auto pour amélioration continue
- Exécution automatique via GitHub Actions

---

## Architecture

### Routes clés
| Route | Type | Description |
|-------|------|-------------|
| `/` | Dynamic | Homepage — hero, trending, infinite latest feed |
| `/article/[id]` | Dynamic | Article detail page with JSON-LD |
| `/search` | Dynamic | Full-text search with filters (category, sort) |
| `/topics/[slug]` | Dynamic | Topic landing pages |
| `/entities/[slug]` | Dynamic | Entity pages (OpenAI, Anthropic, etc.) |
| `/feed.xml` | Static | RSS output feed |

### Qualité & Tests
- **Vitest** — 465+ tests unitaires
- **Playwright** — smoke tests E2E critiques
- **Couverture** — seuil 75% par branche (TNR)
- **Linting** — TSR + Prettier pré-commit

---

## Tech Stack

```
TypeScript, Next.js 14, React 18, Tailwind CSS
Supabase (PostgreSQL, Auth, Storage)
OpenAI GPT-5 nano, Playwright, Vitest
GitHub Actions, Vercel
```
