#!/bin/bash
set -e
echo "=== Build script started ==="
node -v
npm -v
echo "=== Installing dependencies ==="
npm ci --no-audit --no-fund
echo "=== Dependencies installed ==="
echo "=== Building Next.js ==="
NODE_OPTIONS=--max-old-space-size=2048 npm run build
echo "=== Build complete ==="
