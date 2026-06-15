1|import Link from 'next/link';
2|import { TrendingUp, Hash, Newspaper, ExternalLink, Sparkles, Zap, Brain, Cpu, Image, Palette, BookOpen } from 'lucide-react';
3|import { createAdminClient } from '@/lib/supabase/server';
4|import { TopicPills } from '@/components/news/TopicPills';
5|import { Badge } from '@/components/ui/badge';
6|import { timeAgo, readingTime } from '@/lib/utils';
7|import { LiveUpdateBar } from '@/components/news/LiveUpdateBar';
8|import { RefreshButton } from '@/components/news/RefreshButton';
9|import { FilteredFeed } from '@/components/news/FilteredFeed';
10|
11|const PAGE_SIZE = 12;
12|
13|interface Article {
14|  id: string;
15|  title: string;
16|  summary: string | null;
17|  image_url: string | null;
18|  source_name: string;
19|  category: string | null;
20|  tags: string[];
21|  published_at: string;
22|  score: number;
23|  is_breaking: boolean;
24|  content: string | null;
25|  language: string | null;
26|}
27|
28|// AI-relevant categories — EXCLUDE noise categories (general, community, media)
29|const AI_CATEGORIES = [
30|  'models', 'research', 'business', 'policy', 'hardware', 'agents',
31|  'open-source', 'startups', 'safety', 'ethics', 'applications',
32|];
33|
34|// Sources to explicitly exclude (noisy, non-news, or low-signal)
35|const EXCLUDED_SOURCES = [
36|  'Hacker News',
37|  'Product Hunt AI',
38|  'Springer AI Research', // academic papers, not news
39|];
40|
41|const EXCLUDED_CATEGORIES = [
42|  'general',
43|  'community',
44|  'media',
45|];
46|
47|async function getArticles() {
48|  try {
49|    const supabase = await createAdminClient();
50|    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
51|
52|    // Base query: AI categories only, exclude noise sources/categories
53|    const baseQuery = supabase
54|      .from('articles')
55|      .select('id, title, summary, image_url, source_name, category, tags, published_at, score, is_breaking, content, language')
56|      .eq('status', 'published')
57|      .gte('published_at', sevenDaysAgo)
58|      .in('category', AI_CATEGORIES)
59|      .filter('source_name', 'not.in', `(${EXCLUDED_SOURCES.join(',')})`);
60|
61|    // Get articles with images for hero/featured
62|    const { data: featured } = await baseQuery
63|      .not('image_url', 'is', null)
64|      .order('score', { ascending: false })
65|      .order('published_at', { ascending: false })
66|      .limit(5);
67|
68|    // Get trending (high score, recent) - higher threshold for quality
69|    const { data: trending } = await baseQuery
70|      .gte('score', 40)
71|      .order('score', { ascending: false })
72|      .order('published_at', { ascending: false })
73|      .limit(10);
74|
75|    // Get latest
76|    const { data: latest } = await baseQuery
77|      .order('published_at', { ascending: false })
78|      .limit(PAGE_SIZE);
79|
80|    return {
81|      featured: (featured || []) as Article[],
82|      trending: (trending || []) as Article[],
83|      latest: (latest || []) as Article[],
84|    };
85|  } catch (err) {
86|    console.error('Failed to fetch articles:', err);
87|    return { featured: [], trending: [], latest: [] };
88|  }
89|}
90|
91|function categoryLabel(slug: string): string {
92|  const map: Record<string, string> = {
93|    models: 'AI Models',
94|    research: 'Research',
95|    business: 'Business',
96|    policy: 'Policy',
97|    'open-source': 'Open Source',
98|    startups: 'Startups',
99|    hardware: 'Hardware',
100|    agents: 'Agents',
101|  };
102|  return map[slug] || slug;
103|}
104|
105|export default async function HomePage() {
106|  let featured: Article[] = [];
107|  let trending: Article[] = [];
108|  let latest: Article[] = [];
109|  try {
110|    const data = await getArticles();
111|    featured = data.featured;
112|    trending = data.trending;
113|    latest = data.latest;
114|  } catch (err) {
115|    console.error('Fatal error in HomePage:', err);
116|  }
117|  const hasTrending = trending.length > 2;
118|
119|  // Show top 4 by score for hero
120|  const heroStories = featured.length >= 3 ? featured.slice(0, 4) : latest.slice(0, 4);
121|  const mainHero = heroStories[0];
122|  const sideHeroes = heroStories.slice(1, 4);
123|
124|  return (
125|    <div className="animate-fade-in">
126|      <LiveUpdateBar initialTimestamp={latest[0]?.published_at || new Date().toISOString()} />
127|      {/* ═══════════════════════════════════════
128|         AI FEATURES — Auto Evolve + DeepMind (TOP OF PAGE)
129|         ═══════════════════════════════════════ */}
130|      <section className="relative overflow-hidden">
131|        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
132|          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
133|            {/* Auto Evolve Card */}
134|            <div className="relative rounded-2xl bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5 border border-primary/20 p-5 sm:p-6 flex flex-col">
135|              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-from)_0%,_transparent_70%)] opacity-20" />
136|              <div className="flex flex-col gap-4">
137|                <div className="flex items-start gap-3 min-w-0">
138|                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shrink-0">
139|                    <Sparkles className="h-5 w-5 text-white" />
140|                  </div>
141|                  <div className="min-w-0">
142|                    <h2 className="text-lg sm:text-xl font-bold text-foreground truncate">Auto Evolve</h2>
143|                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Self-improving AI platform — tests, fixes, and ships autonomously while you sleep</p>
144|                  </div>
145|                </div>
146|                <div className="w-full sm:w-auto">
147|                  <Link
148|                    href="/auto-tune"
149|                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors w-full sm:w-auto"
150|                  >
151|                    <Zap className="h-3.5 w-3.5" />
152|                    View Engine
153|                    <ExternalLink className="h-3 w-3" />
154|                  </Link>
155|                </div>
156|              </div>
157|              <div className="mt-4 grid grid-cols-2 gap-2.5 pt-4 border-t border-border/20">
158|                <div className="flex items-center gap-1.5">
159|                  <Cpu className="h-3.5 w-3.5 text-blue-400" />
160|                  <span className="text-xs text-muted-foreground">Continuous CI/CD</span>
161|                </div>
162|                <div className="flex items-center gap-1.5">
163|                  <Brain className="h-3.5 w-3.5 text-purple-400" />
164|                  <span className="text-xs text-muted-foreground">LLM-Driven Bug Fixes</span>
165|                </div>
166|                <div className="flex items-center gap-1.5">
167|                  <Zap className="h-3.5 w-3.5 text-green-400" />
168|                  <span className="text-xs text-muted-foreground">Auto Test Generation</span>
169|                </div>
170|                <div className="flex items-center gap-1.5">
171|                  <Sparkles className="h-3.5 w-3.5 text-orange-400" />
172|                  <span className="text-xs text-muted-foreground">Weekly Feature Planning</span>
173|                </div>
174|              </div>
175|            </div>
176|
177|            {/* DeepMind Card */}
178|            <div className="relative rounded-2xl bg-gradient-to-br from-pink-500/5 via-purple-500/5 to-rose-500/5 border border-pink-500/20 p-5 sm:p-6 flex flex-col">
179|              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-from)_0%,_transparent_70%)] opacity-20" />
180|              <div className="flex flex-col gap-4">
181|                <div className="flex items-start gap-3 min-w-0">
182|                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-pink-500 via-purple-500 to-rose-500 flex items-center justify-center shrink-0">
183|                    <Brain className="h-5 w-5 text-white" />
184|                  </div>
185|                  <div className="min-w-0">
186|                    <h2 className="text-lg sm:text-xl font-bold text-foreground truncate">DeepMind</h2>
187|                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">AI philosopher reads world news (20min, BBC, Google) & writes luminous essays on humanity's future</p>
188|                  </div>
189|                </div>
190|                <div className="w-full sm:w-auto">
191|                  <Link
192|                    href="/ia-auto-news"
193|                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 text-white font-medium text-sm hover:from-pink-600 hover:to-rose-600 transition-all w-full sm:w-auto"
194|                  >
195|                    <Brain className="h-3.5 w-3.5" />
196|                    Read Essays
197|                    <ExternalLink className="h-3 w-3" />
198|                  </Link>
199|                </div>
200|              </div>
201|              <div className="mt-4 grid grid-cols-3 gap-2.5 pt-4 border-t border-border/20">
202|                <div className="flex items-center gap-1.5 col-span-1">
203|                  <Image className="h-3.5 w-3.5 text-cyan-400" />
204|                  <span className="text-xs text-muted-foreground">20 Minutes + BBC + Google</span>
205|                </div>
206|                <div className="flex items-center gap-1.5">
207|                  <BookOpen className="h-3.5 w-3.5 text-pink-400" />
208|                  <span className="text-xs text-muted-foreground">2-3 essays daily</span>
209|                </div>
210|                <div className="flex items-center gap-1.5">
211|                  <Palette className="h-3.5 w-3.5 text-purple-400" />
212|                  <span className="text-xs text-muted-foreground">DALL·E 3 images</span>
213|                </div>
214|              </div>
215|            </div>
216|          </div>
217|        </div>
218|      </section>
219|
220|      {/* ═══════════════════════════════════════
221|         HERO SECTION
222|         ═══════════════════════════════════════ */}
223|      {mainHero && (
224|        <section className="relative">
225|          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-6 sm:pb-8">
226|            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
227|              {/* Main hero — spans 2 cols */}
228|              <div className="lg:col-span-2">
229|                <Link
230|                  href={`/article/${mainHero.id}`}
231|                  className="group block relative rounded-xl overflow-hidden bg-card border border-border/40 h-full min-h-[320px] sm:min-h-[420px]"
232|                >
233|                  {/* Background image */}
234|                  <div className="absolute inset-0 bg-muted">
235|                    {mainHero.image_url ? (
236|                      <img
237|                        src={mainHero.image_url}
238|                        alt=""
239|                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
240|                      />
241|                    ) : (
242|                      <div className="w-full h-full bg-gradient-to-br from-primary/10 via-secondary/10 to-primary/5" />
243|                    )}
244|                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
245|                  </div>
246|
247|                  {/* Content overlay */}
248|                  <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8">
249|                    <div className="flex items-center gap-2 mb-3">
250|                      {mainHero.category && (
251|                        <Badge variant="secondary" className="bg-black/50 text-white border-0 text-[10px] uppercase tracking-wider">
252|                          {categoryLabel(mainHero.category)}
253|                        </Badge>
254|                      )}
255|                      {mainHero.is_breaking && (
256|                        <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider animate-pulse-soft">
257|                          Breaking
258|                        </span>
259|                      )}
260|                    </div>
261|                    <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight mb-2">
262|                      {mainHero.title}
263|                    </h1>
264|                    {mainHero.summary && (
265|                      <p className="text-sm text-white/70 line-clamp-2 max-w-2xl hidden sm:block">
266|                        {mainHero.summary}
267|                      </p>
268|                    )}
269|                    <div className="flex items-center gap-3 mt-3 text-xs text-white/50">
270|                      <span className="font-medium text-white/70">{mainHero.source_name}</span>
271|                      <span>·</span>
272|                      <span>{mainHero.published_at ? timeAgo(mainHero.published_at) : ''}</span>
273|                      <span>·</span>
274|                      <span>{readingTime(mainHero.content || mainHero.summary || mainHero.title)} min read</span>
275|                    </div>
276|                  </div>
277|                </Link>
278|              </div>
279|
280|              {/* Side stories */}
281|              <div className="flex flex-col gap-4">
282|                {sideHeroes.map((article) => (
283|                  <Link
284|                    key={article.id}
285|                    href={`/article/${article.id}`}
286|                    className="group relative flex-1 rounded-xl overflow-hidden bg-card border border-border/40 min-h-[140px] sm:min-h-[180px]"
287|                  >
288|                    <div className="absolute inset-0 bg-muted">
289|                      {article.image_url ? (
290|                        <img
291|                          src={article.image_url}
292|                          alt=""
293|                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
294|                        />
295|                      ) : (
296|                        <div className="w-full h-full bg-gradient-to-br from-primary/5 via-secondary/5 to-primary/10" />
297|                      )}
298|                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
299|                    </div>
300|                    <div className="absolute bottom-0 left-0 right-0 p-4">
301|                      <div className="flex items-center gap-1.5 mb-1.5">
302|                        {article.category && (
303|                          <span className="text-[10px] font-semibold text-white/60 uppercase tracking-wider">
304|                            {categoryLabel(article.category)}
305|                          </span>
306|                        )}
307|                      </div>
308|                      <h3 className="text-sm sm:text-base font-bold text-white leading-snug line-clamp-2 group-hover:text-white/90 transition-colors">
309|                        {article.title}
310|                      </h3>
311|                      <div className="text-[10px] text-white/50 mt-1">
312|                        {article.source_name} · {article.published_at ? timeAgo(article.published_at) : ''}
313|                      </div>
314|                    </div>
315|                  </Link>
316|                ))}
317|              </div>
318|            </div>
319|          </div>
320|        </section>
321|      )}
322|
323|      {/* ═══════════════════════════════════════
324|         TRENDING TICKER (below hero, full width)
325|         ═══════════════════════════════════════ */}
326|      {hasTrending && (
327|        <section className="border-y border-border/30 bg-muted/20">
328|          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
329|            <div className="flex items-center gap-3 mb-2">
330|              <TrendingUp className="h-4 w-4 text-primary" />
331|              <span className="text-xs font-semibold uppercase tracking-wider text-primary">Trending Now</span>
332|            </div>
333|            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
334|              {trending.slice(0, 8).map((article) => (
335|                <Link
336|                  key={article.id}
337|                  href={`/article/${article.id}`}
338|                  className="shrink-0 group flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-border/40 hover:border-primary/30 transition-colors text-xs"
339|                >
340|                  {article.image_url ? (
341|                    <img src={article.image_url} alt="" className="w-5 h-5 rounded-full object-cover" />
342|                  ) : (
343|                    <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[8px]">AI</span>
344|                  )}
345|                  <span className="font-medium text-foreground/80 group-hover:text-foreground truncate max-w-[180px] sm:max-w-[240px]">
346|                    {article.title}
347|                  </span>
348|                  {article.score && article.score > 70 && (
349|                    <span className="flex items-center gap-0.5 text-[10px] text-primary whitespace-nowrap">
350|                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
351|                      {article.score}
352|                    </span>
353|                  )}
354|                </Link>
355|              ))}
356|            </div>
357|          </div>
358|        </section>
359|      )}
360|
361|      {/* ═══════════════════════════════════════
362|         MAIN CONTENT — Latest feed
363|         ═══════════════════════════════════════ */}
364|      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
365|        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
366|          {/* Feed column */}
367|          <div className="lg:col-span-3">
368|            {/* Section header */}
369|            <div className="flex items-center justify-between mb-6">
370|              <div className="flex items-center gap-2">
371|                <Newspaper className="h-5 w-5 text-primary" />
372|                <h2 className="text-lg font-bold">Latest AI News</h2>
373|              </div>
374|              <div className="flex items-center gap-1">
375|                <RefreshButton />
376|              </div>
377|              <Link
378|                href="/trending"
379|                className="text-xs text-primary hover:underline inline-flex items-center gap-1"
380|              >
381|                View all <ExternalLink className="h-3 w-3" />
382|              </Link>
383|            </div>
384|
385|            {/* Featured grid — top 4 stories with images */}
386|            <FilteredFeed featured={featured} latest={[]} excludeIds={heroStories.slice(0, 4).map(a => a.id)} />
387|
388|            {/* Latest feed with load more */}
389|            <div className="mt-8">
390|              <div className="flex items-center gap-2 mb-4">
391|                <Newspaper className="h-4 w-4 text-primary" />
392|                <h3 className="text-sm font-semibold">Latest</h3>
393|              </div>
394|              <FilteredFeed featured={[]} latest={latest} excludeIds={heroStories.slice(0, 4).map(a => a.id)} showEmptyMessage={false} />
395|            </div>
396|          </div>
397|
398|          {/* Sidebar */}
399|          <aside className="hidden lg:block lg:col-span-1">
400|            <div className="sticky top-20 space-y-8">
401|              {/* Top Stories widget - PROMINENT, FIRST */}
402|              {trending.length > 0 && (
403|                <div className="bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 border border-primary/20 rounded-2xl p-5">
404|                  <div className="flex items-center gap-2 mb-4">
405|                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
406|                      <TrendingUp className="h-4 w-4 text-white" />
407|                    </div>
408|                    <h3 className="text-lg font-bold text-foreground">Top Stories</h3>
409|                  </div>
410|                  <div className="space-y-3">
411|                    {trending.slice(0, 6).map((article, i) => (
412|                      <Link
413|                        key={article.id}
414|                        href={`/article/${article.id}`}
415|                        className="group flex items-start gap-3 p-2 rounded-xl hover:bg-primary/5 transition-colors border border-transparent hover:border-primary/20"
416|                      >
417|                        <span className="text-base font-bold text-primary/60 shrink-0 w-7 leading-none">
418|                          {String(i + 1).padStart(2, '0')}
419|                        </span>
420|                        <div className="min-w-0">
421|                          <h4 className="text-sm font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-2">
422|                            {article.title}
423|                          </h4>
424|                          <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
425|                            <span className="font-medium">{article.source_name}</span>
426|                            <span>·</span>
427|                            <span>{article.published_at ? timeAgo(article.published_at) : ''}</span>
428|                            {article.score && article.score > 50 && (
429|                              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-primary/10 text-primary">
430|                                {article.score}
431|                              </span>
432|                            )}
433|                          </div>
434|                        </div>
435|                      </Link>
436|                    ))}
437|                  </div>
438|                </div>
439|              )}
440|
441|              {/* Topics widget - SECOND */}
442|              <div>
443|                <div className="flex items-center gap-2 mb-3">
444|                  <Hash className="h-4 w-4 text-primary" />
445|                  <h3 className="text-sm font-semibold">Topics</h3>
446|                </div>
447|                <TopicPills topics={[]} />
448|              </div>
449|
450|              {/* Source freshness note */}
451|              <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
452|                <p className="text-[11px] text-muted-foreground">
453|                  Data updated daily at 07:00 UTC via automated ingestion from 20+ AI news sources including OpenAI, Anthropic, Google DeepMind, Hugging Face, and more.
454|                </p>
455|              </div>
456|            </div>
457|          </aside>
458|        </div>
459|      </div>
460|    </div>
461|  );
462|}
463|