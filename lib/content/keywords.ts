/**
 * Extract meaningful keywords from article data.
 * Filters out stop words, short words, and noisy bigrams.
 */

const STOP_WORDS = new Set([
  'the','a','an','and','or','but','in','on','at','to','for','of','with','by',
  'from','as','is','was','are','were','be','been','being','have','has','had',
  'do','does','did','will','would','could','should','may','might','can','its',
  'it','this','that','these','those','we','you','they','he','she','all','each',
  'every','both','few','more','most','some','any','no','not','out','up','down',
  'about','after','before','between','through','during','without','within',
  'along','into','over','than','then','also','just','how','why','what','when',
  'where','who','which','their','them','our','your','new','latest','first',
  'next','last','here','there','way','into','off','done','via','now','one',
  'two','much','very','make','made','set','get','got','use','used','using',
  'says','said','see','seen','like','well','back','still','even','yet',
  'already','ever','never','other','another','such','only','own','same',
  'so','too','really','quite','rather','able','become','became','coming',
  'goes','went','going','takes','took','taking','given','gives','giving',
  'based','called','known','including','according','among','across',
  'many','those','though','while','since','until','whether','although',
  'because','once','per','around','under','above','below','part','full',
  'big','small','large','high','low','long','short','early','late',
  'open','close','best','top','world','global','launch','launched',
  'launches','announces','announced','announcement','releases','released',
  'release','introduces','introduced','unveils','unveiled','reveals','revealed',
  'report','reports','reported','study','studies','shows','showed','show',
  'plans','plan','planned','sets','set','setting','build','built','building',
  'create','created','creating','develop','developed','developing',
  'work','works','working','working','team','teams','company','companies',
]);

const MEANINGFUL_MIN_LENGTH = 3;

export function extractArticleKeywords(
  title: string,
  summary?: string | null,
  existingTags?: string[] | null
): string[] {
  const keywords = new Set<string>();

  // Add existing event tags and entity names (most valuable)
  if (existingTags) {
    for (const tag of existingTags) {
      const lower = tag.toLowerCase().trim();
      // Clean up noisy bigrams — keep short meaningful words
      if (lower.split(/\s+/).length <= 2 && lower.length >= MEANINGFUL_MIN_LENGTH) {
        keywords.add(lower);
      }
    }
  }

  // Extract meaningful single words from title
  const words = title.toLowerCase().split(/[\s,;:.!?()\[\]\/\\"'+]+/);
  for (const word of words) {
    if (
      word.length >= MEANINGFUL_MIN_LENGTH &&
      !STOP_WORDS.has(word) &&
      !/^\d+$/.test(word) && // pure numbers
      /^[a-z0-9#+.\-/]+$/.test(word) // alphanumeric with common symbols
    ) {
      keywords.add(word);
    }
  }

  // Extract meaningful words from summary
  if (summary) {
    const sumWords = summary.toLowerCase().split(/[\s,;:.!?()\[\]\/\\"'+]+/);
    for (const word of sumWords) {
      if (
        word.length >= 5 && // longer threshold for summary
        !STOP_WORDS.has(word) &&
        !/^\d+$/.test(word) &&
        /^[a-z0-9#+.\-/]+$/.test(word)
      ) {
        keywords.add(word);
      }
    }
  }

  return Array.from(keywords).slice(0, 15);
}

/**
 * Aggregate popular keywords across many articles.
 */
export function getPopularKeywords(
  articles: Array<{ title: string; summary?: string | null; tags?: string[] | null }>,
  limit: number = 50
): string[] {
  const freq = new Map<string, number>();

  for (const article of articles) {
    const kws = extractArticleKeywords(article.title, article.summary, article.tags);
    for (const kw of kws) {
      freq.set(kw, (freq.get(kw) || 0) + 1);
    }
  }

  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([kw]) => kw);
}
