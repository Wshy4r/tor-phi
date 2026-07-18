import { createServer } from "node:http";
import { spawn } from "node:child_process";

const port = Number(process.env.TORPHI_GITHUB_STATUS_PORT || 8788);
const repo = process.env.TORPHI_GITHUB_REPO || "Wshy4r/tor-phi";
const workflow = process.env.TORPHI_GITHUB_WORKFLOW || "TOR Phi Social Harvest";

function sendJson(response, status, data) {
  response.writeHead(status, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "content-type",
    "Content-Type": "application/json"
  });
  response.end(JSON.stringify(data));
}

function runGh(args) {
  return new Promise((resolve) => {
    const child = spawn("gh", args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("close", (code) => resolve({ code, stdout, stderr }));
    child.on("error", (error) => resolve({ code: 1, stdout, stderr: error.message }));
  });
}

async function githubStatus() {
  const fields = "databaseId,status,conclusion,displayTitle,event,createdAt,updatedAt,url,headBranch";
  const result = await runGh(["run", "list", "--repo", repo, "--workflow", workflow, "--limit", "5", "--json", fields]);
  if (result.code !== 0) {
    return {
      ok: false,
      repo,
      workflow,
      error: result.stderr.trim() || "GitHub CLI failed. Check gh auth status.",
      runs: []
    };
  }

  let runs = [];
  try {
    runs = JSON.parse(result.stdout || "[]");
  } catch {
    return { ok: false, repo, workflow, error: "GitHub CLI returned invalid JSON.", runs: [] };
  }

  return {
    ok: true,
    repo,
    workflow,
    checkedAt: new Date().toISOString(),
    latest: runs[0] ?? null,
    runs
  };
}

const server = createServer(async (request, response) => {
  if (request.method === "OPTIONS") return sendJson(response, 204, {});
  const url = new URL(request.url || "/", `http://127.0.0.1:${port}`);
  if (request.method === "GET" && url.pathname === "/github-status") {
    return sendJson(response, 200, await githubStatus());
  }
  return sendJson(response, 404, { ok: false, error: "Not found" });
});

server.listen(port, "127.0.0.1", () => {
  console.log(`[TOR Phi] GitHub status server listening on http://127.0.0.1:${port}`);
});
