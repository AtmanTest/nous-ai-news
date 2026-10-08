import type { KeyValueStorage } from '@/modules/bookmarks/storage';

export interface FakeStorage extends KeyValueStorage {
  data: Map<string, string>;
}

export function createFakeStorage(initial: Record<string, string> = {}): FakeStorage {
  const data = new Map<string, string>(Object.entries(initial));
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
  };
}
