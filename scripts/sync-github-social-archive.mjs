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

function runOptional(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, ...options.env }
  });
  return result.status === 0;
}

async function localSocialCaptureIsRunning() {
  if (process.env.TORPHI_SYNC_FORCE === "1") return false;
  try {
    const response = await fetch("http://127.0.0.1:8787/status", { signal: AbortSignal.timeout(5000) });
    if (!response.ok) return true;
    const status = await response.json();
    return Boolean(status.activeJob);
  } catch {
    return true;
  }
}

async function localDevServerIsRunning() {
  if (process.env.TORPHI_SYNC_EXPORT_WHILE_DEV === "1") return false;
  for (const url of ["http://127.0.0.1:5173", "http://localhost:5173"]) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(1500) });
      if (response.ok) return true;
    } catch {
      // Keep checking the next local dev URL.
    }
  }
  return false;
}

if (!existsSync(path.join(root, ".git"))) {
  console.error("[TOR Phi] This folder is not a Git checkout yet. Push TOR Phi to GitHub, then run this sync.");
  process.exit(1);
}

run("git", ["pull", "--rebase", "--autostash"]);
if (await localSocialCaptureIsRunning()) {
  console.log("[TOR Phi] Local social capture is active; pulled GitHub archive but skipped SQLite import/export for this sync tick.");
  process.exit(0);
}
if (await localDevServerIsRunning()) {
  console.log("[TOR Phi] Local dev server is active; pulled GitHub archive but skipped browser-facing social exports to prevent reloads.");
  process.exit(0);
}
run("python3", ["scripts/import-social-archive-jsonl.py"]);
run("python3", ["scripts/export-social-snapshot.py"]);
run("python3", ["scripts/export-social-archive-jsonl.py"]);
run("git", ["add", "social-archive", "public/source/social", "src/socialAccountRegistry.js"]);
if (runOptional("git", ["diff", "--cached", "--quiet"])) {
  console.log("[TOR Phi] Local social archive already matches GitHub.");
} else {
  run("git", ["commit", "-m", "Sync local TOR Phi social archive [skip ci]"]);
  run("git", ["pull", "--rebase", "--autostash"]);
  run("git", ["push"]);
}
console.log("[TOR Phi] Local and GitHub social archives are synced.");
