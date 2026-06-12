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
        temperature: 0.2,
        max_tokens: 1000,
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
  console.log('🔍 UX Analyzer — scanning results...');
  ensureDir(REPORT_DIR);

  // Read the latest Lighthouse JSON
  const files = fs.readdirSync(REPORT_DIR).filter((f) => f.includes('lighthouse') && f.endsWith('.json'));
  if (files.length === 0) {
    console.log('No Lighthouse reports found. Skipping.');
    return;
  }
  const latest = files.sort().reverse()[0];
  const lh = JSON.parse(fs.readFileSync(path.join(REPORT_DIR, latest), 'utf8'));
  const categories = lh.categories || {};
  const audits = lh.audits || {};

  const scores = {
    performance: Math.round((categories.performance?.score || 0) * 100),
    accessibility: Math.round((categories.accessibility?.score || 0) * 100),
    seo: Math.round((categories.seo?.score || 0) * 100),
    'best-practices': Math.round((categories['best-practices']?.score || 0) * 100),
  };

  // Collect actionable items (diagnostics below threshold)
  const issues = [];
  const thresholds = { 'first-contentful-paint': 2500, 'largest-contentful-paint': 4000, 'total-blocking-time': 300, 'cumulative-layout-shift': 0.1, 'speed-index': 4000 };
  Object.entries(thresholds).forEach(([auditId, threshold]) => {
    const audit = audits[auditId];
    if (audit && audit.numericValue > threshold) {
      issues.push({ metric: audit.title || auditId, value: audit.displayValue || audit.numericValue, threshold, score: Math.round((audit.score || 0) * 100) });
    }
  });

  // LLM recommendations
  let recommendations = [];
  const prompt = `Analyze this Lighthouse report for a Next.js AI news site and suggest 3 concrete UX improvements (CSS/JS/structural):

Scores: ${JSON.stringify(scores)}
Issues: ${JSON.stringify(issues)}

Respond as JSON array: [{"action": "...", "impact": "high|med|low", "effort": "easy|med|hard", "details": "..."}]`;

  const llmRecs = await callLLM(prompt);
  if (llmRecs) {
    recommendations = llmRecs;
  } else {
    recommendations = [{ action: 'LLM analysis failed or unavailable', impact: 'low', effort: 'easy', details: 'Using fallback recommendations' }];
  }

  const report = { timestamp: new Date().toISOString(), scores, issues, recommendations };
  fs.writeFileSync(path.join(REPORT_DIR, 'ux-report.json'), JSON.stringify(report, null, 2));

  console.log(`✅ UX Report saved. Performance: ${scores.performance}, A11y: ${scores.accessibility}, SEO: ${scores.seo}`);
  report.issues.forEach((i) => console.log(`  ⚠ ${i.metric}: ${i.value} (threshold: ${i.threshold})`));
}

main().catch(console.error);
