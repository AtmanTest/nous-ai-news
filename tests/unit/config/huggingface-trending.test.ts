import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '../../..');

function read(relPath: string) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

describe('Hugging Face Trending Models freshness', () => {
  it('does not sort Trending Models by all-time downloads because that returns stale 2022-era models', () => {
    const source = read('app/api/huggingface/trending/route.ts');

    expect(source).not.toContain('sort=downloads');
    expect(source).toMatch(/sort=(trending|lastModified|createdAt)/);
  });
});
