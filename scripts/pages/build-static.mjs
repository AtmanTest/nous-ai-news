#!/usr/bin/env node
// Construit la version statique (GitHub Pages) dans ./dist-pages.
// Principe : copie du projet dans .pages-build/, retrait des routes serveur (API),
// application de l'overlay (pagination, recherche et flux côté statique), puis `next build` en mode export.
import { cpSync, rmSync, mkdirSync, writeFileSync, readFileSync, readdirSync, statSync, symlinkSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = resolve(import.meta.dirname, '..', '..');
const work = join(root, '.pages-build');
const out = join(root, 'dist-pages');
const repo = process.env.PAGES_BASE_PATH ?? '/nous-ai-news';
const origin = process.env.SITE_ORIGIN ?? 'https://atmantest.github.io';

rmSync(work, { recursive: true, force: true });
rmSync(out, { recursive: true, force: true });
mkdirSync(work, { recursive: true });

cpSync(join(root, 'src'), join(work, 'src'), { recursive: true });
for (const f of ['tsconfig.json', 'tailwind.config.ts', 'postcss.config.mjs', 'package.json', '.eslintrc.json']) {
  cpSync(join(root, f), join(work, f));
}
symlinkSync(join(root, 'node_modules'), join(work, 'node_modules'), 'dir');

// Routes serveur retirées.
rmSync(join(work, 'src/app/api'), { recursive: true, force: true });
cpSync(join(root, 'scripts/pages/overlay/src'), join(work, 'src'), { recursive: true });

// force-dynamic → force-static + paramètres statiques.
const walk = (d) => readdirSync(d).flatMap((n) => {
  const p = join(d, n);
  return statSync(p).isDirectory() ? walk(p) : [p];
});
for (const file of walk(join(work, 'src/app')).filter((f) => /page\.tsx$/.test(f))) {
  let s = readFileSync(file, 'utf8');
  s = s.replace("export const dynamic = 'force-dynamic';", "export const dynamic = 'force-static';");
  if (file.includes('articles/[slug]')) {
    s = "import { ARTICLES as __A } from '@/modules/articles/data';\nexport const dynamicParams = false;\nexport function generateStaticParams() { return __A.map((a) => ({ slug: a.slug })); }\n" + s;
  }
  if (file.includes('topics/[slug]')) {
    s = "import { TOPICS as __T } from '@/modules/topics/topics';\nexport const dynamicParams = false;\nexport function generateStaticParams() { return __T.map((t) => ({ slug: t.slug })); }\n" + s;
  }
  writeFileSync(file, s);
}

writeFileSync(join(work, 'next.config.mjs'), `export default {
  output: 'export',
  basePath: '${repo}',
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
};
`);

const env = { ...process.env, NEXT_PUBLIC_BASE_PATH: repo, SITE_ORIGIN: origin, NEXT_TELEMETRY_DISABLED: '1' };
const r = spawnSync('npx', ['next', 'build'], { cwd: work, env, stdio: 'inherit' });
if (r.status !== 0) process.exit(r.status ?? 1);

if (!existsSync(join(work, 'out'))) throw new Error('Export introuvable');
cpSync(join(work, 'out'), out, { recursive: true });
writeFileSync(join(out, '.nojekyll'), '');
rmSync(work, { recursive: true, force: true });
console.log(`✔ Site statique prêt dans dist-pages/ (base ${repo})`);
