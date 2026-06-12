const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const REPORT_DIR = path.join(__dirname, '..', 'reports');
const TESTS_DIR = path.join(__dirname, '..', 'tests');
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
        max_tokens: 1500,
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
  console.log('🧪 Test Generator — analyzing recent changes...');
  ensureDir(REPORT_DIR);
  ensureDir(TESTS_DIR);

  // Read changed files
  let changedFiles = [];
  try {
    const content = fs.readFileSync(path.join(REPORT_DIR, 'changed-files.txt'), 'utf8');
    changedFiles = content.split('\n').filter(Boolean).filter((f) => f.endsWith('.ts') || f.endsWith('.tsx'));
  } catch {
    console.log('  No changed-files.txt found. Using git diff HEAD~1.');
    try {
      const output = execSync('git diff --name-only HEAD~1 HEAD', { cwd: path.join(__dirname, '..') }).toString();
      changedFiles = output.split('\n').filter(Boolean).filter((f) => f.endsWith('.ts') || f.endsWith('.tsx'));
    } catch {
      // If git diff fails (shallow clone), use modified files from last commit
      try {
        const output = execSync('git diff --name-only HEAD^ HEAD', { cwd: path.join(__dirname, '..') }).toString();
        changedFiles = output.split('\n').filter(Boolean).filter((f) => f.endsWith('.ts') || f.endsWith('.tsx'));
      } catch {
        changedFiles = [];
      }
    }
  }

  if (changedFiles.length === 0) {
    console.log('  No TypeScript files changed. Skipping.');
    return;
  }

  const generatedTests = [];

  for (const file of changedFiles.slice(0, 5)) {
    const fullPath = path.join(__dirname, '..', file);
    if (!fs.existsSync(fullPath)) continue;

    const code = fs.readFileSync(fullPath, 'utf8');
    const basename = path.basename(file, path.extname(file));
    const testPath = path.join(TESTS_DIR, `auto-${basename}.test.ts`);

    // Skip if test already exists
    if (fs.existsSync(testPath)) {
      console.log(`  Test exists: ${testPath}`);
      continue;
    }

    const prompt = `Generate vitest tests for this file. The project uses vitest with describe/it/expect. Return ONLY the test code, no explanation.

File: ${file}
\`\`\`typescript
${code.slice(0, 3000)}
\`\`\`

Generate focused unit tests for the main functions/exports. Import the module with a relative path.`;

      const testCode = await callLLM(prompt, 'You generate vitest test files. Return ONLY valid TypeScript test code.');
      if (testCode) {
        // Extract code block
        const codeMatch = testCode.match(/```(?:typescript|ts)?\n([\s\S]*?)```/);
        const cleanCode = codeMatch ? codeMatch[1].trim() : testCode.replace(/^```[\s\S]*?\n/, '').replace(/\n```$/, '').trim();

        if (cleanCode && cleanCode.length > 50) {
          fs.writeFileSync(testPath, cleanCode);
          generatedTests.push({ file: testPath, lines: cleanCode.split('\n').length });
          console.log(`  ✓ Generated: tests/auto-${basename}.test.ts`);
        }
      }
  }

  if (generatedTests.length > 0) {
    fs.writeFileSync(path.join(REPORT_DIR, 'generated-tests.json'), JSON.stringify({ timestamp: new Date().toISOString(), tests: generatedTests }, null, 2));
    console.log(`✅ Generated ${generatedTests.length} new test files`);
  } else {
    console.log('  No new tests generated');
  }
}

main().catch(console.error);
