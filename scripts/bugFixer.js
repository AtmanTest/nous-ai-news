const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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
        temperature: 0.1,
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
  console.log('🐛 Bug Fixer — scanning issues...');
  ensureDir(REPORT_DIR);

  const fixes = [];

  // 1. Read ESLint report
  try {
    const eslintReport = JSON.parse(fs.readFileSync(path.join(REPORT_DIR, 'eslint-report.json'), 'utf8'));
    const errors = [];
    Object.entries(eslintReport).forEach(([file, msgs]) => {
      msgs.forEach((m) => {
        if (m.severity === 2) errors.push({ file, line: m.line, message: m.message, rule: m.ruleId });
      });
    });

    if (errors.length > 0) {
      // Ask LLM for auto-fix suggestions for the first 5 errors
      const topErrors = errors.slice(0, 5);
      const prompt = `Suggest an ESLint auto-fix for each error (ONLY if trivial/mechanical). Return JSON array:\n[{"file": "...", "line": N, "fix": "exact text to replace the line with" or null if risky}]\n\nErrors:\n${topErrors.map((e) => `${e.file}:${e.line} — ${e.message} (${e.rule})`).join('\n')}`;

      const suggestedFixes = await callLLM(prompt, 'Return only valid JSON. Return null for risky/ambiguous fixes.');
      if (suggestedFixes) {
        suggestedFixes.forEach((f) => {
          if (f.fix && f.file && f.line) {
            try {
              const fullPath = path.join(__dirname, '..', f.file);
              if (fs.existsSync(fullPath)) {
                const content = fs.readFileSync(fullPath, 'utf8').split('\n');
                const idx = f.line - 1;
                if (idx >= 0 && idx < content.length) {
                  content[idx] = f.fix;
                  fs.writeFileSync(fullPath, content.join('\n'));
                  fixes.push({ file: f.file, line: f.line, fix: f.fix });
                }
              }
            } catch (e) {
              console.error(`  ✗ Failed to fix ${f.file}:${f.line} — ${e.message}`);
            }
          }
        });
      }
    }
  } catch (e) {
    console.error('  No ESLint report or parse error:', e.message);
  }

  // 2. Quick auto-fixes for common patterns
  const ignorePatterns = ['@typescript-eslint/no-explicit-any', '@next/next/no-img-element'];
  const commentedFiles = {};

  try {
    const eslintReport = JSON.parse(fs.readFileSync(path.join(REPORT_DIR, 'eslint-report.json'), 'utf8'));
    Object.entries(eslintReport).forEach(([file, msgs]) => {
      msgs.forEach((m) => {
        if (ignorePatterns.includes(m.ruleId)) {
          if (!commentedFiles[file]) commentedFiles[file] = new Set();
          commentedFiles[file].add(m.ruleId);
        }
      });
    });
  } catch {}

  // Add eslint-disable comments for known patterns
  Object.entries(commentedFiles).forEach(([relFile, rules]) => {
    const fullPath = path.join(__dirname, '..', relFile);
    if (!fs.existsSync(fullPath)) return;
    const content = fs.readFileSync(fullPath, 'utf8');
    // Only add if not already there
    rules.forEach((rule) => {
      const comment = `/* eslint-disable ${rule} */`;
      if (!content.includes(comment)) {
        const lines = content.split('\n');
        // Find a good insertion point (after imports)
        let insertIdx = 0;
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].startsWith('import ')) insertIdx = i + 1;
        }
        if (insertIdx < lines.length) {
          lines.splice(insertIdx, 0, comment);
          fs.writeFileSync(fullPath, lines.join('\n'));
          fixes.push({ file: relFile, action: `added ${comment}` });
        }
      }
    });
  });

  // 3. Save fix report
  if (fixes.length > 0) {
    fs.writeFileSync(path.join(REPORT_DIR, 'auto-fixes.json'), JSON.stringify({ timestamp: new Date().toISOString(), fixes }, null, 2));
    console.log(`✅ Applied ${fixes.length} auto-fixes`);
  } else {
    console.log('  No auto-fixes applied');
  }
}

main().catch(console.error);
