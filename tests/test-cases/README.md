# Référentiel des cas de test — Nous AI News

Ce référentiel définit les cas de test métier et techniques à maintenir en parallèle des tests automatisés.

## Fichiers

- `p0-vital.md` — cas vitaux bloquants avant commit, push ou déploiement.
- `smoke-monthly.md` — smoke test mensuel / périodique sur production.
- `regression-matrix.md` — matrice de régression par module.

## Règle projet

- Tout bug corrigé doit avoir un test de non-régression associé.
- `npm run tnr` doit être vert avant chaque commit.
- Les tests Playwright P0 doivent être lancés contre l’environnement cible avant de déclarer que le site fonctionne.
- Aucun élément UX fake : chaque lien, bouton ou badge doit être réel ou supprimé.
