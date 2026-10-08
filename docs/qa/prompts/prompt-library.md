# Bibliothèque de prompts de test

Prompts réutilisables, versionnés. Remplacer les éléments entre `<…>`. Pour les prompts de conception, préférer la génération automatique du contexte :

```bash
npm run qa:prompt -- --req <ID> --technique <ep|bva|decision-table|state-transition|error-guessing|exploratory>
```

> **Rappel** : ne jamais coller de secret, de jeton ni de donnée personnelle réelle. Relire toute sortie avec la [checklist de revue](../genai-testing.md#5-checklist-de-revue-dun-test-généré-par-ia).

---

## P1 — Analyse d'une exigence (testabilité)

```
Rôle : analyste de test ISTQB Foundation.

Voici une exigence :
<énoncé>

Tâche :
1. Dis si elle est testable. Sinon, explique pourquoi (ambiguïté, absence de critère mesurable).
2. Liste les ambiguïtés sous forme de questions fermées (oui/non ou valeur attendue).
3. Propose une reformulation testable avec des critères d'acceptation mesurables.

Contraintes : n'invente aucune règle. Si une information manque, pose la question.
Format : 3 sections « Testabilité », « Questions », « Reformulation proposée ».
```

## P2 — Partitions d'équivalence et valeurs limites

```
Rôle : analyste de test ISTQB Foundation.

Entrée à tester : <nom, type, contraintes connues, exemples valides/invalides>
Comportement attendu : <erreurs, codes, messages>

Tâche :
1. Établis les partitions valides et invalides.
2. Pour chaque borne, donne borne−1, borne, borne+1.
3. Propose un cas de test par partition et par valeur limite.

Contraintes : déterministe ; indique le niveau recommandé (unitaire / API / E2E) en privilégiant le plus bas ;
liste tes hypothèses à valider ; aucun code.
Format : tableau | ID | Partition ou borne | Donnée | Attendu | Niveau |.
```

## P3 — Table de décision

```
Rôle : analyste de test ISTQB Foundation.

Règles métier :
<règles>

Tâche :
1. Extrais les conditions et les actions.
2. Construis la table complète (2^n règles), puis fusionne les règles équivalentes en justifiant.
3. Donne un cas de test par règle fusionnée.

Contraintes : signale toute combinaison impossible ou non spécifiée au lieu de décider.
Format : table de décision Markdown puis liste de cas de test.
```

## P4 — Génération de charges hostiles (devinette d'erreurs)

```
Rôle : testeur sécurité applicative (niveau fondamental).

Champ de saisie : <nom, type, où la valeur est réaffichée ou stockée>

Tâche : propose 15 entrées hostiles ou inhabituelles, regroupées par famille
(injection HTML/JS, injection SQL/commande, traversal, format string, unicode/emoji, longueurs extrêmes,
caractères de contrôle, espaces/vides, types inattendus).
Pour chaque entrée : la faille pressentie et le comportement sûr attendu.

Contraintes : entrées à des fins défensives sur une application de démonstration ; aucune charge destructrice ;
aucune donnée personnelle réelle.
Format : tableau | Famille | Entrée | Faille pressentie | Comportement sûr attendu |.
```

## P5 — Génération de code de test Playwright à partir de cas validés

```
Rôle : ingénieur d'automatisation de test.

Cas de test validés (à implémenter tels quels, sans en ajouter) :
<tableau de cas>

Conventions du projet :
- Playwright + TypeScript, tests dans tests/<niveau>/<module>/.
- Titre : « MOD-NIVEAU-NNN @REQ-XXX-NN <comportement attendu> ».
- Sélecteurs : getByRole / getByLabel en priorité, data-testid sinon.
- Aucune attente fixe (waitForTimeout interdit) : attendre un état observable.
- Données de test depuis tests/support/ ; adresses e-mail via uniqueEmail().

Tâche : écris le code. Si un cas est ambigu ou non implémentable, dis-le au lieu de deviner.
Format : un bloc de code par fichier, précédé du chemin.
```

## P6 — Analyse d'un échec de test (défaut produit ou défaut de test ?)

```
Rôle : analyste de test.

Test en échec : <titre>
Message d'erreur : <message>
Extrait du test : <code>
Extrait du code testé : <code>
Exigence : <énoncé>

Tâche :
1. Classe la cause la plus probable : (a) défaut du produit, (b) défaut du test, (c) environnement/instabilité.
2. Justifie en citant les éléments ci-dessus.
3. Propose le correctif minimal ET dis ce qu'il faut vérifier pour exclure les autres causes.

Contraintes : ne propose JAMAIS d'adapter l'assertion pour faire passer le test sans avoir confirmé
que le comportement actuel est conforme à l'exigence.
```

## P7 — Rapport de défaut

```
Rôle : analyste qualité.

Observations brutes : <étapes, résultat obtenu, résultat attendu, traces, captures>

Tâche : rédige un rapport de défaut avec : titre (≤ 80 car.), environnement, étapes de reproduction numérotées,
résultat attendu, résultat obtenu, sévérité proposée (justifiée), exigence concernée, pièces jointes.

Contraintes : ne mentionne que des faits présents dans les observations ; marque « à confirmer »
tout ce qui est supposé.
```

## P8 — Chartes d'exploration

```
Rôle : testeur exploratoire expérimenté.

Zone du produit : <module / fonctionnalité>
Risques connus : <liste>

Tâche : rédige 3 chartes au format « Explorer <zone> avec <ressources> pour découvrir <information> »,
avec durée (30–45 min), heuristiques suggérées (ex. SFDIPOT, tours de test) et critères de fin de session.
```

## P9 — Revue d'une suite de tests

```
Rôle : relecteur de tests.

Voici un fichier de tests : <code>
Exigences associées : <liste>

Tâche : signale (1) assertions tautologiques ou trop faibles, (2) cas manquants selon PE/AVL,
(3) risques de flakiness, (4) tests au mauvais niveau de la pyramide, (5) données non isolées.
Pour chaque point : ligne concernée, problème, correctif suggéré.

Contraintes : ne réécris pas la suite ; cite la ligne ; n'invente pas de comportement du produit.
```
