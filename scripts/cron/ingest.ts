/**
 * Cron d'ingestion : lit content/sources.json, récupère les flux RSS/Atom, normalise,
 * fusionne dans content/ingested.json. Ne conserve que titre, court extrait et lien vers la source.
 *
 * Usage : npm run cron:ingest [-- --dry-run]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Article } from '../../src/modules/articles/types';
import { parseFeed } from '../../src/modules/ingest/feed';
import { DEFAULT_MERGE, mergeArticles } from '../../src/modules/ingest/merge';
import { normalizeItem, type Source } from '../../src/modules/ingest/normalize';

const root = resolve(__dirname, '..', '..');
const sourcesPath = resolve(root, 'content/sources.json');
const outputPath = resolve(root, 'content/ingested.json');
const dryRun = process.argv.includes('--dry-run');
const PER_SOURCE_LIMIT = 12;

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) NousAINews/2.0', Accept: 'application/rss+xml, application/atom+xml, text/xml, */*' },
    signal: AbortSignal.timeout(20_000),
    redirect: 'follow',
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}

async function main(): Promise<void> {
  const sources = JSON.parse(readFileSync(sourcesPath, 'utf8')) as Source[];
  const existing = JSON.parse(readFileSync(outputPath, 'utf8')) as Article[];
  const now = new Date();

  const results = await Promise.allSettled(
    sources.map(async (source) => {
      const items = parseFeed(await fetchText(source.url));
      const articles = items
        .map((item) => normalizeItem(item, source, { now }))
        .filter((a): a is Article => a !== null)
        .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1))
        .slice(0, PER_SOURCE_LIMIT);
      return { source, found: items.length, articles };
    }),
  );

  const incoming: Article[] = [];
  let failures = 0;
  results.forEach((result, index) => {
    const source = sources[index];
    if (!source) return;
    if (result.status === 'fulfilled') {
      incoming.push(...result.value.articles);
      console.log(`✔ ${source.name}: ${result.value.articles.length} retenus / ${result.value.found} lus`);
    } else {
      failures += 1;
      console.warn(`✘ ${source.name}: ${String(result.reason)}`);
    }
  });

  if (failures === sources.length) {
    console.error('Aucune source disponible : abandon sans modification.');
    process.exit(1);
  }

  const merged = mergeArticles(existing, incoming, { ...DEFAULT_MERGE, now });
  const added = merged.filter((a) => !existing.some((e) => e.id === a.id)).length;
  console.log(`\n${merged.length} articles au total (${added} nouveaux, ${failures} source(s) en échec).`);

  if (dryRun) return;
  const next = `${JSON.stringify(merged, null, 2)}\n`;
  if (next !== readFileSync(outputPath, 'utf8')) writeFileSync(outputPath, next);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
