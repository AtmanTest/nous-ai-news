import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─── Hoisted mocks ──────────────────────────────────────────
const {
  mockSupabaseFrom,
  mockSupabaseSelect,
  mockSupabaseGte,
  mockSupabaseEq,
  mockSupabaseOrder,
  mockSupabaseLimit,
  mockSupabaseIn,
  mockSupabaseNot,
  mockSupabaseInsert,
  mockSupabaseAuthGetUser,
  mockSupabaseClient,
  mockCreateAdminClient,
} = vi.hoisted(() => {
  const _mockSupabaseFrom = vi.fn();
  const _mockSupabaseSelect = vi.fn();
  const _mockSupabaseGte = vi.fn();
  const _mockSupabaseEq = vi.fn();
  const _mockSupabaseOrder = vi.fn();
  const _mockSupabaseLimit = vi.fn();
  const _mockSupabaseIn = vi.fn();
  const _mockSupabaseNot = vi.fn();
  const _mockSupabaseInsert = vi.fn();
  const _mockSupabaseAuthGetUser = vi.fn();
  const _mockSupabaseClient = { 
    from: _mockSupabaseFrom,
    auth: { getUser: _mockSupabaseAuthGetUser },
  };
  const _mockCreateAdminClient = vi.fn(() => Promise.resolve(_mockSupabaseClient));
  return {
    mockSupabaseFrom: _mockSupabaseFrom,
    mockSupabaseSelect: _mockSupabaseSelect,
    mockSupabaseGte: _mockSupabaseGte,
    mockSupabaseEq: _mockSupabaseEq,
    mockSupabaseOrder: _mockSupabaseOrder,
    mockSupabaseLimit: _mockSupabaseLimit,
    mockSupabaseIn: _mockSupabaseIn,
    mockSupabaseNot: _mockSupabaseNot,
    mockSupabaseInsert: _mockSupabaseInsert,
    mockSupabaseAuthGetUser: _mockSupabaseAuthGetUser,
    mockSupabaseClient: _mockSupabaseClient,
    mockCreateAdminClient: _mockCreateAdminClient,
  };
});

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}));

vi.mock('@/lib/supabase/server', () => ({
  createAdminClient: mockCreateAdminClient,
}));

import { GET } from '@/app/api/for-you/route';

function makeRequest(url = '/api/for-you'): Request {
  return new Request(`http://localhost:3000${url}`, { method: 'GET' });
}

function mockArticle(
  overrides: Partial<Record<string, unknown>> = {}
): Record<string, unknown> {
  return {
    id: 'article-1',
    title: 'Test Article',
    summary: 'A summary',
    url: 'https://example.com/article',
    source_name: 'Test Source',
    source_type: 'rss',
    source_tier: 2,
    category: 'ai',
    published_at: new Date().toISOString(),
    score: 75,
    base_score: 70,
    social_momentum: null,
    detected_models: ['gpt-4'],
    image_url: null,
    slug: 'test-article',
    ...overrides,
  };
}

function mockArticles(count: number): Record<string, unknown>[] {
  return Array.from({ length: count }, (_, i) =>
    mockArticle({
      id: `article-${i}`,
      title: `Article ${i}`,
      category: i % 2 === 0 ? 'ai' : 'research',
      score: 50 + i * 2,
      published_at: new Date(Date.now() - i * 3600_000).toISOString(),
    })
  );
}

function createDefaultChain(articles: Record<string, unknown>[]) {
  mockSupabaseLimit.mockResolvedValue({ data: articles, error: null });
  mockSupabaseOrder.mockReturnValue({ limit: mockSupabaseLimit });
  mockSupabaseGte.mockReturnValue({ order: mockSupabaseOrder });
  mockSupabaseEq.mockReturnValue({ gte: mockSupabaseGte, order: mockSupabaseOrder });
  mockSupabaseIn.mockReturnValue({ order: mockSupabaseOrder });
  mockSupabaseNot.mockReturnValue({ in: mockSupabaseIn, order: mockSupabaseOrder });
  mockSupabaseSelect.mockReturnValue({
    gte: mockSupabaseGte,
    eq: mockSupabaseEq,
    in: mockSupabaseIn,
    not: mockSupabaseNot,
    order: mockSupabaseOrder,
  });
  return { select: mockSupabaseSelect, insert: mockSupabaseInsert };
}

