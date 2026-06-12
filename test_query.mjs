// Test the exact query using @supabase/supabase-js (same as Next.js)
import { createClient } from '@supabase/supabase-js';

const url = 'https://wlxtulibsipesxpwkhyz.supabase.co';
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!key) {
  console.error('No NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(url, key);

const AI_CATEGORIES = ['models', 'research', 'business', 'policy', 'hardware', 'agents', 'open-source', 'startups', 'safety', 'ethics', 'applications'];
const EXCLUDED_SOURCES = ['Hacker News', 'Product Hunt AI', 'Springer AI Research'];

async function testQuery() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  console.log('=== Test: Full query with filters ===');
  const { data, error } = await supabase
    .from('articles')
    .select('id, title, summary, image_url, source_name, category, tags, published_at, score, is_breaking, content, language')
    .eq('status', 'published')
    .gte('published_at', sevenDaysAgo)
    .in('category', AI_CATEGORIES)
    .filter('source_name', 'not.in', `(${EXCLUDED_SOURCES.join(',')})`)
    .order('score', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Query error:', error);
    return;
  }

  console.log(`Results: ${data?.length || 0}`);
  for (const a of data || []) {
    console.log(`  ${a.score} | ${a.source_name} | ${a.category} | ${a.title.slice(0, 80)}`);
  }

  // Test featured (with images)
  console.log('\n=== Test: Featured (with images) ===');
  const { data: featured } = await supabase
    .from('articles')
    .select('id, title, summary, image_url, source_name, category, tags, published_at, score, is_breaking, content, language')
    .eq('status', 'published')
    .gte('published_at', sevenDaysAgo)
    .in('category', AI_CATEGORIES)
    .filter('source_name', 'not.in', `(${EXCLUDED_SOURCES.join(',')})`)
    .not('image_url', 'is', null)
    .order('score', { ascending: false })
    .limit(5);

  console.log(`Results: ${featured?.length || 0}`);
  for (const a of featured || []) {
    console.log(`  ${a.score} | ${a.source_name} | ${a.category} | ${a.title.slice(0, 80)}`);
  }

  // Test trending (score >= 40)
  console.log('\n=== Test: Trending (score >= 40) ===');
  const { data: trending } = await supabase
    .from('articles')
    .select('id, title, summary, image_url, source_name, category, tags, published_at, score, is_breaking, content, language')
    .eq('status', 'published')
    .gte('published_at', sevenDaysAgo)
    .in('category', AI_CATEGORIES)
    .filter('source_name', 'not.in', `(${EXCLUDED_SOURCES.join(',')})`)
    .gte('score', 40)
    .order('score', { ascending: false })
    .limit(10);

  console.log(`Results: ${trending?.length || 0}`);
  for (const a of trending || []) {
    console.log(`  ${a.score} | ${a.source_name} | ${a.category} | ${a.title.slice(0, 80)}`);
  }

  // Test latest
  console.log('\n=== Test: Latest ===');
  const { data: latest } = await supabase
    .from('articles')
    .select('id, title, summary, image_url, source_name, category, tags, published_at, score, is_breaking, content, language')
    .eq('status', 'published')
    .gte('published_at', sevenDaysAgo)
    .in('category', AI_CATEGORIES)
    .filter('source_name', 'not.in', `(${EXCLUDED_SOURCES.join(',')})`)
    .order('published_at', { ascending: false })
    .limit(12);

  console.log(`Results: ${latest?.length || 0}`);
  for (const a of latest || []) {
    console.log(`  ${a.score} | ${a.source_name} | ${a.category} | ${a.title.slice(0, 80)}`);
  }
}

testQuery();
