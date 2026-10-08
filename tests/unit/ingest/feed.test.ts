import { describe, expect, it } from 'vitest';
import { decodeEntities, parseFeed, toPlainText } from '@/modules/ingest/feed';

const RSS = `<?xml version="1.0"?><rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/"><channel>
<item><title><![CDATA[Un modèle &amp; ses limites]]></title><link>https://exemple.fr/a?utm_source=x</link>
<description><![CDATA[<p>Résumé <b>riche</b> &amp; utile</p>]]></description><pubDate>Mon, 06 Oct 2026 08:00:00 GMT</pubDate></item>
<item><title>Second</title><link>https://exemple.fr/b</link><description>&lt;p&gt;Encodé&lt;/p&gt;</description><pubDate>Tue, 07 Oct 2026 08:00:00 GMT</pubDate></item>
</channel></rss>`;

const ATOM = `<feed xmlns="http://www.w3.org/2005/Atom"><entry><title>Entrée Atom</title>
<link rel="self" href="https://exemple.fr/self"/><link rel="alternate" href="https://exemple.fr/atom-1"/>
<summary>Texte atom</summary><updated>2026-10-05T10:00:00Z</updated></entry></feed>`;

describe('[REQ-ING-01] parseFeed', () => {
  it('lit les éléments RSS, y compris CDATA et entités', () => {
    const items = parseFeed(RSS);
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({ title: 'Un modèle & ses limites', link: 'https://exemple.fr/a?utm_source=x', summary: 'Résumé riche & utile' });
  });

  it('retire le HTML même lorsqu’il est encodé en entités', () => {
    expect(parseFeed(RSS)[1]?.summary).toBe('Encodé');
  });

  it('lit les entrées Atom et préfère le lien « alternate »', () => {
    const [entry] = parseFeed(ATOM);
    expect(entry).toMatchObject({ title: 'Entrée Atom', link: 'https://exemple.fr/atom-1', summary: 'Texte atom', published: '2026-10-05T10:00:00Z' });
  });

  it.each([['chaîne vide', ''], ['texte quelconque', 'pas du XML'], ['HTML', '<html><body>403</body></html>']])(
    'ne produit aucun élément pour : %s',
    (_label, input) => {
      expect(parseFeed(input)).toEqual([]);
    },
  );

  it('ne plante pas sur un XML tronqué', () => {
    expect(parseFeed('<rss><channel><item><title>Coupé')).toEqual([]);
  });
});

describe('[REQ-ING-01] decodeEntities / toPlainText', () => {
  it('décode entités nommées, décimales et hexadécimales', () => {
    expect(decodeEntities('a&nbsp;b &#233; &#xE9; &hellip; &inconnue;')).toBe('a b é é … &inconnue;');
  });

  it('laisse intact un point de code invalide', () => {
    expect(decodeEntities('&#99999999;')).toBe('&#99999999;');
  });

  it('retire script et style avec leur contenu', () => {
    expect(toPlainText('<style>.a{}</style>Bonjour<script>alert(1)</script> monde')).toBe('Bonjour monde');
  });
});