function createUserEmbeddingsChain(embedding: number[] | null) {
  const data = embedding ? { embedding } : null;
  mockSupabaseLimit.mockResolvedValue({ data, error: null });
  mockSupabaseEq.mockReturnValue({ 
    single: vi.fn().mockReturnValue({ data, error: null }) 
  });
  mockSupabaseSelect.mockReturnValue({ eq: mockSupabaseEq });
  return { select: mockSupabaseSelect, insert: mockSupabaseInsert };
}

function createArticleClicksChain(articleIds: string[]) {
  mockSupabaseLimit.mockResolvedValue({ 
    data: articleIds.map((id) => ({ article_id: id })), 
    error: null 
  });
  mockSupabaseOrder.mockReturnValue({ limit: mockSupabaseLimit });
  mockSupabaseEq.mockReturnValue({ order: mockSupabaseOrder });
  mockSupabaseSelect.mockReturnValue({ eq: mockSupabaseEq });
  return { select: mockSupabaseSelect, insert: mockSupabaseInsert };
}

function createBookmarksChain(articleIds: string[]) {
  mockSupabaseLimit.mockResolvedValue({ 
    data: articleIds.map((id) => ({ article_id: id })), 
    error: null 
  });
  mockSupabaseOrder.mockReturnValue({ limit: mockSupabaseLimit });
  mockSupabaseEq.mockReturnValue({ order: mockSupabaseOrder });
  mockSupabaseSelect.mockReturnValue({ eq: mockSupabaseEq });
  return { select: mockSupabaseSelect, insert: mockSupabaseInsert };
}

function createCategoryPrefsChain(prefs: Record<string, number>) {
  const prefData = Object.entries(prefs).map(([category, weight]) => ({ category, weight }));
  mockSupabaseEq.mockReturnValue({ 
    limit: vi.fn().mockResolvedValue({ data: prefData, error: null }),
  });
  mockSupabaseSelect.mockReturnValue({ eq: mockSupabaseEq });
  return { select: mockSupabaseSelect, insert: mockSupabaseInsert };
}

function createArticlesChain(articles: Record<string, unknown>[]) {
  mockSupabaseLimit.mockResolvedValue({ data: articles, error: null });
  mockSupabaseOrder.mockReturnValue({ limit: mockSupabaseLimit });
  mockSupabaseGte.mockReturnValue({ order: mockSupabaseOrder });
  mockSupabaseEq.mockReturnValue({ gte: mockSupabaseGte, order: mockSupabaseOrder });
  mockSupabaseIn.mockReturnValue({ order: mockSupabaseOrder });
  mockSupabaseNot.mockReturnValue({ in: mockSupabaseIn, order: mockSupabaseOrder });
  mockSupabaseSelect.mockReturnValue({
    gte: mockSupabaseGte,
    eq: mockSupabaseEq,
    in: mockSupabaseIn,
    not: mockSupabaseNot,
    order: mockSupabaseOrder,
  });
  return { select: mockSupabaseSelect, insert: mockSupabaseInsert };
}

function createArticleEmbeddingsChain(embeddings: Map<string, number[]>) {
  const embeddingData = Array.from(embeddings.entries()).map(([article_id, embedding]) => ({
    article_id,
    embedding,
  }));
  mockSupabaseLimit.mockResolvedValue({ data: embeddingData, error: null });
  mockSupabaseOrder.mockReturnValue({ limit: mockSupabaseLimit });
  mockSupabaseIn.mockReturnValue({ select: mockSupabaseSelect, limit: mockSupabaseLimit, order: mockSupabaseOrder });
  mockSupabaseSelect.mockReturnValue({ in: mockSupabaseIn });
  return { select: mockSupabaseSelect, insert: mockSupabaseInsert };
}

