# Cas de test vitaux P0 — Nous AI News

Tous les P0 sont bloquants : 100% doivent passer avant commit/push/déploiement.

## P0-HOME-001 — Homepage sans crash applicatif

- Priorité : P0
- Type : E2E smoke / régression
- Auto : Oui (`tests/e2e/smoke-critical.spec.ts`)
- Préconditions : site déployé accessible.
- Étapes :
  1. Ouvrir `/`.
  2. Attendre le chargement réseau.
  3. Vérifier que `main` ne contient pas `500` ni `Something went wrong`.
  4. Vérifier qu’un contenu métier est visible (`Daily AI`, `Latest AI News`, `Auto Evolve`).
  5. Vérifier zéro erreur console/pageerror.
- Résultat attendu : homepage utilisable, pas de page d’erreur client.
- Bug couvert : SSR HTTP 200 mais hydration client remplacée par erreur 500.

## P0-NAV-001 — Tous les liens de navigation internes sont réels

- Priorité : P0
- Type : E2E smoke / fake UX
- Auto : Oui (`tests/e2e/smoke-critical.spec.ts`)
- Étapes :
  1. Ouvrir `/`.
  2. Collecter tous les liens internes `a[href^="/"]` hors articles dynamiques.
  3. Faire une requête sur chaque lien.
- Résultat attendu : aucun lien interne ne retourne 404 ou 500.

## P0-ARTICLE-001 — Parcours article depuis la homepage

- Priorité : P0
- Type : E2E utilisateur
- Auto : Oui (`tests/e2e/smoke-critical.spec.ts`)
- Étapes :
  1. Ouvrir `/`.
  2. Cliquer le premier lien `/article/...`.
  3. Vérifier l’URL `/article/`.
  4. Vérifier qu’un `h1` article est visible.
  5. Vérifier absence de 500 et erreurs console.
- Résultat attendu : l’article s’ouvre réellement et affiche du contenu.

## P0-FEED-001 — Feed principal visible

- Priorité : P0
- Type : E2E smoke
- Auto : Oui (`tests/e2e/smoke-critical.spec.ts`)
- Étapes : ouvrir `/feed`.
- Résultat attendu : onglets ou titre feed visibles, pas de 500, pas d’erreur console.

## P0-DAILY-001 — Daily feed visible

- Priorité : P0
- Type : E2E smoke
- Auto : Oui (`tests/e2e/smoke-critical.spec.ts`)
- Étapes : ouvrir `/daily`.
- Résultat attendu : page daily utilisable, pas de 500.

## P0-TRENDING-001 — Trending visible

- Priorité : P0
- Type : E2E smoke
- Auto : Oui (`tests/e2e/smoke-critical.spec.ts`)
- Étapes : ouvrir `/trending`.
- Résultat attendu : contenu trending visible, pas de 500.

## P0-SEARCH-001 — Recherche accessible

- Priorité : P0
- Type : E2E smoke + fonctionnel
- Auto : Partiel (`tests/e2e/search.spec.ts`, `tests/e2e/smoke-critical.spec.ts`)
- Étapes :
  1. Ouvrir `/search`.
  2. Vérifier le champ de recherche.
  3. Chercher `AI`.
- Résultat attendu : résultats ou état vide propre, jamais une page blanche/500.

## P0-BOOKMARKS-001 — Bookmarks utilisable en guest

- Priorité : P0
- Type : E2E smoke / UX fake
- Auto : Oui (`tests/e2e/bookmarks.spec.ts`, `tests/e2e/smoke-critical.spec.ts`)
- Étapes : ouvrir `/bookmarks` sans session.
- Résultat attendu : état guest ou liste localStorage propre, pas de mur cassé ni bouton inerte.

## P0-SETTINGS-001 — Settings ne time-out pas

- Priorité : P0
- Type : E2E smoke
- Auto : Oui (`tests/e2e/smoke-critical.spec.ts`)
- Étapes : ouvrir `/settings`.
- Résultat attendu : page préférences visible en moins de 10s, pas de 500.

## P0-AUTOEVOLVE-001 — Auto Evolve route réelle

- Priorité : P0
- Type : E2E smoke / nav parity
- Auto : Oui (`tests/e2e/smoke-critical.spec.ts`)
- Étapes : ouvrir `/auto-tune` via nav et direct URL.
- Résultat attendu : page Auto Evolve visible, route non fake.

## P0-DEEPMIND-001 — IA Auto News route réelle

- Priorité : P0
- Type : E2E smoke / client-side hydration
- Auto : Oui (`tests/e2e/smoke-critical.spec.ts`)
- Étapes : ouvrir `/ia-auto-news`.
- Résultat attendu : page hydratée sans crash, état data/loading/empty propre.

## P0-TOPICS-001 — Pages topics réelles

- Priorité : P0
- Type : E2E smoke
- Auto : Oui (`tests/e2e/smoke-critical.spec.ts`, `tests/e2e/topics.spec.ts`)
- Routes : `/topics/models`, `/topics/research`, `/topics/business`, `/topics/policy`.
- Résultat attendu : chaque topic retourne du contenu ou un état vide explicite, pas 404/500.

## P0-API-001 — Endpoints publics critiques OK

- Priorité : P0
- Type : API smoke
- Auto : À renforcer
- Endpoints : `/api/news`, `/api/news/counts-by-day`, `/api/huggingface/trending`, `/feed.xml`, `/sitemap.xml`, `/robots.txt`.
- Résultat attendu : status < 400, schéma JSON/XML valide.

## P0-QUALITY-001 — Aucun contenu RSS brut non nettoyé visible

- Priorité : P0
- Type : Data quality / UX
- Auto : À ajouter
- Données à détecter : `<![CDATA[`, balises HTML dans titres/summaries visibles, `&amp;` non décodé, timestamps négatifs.
- Résultat attendu : contenu utilisateur final propre.
