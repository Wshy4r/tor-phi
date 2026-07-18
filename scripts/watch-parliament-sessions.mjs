import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const intervalMs = Number(process.env.PARLIAMENT_SESSION_WATCH_INTERVAL_MS || "60000");
const fullRefreshIntervalMs = Number(process.env.PARLIAMENT_SESSION_SOURCE_REFRESH_INTERVAL_MS || "1800000");
const refreshSources = process.env.PARLIAMENT_SESSION_REFRESH_SOURCES === "1";
const once = process.argv.includes("--once");

let running = false;
let lastFullRefreshAt = 0;

console.log(`[TOR Phi] Parliament session watcher started. Interval: ${Math.round(intervalMs / 1000)}s. Live sources: on. Full source refresh: ${refreshSources ? "on" : "off"}.`);

await refreshLoop();

if (!once) {
  setInterval(refreshLoop, intervalMs);
}

async function refreshLoop() {
  if (running) {
    console.log("[TOR Phi] Previous parliament session refresh is still running; skipping this tick.");
    return;
  }
  running = true;

  try {
    const now = Date.now();
    if (refreshSources && now - lastFullRefreshAt >= fullRefreshIntervalMs) {
      await refreshSourceArchives();
      lastFullRefreshAt = Date.now();
    }

    await runNodeScript("scripts/import-parliament-sessions.mjs", {
      PARLIAMENT_SESSIONS_LIVE: "1",
      PARLIAMENT_SESSIONS_WRITE_MODULE: "0"
    });
    console.log(`[TOR Phi] Parliament sessions refreshed at ${new Date().toLocaleString()}.`);
  } catch (error) {
    console.error(`[TOR Phi] Parliament session refresh failed: ${error.message}`);
  } finally {
    running = false;
  }
}

async function refreshSourceArchives() {
  console.log("[TOR Phi] Running deeper parliament source refresh...");
  const commands = [
    ["scripts/generate-uk-parliament.mjs", {}],
    ["scripts/generate-france-parliament.mjs", {}],
    ["scripts/import-us-congress-official.mjs", {
      US_CONGRESS_HOUSE_VOTE_PAGES: process.env.US_CONGRESS_HOUSE_VOTE_PAGES || "1"
    }]
  ];

  for (const [script, env] of commands) {
    await runNodeScript(script, env);
  }
}

function runNodeScript(script, env = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script], {
      cwd: rootDir,
      env: { ...process.env, ...env },
      stdio: ["ignore", "pipe", "pipe"]
    });
    child.stdout.on("data", (chunk) => process.stdout.write(chunk));
    child.stderr.on("data", (chunk) => process.stderr.write(chunk));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${script} exited with code ${code}`));
    });
  });
}
