# Matrice de traçabilité exigences → tests

> Fichier **généré** par `node scripts/qa/check-traceability.mjs --write` — ne pas éditer à la main.
> La CI échoue si cette matrice n'est pas à jour, si une exigence n'est couverte par aucun test,
> ou si une exigence à risque ÉLEVÉ n'est couverte que sur un seul niveau (sauf exemption motivée dans `requirements.json`).

Les colonnes Unit / API / E2E comptent les **références** (`REQ-XXX-NN`) trouvées dans les titres de tests (ou de blocs `describe` pour Vitest).
Risque = probabilité × impact (échelle 1–3) : ≥ 6 ÉLEVÉ, 3–5 MOYEN, ≤ 2 FAIBLE (voir [risk-analysis.md](risk-analysis.md)).

| Exigence | Module | Description | Risque | Unit | API | E2E | Niveaux |
|---|---|---|---|---:|---:|---:|---|
| ART-01 | articles | La liste d'articles est paginée (page ≥ 1, pageSize 1–50, défaut 9), triée par date décroissante par défaut (ou croissante), et n'expose jamais le corps des articles. | ÉLEVÉ (6) | 8 | 13 | 6 | UNIT + API + E2E |
| ART-02 | articles | La liste peut être filtrée par thématique ; une thématique inconnue est rejetée. | MOYEN (4) | 2 | 2 | 0 | UNIT + API |
| ART-03 | articles | Le détail d'un article est accessible par son slug (corps complet) ; un slug inconnu renvoie 404 (API et page). | ÉLEVÉ (6) | 2 | 7 | 1 | UNIT + API + E2E |
| ART-04 | articles | La page article affiche titre, thématique, source, date longue, durée de lecture, tags, corps et jusqu'à deux articles liés de la même thématique. | MOYEN (4) | 2 | 0 | 6 | UNIT + E2E |
| SRC-01 | search | La recherche plein texte (titre, tags, résumé, corps) est insensible à la casse et aux accents, en sémantique ET entre les termes, avec filtre de thématique et limite. | ÉLEVÉ (9) | 4 | 8 | 7 | UNIT + API + E2E |
| SRC-02 | search | La requête est validée (2–100 caractères après trim, limit 1–50, thématique connue) ; toute saisie est traitée comme du texte (aucune injection, aucun HTML interprété). | ÉLEVÉ (6) | 3 | 6 | 5 | UNIT + API + E2E |
| SRC-03 | search | Les résultats sont triés par pertinence décroissante (titre > tags > résumé > corps), puis par date, puis par slug. | MOYEN (4) | 1 | 1 | 0 | UNIT + API |
| TOP-01 | topics | La liste des thématiques expose libellé, description et nombre d'articles ; la somme des compteurs égale le total d'articles. | FAIBLE (2) | 1 | 5 | 2 | UNIT + API + E2E |
| TOP-02 | topics | La page d'une thématique n'affiche que ses articles, du plus récent au plus ancien ; une thématique inconnue renvoie 404. | FAIBLE (2) | 1 | 0 | 3 | UNIT + E2E |
| NEW-01 | newsletter | Un visiteur peut s'inscrire à la newsletter avec une adresse valide et son consentement ; le formulaire confirme l'inscription. | ÉLEVÉ (6) | 2 | 4 | 4 | UNIT + API + E2E |
| NEW-02 | newsletter | L'inscription est validée (format e-mail, longueurs 254/64, consentement booléen explicite, thématiques connues) avec toutes les erreurs retournées ; aucune donnée hostile n'est acceptée ni interprétée. | ÉLEVÉ (9) | 6 | 8 | 7 | UNIT + API + E2E |
| NEW-03 | newsletter | L'inscription est idempotente : une adresse déjà inscrite (casse et espaces ignorés) reçoit « already_subscribed » sans doublon, y compris en soumissions concurrentes. | MOYEN (4) | 2 | 3 | 1 | UNIT + API + E2E |
| BKM-01 | bookmarks | Un favori s'ajoute et se retire depuis l'article et depuis la page Favoris ; l'état persiste après rechargement et se synchronise entre onglets. | MOYEN (4) | 2 | 0 | 6 | UNIT + E2E |
| BKM-02 | bookmarks | La page Favoris liste les articles mis en favori (le plus récent d'abord) avec leur compteur, ou un état vide explicite. | FAIBLE (2) | 0 | 0 | 2 | E2E |
| BKM-03 | bookmarks | Les favoris résistent à un stockage corrompu, non conforme, saturé ou inaccessible : aucune exception, dégradation silencieuse. | MOYEN (4) | 2 | 0 | 3 | UNIT + E2E |
| PLT-01 | platform | GET /api/health renvoie l'état du service (status, version, volume de données, horodatage) sans mise en cache. | FAIBLE (2) | 0 | 2 | 0 | API |
| PLT-02 | platform | Le flux RSS /feed.xml est valide, trié, correctement échappé, avec des liens absolus ; il est annoncé par auto-découverte. | FAIBLE (2) | 1 | 5 | 2 | UNIT + API + E2E |
| PLT-03 | platform | La navigation globale fonctionne ; chaque page a un titre propre et un unique <h1> ; toute URL inconnue affiche une page 404 avec statut HTTP 404 ; aucune erreur console. | MOYEN (4) | 0 | 1 | 7 | API + E2E |
| PLT-04 | platform | Le site est accessible (WCAG 2.1 A/AA) : aucune violation axe « serious/critical », lien d'évitement, focus visible, champs nommés. | ÉLEVÉ (6) | 0 | 0 | 5 | E2E |
| PLT-05 | platform | Le site est utilisable sur mobile : pas de défilement horizontal, navigation et recherche visibles, balise viewport. | MOYEN (4) | 0 | 0 | 5 | E2E |
| PLT-06 | platform | Les en-têtes de sécurité de base sont envoyés (nosniff, X-Frame-Options, Referrer-Policy, Permissions-Policy) ; la pile technique et les traces d'erreur ne fuient pas. | ÉLEVÉ (6) | 2 | 3 | 0 | UNIT + API |
| PLT-07 | platform | Le jeu de données de démonstration est cohérent : identifiants et slugs uniques, champs obligatoires, dates valides et distinctes, répartition par thématique. | MOYEN (3) | 2 | 0 | 0 | UNIT |
| ING-01 | ingest | Les flux RSS 2.0 et Atom sont analysés de façon tolérante (CDATA, entités, HTML dans l'extrait) ; un flux invalide ne produit aucun élément. | MOYEN (4) | 2 | 0 | 0 | UNIT |
| ING-02 | ingest | Un élément de flux devient un article valide (URL canonique sans suivi, date ISO non future, extrait ≤ 300 caractères, thématique connue) ou est rejeté ; les flux généralistes sont filtrés sur le sujet IA. | MOYEN (4) | 4 | 0 | 0 | UNIT |
| ING-03 | ingest | La fusion dédoublonne par URL et par titre, purge les articles trop anciens, trie du plus récent au plus ancien et plafonne le volume ; le site retombe sur le jeu de démonstration si rien n'est ingéré ou si NOUS_CONTENT=seed. | ÉLEVÉ (6) | 2 | 0 | 0 | UNIT |
