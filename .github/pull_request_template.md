## Contexte

<!-- Quoi et pourquoi. Exigence(s) concernée(s) : REQ-XXX-NN -->

## Changements

-

## Checklist QA

- [ ] Exigence créée/mise à jour dans `docs/qa/requirements.json`
- [ ] Tests ajoutés au bon niveau (unitaire / API / E2E), titres tagués `@REQ-…`
- [ ] Techniques de conception citées si pertinent (PE, AVL, table de décision, transitions)
- [ ] `npm run test:all` et `npm run qa:trace` verts
- [ ] Matrice régénérée (`node scripts/qa/check-traceability.mjs --write`)
- [ ] Si du code/test a été généré par IA : revu selon la [checklist](../docs/qa/genai-testing.md#5-checklist-de-revue-dun-test-généré-par-ia) et consigné dans `docs/qa/ai-assistance-log.md`
