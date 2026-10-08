import { describe, expect, it } from 'vitest';
import {
  BOOKMARKS_KEY,
  MAX_BOOKMARKS,
  isBookmarked,
  readBookmarks,
  toggleBookmark,
  writeBookmarks,
  type KeyValueStorage,
} from '@/modules/bookmarks/storage';
import { createFakeStorage } from '../../support/fakeStorage';

describe('[REQ-BKM-01] toggleBookmark — transitions d’état', () => {
  it('non favori → favori → non favori → favori', () => {
    const storage = createFakeStorage();
    expect(isBookmarked(storage, 'a')).toBe(false);

    expect(toggleBookmark(storage, 'a')).toEqual({ bookmarked: true, slugs: ['a'] });
    expect(isBookmarked(storage, 'a')).toBe(true);

    expect(toggleBookmark(storage, 'a')).toEqual({ bookmarked: false, slugs: [] });
    expect(isBookmarked(storage, 'a')).toBe(false);

    expect(toggleBookmark(storage, 'a').bookmarked).toBe(true);
  });

  it('insère le dernier ajout en tête (plus récent d’abord)', () => {
    const storage = createFakeStorage();
    toggleBookmark(storage, 'a');
    toggleBookmark(storage, 'b');
    toggleBookmark(storage, 'c');
    expect(readBookmarks(storage)).toEqual(['c', 'b', 'a']);
  });

  it('retirer un favori n’affecte pas les autres', () => {
    const storage = createFakeStorage();
    ['a', 'b', 'c'].forEach((slug) => toggleBookmark(storage, slug));
    toggleBookmark(storage, 'b');
    expect(readBookmarks(storage)).toEqual(['c', 'a']);
  });

  it('persiste dans le stockage sous la clé versionnée', () => {
    const storage = createFakeStorage();
    toggleBookmark(storage, 'a');
    expect(JSON.parse(storage.data.get(BOOKMARKS_KEY)!)).toEqual(['a']);
  });
});

describe('[REQ-BKM-01] limite de capacité — analyse des valeurs limites', () => {
  it('conserve MAX_BOOKMARKS éléments et évince le plus ancien au-delà', () => {
    const storage = createFakeStorage();
    for (let i = 1; i <= MAX_BOOKMARKS; i++) toggleBookmark(storage, `slug-${i}`);
    expect(readBookmarks(storage)).toHaveLength(MAX_BOOKMARKS);

    toggleBookmark(storage, 'slug-nouveau');
    const after = readBookmarks(storage);
    expect(after).toHaveLength(MAX_BOOKMARKS);
    expect(after[0]).toBe('slug-nouveau');
    expect(after).not.toContain('slug-1'); // le plus ancien a été évincé
    expect(after).toContain('slug-2');
  });
});

describe('[REQ-BKM-03] readBookmarks — résilience aux données corrompues', () => {
  it.each([
    ['clé absente', undefined],
    ['chaîne vide', ''],
    ['JSON invalide', '{pas du json'],
    ['objet au lieu d’une liste', '{"a":1}'],
    ['chaîne JSON', '"texte"'],
    ['null', 'null'],
    ['nombre', '42'],
  ])('%s → liste vide, sans exception', (_label, raw) => {
    const storage = createFakeStorage(raw === undefined ? {} : { [BOOKMARKS_KEY]: raw });
    expect(readBookmarks(storage)).toEqual([]);
  });

  it('filtre les éléments non conformes et conserve les valides', () => {
    const storage = createFakeStorage({ [BOOKMARKS_KEY]: JSON.stringify(['ok', 1, null, '', {}, ['x'], 'ok-2', true]) });
    expect(readBookmarks(storage)).toEqual(['ok', 'ok-2']);
  });

  it('dédoublonne en conservant la première occurrence', () => {
    const storage = createFakeStorage({ [BOOKMARKS_KEY]: JSON.stringify(['a', 'b', 'a', 'c', 'b']) });
    expect(readBookmarks(storage)).toEqual(['a', 'b', 'c']);
  });

  it('rejette un slug démesuré (> 200 caractères)', () => {
    const storage = createFakeStorage({ [BOOKMARKS_KEY]: JSON.stringify(['a'.repeat(200), 'a'.repeat(201)]) });
    expect(readBookmarks(storage)).toEqual(['a'.repeat(200)]);
  });

  it('tronque une liste dépassant la capacité', () => {
    const storage = createFakeStorage({
      [BOOKMARKS_KEY]: JSON.stringify(Array.from({ length: MAX_BOOKMARKS + 25 }, (_, i) => `s${i}`)),
    });
    expect(readBookmarks(storage)).toHaveLength(MAX_BOOKMARKS);
  });

  it('un toggle sur données corrompues repart d’une base saine', () => {
    const storage = createFakeStorage({ [BOOKMARKS_KEY]: '{corrompu' });
    expect(toggleBookmark(storage, 'a')).toEqual({ bookmarked: true, slugs: ['a'] });
  });
});

describe('[REQ-BKM-03] stockage défaillant', () => {
  it('getItem qui lève une exception → liste vide', () => {
    const broken: KeyValueStorage = {
      getItem: () => {
        throw new Error('SecurityError');
      },
      setItem: () => undefined,
    };
    expect(readBookmarks(broken)).toEqual([]);
  });

  it('setItem qui lève une exception (quota) → pas d’exception propagée', () => {
    const full: KeyValueStorage = {
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
    };
    expect(() => writeBookmarks(full, ['a'])).not.toThrow();
    expect(toggleBookmark(full, 'a')).toEqual({ bookmarked: true, slugs: ['a'] });
  });
});
