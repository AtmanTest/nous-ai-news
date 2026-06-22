import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '../../..');

function read(relPath: string) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

describe('dashboard responsive widgets', () => {
  it('keeps the right panel and Trending Models visible from large desktop widths, not only maximized xl screens', () => {
    const source = read('components/layout/AppLayout.tsx');

    expect(source).toContain('hidden lg:block');
    expect(source).toContain('w-[300px] xl:w-[350px]');
    expect(source).not.toContain('hidden xl:block w-[350px]');
  });
});
