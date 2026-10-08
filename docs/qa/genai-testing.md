# IA générative et test logiciel

Ce document définit comment la GenAI (LLM, agents de code) est utilisée **comme assistant** dans le workflow QA, avec ses garde-fous. Il s'appuie sur les concepts du programme *ISTQB Certified Tester — Testing with Generative AI* : fonctionnement des LLM, ingénierie de prompts, risques, tâches de test assistées, gouvernance.

> **Principe directeur** : la GenAI **propose**, l'humain **décide**. Un test généré n'a aucune valeur tant qu'il n'a pas été **relu, compris et exécuté** — et qu'il a, idéalement, été vu échouer avant d'être vu passer.

## 1. Ce qu'un LLM sait faire (et ne sait pas faire) pour le test

| Force | Limite associée |
|---|---|
| Générer rapidement de nombreux cas candidats (variantes, charges hostiles, bornes) | Peut **halluciner** un comportement du produit qu'il n'a pas lu : le cas attendu peut être faux |
| Reformuler des exigences ambiguës, repérer des trous | Peut combler un trou en **inventant** une règle plutôt qu'en le signaler |
| Écrire du code de test (Playwright, Vitest) conforme aux conventions | Peut produire des tests **tautologiques** (qui passent toujours) ou fragiles (sélecteurs, attentes) |
| Rédiger des rapports de défaut clairs, des chartes exploratoires | Reste **non déterministe** : deux exécutions ≠ même résultat |
| Aider à maintenir des tests après un changement | Peut « réparer » un test en **alignant l'assertion sur le bug** |

## 2. Cas d'usage retenus par activité de test

| Activité ISTQB | Usage de la GenAI | Garde-fou principal |
|---|---|---|
| Analyse | Détecter ambiguïtés et exigences non testables | Toute hypothèse est listée explicitement et validée par un humain |
| Conception | Proposer partitions, bornes, tables de décision, chartes exploratoires | La technique est **imposée** dans le prompt ; résultat comparé à une conception manuelle |
| Données de test | Générer des jeux fictifs, des charges hostiles | Aucune donnée personnelle réelle ; données déterministes ou graine fixe |
| Implémentation | Rédiger le code de test à partir de cas validés | Revue de code, exécution, test « rouge avant vert » |
| Exécution / maintenance | Analyser un échec, proposer un correctif de test | On distingue **défaut produit** vs **défaut de test** avant toute modification |
| Rapports | Rédiger un rapport de défaut à partir de traces | Contrôle factuel : étapes reproduites par un humain |

## 3. Ingénierie de prompts : structure retenue

Chaque prompt de la [bibliothèque](prompts/prompt-library.md) suit la même ossature :

1. **Rôle** — « analyste de test certifié ISTQB ».
2. **Contexte** — produit, contrat d'API, données (jamais de secrets ni de données personnelles).
3. **Tâche** — une seule, précise, avec la **technique de conception imposée**.
4. **Contraintes** — n'invente rien ; liste tes hypothèses ; déterminisme ; niveau de test recommandé.
5. **Format de sortie** — tableau structuré (ID, technique, données, attendu, niveau, priorité).
6. **Critère d'arrêt** — « Questions / hypothèses » et « cas non couverts, avec justification ».

Le script `npm run qa:prompt -- --req <ID> --technique <t>` assemble ce prompt à partir du référentiel [requirements.json](requirements.json) : le contexte est ainsi **reproductible** et versionné, pas retapé de mémoire.

## 4. Risques et mesures de maîtrise

| Risque | Exemple en test | Mesure |
|---|---|---|
| **Hallucination** | Le LLM suppose que la recherche est en OU, génère un attendu faux | Prompt « n'invente rien » + revue contre l'exigence ; le test doit échouer d'abord sur un défaut connu |
| **Biais / couverture trompeuse** | Surreprésentation des cas nominaux, oubli des cas culturels (accents, emoji, langues) | Technique imposée (PE/AVL), liste de contrôle d'entrées exotiques |
| **Non-déterminisme** | Même prompt, tests différents | Prompts versionnés ; on conserve le **test relu**, pas le prompt, comme artefact de référence |
| **Confidentialité** | Coller du code ou des données clients dans un LLM tiers | Données de démonstration uniquement ; politique d'usage de l'organisation respectée |
| **Sécurité (prompt injection)** | Une page ou un fichier analysé contient des instructions cachées | Le contenu analysé est traité comme **donnée**, jamais comme instruction |
| **Tests tautologiques** | `expect(result).toBeTruthy()` partout | Revue : chaque assertion doit pouvoir **échouer** pour une raison métier |
| **Dérive de confiance** | Valider sans relire parce que « l'IA a testé » | Checklist de revue obligatoire ; journal d'assistance |
| **Propriété intellectuelle / licences** | Code généré proche d'une source protégée | Revue ; usage de bibliothèques publiques standard uniquement |

## 5. Checklist de revue d'un test généré par IA

À cocher **avant** de fusionner un test écrit ou suggéré par une IA :

- [ ] Je peux expliquer, sans l'IA, **ce que le test vérifie et pourquoi**.
- [ ] Le résultat attendu vient de l'**exigence** (ou du contrat), pas d'une observation du code actuel.
- [ ] Le test **échoue** si je casse volontairement le comportement visé (mutation manuelle) — il n'est pas tautologique.
- [ ] Il est **déterministe** : pas d'horloge, de hasard non maîtrisé, d'ordre d'exécution ou d'attente arbitraire.
- [ ] Les **sélecteurs** sont sémantiques (rôle, libellé) et ne dépendent pas du style.
- [ ] Les **données** sont fictives, isolées, et centralisées dans `tests/support/`.
- [ ] Le test est **au bon niveau** de la pyramide (pas d'E2E pour une règle de validation).
- [ ] Il est **tracé** : tag `@REQ-…`, identifiant `MOD-NIVEAU-NNN`.
- [ ] Il n'**encode pas un bug** : en cas de doute, j'ai relu l'exigence plutôt que d'aligner l'assertion.
- [ ] Les **cas hostiles** (vide, très long, unicode, injection) ont été considérés.

## 6. Évaluer la qualité de l'assistance

| Indicateur | Question posée |
|---|---|
| Précision | Quelle part des cas proposés est correcte sans modification ? |
| Rappel | Quels cas pertinents l'IA a-t-elle omis par rapport à la conception manuelle ? |
| Valeur ajoutée | Combien de défauts ont été trouvés par des cas suggérés par l'IA ? |
| Coût de revue | Temps de relecture vs temps de conception manuelle |
| Erreurs d'IA détectées | Journal dans [ai-assistance-log.md](ai-assistance-log.md) |

## 7. Gouvernance

- Tout usage significatif de la GenAI est **consigné** dans [ai-assistance-log.md](ai-assistance-log.md) (quoi, par quel outil, avec quelle vérification).
- Les artefacts critiques (stratégie, critères de sortie, jugement de sévérité d'un défaut) restent **de la responsabilité humaine**.
- Aucun secret, jeton ni donnée personnelle réelle n'est transmis à un modèle.
