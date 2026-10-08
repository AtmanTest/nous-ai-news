/** Analyse minimale de flux RSS 2.0 / Atom, sans dépendance. Tolère les CDATA et les entités HTML. */

export interface RawItem {
  title: string;
  link: string;
  summary: string;
  /** Date brute telle que lue dans le flux. */
  published: string;
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  hellip: '…',
  rsquo: '’',
  lsquo: '‘',
  rdquo: '”',
  ldquo: '“',
  ndash: '–',
  mdash: '—',
};

export function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
    if (entity.startsWith('#')) {
      const code = entity[1]?.toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : match;
    }
    return NAMED_ENTITIES[entity.toLowerCase()] ?? match;
  });
}

/** Retire balises, CDATA et entités ; normalise les espaces. */
export function toPlainText(html: string): string {
  const withoutCdata = html.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
  const decoded = decodeEntities(withoutCdata);
  // Les entités peuvent encoder du HTML (« &lt;p&gt; ») : on retire les balises après décodage.
  return decodeEntities(decoded.replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]*>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

function tagContent(block: string, names: string[]): string {
  for (const name of names) {
    const match = new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, 'i').exec(block);
    if (match?.[1] !== undefined) return match[1];
  }
  return '';
}

function atomLink(block: string): string {
  const links = Array.from(block.matchAll(/<link\b([^>]*)\/?>/gi));
  const alternate = links.find((m) => !/rel=["'](?!alternate)/i.test(m[1] ?? ''));
  const href = /href=["']([^"']+)["']/i.exec((alternate ?? links[0])?.[1] ?? '');
  return href?.[1] ?? '';
}

export function parseFeed(xml: string): RawItem[] {
  const blocks = [
    ...Array.from(xml.matchAll(/<item\b[\s\S]*?<\/item>/gi), (m) => m[0]),
    ...Array.from(xml.matchAll(/<entry\b[\s\S]*?<\/entry>/gi), (m) => m[0]),
  ];

  return blocks.map((block) => {
    const rssLink = toPlainText(tagContent(block, ['link']));
    return {
      title: toPlainText(tagContent(block, ['title'])),
      link: (rssLink.startsWith('http') ? rssLink : atomLink(block)).trim(),
      summary: toPlainText(tagContent(block, ['description', 'summary', 'content:encoded', 'content'])),
      published: toPlainText(tagContent(block, ['pubDate', 'published', 'updated', 'dc:date'])),
    };
  });
}
