# Smoke test mensuel / périodique — Nous AI News

Objectif : vérifier régulièrement que la production n’a pas régressé sur les parcours vitaux.

## Fréquence

- Tous les mois au minimum.
- Aussi après chaque déploiement recette/prod.
- Aussi après changement Vercel, Supabase, Auth, i18n, PWA ou ingestion.

## Commande automatisée

```bash
E2E_BASE_URL=https://nous-daily.vercel.app npx playwright test tests/e2e/smoke-critical.spec.ts --project=chromium --reporter=line
```

Le test ne démarre plus `npm run start` quand `E2E_BASE_URL` pointe vers un site déployé.

## Smoke mensuel par module

### Module 1 — Shell applicatif

- Routes : `/`, sidebar desktop, header mobile, bottom nav.
- Vérifier : pas de 500 client, pas d’erreur console, layout stable.

### Module 2 — News feed

- Routes : `/feed`, `/daily`, `/trending`.
- Vérifier : articles visibles ou état vide contextualisé, tabs fonctionnels, dates UTC cohérentes.

### Module 3 — Articles

- Parcours : homepage → premier article.
- Vérifier : détail article, metadata, contenu, related stories si disponible.

### Module 4 — Search / Explore

- Route : `/search`.
- Vérifier : champ visible, recherche `AI`, filtres catégorie, pas de 500.

### Module 5 — Topics

- Routes : `/topics/models`, `/topics/research`, `/topics/business`, `/topics/policy`.
- Vérifier : contenu réel Supabase, pas de catégorie vide à cause d’un filtre invalide.

### Module 6 — Bookmarks / Auth guest

- Route : `/bookmarks`.
- Vérifier : état guest correct, pas de bouton fake, localStorage supporté.

### Module 7 — Settings

- Route : `/settings`.
- Vérifier : page visible sous 10s, appels externes timeboxés, pas de timeout Vercel.

### Module 8 — Widgets live

- Zones : RightPanel, Trending Models, Auto Evolve, DeepMind.
- Vérifier : données réelles ou fallback explicite, aucun widget statique mensonger.

### Module 9 — SEO / feeds

- Routes : `/feed.xml`, `/sitemap.xml`, `/robots.txt`.
- Vérifier : HTTP 200, XML/TXT valide, URLs de production correctes.

### Module 10 — Responsive

- Viewports : desktop Chrome, Pixel 5, iPhone 12.
- Vérifier : nav accessible, aucun overflow, boutons 44px touch target.

## Critères GO

- 0 route P0 en 404/500.
- 0 page affichant `Something went wrong`.
- 0 erreur JS console/pageerror sur routes P0.
- 0 lien nav interne cassé.
- 0 bouton d’action fake sur les zones testées.

## Rapport attendu

- Date / environnement / commit ou build Vercel.
- Résultat : OK ou KO.
- Bugs trouvés : sévérité, route, étapes, attendu, obtenu, preuve.
- Tests automatisés lancés : commande + pass/fail.
