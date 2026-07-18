#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
PLIST="$HOME/Library/LaunchAgents/com.torphi.github-social-sync.plist"

mkdir -p "$HOME/Library/LaunchAgents"

cat > "$PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.torphi.github-social-sync</string>
  <key>ProgramArguments</key>
  <array>
    <string>$ROOT/sync-github-social.command</string>
  </array>
  <key>WorkingDirectory</key>
  <string>$ROOT</string>
  <key>StartInterval</key>
  <integer>300</integer>
  <key>RunAtLoad</key>
  <true/>
  <key>StandardOutPath</key>
  <string>$ROOT/data/github-social-sync.log</string>
  <key>StandardErrorPath</key>
  <string>$ROOT/data/github-social-sync.err.log</string>
</dict>
</plist>
EOF

launchctl unload "$PLIST" >/dev/null 2>&1 || true
launchctl load "$PLIST"
echo "TOR Phi GitHub social sync installed. It runs every 5 minutes while this Mac is awake."
