import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dbPath = path.join(root, "data", "torphi-social.db");
const snapshotPath = path.join(root, "public", "source", "social", "twitter-snapshot.json");
const port = Number(process.env.TORPHI_SOCIAL_CONTROL_PORT || 8787);

let activeJob = null;
let lastJob = null;

function sendJson(response, status, data) {
  response.writeHead(status, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "content-type",
    "Content-Type": "application/json"
  });
  response.end(JSON.stringify(data));
}

function readRequest(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        request.destroy();
        reject(new Error("Request body too large"));
      }
    });
    request.on("end", () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
    request.on("error", reject);
  });
}

function normalizeHandle(handle) {
  return `${handle || ""}`.trim().replace(/^@/, "");
}

function safeInteger(value, fallback, min, max) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

function makeCaptureArgs(payload) {
  const args = ["scripts/torphi-social-capture.py"];
  const handle = normalizeHandle(payload.handle);
  const pages = safeInteger(payload.pages, 5, 1, 8);
  if (handle) {
    args.push("--handle", handle);
  } else {
    if (payload.country && payload.country !== "all") args.push("--country", payload.country);
    if (payload.ownerType && payload.ownerType !== "all") args.push("--owner-type", payload.ownerType);
    args.push("--all");
    if (payload.mode === "missing") {
      args.push("--only-under-tweet-count", `${safeInteger(payload.minimumTweets, pages * 20, 1, 500)}`);
    }
  }

  args.push("--pages", `${pages}`);
  args.push("--source", ["graphql", "syndication", "auto"].includes(payload.source) ? payload.source : "auto");
  args.push("--pause", `${Math.max(0, Math.min(10, Number(payload.pause ?? 0.7) || 0.7))}`);
  if (payload.includeReplies) args.push("--include-replies");
  const stopAfterRateLimits = payload.harvestMode && !handle
    ? 0
    : safeInteger(payload.stopAfterRateLimits, 6, 0, 100);
  args.push("--stop-after-rate-limits", `${stopAfterRateLimits}`);
  return args;
}

function runProcess(command, args, job, { appendOnly = false } = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: root,
      env: { ...process.env, PYTHONUNBUFFERED: "1" },
      stdio: ["ignore", "pipe", "pipe"]
    });
    if (!appendOnly) job.child = child;
    const append = (chunk) => {
      const text = chunk.toString();
      job.output += text;
      job.output = job.output.slice(-24000);
    };
    child.stdout.on("data", append);
    child.stderr.on("data", append);
    child.on("close", (code) => resolve(code));
    child.on("error", (error) => {
      append(`${error.message}\n`);
      resolve(1);
    });
  });
}

function runPublicSnapshotExport(job) {
  return new Promise((resolve) => {
    const child = spawn("python3", ["scripts/export-social-snapshot.py"], {
      cwd: root,
      env: { ...process.env, PYTHONUNBUFFERED: "1", TORPHI_SOCIAL_EXPORT_PUBLIC_ONLY: "1" },
      stdio: ["ignore", "pipe", "pipe"]
    });
    const append = (chunk) => {
      const text = chunk.toString();
      job.output += text;
      job.output = job.output.slice(-24000);
    };
    child.stdout.on("data", append);
    child.stderr.on("data", append);
    child.on("close", (code) => resolve(code));
    child.on("error", (error) => {
      append(`${error.message}\n`);
      resolve(1);
    });
  });
}

