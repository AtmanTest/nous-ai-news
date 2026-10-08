# Techniques de conception de tests (ISTQB Foundation)

Chaque technique est illustrée par des cas **réels du dépôt**. Les identifiants renvoient aux fichiers `tests/api/**` et `tests/e2e/**` ; les tests unitaires sont repérés par le tag `[REQ-…]` de leur bloc `describe`.

## 1. Techniques boîte noire

### 1.1 Partitions d'équivalence (PE)

Principe : diviser le domaine d'une entrée en classes que le système traite de la même façon, et tester **un représentant par classe**.

| Entrée | Partitions valides | Partitions invalides | Tests |
|---|---|---|---|
| `page` | entier ≥ 1 | non numérique, négatif, décimal, vide, espace | `ART-API-009`, unit `[REQ-ART-01]` |
| `category` | 6 slugs connus | inconnu, mauvaise casse, vide, chemin (`../`) | `ART-API-009/011`, unit `[REQ-ART-02]` |
| `sort` | `newest`, `oldest` | autre valeur, mauvaise casse, vide | `ART-API-009`, unit |
| `q` (recherche) | mot du titre / tag / résumé / corps ; casse variée ; accents variés | absent, vide, espaces seuls, trop court, trop long | `SRC-API-001…009`, `SRC-E2E-003/006/007` |
| e-mail | adresse standard, avec `+tag`, sous-domaines, majuscules | sans `@`, sans domaine, TLD d'un caractère, espaces, HTML, double `@` | unit `[REQ-NEW-02]`, `NEW-API-006/014` |
| corps JSON newsletter | objet | `null`, tableau, chaîne, nombre, booléen, JSON invalide, vide | `NEW-API-007/008/009` |
| contenu du localStorage | liste de slugs | JSON invalide, objet, nombre, éléments non-chaîne, doublons | unit `[REQ-BKM-03]`, `BKM-E2E-010/011` |

### 1.2 Analyse des valeurs limites (AVL)

Principe : les défauts se logent aux **bornes** des partitions ordonnées. On teste la borne, la valeur juste en dessous et juste au-dessus (AVL à 3 valeurs).

| Entrée | Bornes | Valeurs testées | Tests |
|---|---|---|---|
| `page` | 1 … 1 000 000 | 0 / 1 / 2 · 1 000 000 / 1 000 001 | unit `[REQ-ART-01]` |
| `page` (affichage) | dernière page = 2 | 1 / 2 / 3 (hors plage → 404) | `ART-E2E-005`, `ART-API-008` |
| `pageSize` | 1 … 50 | 0 / 1 / 9 / 50 / 51 | `ART-API-006/007/009`, unit |
| `q` (longueur) | 2 … 100 | 1 / 2 / 3 · 99 / 100 / 101 | `SRC-API-008`, unit `[REQ-SRC-02]` |
| `limit` | 1 … 50 | 0 / 1 / 50 / 51 | `SRC-API-013`, unit |
| e-mail (longueur totale) | ≤ 254 | 253 / 254 / 255 | `NEW-API-010`, unit |
| e-mail (partie locale) | ≤ 64 | 63 / 64 / 65 | `NEW-API-011`, unit |
| label DNS | ≤ 63 | 63 / 64 | unit `[REQ-NEW-02]` — **a révélé DEF-002** |
| nombre de favoris | ≤ 200 | 200 puis 201 (éviction du plus ancien) | unit `[REQ-BKM-01]` |
| slug | ≤ 200 car. | 200 / 201 | unit `[REQ-BKM-03]` |

### 1.3 Table de décision

Principe : modéliser des **combinaisons de conditions** et leurs actions, une règle = un cas de test.

Newsletter — conditions : *e-mail valide ?* × *consentement `true` ?* × *thématiques valides ?*

| Règle | E-mail valide | Consentement | Thématiques | Résultat attendu |
|:-:|:-:|:-:|:-:|---|
| R1 | O | O | O (ou absentes) | 201 `subscribed` |
| R3 | **N** | O | O | 422, champ `email` |
| R5/R6/R7 | O | **N** (absent / `false` / `"true"`) | O | 422, champ `consent` |
| R8/R9 | O | O | **N** (inconnue / non-liste) | 422, champ `topics` |
| R10 | **N** | **N** | O | 422, champs `consent` + `email` |
| R11 | **N** | **N** | **N** | 422, trois champs |

→ Implémentée dans `NEW-API-006` (11 règles) et dans les tests unitaires `[REQ-NEW-02]`. Le test vérifie aussi que **toutes** les erreurs sont retournées ensemble (pas seulement la première).

Recherche — règle ET : *terme 1 présent ?* × *terme 2 présent ?* → résultat uniquement si les deux sont vrais (`SRC-API-005`, `SRC-E2E-004`, unit `[REQ-SRC-01]`).

