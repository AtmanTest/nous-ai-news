#!/usr/bin/env node
/**
 * Génère un prompt structuré pour demander à un LLM de proposer des cas de test.
 * Aucun appel réseau : le script assemble seulement le contexte (exigence + technique ISTQB + garde-fous)
 * pour que le résultat soit reproductible, relu par un humain, puis tracé dans docs/qa/ai-assistance-log.md.
 *
 *   npm run qa:prompt -- --req SRC-02 --technique bva
 *   npm run qa:prompt -- --req NEW-02 --technique decision-table --out /tmp/prompt.md
 *   npm run qa:prompt -- --list
 */
import { readFileSync, writeFileSync } from 'node:fs';

const TECHNIQUES = {
  ep: {
    name: "Partitions d'équivalence (ISTQB, boîte noire)",
    instruction:
      "Identifie les partitions valides et invalides de chaque entrée. Propose UN représentant par partition. Précise la partition visée.",
  },
  bva: {
    name: 'Analyse des valeurs limites (ISTQB, boîte noire)',
    instruction:
      "Pour chaque entrée ordonnée, identifie les bornes min/max et teste la borne, borne−1 et borne+1 (valeurs limites à 3 valeurs). Indique la borne testée.",
  },
  'decision-table': {
    name: 'Table de décision (ISTQB, boîte noire)',
    instruction:
      "Liste les conditions et les actions, génère la table complète (2^n règles, puis fusionne les règles équivalentes), puis un cas de test par règle.",
  },
  'state-transition': {
    name: "Test de transitions d'état (ISTQB, boîte noire)",
    instruction:
      "Modélise les états, événements et transitions (y compris les transitions invalides). Propose des cas couvrant chaque transition valide et au moins une transition invalide.",
  },
  'error-guessing': {
    name: "Devinette d'erreurs (ISTQB, basée sur l'expérience)",
    instruction:
      "À partir de défauts classiques (entrées vides, unicode, injections, concurrence, données corrompues, réseau coupé), propose des cas ciblés. Justifie chaque cas par l'erreur pressentie.",
  },
  exploratory: {
    name: 'Tests exploratoires (ISTQB, basés sur l’expérience)',
    instruction:
      "Rédige 3 chartes d'exploration (mission, durée de 30–45 min, zones à explorer, heuristiques) au format : « Explorer <zone> avec <ressources> pour découvrir <information> ».",
  },
};

const args = process.argv.slice(2);
const option = (name) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : undefined;
};

const { requirements } = JSON.parse(readFileSync('docs/qa/requirements.json', 'utf8'));

if (args.includes('--list')) {
  console.log('Exigences :');
  for (const r of requirements) console.log(`  ${r.id}  [${r.module}]  ${r.title}`);
  console.log('\nTechniques :', Object.keys(TECHNIQUES).join(', '));
  process.exit(0);
}

const reqId = option('req');
const techniqueId = option('technique') ?? 'ep';
const requirement = requirements.find((r) => r.id === reqId);
const technique = TECHNIQUES[techniqueId];

if (!requirement || !technique) {
  console.error('Usage : npm run qa:prompt -- --req <ID> --technique <ep|bva|decision-table|state-transition|error-guessing|exploratory> [--out fichier]');
  console.error('Astuce : npm run qa:prompt -- --list');
  process.exit(2);
}

const score = requirement.likelihood * requirement.impact;
const prompt = `# Rôle
Tu es un analyste de test certifié ISTQB Foundation. Tu conçois des cas de test rigoureux, traçables et reproductibles.

# Contexte produit
Application web « Nous AI News » (Next.js 14, TypeScript). Contrat HTTP : réponses JSON \`{ data, meta }\` ; erreurs \`{ error: { code, message, details[] } }\`.
Données de démonstration fictives (18 articles, 6 thématiques). Aucune donnée personnelle réelle ne doit apparaître dans tes propositions.

# Exigence à tester
- Identifiant : REQ-${requirement.id} (module : ${requirement.module})
- Énoncé : ${requirement.title}
- Risque produit : probabilité ${requirement.likelihood} × impact ${requirement.impact} = ${score} → ${score >= 6 ? 'ÉLEVÉ' : score >= 3 ? 'MOYEN' : 'FAIBLE'}

# Technique de conception demandée
${technique.name}
${technique.instruction}

# Contraintes (garde-fous)
1. N'invente AUCUN comportement : si l'énoncé est ambigu, liste tes hypothèses dans une section « Questions / hypothèses » plutôt que de trancher.
2. Chaque cas de test doit être déterministe (pas de dépendance à l'heure, à l'ordre d'exécution ou à des données aléatoires non maîtrisées).
3. Indique pour chaque cas le niveau recommandé (unitaire / API / E2E) en privilégiant le niveau le plus bas qui détecte le défaut (pyramide de tests).
4. Ne génère pas de code ; produis uniquement les cas de test.

# Format de sortie (tableau Markdown)
| ID proposé | Technique / partition ou borne | Préconditions | Données d'entrée | Résultat attendu | Niveau | Priorité (risque) |
Termine par : « Questions / hypothèses » puis « Cas volontairement non couverts (avec justification) ».
`;

const out = option('out');
if (out) {
  writeFileSync(out, prompt);
  console.log(`Prompt écrit dans ${out}`);
} else {
  process.stdout.write(prompt);
}
