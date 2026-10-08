/**
 * Cron de contrôle des liens : vérifie les URL sources de content/ingested.json
 * et retire les articles dont le lien est définitivement mort (404 / 410).
 * Les erreurs temporaires (5xx, timeout, 403 anti-bot) ne provoquent aucune suppression.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Article } from '../../src/modules/articles/types';

const file = resolve(__dirname, '..', '..', 'content/ingested.json');
const dryRun = process.argv.includes('--dry-run');
const CONCURRENCY = 8;

async function status(url: string): Promise<number> {
  const init = { redirect: 'follow' as const, signal: AbortSignal.timeout(15_000), headers: { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) NousAINews/2.0' } };
  try {
    const head = await fetch(url, { ...init, method: 'HEAD' });
    if (head.status !== 405 && head.status !== 501) return head.status;
    return (await fetch(url, { ...init, method: 'GET' })).status;
  } catch {
    return 0;
  }
}

async function main(): Promise<void> {
  const articles = JSON.parse(readFileSync(file, 'utf8')) as Article[];
  const dead = new Set<string>();
  let cursor = 0;

  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (cursor < articles.length) {
        const article = articles[cursor++];
        if (!article?.sourceUrl) continue;
        const code = await status(article.sourceUrl);
        if (code === 404 || code === 410) {
          dead.add(article.id);
          console.warn(`✘ ${code} ${article.sourceUrl}`);
        }
      }
    }),
  );

  console.log(`${articles.length} liens contrôlés, ${dead.size} mort(s).`);
  if (dead.size > 0 && !dryRun) {
    writeFileSync(file, `${JSON.stringify(articles.filter((a) => !dead.has(a.id)), null, 2)}\n`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