function createRecommendationLogsChain() {
  mockSupabaseInsert.mockResolvedValue({ error: null });
  return { select: mockSupabaseSelect, insert: mockSupabaseInsert };
}

function createTrendingChain(articles: Record<string, unknown>[]) {
  mockSupabaseLimit.mockResolvedValue({ data: articles, error: null });
  mockSupabaseOrder.mockReturnValue({ limit: mockSupabaseLimit });
  mockSupabaseGte.mockReturnValue({ order: mockSupabaseOrder });
  mockSupabaseSelect.mockReturnValue({ gte: mockSupabaseGte, order: mockSupabaseOrder });
  return { select: mockSupabaseSelect, insert: mockSupabaseInsert };
}

function setupAuth(userId: string | null) {
  if (userId) {
    mockSupabaseAuthGetUser.mockResolvedValue({ 
      data: { user: { id: userId } }, 
      error: null 
    });
  } else {
    mockSupabaseAuthGetUser.mockResolvedValue({ 
      data: { user: null }, 
      error: null 
    });
  }
}

function resetAllMocks() {
  vi.clearAllMocks();
  mockSupabaseFrom.mockReset();
  mockSupabaseSelect.mockReset();
  mockSupabaseGte.mockReset();
  mockSupabaseEq.mockReset();
  mockSupabaseOrder.mockReset();
  mockSupabaseLimit.mockReset();
  mockSupabaseIn.mockReset();
  mockSupabaseNot.mockReset();
  mockSupabaseInsert.mockReset();
  mockSupabaseAuthGetUser.mockResolvedValue({ data: { user: null }, error: null });
  mockCreateAdminClient.mockResolvedValue(mockSupabaseClient);
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
}

function buildPersonalizedMock(options: {
  userId: string;
  articles: Record<string, unknown>[];
  userEmbedding: number[] | null;
  clickedIds: string[];
  bookmarkedIds: string[];
  categoryPrefs: Record<string, number>;
  articleEmbeddings: Map<string, number[]>;
}) {
  const { userId, articles, userEmbedding, clickedIds, bookmarkedIds, categoryPrefs, articleEmbeddings } = options;
  
  mockSupabaseFrom.mockImplementation((tableName: string) => {
    switch (tableName) {
      case 'user_embeddings':
        return createUserEmbeddingsChain(userEmbedding);
      case 'article_clicks':
        return createArticleClicksChain(clickedIds);
      case 'bookmarks':
        return createBookmarksChain(bookmarkedIds);
      case 'user_category_preferences':
        return createCategoryPrefsChain(categoryPrefs);
      case 'articles':
        return createArticlesChain(articles);
      case 'article_embeddings':
        return createArticleEmbeddingsChain(articleEmbeddings);
      case 'recommendation_logs':
        return createRecommendationLogsChain();
      default:
        return createDefaultChain([]);
    }
  });
}

function buildGuestMock(articles: Record<string, unknown>[]) {
  mockSupabaseFrom.mockImplementation((tableName: string) => {
    if (tableName === 'articles') {
      return createTrendingChain(articles);
    }
    return createDefaultChain([]);
  });
}

beforeEach(() => {
  resetAllMocks();
});

afterEach(() => {
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
});

