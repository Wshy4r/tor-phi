#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, ...options.env }
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

async function localSocialCaptureIsRunning() {
  if (process.env.TORPHI_SYNC_FORCE === "1") return false;
  try {
    const response = await fetch("http://127.0.0.1:8787/status", { signal: AbortSignal.timeout(1500) });
    if (!response.ok) return false;
    const status = await response.json();
    return Boolean(status.activeJob);
  } catch {
    return false;
  }
}

if (!existsSync(path.join(root, ".git"))) {
  console.error("[TOR Phi] This folder is not a Git checkout yet. Push TOR Phi to GitHub, then run this sync.");
  process.exit(1);
}

run("git", ["pull", "--rebase"]);
if (await localSocialCaptureIsRunning()) {
  console.log("[TOR Phi] Local social capture is active; pulled GitHub archive but skipped SQLite import for this sync tick.");
  process.exit(0);
}
run("python3", ["scripts/import-social-archive-jsonl.py"]);
run("python3", ["scripts/export-social-snapshot.py"]);
console.log("[TOR Phi] Local social archive synced from GitHub and imported into SQLite.");