### 1.4 Test de transitions d'état

Principe : modéliser états, événements, transitions (valides **et** invalides).

**Favori** (`BKM-E2E-002`, unit `toggleBookmark`)

```
 ┌──────────┐   clic « Ajouter »    ┌─────────┐
 │ non favori│ ───────────────────► │  favori │
 │           │ ◄─────────────────── │         │
 └──────────┘   clic « Retirer »    └─────────┘
```

**Inscription newsletter** (`NEW-API-003/004/005`, unit `[REQ-NEW-03]`)

```
 (inconnue) ──subscribe──► subscribed ──subscribe──► subscribed (réponse « already_subscribed », sans changement)
```

La transition « subscribe sur adresse déjà inscrite » est la transition *non triviale* : elle est testée en séquence **et** en concurrence (5 requêtes simultanées → une seule inscription).

### 1.5 Test de cas d'utilisation (parcours)

Chaque cas d'utilisation principal a un test E2E qui le déroule de bout en bout :

| Cas d'utilisation | Test |
|---|---|
| Lire un article depuis l'accueil | `ART-E2E-010` |
| Rechercher puis ouvrir un résultat | `SRC-E2E-001`, `SRC-E2E-009` |
| Parcourir une thématique | `TOP-E2E-002` |
| Mettre un article en favori, le retrouver, le retirer | `BKM-E2E-001/004/005` |
| S'inscrire à la newsletter | `NEW-E2E-001` |

## 2. Techniques basées sur l'expérience

### 2.1 Devinette d'erreurs

À partir des défauts classiques des applications web, des cas ciblés sont ajoutés :

| Erreur pressentie | Tests |
|---|---|
| Injection XSS / SQL / traversal / format string dans la recherche | `SRC-API-015` (9 charges), `SRC-E2E-010/011` |
| E-mail hostile (HTML, en-tête injecté, `${}`) | `NEW-API-014`, `NEW-E2E-012`, unit — **a révélé DEF-001** |
| Mass assignment (champs `isAdmin`, `role`) | `NEW-API-013` |
| Soumissions concurrentes | `NEW-API-005` |
| Double soumission du formulaire | `NEW-E2E-008` (bouton désactivé pendant l'envoi) |
| Réseau coupé / erreur 500 pendant l'envoi | `NEW-E2E-009/010` |
| localStorage corrompu, saturé ou interdit | `BKM-E2E-010/011/012`, unit `[REQ-BKM-03]` |
| Slug démesuré, casse différente, path traversal | `ART-API-104/105/106` |
| Unicode, emoji, caractères de contrôle | `SRC-API-015`, unit `[REQ-SRC-02]` |
| Soft 404 (page inconnue qui répond 200) | `ART-E2E-005/014`, `TOP-E2E-004`, `PLT-E2E-003` |

### 2.2 Tests exploratoires (chartes)

Non automatisés, à exécuter en sessions de 30–45 minutes (le test exploratoire cherche ce que les scripts ne prévoient pas) :

1. **Explorer la saisie de la newsletter avec un lecteur d'écran et un clavier seul pour découvrir des obstacles de navigation, d'annonce des erreurs ou de focus.**
2. **Explorer la recherche avec des requêtes issues de vrais usages (fautes de frappe, abréviations, phrases entières, mots très courts comme « IA ») pour découvrir des résultats surprenants ou une pertinence discutable.**
3. **Explorer les favoris avec plusieurs onglets, un mode navigation privée et des rechargements rapides pour découvrir des incohérences d'état ou des pertes de données.**

À l'issue : notes de session, défauts consignés ([defect-management.md](defect-management.md)), nouveaux cas automatisés si pertinent.

## 3. Techniques boîte blanche

| Technique | Mise en œuvre |
|---|---|
| Couverture des instructions | Seuil ≥ 90 % sur `src/modules` et `src/lib` (`vitest.config.mts`) |
| Couverture des branches | Seuil ≥ 85 % — la CI échoue sous le seuil |
| Couverture des fonctions | Seuil ≥ 90 % |

La couverture est un **indicateur de zones non testées**, pas une mesure de qualité : elle ne dit rien des cas d'entrée manquants. C'est pourquoi les techniques boîte noire ci-dessus restent le moteur de conception.

## 4. Gestion des données de test

- **Jeu de référence versionné** (`src/modules/articles/data.ts`) avec invariants vérifiés : unicité, dates distinctes, 3 articles par thématique.
- **Constantes de test centralisées** (`tests/support/seed.ts`), validées contre ce jeu par `[REQ-PLT-07]` : toute dérive casse un test unitaire immédiatement.
- **Données générées uniques** (`uniqueEmail`, `emailOfLength`, `emailWithLocalLength`) pour l'isolation sans reset d'état.
- **Horloge injectée** dans le service newsletter (`now`) pour des horodatages déterministes en test unitaire.
