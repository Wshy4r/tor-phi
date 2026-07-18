#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"
node scripts/sync-github-social-archive.mjs
