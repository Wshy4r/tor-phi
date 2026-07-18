const controlUrl = process.env.TORPHI_SOCIAL_CONTROL_URL || "http://127.0.0.1:8787";
const cooldownSeconds = Number(process.env.TORPHI_SOCIAL_HARVEST_COOLDOWN_SECONDS || 180);
const pollSeconds = Number(process.env.TORPHI_SOCIAL_HARVEST_POLL_SECONDS || 20);

const payload = {
  country: process.env.TORPHI_SOCIAL_HARVEST_COUNTRY || "usa",
  ownerType: process.env.TORPHI_SOCIAL_HARVEST_OWNER_TYPE || "Congress",
  mode: "missing",
  minimumTweets: Number(process.env.TORPHI_SOCIAL_HARVEST_MINIMUM_TWEETS || 500),
  pages: Number(process.env.TORPHI_SOCIAL_HARVEST_PAGES || 25),
  source: process.env.TORPHI_SOCIAL_HARVEST_SOURCE || "auto",
  pause: Number(process.env.TORPHI_SOCIAL_HARVEST_PAUSE || 0.7),
  harvestMode: true
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getStatus() {
  const response = await fetch(`${controlUrl}/status`);
  if (!response.ok) throw new Error(`status ${response.status}`);
  return response.json();
}

async function startCapture() {
  const response = await fetch(`${controlUrl}/capture`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await response.json().catch(() => ({}));
  if (response.status === 409) return data;
  if (!response.ok) throw new Error(data.error || `capture ${response.status}`);
  return data;
}

function outputHasNoTargets(job) {
  return /Capture targets:\s+0\b/.test(job?.output || "");
}

function summarize(job) {
  const parsed = job?.parsed || {};
  return `status=${job?.status || "unknown"} completed=${parsed.completed || 0}/${parsed.total || 0} remaining=${parsed.remaining || 0}`;
}

while (true) {
  try {
    const status = await getStatus();
    if (status.activeJob) {
      console.log(`[TOR Phi] Harvest loop: capture already active; ${summarize(status.activeJob)}.`);
      while (true) {
        await sleep(pollSeconds * 1000);
        const nextStatus = await getStatus();
        if (!nextStatus.activeJob) {
          console.log(`[TOR Phi] Harvest loop: active capture finished; ${summarize(nextStatus.lastJob)}.`);
          break;
        }
        console.log(`[TOR Phi] Harvest loop: ${summarize(nextStatus.activeJob)}.`);
      }
    } else if (outputHasNoTargets(status.lastJob)) {
      console.log(`[TOR Phi] Harvest loop: target appears complete. Sleeping ${cooldownSeconds}s before checking again.`);
      await sleep(cooldownSeconds * 1000);
    } else {
      const started = await startCapture();
      console.log(`[TOR Phi] Harvest loop: started capture ${started.activeJob?.id || ""}; ${summarize(started.activeJob)}.`);
    }
  } catch (error) {
    console.log(`[TOR Phi] Harvest loop: ${error.message}. Retrying in ${cooldownSeconds}s.`);
    await sleep(cooldownSeconds * 1000);
  }

  await sleep(cooldownSeconds * 1000);
}
