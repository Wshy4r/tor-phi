#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
PLIST="$HOME/Library/LaunchAgents/com.torphi.github-social-sync.plist"

launchctl unload "$PLIST" >/dev/null 2>&1 || true
rm "$PLIST" >/dev/null 2>&1 || true

rm "$ROOT/.github/workflows/social-harvest.yml" >/dev/null 2>&1 || true
rm "$ROOT/scripts/export-social-archive-jsonl.py" >/dev/null 2>&1 || true
rm "$ROOT/scripts/import-social-archive-jsonl.py" >/dev/null 2>&1 || true
rm "$ROOT/scripts/sync-github-social-archive.mjs" >/dev/null 2>&1 || true
rm "$ROOT/sync-github-social.command" >/dev/null 2>&1 || true
rm "$ROOT/install-github-social-sync.command" >/dev/null 2>&1 || true
rm -r "$ROOT/social-archive" >/dev/null 2>&1 || true
node - "$ROOT/package.json" <<'NODE'
const fs = require("fs");
const path = process.argv[2];
if (!fs.existsSync(path)) process.exit(0);
const pkg = JSON.parse(fs.readFileSync(path, "utf8"));
for (const key of ["export:social-archive", "import:social-archive", "sync:github-social"]) {
  delete pkg.scripts[key];
}
fs.writeFileSync(path, JSON.stringify(pkg, null, 2) + "\n");
NODE
rm "$ROOT/remove-github-social-plan.command" >/dev/null 2>&1 || true

echo "TOR Phi GitHub social plan removed. Existing local SQLite data and app files were left in place."
