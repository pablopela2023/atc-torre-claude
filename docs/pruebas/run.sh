#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
if [[ ! -d node_modules/puppeteer-core ]]; then
  npm install --no-fund --no-audit --loglevel=error
fi
exec node test_atc.mjs "$@"