async function runCaptureJob(payload) {
  const job = {
    id: `${Date.now()}`,
    status: "running",
    startedAt: new Date().toISOString(),
    finishedAt: null,
    payload,
    command: "",
    output: "",
    child: null,
    captureExitCode: null,
    exportExitCode: null
  };
  const args = makeCaptureArgs(payload);
  job.command = `python3 -u ${args.map((arg) => JSON.stringify(arg)).join(" ")}`;
  activeJob = job;
  lastJob = job;

  const captureExitCode = await runProcess("python3", ["-u", ...args], job);
  job.captureExitCode = captureExitCode;

  if (job.status === "stopping") {
    job.status = "stopped";
  } else {
    job.output += "\n[TOR Phi] Exporting refreshed public social snapshot without touching src modules...\n";
    const exportExitCode = await runPublicSnapshotExport(job);
    job.exportExitCode = exportExitCode;
    job.status = captureExitCode === 0 && exportExitCode === 0 ? "completed" : "completed-with-errors";
  }

  job.finishedAt = new Date().toISOString();
  activeJob = null;
}

function querySql(sql) {
  return new Promise((resolve) => {
    if (!existsSync(dbPath)) return resolve([]);
    const child = spawn("sqlite3", ["-json", dbPath, sql], { cwd: root });
    let stdout = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.on("close", () => {
      try {
        resolve(stdout.trim() ? JSON.parse(stdout) : []);
      } catch {
        resolve([]);
      }
    });
    child.on("error", () => resolve([]));
  });
}

async function buildStatus() {
  const snapshot = await readSnapshot();
  const liveTotalRows = await querySql(`
    SELECT
      (SELECT COUNT(*) FROM accounts) AS accounts,
      (SELECT COUNT(*) FROM accounts WHERE status='captured') AS capturedAccounts,
      (SELECT COUNT(*) FROM accounts WHERE status='pending') AS pendingAccounts,
      (SELECT COUNT(*) FROM accounts WHERE status='error') AS errorAccounts,
      (SELECT COUNT(*) FROM tweets) AS tweets,
      (SELECT MAX(captured_at) FROM tweets) AS latestCapturedAt
  `);
  const accountRows = await querySql(`
    SELECT country_id AS countryId, owner_type AS ownerType, status, COUNT(*) AS count
    FROM accounts
    GROUP BY country_id, owner_type, status
    ORDER BY country_id, owner_type, status
  `);
  const recentErrors = await querySql(`
    SELECT handle, owner_name AS ownerName, country_id AS countryId, owner_type AS ownerType, last_error AS lastError
    FROM accounts
    WHERE status = 'error'
    ORDER BY updated_at DESC
    LIMIT 12
  `);
  const accounts = await querySql(`
    WITH tweet_counts AS (
      SELECT handle, COUNT(*) AS tweetCount, MAX(created_at_iso) AS latestTweetAt
      FROM tweets
      GROUP BY handle
    )
    SELECT
      a.handle,
      a.display_handle AS displayHandle,
      a.owner_name AS ownerName,
      a.country_id AS countryId,
      a.owner_type AS ownerType,
      a.role,
      a.profile_href AS profileHref,
      a.url,
      a.status,
      a.last_scraped_at AS lastScrapedAt,
      a.last_error AS lastError,
      COALESCE(t.tweetCount, 0) AS tweetCount,
      t.latestTweetAt
    FROM accounts a
    LEFT JOIN tweet_counts t ON t.handle = a.handle
    ORDER BY a.country_id, a.owner_type, a.owner_name, a.handle
  `);
  return {
    ok: true,
    server: "TOR Phi social control",
    port,
    activeJob: simplifyJob(activeJob),
    lastJob: simplifyJob(lastJob),
    snapshot: {
      generatedAt: snapshot.generatedAt,
      totals: snapshot.totals,
      auth: snapshot.auth,
      registry: snapshot.registry
    },
    liveTotals: liveTotalRows[0] ?? null,
    accountRows,
    accounts,
    recentErrors
  };
}

async function readSnapshot() {
  try {
    return JSON.parse(await readFile(snapshotPath, "utf8"));
  } catch {
    return {};
  }
}

function simplifyJob(job) {
  if (!job) return null;
  const parsed = parseJobOutput(job.output);
  return {
    id: job.id,
    status: job.status,
    startedAt: job.startedAt,
    finishedAt: job.finishedAt,
    payload: job.payload,
    command: job.command,
    captureExitCode: job.captureExitCode,
    exportExitCode: job.exportExitCode,
    parsed,
    output: job.output
  };
}

