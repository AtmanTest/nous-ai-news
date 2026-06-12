#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# TNR — Tests Non-Régression (Pre-commit hook)
# Runs the full test suite. If any test fails, the commit is
# blocked with an error message.
# ─────────────────────────────────────────────────────────────

set -e

echo "🧪 Running TNR (Tests Non-Régression)..."
echo ""

# Run vitest in headless mode with minimal output
if npx vitest run --reporter=verbose 2>&1; then
  echo ""
  echo "✅ TNR passed — all tests OK"
  exit 0
else
  echo ""
  echo "⛔ TNR FAILED — commit blocked"
  echo "   Fix failing tests before committing."
  exit 1
fi
