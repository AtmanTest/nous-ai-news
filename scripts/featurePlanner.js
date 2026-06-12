const fs = require('fs');
const path = require('path');

const REPORT_DIR = path.join(__dirname, '..', 'reports');
const LLM_API_KEY = process.env.LLM_API_KEY || '';
const LLM_API_URL = process.env.LLM_API_URL || 'https://integrate.api.nvidia.com/v1/chat/completions';
const LLM_MODEL = process.env.LLM_MODEL || 'mistralai/mistral-nemotron';

function ensureDir(dir) { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); }

async function callLLM(prompt, systemPrompt = 'Return only valid JSON.') {
  if (!LLM_API_KEY) return null;
  try {
    const res = await fetch(LLM_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LLM_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: LLM_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.4,
        max_tokens: 2000,
      }),
    });
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content || '';
    const match = text.match(/\[[\s\S]*?\]/);
    return match ? JSON.parse(match[0]) : null;
  } catch (e) {
    console.error('  LLM call failed:', e.message);
    return null;
  }
}

async function main() {
  console.log('🚀 Feature Planner — analyzing trends & feedback...');
  ensureDir(REPORT_DIR);

  const features = [];

  // 1. Analyze current codebase for improvement areas
  const srcDir = path.join(__dirname, '..', 'app');
  const componentDir = path.join(__dirname, '..', 'components');

  let pageCount = 0;
  let componentCount = 0;
  try {
    pageCount = fs.readdirSync(srcDir).filter((f) => !f.startsWith('.')).length;
    if (fs.existsSync(componentDir))
      componentCount = fs.readdirSync(componentDir, { recursive: true }).filter((f) => f.endsWith('.tsx')).length;
  } catch {}

  // 2. Check Lighthouse report for UX gaps
  let lhScores = {};
  try {
    const ux = JSON.parse(fs.readFileSync(path.join(REPORT_DIR, 'ux-report.json'), 'utf8'));
    lhScores = ux.scores || {};
  } catch {}

  // 3. LLM-based feature suggestions
  const prompt = `You are a product manager for a Next.js AI news site (nous-daily.vercel.app).
Current state: ${pageCount} pages, ${componentCount} components, UX scores: ${JSON.stringify(lhScores)}.

Suggest 3-5 high-impact features for the coming week. Consider:
- AI/LLM trends (agents, open-source, hardware AI)
- UX improvements
- Content discovery
- Community features
- Monetization

Return JSON array: [{"title": "...", "description": "...", "impact": "high|medium|low", "effort": "low|medium|high", "category": "ux|content|feature|perf"}]`;

  const llmFeatures = await callLLM(prompt);
  if (llmFeatures) {
    features.push(...llmFeatures);
  }

  // Fallback features
  if (features.length === 0) {
    features.push(
      { title: 'AI Topic Tracker', description: 'Follow specific AI topics (LLMs, robotics, agents) with personalized alerts', impact: 'high', effort: 'medium', category: 'feature' },
      { title: 'Dark Mode Refinement', description: 'Improve dark mode contrast and add accent color themes', impact: 'medium', effort: 'low', category: 'ux' },
      { title: 'Newsletter Integration', description: 'Weekly AI digest delivered via email', impact: 'medium', effort: 'medium', category: 'content' },
    );
  }

  fs.writeFileSync(path.join(REPORT_DIR, 'planned-features.json'), JSON.stringify(features, null, 2));
  console.log(`✅ Planned ${features.length} features for next sprint`);
  features.forEach((f) => console.log(`  · ${f.title} (${f.impact}/${f.effort})`));
}

main().catch(console.error);
