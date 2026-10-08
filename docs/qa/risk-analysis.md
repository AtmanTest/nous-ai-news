# Analyse de risques

Approche ISTQB : le **risque produit** = **probabilité** qu'un défaut existe × **impact** s'il survient. Le niveau de risque détermine la **profondeur** (nombre de techniques, nombre de niveaux de test) et l'**ordre d'exécution** des tests.

Échelle : probabilité 1–3, impact 1–3. Score ≥ 6 → **ÉLEVÉ** · 3–5 → **MOYEN** · ≤ 2 → **FAIBLE**.

## 1. Risques produit par exigence

Les scores sont les valeurs de [requirements.json](requirements.json) ; la couverture réelle par niveau est dans la [matrice de traçabilité](traceability-matrix.md).

| Niveau | Exigences | Justification |
|---|---|---|
| **ÉLEVÉ** (9) | SRC-01, NEW-02 | Cœur fonctionnel (la recherche est la fonction la plus utilisée et la plus complexe) ; saisie de données personnelles exposée à des entrées hostiles. |
| **ÉLEVÉ** (6) | ART-01, ART-03, SRC-02, NEW-01, PLT-04, PLT-06 | Liste/détail = fonction principale et 404 ; injection/XSS réfléchi sur la requête ; inscription = collecte de données ; accessibilité (exigence légale et d'inclusion) ; sécurité de base. |
| **MOYEN** (3–5) | ART-02, ART-04, SRC-03, NEW-03, BKM-01, BKM-03, PLT-03, PLT-05, PLT-07 | Fonctions secondaires ou à impact limité mais à probabilité de défaut non négligeable (état navigateur, tri, responsive). |
| **FAIBLE** (≤ 2) | TOP-01, TOP-02, BKM-02, PLT-01, PLT-02 | Fonctions simples, dérivées des données, faible impact. |

## 2. Stratégie de test par niveau de risque

| Niveau de risque | Profondeur exigée | Techniques |
|---|---|---|
| ÉLEVÉ | ≥ 2 niveaux de test (sauf exemption motivée) ; cas négatifs et hostiles obligatoires | Valeurs limites, partitions, table de décision, devinette d'erreurs |
| MOYEN | ≥ 1 niveau, nominaux + principaux cas d'erreur | Partitions, transitions d'état |
| FAIBLE | 1 niveau suffit, cas nominal + cohérence | Test de cohérence, conservation |

Cette règle est **appliquée automatiquement** : `scripts/qa/check-traceability.mjs` fait échouer la CI si une exigence ÉLEVÉE n'est couverte que sur un seul niveau sans exemption documentée (`exemptLevels`). Deux exemptions motivées : PLT-04 (accessibilité, vérifiable seulement au niveau navigateur) et ING-03 (fusion/ingestion : logique pure hors serveur, tests d'intégration volontairement figés sur le jeu de démonstration).

## 3. Principaux scénarios de risque et parades

| Scénario | Exigence | Parade (tests) |
|---|---|---|
| Une requête de recherche exécute du HTML/JS dans la page (XSS réfléchi) | SRC-02 | `SRC-E2E-010/011` (aucune exécution), `SRC-API-015` (9 charges hostiles → 200 JSON) |
| Une adresse e-mail hostile est stockée puis réutilisée (injection d'en-tête, HTML dans un back-office) | NEW-02 | `NEW-API-014`, `NEW-E2E-012`, tests unitaires de sécurité du validateur — **a révélé DEF-001** |
| L'utilisateur est inscrit en double ou perd son inscription en cas de double clic / concurrence | NEW-03 | `NEW-API-005` (5 requêtes parallèles → 1 seule inscription), `NEW-E2E-008` (bouton désactivé pendant l'envoi) |
| Le tri « plus récent » affiche les articles à l'envers | ART-01 | Tests unitaires de tri et d'intégrité — **a révélé DEF-003** |
| Un utilisateur au clavier ou avec lecteur d'écran ne peut pas utiliser le site | PLT-04 | axe-core sur 11 pages, lien d'évitement, focus visible, noms accessibles |
| Les favoris plantent la page quand le stockage est corrompu ou bloqué | BKM-03 | `BKM-E2E-010/011/012` + tests unitaires de résilience (`[REQ-BKM-03]`) |
| Une URL erronée renvoie un faux 200 (« soft 404 ») ou une trace d'erreur | PLT-03, PLT-06 | Contrôle du statut HTTP 404 réel, `PLT-API-022` (aucune pile d'appels) |

## 4. Risques projet

Voir [test-plan.md §8](test-plan.md#8-risques-projet-et-parades).
