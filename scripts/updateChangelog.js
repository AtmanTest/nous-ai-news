const fs = require('fs');
const path = require('path');

const REPORT_DIR = path.join(__dirname, '..', 'reports');
const CHANGELOG_FILE = path.join(__dirname, '..', 'data', 'auto-tune-changelog.json');
const DATA_DIR = path.join(__dirname, '..', 'data');

function ensureDir(dir) { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); }

function loadChangelog() {
  try { return JSON.parse(fs.readFileSync(CHANGELOG_FILE, 'utf8')); } catch { return { entries: [] }; }
}

function saveChangelog(log) {
  ensureDir(DATA_DIR);
  fs.writeFileSync(CHANGELOG_FILE, JSON.stringify(log, null, 2));
}

function main() {
  const type = process.argv.find((a) => a.startsWith('--type='))?.split('=')[1] || 'unknown';

  let entry = { type, timestamp: new Date().toISOString(), runId: process.env.GITHUB_RUN_ID || 'local' };

  switch (type) {
    case 'ux-audit': {
      // Parse Lighthouse report if available
      const reports = fs.readdirSync(REPORT_DIR).filter((f) => f.endsWith('.json') && f.includes('lighthouse'));
      if (reports.length > 0) {
        const latest = reports.sort().reverse()[0];
        const lh = JSON.parse(fs.readFileSync(path.join(REPORT_DIR, latest), 'utf8'));
        entry.details = {
          performance: Math.round(lh.categories?.performance?.score * 100 || 0),
          accessibility: Math.round(lh.categories?.accessibility?.score * 100 || 0),
          seo: Math.round(lh.categories?.seo?.score * 100 || 0),
          bestPractices: Math.round(lh.categories?.['best-practices']?.score * 100 || 0),
        };
        entry.summary = `UX Audit — Perf:${entry.details.performance} A11y:${entry.details.accessibility} SEO:${entry.details.seo} BP:${entry.details.bestPractices}`;
      } else {
        entry.summary = 'UX Audit — no Lighthouse report found';
      }
      break;
    }
    case 'bug-fix': {
      entry.summary = 'Auto bug fixes applied';
      break;
    }
    case 'test-generation': {
      entry.summary = 'New test cases generated';
      break;
    }
    case 'feature-planning': {
      entry.summary = 'Weekly feature planning complete';
      break;
    }
    default: {
      entry.summary = `Action: ${type}`;
    }
  }

  const log = loadChangelog();
  log.entries.unshift(entry);
  // Keep last 500 entries
  log.entries = log.entries.slice(0, 500);
  saveChangelog(log);

  console.log(`✅ Changelog updated: ${entry.summary}`);
}

main();
