/**
 * Recategorize ALL articles in Supabase using keyword rules.
 * Simple sequential batch approach — no loop issues.
 * Run: cd /tmp/nous-ai-news && SUPABASE_SERVICE_ROLE_KEY=xxx npx tsx scripts/recategorize.ts
 *
 * Keyword rules mirrored from lib/content/normalize.ts categorizeArticle()
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const CATEGORY_RULES: [RegExp, string][] = [
  [/\b(GPT|Claude|Gemini|Llama|Mistral|DeepSeek|Qwen|Phi|Falcon|DALL.E|Stable Diffusion|Sora|Veo|Midjourney|Runway|Pika)\b/i, 'models'],
  [/\b(model release|new model|open model|language model|vision model|foundation model|diffusion model|multimodal)\b/i, 'models'],
  [/\b(GPU|TPU|NPU|chip|processor|semiconductor|H100|B200|Blackwell|Hopper|MI300|Gaudi|transistor|wafer|fabrication)\b/i, 'hardware'],
  [/\b(quantization|fine.tune|fine tune|LoRA|QLoRA|RLHF|DPO|inference|training|compute|parameter)\b/i, 'models'],
  [/\b(research|paper|preprint|arxiv|benchmark|SOTA|breakthrough|discovery|novel|architecture|attention|transformer)\b/i, 'research'],
  [/\b(reasoning|chain.of.thought|CoT|alignment|safety|interpretability|mechanistic interpretability|activation steering|red team|jailbreak)\b/i, 'research'],
  [/\b(agent|multi.agent|agentic|autonomous|tool.use|function calling|orchestration)\b/i, 'research'],
  [/\b(funding|fundraise|series [A-Z]|valuation|IPO|acquisition|merger|billion.*investment|revenue|profit|market cap|ARR)\b/i, 'business'],
  [/\b(startup|YC |accelerator|incubator|seed|pre.seed|venture|VC |investor)\b/i, 'startups'],
  [/\b(stock|share price|market|NASDAQ|NYSE|investor|earnings|quarterly|profitability|layoff|restructuring|downsize)\b/i, 'business'],
  [/\b(partnership|strategic.*alliance|collaboration|joint venture|enterprise|B2B|SaaS|subscription|pricing|tier)\b/i, 'business'],
  [/\b(regulation|regulatory|EU AI Act|Executive Order|White House|Congress|Senate|law|legislation|compliance|governance|GDPR|Copyright|liability)\b/i, 'policy'],
  [/\b(CMA|FTC|DOJ|competition|antitrust|monopoly|investigation|fine|sanction|authority|decision)\b/i, 'policy'],
  [/\b(open source|open.weight|open.model|Hugging Face|GitHub|repository|MIT license|Apache|permissive|OSI|open.weight)\b/i, 'open-source'],
  [/\b(robot|humanoid|drone|autonomous vehicle|self.driving|edge AI|IoT|sensor)\b/i, 'hardware'],
  [/\b(data center|hyperscaler|server|cluster|infrastructure|cloud|AWS|Azure|GCP|Oracle|equinix|colocation|power|energy|water|cooling)\b/i, 'hardware'],
];

function categorize(text: string): string {
  for (const [pattern, cat] of CATEGORY_RULES) {
    if (pattern.test(text)) return cat;
  }
  return 'general';
}

async function main() {
  const BATCH = 500;

  const { count } = await supabase.from('articles').select('id', { count: 'exact', head: true });
  const total = count || 0;
  console.log(`Total articles: ${total}`);

  let updated = 0;
  let processed = 0;

  while (processed < total) {
    const { data: batch, error } = await supabase
      .from('articles')
      .select('id, title, summary, content, source_name')
      .order('id', { ascending: true })
      .range(processed, processed + BATCH - 1);
    if (error || !batch) {
      console.error('Query error at', processed, error);
      break;
    }

    if (batch.length === 0) break;

    for (const article of batch) {
      const text = [article.title, article.summary || '', article.content || '', article.source_name]
        .filter(Boolean)
        .join(' ');

      if (!text.trim()) continue;

      const category = categorize(text);
      if (category === 'general') continue;

      const { error: upErr } = await supabase
        .from('articles')
        .update({ category })
        .eq('id', article.id);

      if (!upErr) updated++;
    }

    processed += batch.length;
    console.log(`  ${processed}/${total} — ${updated} categorized`);
  }

  // Verify
  const { count: nonGeneral } = await supabase
    .from('articles')
    .select('id', { count: 'exact', head: true })
    .neq('category', 'general')
    .not('category', 'is', null);

  const { count: genCount } = await supabase
    .from('articles')
    .select('id', { count: 'exact', head: true })
    .or('category.eq.general,category.is.null');

  console.log(`\n✅ ${updated} articles categorized.`);
  console.log(`   Non-general: ${nonGeneral}`);
  console.log(`   General/null: ${genCount}`);
}

main().catch(console.error);
