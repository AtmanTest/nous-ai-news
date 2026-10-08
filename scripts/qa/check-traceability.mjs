#!/usr/bin/env node
/**
 * Contrôle de traçabilité exigences → tests (porte qualité de la CI).
 *
 * Convention : chaque test (ou bloc describe pour les tests unitaires) référence ses exigences
 * avec un tag REQ-XXX-NN dans son titre, ex. « [REQ-SRC-02] » ou « @REQ-SRC-02 ».
 * Le niveau d'un test se déduit de son dossier : tests/unit, tests/api, tests/e2e.
 *
 * Échec (code 1) si :
 *  - un test référence une exigence inconnue (faute de frappe, exigence supprimée) ;
 *  - une exigence n'est couverte par aucun test ;
 *  - une exigence à risque ÉLEVÉ n'est couverte que sur un seul niveau, sans exemption motivée (exemptLevels).
 *
 * Option --write : régénère docs/qa/traceability-matrix.md (sortie déterministe, sans horodatage).
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const ROOT = process.cwd();
const LEVELS = ['unit', 'api', 'e2e'];
const MATRIX_PATH = 'docs/qa/traceability-matrix.md';

const { requirements } = JSON.parse(readFileSync(join(ROOT, 'docs/qa/requirements.json'), 'utf8'));

function riskLevel(requirement) {
  const score = requirement.likelihood * requirement.impact;
  return { score, label: score >= 6 ? 'ÉLEVÉ' : score >= 3 ? 'MOYEN' : 'FAIBLE' };
}

function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const counts = new Map(requirements.map((r) => [r.id, { unit: 0, api: 0, e2e: 0 }]));
const unknownRefs = [];

for (const file of walk(join(ROOT, 'tests')).filter((f) => /\.(test|spec)\.ts$/.test(f))) {
  const rel = relative(ROOT, file);
  const level = LEVELS.find((l) => rel.startsWith(`tests${sep}${l}${sep}`));
  if (!level) continue;
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    for (const match of line.matchAll(/REQ-([A-Z]{3}-\d{2})/g)) {
      const id = match[1];
      if (counts.has(id)) counts.get(id)[level] += 1;
      else unknownRefs.push(`${rel} → REQ-${id}`);
    }
  }
}

const errors = [];
for (const ref of unknownRefs) errors.push(`Exigence inconnue référencée : ${ref}`);

for (const requirement of requirements) {
  const c = counts.get(requirement.id);
  const total = c.unit + c.api + c.e2e;
  const levelsCovered = LEVELS.filter((l) => c[l] > 0).length;
  if (total === 0) {
    errors.push(`${requirement.id} : aucune référence de test.`);
  } else if (riskLevel(requirement).label === 'ÉLEVÉ' && levelsCovered < 2 && !requirement.exemptLevels) {
    errors.push(`${requirement.id} : risque ÉLEVÉ couvert sur un seul niveau (ajouter un niveau ou documenter exemptLevels).`);
  }
}

const rows = requirements.map((requirement) => {
  const c = counts.get(requirement.id);
  const risk = riskLevel(requirement);
  const levels = LEVELS.filter((l) => c[l] > 0).map((l) => l.toUpperCase()).join(' + ') || '—';
  return `| ${requirement.id} | ${requirement.module} | ${requirement.title} | ${risk.label} (${risk.score}) | ${c.unit} | ${c.api} | ${c.e2e} | ${levels} |`;
});

const matrix = `# Matrice de traçabilité exigences → tests

> Fichier **généré** par \`node scripts/qa/check-traceability.mjs --write\` — ne pas éditer à la main.
> La CI échoue si cette matrice n'est pas à jour, si une exigence n'est couverte par aucun test,
> ou si une exigence à risque ÉLEVÉ n'est couverte que sur un seul niveau (sauf exemption motivée dans \`requirements.json\`).

Les colonnes Unit / API / E2E comptent les **références** (\`REQ-XXX-NN\`) trouvées dans les titres de tests (ou de blocs \`describe\` pour Vitest).
Risque = probabilité × impact (échelle 1–3) : ≥ 6 ÉLEVÉ, 3–5 MOYEN, ≤ 2 FAIBLE (voir [risk-analysis.md](risk-analysis.md)).

| Exigence | Module | Description | Risque | Unit | API | E2E | Niveaux |
|---|---|---|---|---:|---:|---:|---|
${rows.join('\n')}
`;

if (process.argv.includes('--write')) {
  writeFileSync(join(ROOT, MATRIX_PATH), matrix);
  console.log(`✔ ${MATRIX_PATH} régénérée.`);
}

const covered = requirements.filter((r) => LEVELS.some((l) => counts.get(r.id)[l] > 0)).length;
console.log(`Traçabilité : ${covered}/${requirements.length} exigences couvertes.`);

if (errors.length > 0) {
  console.error(`\n✖ ${errors.length} problème(s) de traçabilité :`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}
console.log('✔ Traçabilité conforme.');
