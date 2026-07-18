import { spawn } from "node:child_process";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

function torPhiParliamentSessionRefresh() {
  let timer = null;
  let running = false;
  const intervalMs = Number(process.env.PARLIAMENT_SESSION_WATCH_INTERVAL_MS || "60000");

  const refresh = () => {
    if (process.env.PARLIAMENT_SESSION_AUTOREFRESH === "0") return;
    if (running) return;
    running = true;

    const child = spawn(process.execPath, ["scripts/import-parliament-sessions.mjs"], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        PARLIAMENT_SESSIONS_LIVE: "1",
        PARLIAMENT_SESSIONS_WRITE_MODULE: "0"
      },
      stdio: ["ignore", "pipe", "pipe"]
    });

    child.stdout.on("data", (chunk) => process.stdout.write(`[parliament] ${chunk}`));
    child.stderr.on("data", (chunk) => process.stderr.write(`[parliament] ${chunk}`));
    child.on("close", () => {
      running = false;
    });
    child.on("error", (error) => {
      running = false;
      console.error(`[parliament] ${error.message}`);
    });
  };

  return {
    name: "tor-phi-parliament-session-refresh",
    configureServer(server) {
      refresh();
      timer = setInterval(refresh, intervalMs);
      server.httpServer?.once("close", () => {
        if (timer) clearInterval(timer);
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), torPhiParliamentSessionRefresh()]
});
