#!/bin/bash
set -e
echo "=== Start wrapper ==="
echo "Node: $(node -v)"
echo "PORT: $PORT"
echo "PWD: $(pwd)"

# Check build exists
echo "=== .next contents ==="
ls -la .next/ | head -15
echo "=== .next/server ==="
ls -la .next/server/ 2>/dev/null | head -10
echo "=== node_modules next ==="
ls node_modules/.bin/next 2>/dev/null && echo "next binary found" || echo "next binary MISSING"

echo "=== Starting next server ==="
NODE_OPTIONS="--max-old-space-size=320" node node_modules/next/dist/bin/next start -p ${PORT:-3000} -H 0.0.0.0 2>&1
echo "=== Server exited ==="
