# Matrice de régression — Nous AI News

## P0 — Bloquant

- Homepage : SSR + hydration OK, article links visibles.
- Navigation : tous les liens internes principaux status < 400.
- Article : ouverture depuis homepage, titre visible, pas d’erreur Supabase silent column.
- Feed : `/feed` et tabs `latest`, `trending`, `for-you` via URL.
- Daily : dates UTC, counts alignés avec articles.
- Search : champ + recherche + filtres.
- Bookmarks : guest mode + localStorage + logged-in Supabase.
- Settings : pas de timeout ni crash client.
- Auto Evolve / DeepMind : routes réelles, widgets cohérents.
- SEO : feed/sitemap/robots OK.

## P1 — Important

- Pagination / infinite scroll.
- Source filters et bouton Show all sources.
- Trending Models HuggingFace avec cache/fallback.
- Auth login/register/forgot/update password.
- Theme dark/dim/light persistant.
- PWA install/offline/update banners.
- Push notifications : VAPID, subscribe, unsubscribe, topics.
- Newsletter : subscribe/confirm/unsubscribe/send.
- Analytics : PostHog chargé seulement si clé présente.

## P2 — Edge cases

- Aucun article sur une date/topic.
- Images nulles ou cassées.
- RSS avec CDATA/HTML/entities.
- Timestamps futurs ou négatifs.
- Supabase indisponible.
- HuggingFace indisponible.
- Utilisateur non authentifié sur pages protégées.
- Mobile très étroit 360–375px.

## Données qualité à surveiller

- Titres contenant `<![CDATA[`.
- Summaries contenant `<img`, `]]>`, HTML brut.
- Images avec `&amp;amp;` ou URLs invalides.
- Articles promotionnels polluants dans top stories.
- Catégories inconnues ou mismatch DB (`research` vs `Recherche`, etc.).
- Dates futures affichées comme `-Xs ago`.

## Automatisation actuelle

- Unit/Vitest : `npm run tnr` — 430 tests au baseline du 2026-06-22.
- E2E existants : home, feed, article, search, trending, topics, bookmarks, auth.
- Nouveau P0 smoke : `tests/e2e/smoke-critical.spec.ts`.
- Nouveau test config : `tests/unit/config/playwright-config.test.ts`.

## Gaps à automatiser ensuite

- API smoke public complet avec schéma JSON/XML.
- Data quality test contre articles Supabase réels.
- Visual responsive snapshots pour homepage/feed/article.
- Auth OAuth e2e avec compte de test dédié.
- Push/newsletter e2e en mode mock service.
