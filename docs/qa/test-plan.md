# Plan de test

## 1. Périmètre

**Dans le périmètre** : le site Nous AI News (pages publiques, routes `/api/*`, flux RSS), son jeu de données de démonstration et son pipeline CI.

**Hors périmètre** : tests de charge et de pénétration, navigateurs autres que Chromium, délivrabilité d'e-mails (aucun e-mail n'est envoyé), recette utilisateur humaine.

## 2. Éléments testés

| Élément | Fichiers principaux |
|---|---|
| Logique métier | `src/modules/{articles,search,topics,newsletter,bookmarks}` |
| Utilitaires | `src/lib/*` |
| Routes HTTP | `src/app/api/**`, `src/app/feed.xml/route.ts` |
| Pages et composants | `src/app/**/page.tsx`, `src/components/*` |
| Configuration | `next.config.mjs` (en-têtes de sécurité) |

## 3. Approche par module

| Module | Techniques principales | Points d'attention |
|---|---|---|
| `articles` | Valeurs limites (page, pageSize), partitions d'équivalence (category, sort), cohérence liste ↔ détail | Tri déterministe, jamais de `body` dans les listes, 404 HTTP réel |
| `search` | Partitions (casse, accents, ET), valeurs limites (longueur de `q`, `limit`), devinette d'erreurs (charges hostiles) | XSS réfléchi, pondération de pertinence, absence de résultat ≠ erreur |
| `topics` | Conservation (somme des compteurs = total), cohérence UI ↔ API | Compteurs dérivés des données, jamais figés |
| `newsletter` | **Table de décision**, valeurs limites (254/64), transitions d'état, concurrence | Données personnelles, validation stricte, idempotence |
| `bookmarks` | **Transitions d'état**, devinette d'erreurs (stockage corrompu / inaccessible), synchronisation entre onglets | Résilience, dégradation silencieuse |
| `platform` | Tests non fonctionnels : accessibilité, en-têtes, RSS, responsive, navigation | Aucune erreur console, 404 corrects, pas de fuite d'information |

## 4. Outillage

| Besoin | Outil |
|---|---|
| Tests unitaires + couverture | Vitest + `@vitest/coverage-v8` |
| Tests API et E2E | Playwright (`api`, `e2e-desktop`, `e2e-mobile`) |
| Accessibilité | `@axe-core/playwright` |
| Analyse statique | ESLint (`next/core-web-vitals`), TypeScript strict (`noUncheckedIndexedAccess`) |
| Traçabilité | `scripts/qa/check-traceability.mjs` |
| Exécution par module | `scripts/qa/test-module.mjs` |
| Assistance GenAI | `scripts/qa/build-test-prompt.mjs`, [bibliothèque de prompts](prompts/prompt-library.md) |
| CI | GitHub Actions — [`.github/workflows/qa.yml`](../../.github/workflows/qa.yml) |

## 5. Conventions

- **Identifiants** : `MOD-NIVEAU-NNN` — `ART-API-011`, `NEW-E2E-006`. Plages : `0xx` cas nominaux, `1xx` détail/variantes, `2xx+` cas spécifiques du module.
- **Tags dans les titres** : `@smoke` (parcours critique), `@mobile` (rejoué sur mobile), `@REQ-XXX-NN` (traçabilité). Les tests Vitest utilisent `[REQ-XXX-NN]` dans le titre du bloc `describe`.
- **Un test = une intention** ; le titre dit le comportement attendu, pas l'implémentation.
- **Données de test** centralisées dans `tests/support/` ; les tests ne dupliquent jamais une constante du jeu de données.

## 6. Exécution

| Contexte | Déclencheur | Contenu | Durée visée |
|---|---|---|---|
| Développement | `npm run test:module -- <module>` | Un module, tous niveaux | < 1 min |
| Avant commit | `npm run test:unit && npm run typecheck` | Retour rapide | < 10 s |
| Pull request / push `main` | GitHub Actions | Pipeline complet (voir ci-dessous) | < 10 min |

```
 static ──┐
          ├──► api ──────────┐
 unit ────┤                  ├──► quality-gate
          └──► e2e (desktop) ┤
               e2e (mobile) ─┘
```

## 7. Livrables

Rapports HTML et JUnit Playwright, rapport de couverture (artefacts CI), matrice de traçabilité générée, journal des défauts, ce plan et la stratégie.

## 8. Risques projet et parades

| Risque projet | Parade |
|---|---|
| Dérive entre données et constantes de test | Test d'intégrité des données (`REQ-PLT-07`) |
| Tests instables | Politique anti-flakiness, reprises CI utilisées comme détecteur |
| Tests générés par IA non relus | Checklist de revue, journal d'assistance, tests de confirmation sur chaque défaut |
| Documentation de traçabilité périmée | Matrice générée et comparée par la CI (`git diff --exit-code`) |