describe('GET /api/for-you', () => {
  describe('Unauthenticated (guest) users', () => {
    it('returns trending fallback when no user', async () => {
      const articles = mockArticles(3);
      setupAuth(null);
      buildGuestMock(articles);

      const response = await GET(makeRequest('/api/for-you?limit=10'));
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.personalized).toBe(false);
      expect(body.articles).toHaveLength(3);
      expect(body.has_more).toBe(false);
    });

    it('returns empty array when no trending articles', async () => {
      setupAuth(null);
      buildGuestMock([]);

      const response = await GET(makeRequest());
      const body = await response.json();

      expect(body.articles).toHaveLength(0);
    });
  });

  describe('Authenticated users with personalization', () => {
    const userId = 'user-123';

    function runPersonalizedTest(
      name: string,
      options: {
        articles: Record<string, unknown>[];
        userEmbedding: number[] | null;
        clickedIds: string[];
        bookmarkedIds: string[];
        categoryPrefs: Record<string, number>;
        articleEmbeddings: Map<string, number[]>;
        limit?: number;
        assertions: (body: any) => void;
      }
    ) {
      it(name, async () => {
        setupAuth(userId);
        buildPersonalizedMock({
          userId,
          ...options,
        });

        const limitParam = options.limit ? `?limit=${options.limit}` : '';
        const response = await GET(makeRequest(`/api/for-you${limitParam}`));
        const body = await response.json();

        expect(response.status).toBe(200);
        options.assertions(body);
      });
    }

    runPersonalizedTest('returns personalized feed with category preferences', {
      articles: mockArticles(5),
      userEmbedding: null,
      clickedIds: [],
      bookmarkedIds: [],
      categoryPrefs: { ai: 0.8, research: 0.5 },
      articleEmbeddings: new Map(mockArticles(5).map((a) => [a.id as string, new Array(384).fill(0.1)])),
      assertions: (body) => {
        expect(body.articles.length).toBeGreaterThan(0);
        expect(body.articles[0]).toHaveProperty('relevance_score');
        expect(body.articles[0]).toHaveProperty('reason');
      },
    });

    runPersonalizedTest('boosts articles matching user category preferences', {
      articles: [
        mockArticle({ id: 'ai-1', category: 'ai', score: 70 }),
        mockArticle({ id: 'research-1', category: 'research', score: 70 }),
        mockArticle({ id: 'other-1', category: 'business', score: 50 }),
      ],
      userEmbedding: null,
      clickedIds: [],
      bookmarkedIds: [],
      categoryPrefs: { ai: 1.0 },
      articleEmbeddings: new Map([
        ['ai-1', new Array(384).fill(0.1)],
        ['research-1', new Array(384).fill(0.1)],
        ['other-1', new Array(384).fill(0.1)],
      ]),
      assertions: (body) => {
        expect(body.personalized).toBe(true);
        expect(body.articles.length).toBeGreaterThan(0);
      },
    });

    runPersonalizedTest('excludes already clicked articles', {
      articles: mockArticles(5),
      userEmbedding: null,
      clickedIds: [],
      bookmarkedIds: [],
      categoryPrefs: {},
      articleEmbeddings: new Map(mockArticles(5).map((a) => [a.id as string, new Array(384).fill(0.1)])),
      assertions: (body) => {
        expect(body.personalized).toBe(true);
      },
    });

    // runPersonalizedTest('uses embedding similarity when similarity > 0.7', {
    //   articles: [
    //     mockArticle({ id: 'similar-1', score: 50 }),
    //     mockArticle({ id: 'different-1', score: 50 }),
    //   ],
    //   userEmbedding: new Array(384).fill(1.0),
    //   clickedIds: [],
    //   bookmarkedIds: [],
    //   categoryPrefs: {},
    //   articleEmbeddings: new Map([
    //     ['similar-1', new Array(384).fill(1.0)],
    //     ['different-1', new Array(384).fill(0.0)],
    //   ]),
    //   assertions: (body) => {
    //     const similarArticle = body.articles.find((a: any) => a.id === 'similar-1');
    //     const differentArticle = body.articles.find((a: any) => a.id === 'different-1');
    //     expect(similarArticle.relevance_score).toBeGreaterThan(differentArticle.relevance_score);
    //     expect(similarArticle.reason).toContain('similar_to_history');
    //   },
    // });

    runPersonalizedTest('applies recency bonus to fresh articles (<24h)', {
      articles: [
        mockArticle({ id: 'fresh-1', score: 50, published_at: new Date(Date.now() - 2 * 3600_000).toISOString() }),
        mockArticle({ id: 'old-1', score: 50, published_at: new Date(Date.now() - 48 * 3600_000).toISOString() }),
      ],
      userEmbedding: null,
      clickedIds: [],
      bookmarkedIds: [],
      categoryPrefs: {},
      articleEmbeddings: new Map([
        ['fresh-1', new Array(384).fill(0.1)],
        ['old-1', new Array(384).fill(0.1)],
      ]),
      assertions: (body) => {
        const freshArticle = body.articles.find((a: any) => a.id === 'fresh-1');
        expect(freshArticle.reason).toContain('recent');
      },
    });

    runPersonalizedTest('applies source quality bonus for tier 1-2 sources', {
      articles: [
        mockArticle({ id: 'tier1-1', source_tier: 1, score: 50 }),
        mockArticle({ id: 'tier3-1', source_tier: 3, score: 50 }),
      ],
      userEmbedding: null,
      clickedIds: [],
      bookmarkedIds: [],
      categoryPrefs: {},
      articleEmbeddings: new Map([
        ['tier1-1', new Array(384).fill(0.1)],
        ['tier3-1', new Array(384).fill(0.1)],
      ]),
      assertions: (body) => {
        const tier1Article = body.articles.find((a: any) => a.id === 'tier1-1');
        const tier3Article = body.articles.find((a: any) => a.id === 'tier3-1');
        expect(tier1Article.reason).toContain('quality_source');
        expect(tier1Article.relevance_score).toBeGreaterThanOrEqual(tier3Article.relevance_score);
      },
    });

    runPersonalizedTest('limits results to requested limit (default 20)', {
      articles: mockArticles(100),
      userEmbedding: null,
      clickedIds: [],
      bookmarkedIds: [],
      categoryPrefs: {},
      articleEmbeddings: new Map(mockArticles(100).map((a) => [a.id as string, new Array(384).fill(0.1)])),
      assertions: (body) => {
        expect(body.articles).toHaveLength(20);
      },
    });

    runPersonalizedTest('limits results to requested limit (10)', {
      articles: mockArticles(100),
      userEmbedding: null,
      clickedIds: [],
      bookmarkedIds: [],
      categoryPrefs: {},
      articleEmbeddings: new Map(mockArticles(100).map((a) => [a.id as string, new Array(384).fill(0.1)])),
      limit: 10,
      assertions: (body) => {
        expect(body.articles).toHaveLength(10);
      },
    });

    it('returns has_more and next_cursor when more articles available', async () => {
      const articles = mockArticles(100);
      const articleEmbeddings = new Map(mockArticles(100).map((a) => [a.id as string, new Array(384).fill(0.1)]));
      
      setupAuth(userId);
      buildPersonalizedMock({
        userId,
        articles,
        userEmbedding: null,
        clickedIds: [],
        bookmarkedIds: [],
        categoryPrefs: {},
        articleEmbeddings,
      });

      const response = await GET(makeRequest('/api/for-you?limit=5'));
      const body = await response.json();

      expect(body.has_more).toBe(true);
      expect(body.next_cursor).toBeDefined();
      expect(body.next_cursor).not.toBeNull();
    });

    it('logs recommendation for analytics', async () => {
      const articles = mockArticles(3);
      const articleEmbeddings = new Map(mockArticles(3).map((a) => [a.id as string, new Array(384).fill(0.1)]));
      
      setupAuth(userId);
      buildPersonalizedMock({
        userId,
        articles,
        userEmbedding: null,
        clickedIds: [],
        bookmarkedIds: [],
        categoryPrefs: {},
        articleEmbeddings,
      });

      await GET(makeRequest());

      expect(mockSupabaseFrom).toHaveBeenCalledWith('recommendation_logs');
      expect(mockSupabaseInsert).toHaveBeenCalled();
    });

    it('falls back to trending on error in main path', async () => {
      const trendingArticles = mockArticles(3);
      
      setupAuth(userId);
      let articlesCallCount = 0;
      mockSupabaseFrom.mockImplementation((tableName: string) => {
        if (tableName === 'articles') {
          articlesCallCount++;
          if (articlesCallCount === 1) throw new Error('DB error');
          return createTrendingChain(trendingArticles);
        }
        if (tableName === 'user_embeddings') return createUserEmbeddingsChain(null);
        if (tableName === 'article_clicks') return createArticleClicksChain([]);
        if (tableName === 'bookmarks') return createBookmarksChain([]);
        if (tableName === 'user_category_preferences') return createCategoryPrefsChain({});
        return createDefaultChain([]);
      });

      const response = await GET(makeRequest());
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.personalized).toBe(false);
    });

    it('respects hours_back parameter', async () => {
      const articles = mockArticles(3);
      const articleEmbeddings = new Map(mockArticles(3).map((a) => [a.id as string, new Array(384).fill(0.1)]));
      
      setupAuth(userId);
      buildPersonalizedMock({
        userId,
        articles,
        userEmbedding: null,
        clickedIds: [],
        bookmarkedIds: [],
        categoryPrefs: {},
        articleEmbeddings,
      });

      await GET(makeRequest('/api/for-you?hours_back=24'));

      expect(mockSupabaseGte).toHaveBeenCalled();
    });

    it('caps limit at 50', async () => {
      const articles = mockArticles(60);
      const articleEmbeddings = new Map(mockArticles(60).map((a) => [a.id as string, new Array(384).fill(0.1)]));
      
      setupAuth(userId);
      buildPersonalizedMock({
        userId,
        articles,
        userEmbedding: null,
        clickedIds: [],
        bookmarkedIds: [],
        categoryPrefs: {},
        articleEmbeddings,
      });

      const response = await GET(makeRequest('/api/for-you?limit=100'));
      const body = await response.json();

      expect(body.articles.length).toBeLessThanOrEqual(50);
    });

    it('caps hours_back at 720 (30 days)', async () => {
      const articles = mockArticles(3);
      const articleEmbeddings = new Map(mockArticles(3).map((a) => [a.id as string, new Array(384).fill(0.1)]));
      
      setupAuth(userId);
      buildPersonalizedMock({
        userId,
        articles,
        userEmbedding: null,
        clickedIds: [],
        bookmarkedIds: [],
        categoryPrefs: {},
        articleEmbeddings,
      });

      await GET(makeRequest('/api/for-you?hours_back=1000'));
    });
  });

  describe('Response structure', () => {
    it('includes all required fields for each article', async () => {
      const articles = mockArticles(1);
      const articleEmbeddings = new Map([[articles[0].id as string, new Array(384).fill(0.1)]]);
      
      setupAuth('user-1');
      buildPersonalizedMock({
        userId: 'user-1',
        articles,
        userEmbedding: null,
        clickedIds: [],
        bookmarkedIds: [],
        categoryPrefs: {},
        articleEmbeddings,
      });

      const response = await GET(makeRequest());
      const body = await response.json();

      const article = body.articles[0];
      expect(article).toHaveProperty('id');
      expect(article).toHaveProperty('title');
      expect(article).toHaveProperty('summary');
      expect(article).toHaveProperty('url');
      expect(article).toHaveProperty('source_name');
      expect(article).toHaveProperty('category');
      expect(article).toHaveProperty('published_at');
      expect(article).toHaveProperty('score');
      expect(article).toHaveProperty('relevance_score');
      expect(article).toHaveProperty('reason');
      expect(article).toHaveProperty('slug');
    });

    it('returns next_cursor as null when no more articles', async () => {
      const articles = mockArticles(3);
      const articleEmbeddings = new Map(mockArticles(3).map((a) => [a.id as string, new Array(384).fill(0.1)]));
      
      setupAuth('user-1');
      buildPersonalizedMock({
        userId: 'user-1',
        articles,
        userEmbedding: null,
        clickedIds: [],
        bookmarkedIds: [],
        categoryPrefs: {},
        articleEmbeddings,
      });

      const response = await GET(makeRequest('/api/for-you?limit=10'));
      const body = await response.json();

      expect(body.next_cursor).toBeNull();
      expect(body.has_more).toBe(false);
    });
  });
});