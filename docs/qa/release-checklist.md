# Release Checklist

## Pre-Commit obligatoire

- [ ] Test ciblé du changement lancé et vert.
- [ ] Si bug fix : nouveau test de non-régression ajouté.
- [ ] `npm run tnr` — 100% vert.
- [ ] Résultats des tests communiqués.
- [ ] `git status` vérifié, aucun fichier oublié.

## Pre-Release

- [ ] CHANGELOG / docs pertinentes mises à jour.
- [ ] `npm run build` — no errors.
- [ ] `npm run tnr` — no failures.
- [ ] Playwright P0 smoke sur cible :

```bash
E2E_BASE_URL=https://nous-daily.vercel.app npx playwright test tests/e2e/smoke-critical.spec.ts --project=chromium --reporter=line
```

- [ ] Aucun 404/500 sur routes P0.
- [ ] Aucun `Something went wrong` dans le DOM hydraté.
- [ ] Aucune erreur console/pageerror sur routes P0.
- [ ] Aucun lien interne primaire cassé.
- [ ] Aucun bouton/lien fake détecté sur la zone livrée.

## Release Steps

1. Vérifier branche cible.
2. Lancer tests ciblés.
3. Lancer `npm run tnr`.
4. Si vert : commit.
5. Si déploiement recette : vérifier automatiquement l’URL live.
6. Si production : attendre GO explicite avant push/deploy prod.
7. Après déploiement : relancer smoke P0 sur l’URL live.

## Post-Release

- [ ] Smoke production OK.
- [ ] Browser réel OK.
- [ ] Console navigateur sans erreur.
- [ ] Endpoints SEO publics OK : `/feed.xml`, `/sitemap.xml`, `/robots.txt`.
- [ ] Cron / ingestion / Auto Evolve vérifiés si impactés.
- [ ] Bug analysis mise à jour si anomalie détectée.