function parseJobOutput(output = "") {
  const progressMatches = [...output.matchAll(/Progress\s+(\d+)\/(\d+);\s+remaining\s+(\d+);\s+capturing\s+@([^\s]+)/g)];
  const completedMatches = [...output.matchAll(/Completed\s+(\d+)\/(\d+);\s+remaining\s+(\d+)/g)];
  const waitMatches = [...output.matchAll(/Rate limited by X;\s+waiting\s+(\d+)s\s+until\s+([0-9T:.\-Z]+)(?:\s+\(([^)]*attempt[^)]*)\))?/g)];
  const counterMatches = [...output.matchAll(/Rate-limit counter\s+([^;]+);\s+completed\s+(\d+)\/(\d+);\s+failed at\s+(\d+)\/(\d+);\s+remaining\s+(\d+);\s+suggested retry after\s+([0-9T:.\-Z]+)/g)];
  const lastProgress = progressMatches.at(-1);
  const lastCompleted = completedMatches.at(-1);
  const lastWait = waitMatches.at(-1);
  const lastCounter = counterMatches.at(-1);
  const total = Number(lastProgress?.[2] || lastCompleted?.[2] || lastCounter?.[3] || 0);
  const current = Number(lastProgress?.[1] || lastCounter?.[4] || lastCompleted?.[1] || 0);
  const completed = Number(lastCompleted?.[1] || lastCounter?.[2] || 0);
  const remaining = Number(lastProgress?.[3] || lastCompleted?.[3] || lastCounter?.[6] || 0);
  return {
    total,
    current,
    completed,
    remaining,
    currentHandle: lastProgress?.[4] || "",
    waitSeconds: Number(lastWait?.[1] || 0),
    waitUntil: lastWait?.[2] || lastCounter?.[7] || "",
    waitAttempt: lastWait?.[3] || "",
    rateLimitCounter: lastCounter?.[1] || "",
    failedAt: lastCounter ? Number(lastCounter[4]) : 0,
    isRateLimited: Boolean(lastWait || lastCounter || /HTTP Error 429|Too Many Requests/i.test(output)),
    stoppedForRateLimit: /Stopping after \d+ consecutive rate-limit errors/i.test(output)
  };
}

const server = createServer(async (request, response) => {
  if (request.method === "OPTIONS") return sendJson(response, 204, {});
  const url = new URL(request.url || "/", `http://127.0.0.1:${port}`);
  try {
    if (request.method === "GET" && url.pathname === "/status") {
      return sendJson(response, 200, await buildStatus());
    }
    if (request.method === "POST" && url.pathname === "/capture") {
      if (activeJob) return sendJson(response, 409, { ok: false, error: "A capture job is already running.", activeJob: simplifyJob(activeJob) });
      const payload = await readRequest(request);
      runCaptureJob(payload).catch((error) => {
        if (lastJob) {
          lastJob.status = "failed";
          lastJob.output += `\n${error.stack || error.message}\n`;
          lastJob.finishedAt = new Date().toISOString();
        }
        activeJob = null;
      });
      return sendJson(response, 202, { ok: true, activeJob: simplifyJob(activeJob) });
    }
    if (request.method === "POST" && url.pathname === "/stop") {
      if (activeJob?.child) {
        activeJob.status = "stopping";
        activeJob.child.kill("SIGINT");
        return sendJson(response, 200, { ok: true, activeJob: simplifyJob(activeJob) });
      }
      return sendJson(response, 200, { ok: true, activeJob: null });
    }
    return sendJson(response, 404, { ok: false, error: "Not found" });
  } catch (error) {
    return sendJson(response, 500, { ok: false, error: error.message });
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`[TOR Phi] Social control server listening on http://127.0.0.1:${port}`);
});
