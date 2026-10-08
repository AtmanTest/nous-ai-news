# Tests

Pyramide : beaucoup de tests unitaires rapides, une couche API, peu d'E2E ciblés sur les parcours.

| Niveau | Dossier | Outil | Commande |
|---|---|---|---|
| Unitaire | `tests/unit/<module>/` | Vitest (+ couverture v8) | `npm run test:unit:cov` |
| API | `tests/api/<module>/*.api.spec.ts` | Playwright (`request`) | `npm run test:api` |
| E2E desktop | `tests/e2e/<module>/*.spec.ts` | Playwright + axe-core | `npm run test:e2e` |
| E2E mobile | tests taggés `@mobile` / `@smoke` | Playwright (viewport mobile) | `npm run test:e2e` |

Modules : `articles`, `search`, `topics`, `bookmarks`, `newsletter`, `platform`.
Un seul module : `npm run test:module -- <module>`. Fumée : `npm run test:smoke`.

## Conventions

- Identifiant : `MOD-NIVEAU-NNN` (ex. `NEW-API-014`).
- Chaque test porte un tag `@REQ-XXX-NN` ; `npm run qa:trace` vérifie la couverture des exigences (`docs/qa/requirements.json`).
- Sélecteurs : `getByRole` / `getByLabel`, sinon `data-testid`. Aucune attente fixe.
- Données et utilitaires dans `tests/support/` (`uniqueEmail`, `SEED`, …).
- Un défaut corrigé = un test de confirmation conservé.

Détails : [docs/qa](../docs/qa/README.md).
