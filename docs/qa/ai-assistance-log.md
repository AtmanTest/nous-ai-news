# Journal d'assistance IA

Transparence sur l'usage de la GenAI dans ce dépôt, conformément à la [politique de gouvernance](genai-testing.md#7-gouvernance).

## Entrée 2026-10-08 — Refonte complète

| Champ | Détail |
|---|---|
| Outil | Claude (Anthropic), en mode agent de code |
| Périmètre | Refonte intégrale du site (code applicatif, jeu de données fictif), de la suite de tests (unitaire, API, E2E), des scripts QA, de la CI et de la documentation |
| Entrées fournies | Demande du mainteneur : refonte complète avec workflow QA, tests Playwright et API par modules, principes ISTQB Foundation et GenAI |
| Décisions humaines | Suppression de l'ancien contenu, conservation de la stack Next.js 14 + TypeScript + Tailwind, publication directe sur `main` |
| Données sensibles transmises | Aucune. Contenu des articles entièrement fictif. |

### Vérifications automatiques effectuées pendant la production

- Typage strict (`tsc --noEmit`), lint (`next lint`), build de production.
- Suites exécutées en local : unitaire (avec couverture), API (Playwright), E2E desktop et mobile (Playwright + axe-core).
- Contrôle de traçabilité exigences → tests (`qa:trace`).

### Erreurs de l'IA détectées par les tests (preuve que la revue reste indispensable)

| Erreur produite | Détectée par | Voir |
|---|---|---|
| Comparateur de tri au signe inversé (`newest` à l'envers) | Tests unitaires de tri | DEF-003 |
| Validateur d'e-mail trop permissif (HTML accepté dans la partie locale) | Test API `NEW-API-014` | DEF-001 |
| Motif de TLD appliqué à tous les labels DNS (limite 63 non respectée) | Test unitaire aux valeurs limites | DEF-002 |
| Hypothèse erronée sur le comportement de Playwright pour un corps JSON invalide | Échec `NEW-API-007/008` | [Défauts de test](defect-management.md#défauts-de-test-non-produit-rencontrés) |
| Locator ambigu (mode strict) | Échec `ART-E2E-010/015` | idem |

### Reste à faire par un humain

- [ ] **Relire** les tests selon la [checklist](genai-testing.md#5-checklist-de-revue-dun-test-généré-par-ia), en particulier les résultats attendus des tests de recherche et de pertinence (dépendants du jeu de données).
- [ ] Valider les **seuils** (couverture, budget de performance, niveaux de risque) : ils sont des propositions, pas des décisions métier.
- [ ] Mener les **3 chartes exploratoires** ([test-design-techniques.md §2.2](test-design-techniques.md#22-tests-exploratoires-chartes)).
- [ ] Confirmer la configuration de déploiement (voir README) : l'ancien pipeline et les crons ont été supprimés.
