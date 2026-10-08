import type { Article } from './types';

/**
 * Jeu de données de démonstration : 18 articles fictifs, 6 thématiques × 3 articles,
 * dates toutes distinctes (tri déterministe). Les tests s'appuient sur ces invariants
 * (voir tests/support/seed.ts et tests/unit/data/integrity.test.ts).
 */
export const ARTICLES: readonly Article[] = [
  // ───────────── Modèles ─────────────
  {
    id: 'art-001',
    slug: 'modeles-raisonnement-longue-duree',
    title: 'Les modèles de raisonnement gagnent en fiabilité sur les tâches longues',
    summary:
      "Les derniers modèles de raisonnement tiennent mieux le fil sur des tâches de plusieurs dizaines d'étapes, avec moins de dérives en cours de route.",
    body: [
      "Les évaluations récentes montrent que les modèles de raisonnement maintiennent une cohérence plus élevée lorsque le nombre d'étapes augmente. Les équipes attribuent ce progrès à de meilleures méthodes de vérification interne et à des jeux d'entraînement mieux calibrés.",
      'Les praticiens restent prudents : une moyenne favorable ne garantit pas la fiabilité sur chaque cas d’usage. Ils recommandent de mesurer le taux d’échec sur leurs propres scénarios avant tout déploiement.',
    ],
    category: 'models',
    tags: ['raisonnement', 'benchmarks', 'évaluation'],
    source: 'Rédaction Nous',
    publishedAt: '2026-10-06T08:00:00Z',
    readingMinutes: 3,
  },
  {
    id: 'art-002',
    slug: 'fenetre-contexte-million-tokens',
    title: 'La fenêtre de contexte à un million de tokens devient un standard',
    summary:
      "Les grandes fenêtres de contexte se généralisent, mais leur usage efficace dépend toujours de la qualité de la récupération d'information.",
    body: [
      'Plusieurs fournisseurs proposent désormais des fenêtres de contexte très longues par défaut. Cela simplifie l’analyse de documents volumineux, sans pour autant supprimer le besoin de structurer les entrées.',
      'Les tests de rappel montrent que la précision varie selon la position de l’information dans le contexte. Les équipes combinent donc contexte long et résumés intermédiaires pour limiter les pertes.',
    ],
    category: 'models',
    tags: ['contexte', 'tokens', 'performance'],
    source: 'Rédaction Nous',
    publishedAt: '2026-09-28T08:00:00Z',
    readingMinutes: 3,
  },
  {
    id: 'art-003',
    slug: 'modeles-multimodaux-video',
    title: 'Les modèles multimodaux progressent sur la compréhension vidéo',
    summary:
      "La compréhension de séquences vidéo s'améliore, notamment pour le suivi d'objets et la description d'événements successifs.",
    body: [
      'Les modèles capables de traiter texte, image et son résument désormais des vidéos de plusieurs minutes en conservant l’ordre des événements. Les cas d’usage vont de l’accessibilité à l’analyse de contenus pédagogiques.',
      'Les limites persistent sur les scènes ambiguës et les détails fins. Les évaluateurs insistent sur la nécessité de jeux de test variés et annotés par des humains.',
    ],
    category: 'models',
    tags: ['multimodal', 'vidéo', 'vision'],
    source: 'Rédaction Nous',
    publishedAt: '2026-09-15T08:00:00Z',
    readingMinutes: 4,
  },

  // ───────────── Recherche ─────────────
  {
    id: 'art-004',
    slug: 'interpretabilite-circuits-internes',
    title: "L'interprétabilité mécaniste cartographie de nouveaux circuits internes",
    summary:
      'Des chercheurs identifient des groupes de neurones associés à des comportements précis, ouvrant la voie à des audits plus fins.',
    body: [
      'Les travaux d’interprétabilité décrivent des circuits récurrents qui expliquent comment un modèle combine des informations dispersées dans un texte. Ces cartographies aident à comprendre pourquoi certaines erreurs se produisent.',
      'L’approche reste coûteuse et difficile à généraliser. Elle complète cependant les évaluations classiques en offrant une lecture causale des comportements observés.',
    ],
    category: 'research',
    tags: ['interprétabilité', 'sécurité', 'recherche'],
    source: 'Rédaction Nous',
    publishedAt: '2026-10-04T08:00:00Z',
    readingMinutes: 5,
  },
  {
    id: 'art-005',
    slug: 'donnees-synthetiques-entrainement',
    title: "Les données synthétiques changent la recette d'entraînement",
    summary:
      'Générer des exemples contrôlés permet de couvrir des cas rares, à condition de surveiller la diversité et les biais introduits.',
    body: [
      'Les équipes utilisent des données synthétiques pour renforcer les cas rares, comme les erreurs de format ou les situations limites. Ces exemples sont filtrés puis mélangés à des données réelles.',
      'Le risque principal est l’appauvrissement de la diversité. Des métriques de couverture et des revues humaines par échantillonnage servent de garde-fous.',
    ],
    category: 'research',
    tags: ['données', 'synthétique', 'entraînement'],
    source: 'Rédaction Nous',
    publishedAt: '2026-09-24T08:00:00Z',
    readingMinutes: 3,
  },
  {
    id: 'art-006',
    slug: 'evaluation-contamination-benchmarks',
    title: 'Contamination des benchmarks : vers des évaluations plus robustes',
    summary:
      'Quand les jeux de test fuient dans les données d’entraînement, les scores perdent leur sens. Les évaluations dynamiques gagnent du terrain.',
    body: [
      'La contamination des benchmarks fausse la comparaison entre modèles. Pour y remédier, les chercheurs renouvellent régulièrement les questions et gardent une partie des jeux de test secrète.',
      'Les évaluations dynamiques, générées à la volée, réduisent ce risque mais compliquent la reproductibilité. Un compromis consiste à publier la méthode de génération et des graines fixes.',
    ],
    category: 'research',
    tags: ['benchmarks', 'évaluation', 'qualité'],
    source: 'Rédaction Nous',
    publishedAt: '2026-09-12T08:00:00Z',
    readingMinutes: 4,
  },

  // ───────────── Open source ─────────────
  {
    id: 'art-007',
    slug: 'poids-ouverts-licences-usage',
    title: "Poids ouverts : les licences d'usage se précisent",
    summary:
      'Les licences associées aux modèles à poids ouverts clarifient les usages commerciaux, la redistribution et les restrictions de sécurité.',
    body: [
      'Les nouvelles licences distinguent plus nettement la recherche, l’usage commercial et la redistribution des modèles dérivés. Les juristes conseillent de lire attentivement les clauses sur les cas d’usage interdits.',
      'Pour les équipes produit, ce cadre simplifie les choix techniques mais impose un suivi des versions. Un inventaire des modèles utilisés devient une bonne pratique.',
    ],
    category: 'open-source',
    tags: ['licences', 'poids ouverts', 'communauté'],
    source: 'Rédaction Nous',
    publishedAt: '2026-10-05T08:00:00Z',
    readingMinutes: 3,
  },
  {
    id: 'art-008',
    slug: 'inference-locale-materiel-grand-public',
    title: "L'inférence locale devient viable sur du matériel grand public",
    summary:
      'La quantification et des runtimes optimisés permettent d’exécuter des modèles utiles sur un ordinateur portable récent.',
    body: [
      'Grâce à la quantification, des modèles de taille moyenne tournent désormais sur des machines grand public avec une latence acceptable. Cela ouvre la voie à des usages hors ligne et plus respectueux de la vie privée.',
      'Les compromis restent réels : qualité légèrement réduite, mémoire limitée et consommation énergétique à surveiller. Les développeurs testent systématiquement plusieurs niveaux de quantification.',
    ],
    category: 'open-source',
    tags: ['inférence locale', 'quantification', 'matériel'],
    source: 'Rédaction Nous',
    publishedAt: '2026-09-26T08:00:00Z',
    readingMinutes: 4,
  },
  {
    id: 'art-009',
    slug: 'outils-evaluation-ouverts',
    title: "Des outils d'évaluation ouverts pour comparer les modèles",
    summary:
      'Des bibliothèques communautaires standardisent la mesure des performances afin de rendre les comparaisons reproductibles.',
    body: [
      'Les boîtes à outils d’évaluation ouvertes fournissent des protocoles communs pour mesurer la précision, la robustesse et la sécurité. Elles facilitent la comparaison entre versions d’un même modèle.',
      'La contribution de la communauté est essentielle : chaque nouveau cas de test enrichit la couverture. Les mainteneurs demandent toutefois une documentation claire de la provenance des données.',
    ],
    category: 'open-source',
    tags: ['évaluation', 'outils', 'communauté'],
    source: 'Rédaction Nous',
    publishedAt: '2026-09-13T08:00:00Z',
    readingMinutes: 3,
  },

  // ───────────── Régulation ─────────────
  {
    id: 'art-010',
    slug: 'transparence-systemes-ia-europe',
    title: "Transparence des systèmes d'IA : les obligations se précisent en Europe",
    summary:
      'Les exigences de documentation et d’information des utilisateurs deviennent plus concrètes pour les fournisseurs de systèmes d’IA.',
    body: [
      'Les fournisseurs doivent mieux documenter les capacités et les limites de leurs systèmes. Les lignes directrices détaillent les informations à fournir aux utilisateurs et aux autorités.',
      'Les entreprises préparent des registres internes et des procédures de revue. Les juristes soulignent l’importance d’une traçabilité claire des décisions de conception.',
    ],
    category: 'policy',
    tags: ['europe', 'conformité', 'transparence'],
    source: 'Rédaction Nous',
    publishedAt: '2026-10-03T08:00:00Z',
    readingMinutes: 4,
  },
  {
    id: 'art-011',
    slug: 'audits-independants-modeles-avances',
    title: 'Les audits indépendants des modèles avancés gagnent du terrain',
    summary:
      'Évaluateurs externes, tests d’intrusion et protocoles partagés : la vérification indépendante s’installe dans les pratiques.',
    body: [
      'Les audits indépendants complètent les évaluations internes en apportant un regard extérieur sur les risques. Ils s’appuient sur des protocoles partagés et des accès encadrés aux modèles.',
      'Le défi est de garantir la qualité et l’indépendance des auditeurs. Des référentiels de compétences et des codes de conduite sont en cours d’élaboration.',
    ],
    category: 'policy',
    tags: ['audit', 'sécurité', 'gouvernance'],
    source: 'Rédaction Nous',
    publishedAt: '2026-09-22T08:00:00Z',
    readingMinutes: 3,
  },
  {
    id: 'art-012',
    slug: 'droit-auteur-donnees-entrainement',
    title: "Droit d'auteur et données d'entraînement : les pratiques d'attribution évoluent",
    summary:
      'Éditeurs et développeurs expérimentent de nouveaux mécanismes de licence et de traçabilité pour les contenus utilisés à l’entraînement.',
    body: [
      'Les accords de licence entre éditeurs et fournisseurs de modèles se multiplient. Ils prévoient souvent des mécanismes de traçabilité et des conditions d’usage explicites.',
      'Les juristes rappellent que le cadre reste en évolution selon les pays. Les équipes documentent l’origine des jeux de données pour anticiper les exigences futures.',
    ],
    category: 'policy',
    tags: ["droit d'auteur", 'données', 'licences'],
    source: 'Rédaction Nous',
    publishedAt: '2026-09-11T08:00:00Z',
    readingMinutes: 4,
  },

  // ───────────── Business ─────────────
  {
    id: 'art-013',
    slug: 'adoption-entreprise-ia-generative',
    title: "L'adoption de l'IA générative en entreprise passe de l'expérimentation à la production",
    summary:
      'Les projets pilotes se transforment en services durables, avec des exigences accrues de qualité, de sécurité et de mesure d’impact.',
    body: [
      'Les entreprises déplacent leurs projets d’IA générative vers la production. Elles investissent dans l’évaluation continue, la gestion des accès et la formation des équipes.',
      'Le retour sur investissement dépend de cas d’usage ciblés et de métriques claires. Les directions demandent des indicateurs avant d’étendre les déploiements.',
    ],
    category: 'business',
    tags: ['entreprise', 'adoption', 'productivité'],
    source: 'Rédaction Nous',
    publishedAt: '2026-10-02T08:00:00Z',
    readingMinutes: 4,
  },
  {
    id: 'art-014',
    slug: 'cout-inference-baisse',
    title: "Le coût de l'inférence continue de baisser",
    summary:
      'Optimisations logicielles, puces spécialisées et modèles plus compacts réduisent le coût par requête.',
    body: [
      'Le coût par requête diminue grâce à des optimisations de serveurs, au traitement par lots et à des modèles distillés. Les fournisseurs répercutent progressivement ces gains sur leurs tarifs.',
      'Cette baisse élargit les usages, mais les volumes augmentent aussi. Les équipes surveillent donc le coût total plutôt que le prix unitaire.',
    ],
    category: 'business',
    tags: ['coût', 'inférence', 'infrastructure'],
    source: 'Rédaction Nous',
    publishedAt: '2026-09-27T08:00:00Z',
    readingMinutes: 3,
  },
  {
    id: 'art-015',
    slug: 'startups-ia-verticale',
    title: "Les startups d'IA verticale ciblent les métiers réglementés",
    summary:
      'Santé, finance, juridique : des jeunes pousses spécialisent leurs produits pour répondre à des exigences de conformité strictes.',
    body: [
      'Les startups verticales misent sur une connaissance fine d’un métier et de ses contraintes réglementaires. Elles intègrent la conformité dès la conception de leurs produits.',
      'La différenciation repose sur les données propriétaires et l’intégration aux outils existants. Les investisseurs examinent la capacité à démontrer la fiabilité en conditions réelles.',
    ],
    category: 'business',
    tags: ['startups', 'vertical', 'santé'],
    source: 'Rédaction Nous',
    publishedAt: '2026-09-14T08:00:00Z',
    readingMinutes: 4,
  },

  // ───────────── Agents IA ─────────────
  {
    id: 'art-016',
    slug: 'agents-outils-protocoles-ouverts',
    title: "Les agents s'appuient sur des protocoles ouverts pour appeler des outils",
    summary:
      'Des protocoles communs simplifient la connexion des agents à des services externes, avec des contrôles d’accès plus clairs.',
    body: [
      'Les protocoles d’appel d’outils permettent à un agent de se connecter à des services variés sans intégration sur mesure. Les développeurs y gagnent en rapidité et en interopérabilité.',
      'La sécurité reste centrale : chaque outil doit déclarer précisément ses permissions. Les équipes ajoutent des validations humaines pour les actions sensibles.',
    ],
    category: 'agents',
    tags: ['agents', 'outils', 'protocoles'],
    source: 'Rédaction Nous',
    publishedAt: '2026-10-01T08:00:00Z',
    readingMinutes: 4,
  },
  {
    id: 'art-017',
    slug: 'agents-codage-revue-humaine',
    title: 'Agents de codage : la revue humaine reste le point de contrôle clé',
    summary:
      'Les agents rédigent et testent du code, mais les équipes maintiennent une revue humaine systématique avant fusion.',
    body: [
      'Les agents de codage produisent des modifications et exécutent des tests, ce qui accélère les cycles de développement. Les équipes les utilisent surtout pour les tâches répétitives et bien délimitées.',
      'La revue humaine demeure le garde-fou principal : elle vérifie l’intention, la sécurité et la maintenabilité. Des tests automatisés solides conditionnent la confiance dans les contributions de l’agent.',
    ],
    category: 'agents',
    tags: ['codage', 'revue de code', 'qualité'],
    source: 'Rédaction Nous',
    publishedAt: '2026-09-25T08:00:00Z',
    readingMinutes: 4,
  },
  {
    id: 'art-018',
    slug: 'evaluation-agents-parcours-longs',
    title: 'Évaluer un agent sur des parcours longs : métriques et pièges',
    summary: 'Mesurer la réussite d’un agent exige de suivre chaque étape, pas seulement le résultat final.',
    body: [
      'Évaluer un agent suppose de définir des scénarios réalistes et des critères de réussite observables. Les équipes mesurent le taux de réussite, le nombre d’étapes et le coût total d’un parcours.',
      'Les pièges courants incluent les scénarios trop faciles et la variabilité des réponses. Répéter chaque scénario plusieurs fois permet d’estimer la stabilité du comportement.',
    ],
    category: 'agents',
    tags: ['évaluation', 'agents', 'métriques'],
    source: 'Rédaction Nous',
    publishedAt: '2026-09-16T08:00:00Z',
    readingMinutes: 4,
  },
];
