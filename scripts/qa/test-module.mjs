#!/usr/bin/env node
/**
 * Exécute tous les tests d'un module, tous niveaux confondus.
 *
 *   npm run test:module -- articles
 *   npm run test:module -- search --api
 *   npm run test:module -- newsletter --e2e --mobile
 *
 * Convention de dossiers : tests/{unit,api,e2e}/<module>/
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const MODULES = ['articles', 'search', 'topics', 'newsletter', 'bookmarks', 'platform', 'data'];

const args = process.argv.slice(2);
const moduleName = args.find((arg) => !arg.startsWith('--'));
const flags = new Set(args.filter((arg) => arg.startsWith('--')));

if (!moduleName || !MODULES.includes(moduleName)) {
  console.error(`Usage : npm run test:module -- <module> [--unit] [--api] [--e2e] [--mobile]`);
  console.error(`Modules : ${MODULES.join(', ')}`);
  process.exit(2);
}

const all = !flags.has('--unit') && !flags.has('--api') && !flags.has('--e2e');
const steps = [];

if ((all || flags.has('--unit')) && existsSync(`tests/unit/${moduleName}`)) {
  steps.push(['npx', ['vitest', 'run', `tests/unit/${moduleName}`]]);
}
if ((all || flags.has('--api')) && existsSync(`tests/api/${moduleName}`)) {
  steps.push(['npx', ['playwright', 'test', '--project=api', `tests/api/${moduleName}`]]);
}
if ((all || flags.has('--e2e')) && existsSync(`tests/e2e/${moduleName}`)) {
  const projects = ['--project=e2e-desktop', ...(flags.has('--mobile') ? ['--project=e2e-mobile'] : [])];
  steps.push(['npx', ['playwright', 'test', ...projects, `tests/e2e/${moduleName}`]]);
}

if (steps.length === 0) {
  console.error(`Aucun test pour le module « ${moduleName} » avec ces options.`);
  process.exit(2);
}

let failed = false;
for (const [command, commandArgs] of steps) {
  console.log(`\n▶ ${command} ${commandArgs.join(' ')}`);
  const result = spawnSync(command, commandArgs, { stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.status !== 0) failed = true;
}
process.exit(failed ? 1 : 0);
