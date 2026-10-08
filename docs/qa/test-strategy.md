# Stratégie de test

## 1. Objectifs

1. **Réduire le risque** de mise en production d'un défaut sur les fonctions à forte valeur ou forte exposition : recherche, saisie de données (newsletter), accessibilité, sécurité des entrées.
2. **Fournir un retour rapide** : un défaut de logique doit être signalé en secondes (unitaire), pas en minutes (E2E).
3. **Rendre la qualité démontrable** : chaque exigence est reliée à des tests, chaque test à une technique de conception, chaque défaut à un test de confirmation.
4. **Permettre l'évolution** : suites déterministes, données maîtrisées, organisées par modules.

## 2. Les sept principes ISTQB appliqués au projet

| # | Principe | Décision concrète dans ce dépôt |
|---|---|---|
| 1 | Les tests montrent la présence de défauts, pas leur absence | Un journal de défauts est tenu ([defect-management.md](defect-management.md)) ; une suite verte n'est jamais présentée comme une preuve d'absence de défaut. |
| 2 | Les tests exhaustifs sont impossibles | Priorisation par le risque ([risk-analysis.md](risk-analysis.md)) et techniques de réduction (partitions d'équivalence, valeurs limites) plutôt qu'énumération. |
| 3 | Tester tôt | Analyse statique (lint, typage) et tests unitaires des validateurs avant tout E2E ; exigences formulées de façon testable dès le départ. |
| 4 | Regroupement des défauts | Les défauts trouvés se concentrent dans la **validation des entrées** et le **tri** : ces zones reçoivent le plus de cas (hostile payloads, bornes). |
| 5 | Paradoxe du pesticide | Données uniques par test (`uniqueEmail`), listes de charges hostiles variées, charters exploratoires à rejouer, revue des tests à chaque évolution du produit. |
| 6 | Le test dépend du contexte | Site d'information sans enjeu vital : accent sur l'accessibilité, la sécurité des entrées, le SEO de base et la robustesse côté navigateur. |
| 7 | Illusion de l'absence d'erreurs | Les tests passants ne valident pas l'utilité du produit : l'accessibilité (axe) et les parcours utilisateur complètent la vérification fonctionnelle. |

## 3. Processus de test (ISTQB)

| Activité | Réalisation |
|---|---|
| Planification | [test-plan.md](test-plan.md), critères d'entrée/sortie ci-dessous |
| Suivi et pilotage | Rapports Playwright (HTML, JUnit), couverture Vitest, matrice de traçabilité en CI |
| Analyse | Exigences testables ([requirements.json](requirements.json)) + analyse de risques |
| Conception | [Techniques ISTQB](test-design-techniques.md), cas nommés `MOD-NIVEAU-NNN` |
| Implémentation | Vitest + Playwright, données et helpers dans `tests/support/` |
| Exécution | Locale par module, CI complète sur chaque push / pull request |
| Achèvement | Porte qualité, journal des défauts, mise à jour de la matrice |

## 4. Niveaux de test

| Niveau ISTQB | Mise en œuvre | Cible |
|---|---|---|
| **Composant** | Vitest, `tests/unit/` | Fonctions pures : validation, recherche, pagination, stockage, formatage |
| **Intégration** | Playwright `api`, `tests/api/` | Routes `/api/*` + modules, via un vrai serveur HTTP (contrat, statuts, formats d'erreur) |
| **Système** | Playwright `e2e-desktop` / `e2e-mobile`, `tests/e2e/` | Parcours utilisateur de bout en bout dans un navigateur réel |
| **Acceptation** | Tag `@smoke` (porte de livraison) | Parcours critiques rejoués sur desktop **et** mobile. La recette utilisateur (UAT) humaine reste hors périmètre automatisé. |

## 5. Types de test

| Type | Couverture |
|---|---|
| Fonctionnel | Tous les modules, voir la matrice de traçabilité |
| Non fonctionnel — accessibilité | axe-core (WCAG 2.1 A/AA) sur 11 pages ; focus visible ; lien d'évitement ; champs nommés |
| Non fonctionnel — sécurité (de base) | En-têtes HTTP, charges hostiles (XSS, injection, traversal), mass assignment, absence de fuite de pile |
| Non fonctionnel — performance (de base) | Budget de réponse API (3 s) — ce n'est **pas** un test de charge |
| Non fonctionnel — compatibilité | Chromium desktop et émulation mobile (Pixel 7) |
| Structurel (boîte blanche) | Couverture instructions/fonctions ≥ 90 %, branches ≥ 85 % sur `src/modules` et `src/lib` |
| Lié aux changements | Test de **confirmation** (le test qui a révélé le défaut est conservé) et de **non-régression** (suite complète en CI) |

## 6. Critères

**Critères d'entrée** (démarrer l'exécution des tests système) : le build réussit ; lint et typage sans erreur ; chaque exigence est référencée par au moins un test.

**Critères de sortie / porte qualité** (livrer) :

- 0 test en échec, 0 test marqué `only` (`forbidOnly` en CI) ;
- 100 % des tests `@smoke` passent sur desktop et mobile ;
- seuils de couverture unitaire respectés (90 / 90 / 90 / 85 %) ;
- 22/22 exigences couvertes ; toute exigence à risque ÉLEVÉ couverte sur ≥ 2 niveaux (ou exemption motivée) ;
- 0 violation d'accessibilité `serious` / `critical` ;
- 0 défaut ouvert de sévérité Critique ou Majeure.

## 7. Environnements et données

- **Environnement de test** : serveur Next.js de production (`next build` + `next start`, port 3100), identique en local et en CI.
- **Données** : jeu de démonstration **fictif** versionné (`src/modules/articles/data.ts`). Les constantes de test (`tests/support/seed.ts`) sont **vérifiées par un test** contre ce jeu : toute dérive est détectée.
- **Isolation** : chaque test E2E obtient un contexte navigateur neuf (localStorage vide) ; les tests d'inscription utilisent des adresses uniques plutôt que de réinitialiser l'état serveur.
- **Aucune donnée personnelle réelle** n'est utilisée ni stockée.

## 8. Politique de fiabilité des tests (anti-flakiness)

- Aucune attente temporelle arbitraire : on attend un **état observable** (ex. `data-hydrated="true"` sur les composants clients).
- Sélecteurs sémantiques (`getByRole`, `getByLabel`) en priorité, `data-testid` pour les zones sans rôle explicite.
- En CI, 2 reprises automatiques servent à **détecter** l'instabilité : un test qui n'échoue qu'avant reprise est signalé « flaky » dans le rapport et doit être corrigé, pas toléré.
- Les tests sont indépendants entre eux et exécutables en parallèle, dans n'importe quel ordre.

## 9. Métriques suivies

Taux de réussite par niveau et par module · couverture de code · couverture des exigences · tests instables · durée de la suite · défauts par module et par sévérité · échappements (défauts trouvés après livraison).

## 10. Limites connues (transparence)

- Navigateurs : Chromium uniquement (pas de Firefox ni WebKit).
- Pas de test de charge ni de test de sécurité dynamique approfondi (pentest).
- Le validateur d'e-mail est volontairement pragmatique : sous-ensemble strict de la RFC 5322, ASCII uniquement (adresses internationalisées et formes entre guillemets refusées).
- Les favoris sont stockés dans le navigateur : pas de test API, la vérification est E2E + unitaire.
- Le store de la newsletter est en mémoire (démonstration) : aucune persistance, aucun e-mail envoyé.
- La revue humaine des tests générés avec assistance IA reste à réaliser par le mainteneur ([ai-assistance-log.md](ai-assistance-log.md)).
