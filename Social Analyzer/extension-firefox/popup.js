// Popup script - controls for the Twitter Analyzer extension

document.addEventListener("DOMContentLoaded", () => {
  const extApi = typeof browser !== "undefined" ? browser : chrome;
  const statusDot = document.getElementById("statusDot");
  const statusText = document.getElementById("statusText");
  const startBtn = document.getElementById("startBtn");
  const stopBtn = document.getElementById("stopBtn");
  const tweetsCount = document.getElementById("tweetsCount");
  const pagesCount = document.getElementById("pagesCount");
  const dupsCount = document.getElementById("dupsCount");
  const errorsCount = document.getElementById("errorsCount");
  const progressText = document.getElementById("progressText");
  const exportBtn = document.getElementById("exportBtn");
  const resetBtn = document.getElementById("resetBtn");
  const detectedAccount = document.getElementById("detectedAccount");
  const useCurrentProfileBtn = document.getElementById("useCurrentProfileBtn");
  const usernameInput = document.getElementById("username");
  const likesUsernameInput = document.getElementById("likesUsername");
  const autoScrollUser = document.getElementById("autoScrollUser");

  let activeTab = "user";
  let currentTabInfo = null;
  let resumableAutoScroll = null;

  function sendRuntimeMessage(message) {
    if (typeof browser !== "undefined" && browser.runtime?.sendMessage) {
      return browser.runtime.sendMessage(message);
    }
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        const err = chrome.runtime && chrome.runtime.lastError;
        if (err) {
          reject(new Error(err.message));
          return;
        }
        resolve(response);
      });
    });
  }

  function queryActiveTab() {
    if (typeof browser !== "undefined" && browser.tabs?.query) {
      return browser.tabs.query({ active: true, currentWindow: true });
    }
    return new Promise((resolve, reject) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const err = chrome.runtime && chrome.runtime.lastError;
        if (err) {
          reject(new Error(err.message));
          return;
        }
        resolve(tabs || []);
      });
    });
  }

  function setLocalStorage(values) {
    if (typeof browser !== "undefined" && browser.storage?.local?.set) {
      return browser.storage.local.set(values);
    }
    return new Promise((resolve, reject) => {
      chrome.storage.local.set(values, () => {
        const err = chrome.runtime && chrome.runtime.lastError;
        if (err) {
          reject(new Error(err.message));
          return;
        }
        resolve();
      });
    });
  }

  function optionalPageCount(id) {
    const raw = document.getElementById(id).value.trim();
    if (!raw) return null;
    const parsed = parseInt(raw, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function setStartButtonLabel() {
    const typedUsername = normalizeUsernameForCompare(usernameInput.value);
    const resumeAvailable =
      activeTab === "user" &&
      autoScrollUser.checked &&
      resumableAutoScroll &&
      resumableAutoScroll.resumable &&
      typedUsername &&
      typedUsername === normalizeUsernameForCompare(resumableAutoScroll.username);
    startBtn.textContent = resumeAvailable ? "Resume Capture" : "Start Capture";
  }

  function normalizeUsernameForCompare(username) {
    return (username || "").replace(/^@/, "").trim().toLowerCase();
  }

  function parseTwitterUsername(urlString) {
    try {
      const url = new URL(urlString);
      if (!["x.com", "www.x.com", "twitter.com", "www.twitter.com"].includes(url.hostname)) {
        return null;
      }
      const parts = url.pathname.split("/").filter(Boolean);
      if (!parts.length) return null;
      const blocked = new Set([
        "home",
        "explore",
        "search",
        "notifications",
        "messages",
        "compose",
        "i",
        "settings",
        "login",
        "signup",
        "tos",
        "privacy",
        "share"
      ]);
      const candidate = parts[0];
      if (blocked.has(candidate.toLowerCase())) return null;
      if (!/^[A-Za-z0-9_]{1,15}$/.test(candidate)) return null;
      return candidate;
    } catch {
      return null;
    }
  }

  async function useCurrentAccountFromTab() {
    try {
      const tabs = await queryActiveTab();
      const current = tabs[0];
      currentTabInfo = current || null;
      const username = current?.url ? parseTwitterUsername(current.url) : null;
      if (username) {
        usernameInput.value = username;
        likesUsernameInput.value = username;
        detectedAccount.innerHTML = `Using current profile: <strong>@${username}</strong>`;
        setStartButtonLabel();
      } else {
        currentTabInfo = null;
        detectedAccount.textContent = "Open an X/Twitter profile tab, then click Use Current Profile.";
      }
    } catch (e) {
      currentTabInfo = null;
      detectedAccount.textContent = "Could not read the current tab. Open an X/Twitter profile and click Use Current Profile.";
    }
  }

  useCurrentProfileBtn.addEventListener("click", () => {
    detectedAccount.textContent = "Checking current tab...";
    useCurrentAccountFromTab();
  });

  usernameInput.addEventListener("input", setStartButtonLabel);
  autoScrollUser.addEventListener("change", setStartButtonLabel);

  // ── Tab switching ──
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      activeTab = tab.dataset.tab;
      document.querySelectorAll(".tab-content").forEach((c) => (c.style.display = "none"));
      document.getElementById(`tab-${activeTab}`).style.display = "block";
      setStartButtonLabel();
    });
  });

  // ── Start capture ──
  startBtn.addEventListener("click", async () => {
    let message;

    if (activeTab === "user") {
      const username = document.getElementById("username").value.trim();
      if (!username) {
        progressText.textContent = "Enter a username first!";
        return;
      }

      let tabId = currentTabInfo?.id ?? null;
      let pageUrl = currentTabInfo?.url ?? null;

      if (autoScrollUser.checked) {
        try {
          const tabs = await queryActiveTab();
          const current = tabs[0];
          const detectedUsername = current?.url ? parseTwitterUsername(current.url) : null;
          if (!current || !detectedUsername) {
            progressText.textContent = "Open the target X profile tab before starting auto-scroll capture.";
            return;
          }
          if (detectedUsername.toLowerCase() !== username.replace(/^@/, "").toLowerCase()) {
            progressText.textContent = `Current tab is @${detectedUsername}, but capture is set to @${username.replace(/^@/, "")}.`;
            return;
          }
          currentTabInfo = current;
          tabId = current.id ?? null;
          pageUrl = current.url ?? null;
          detectedAccount.innerHTML = `Locked to current profile: <strong>@${detectedUsername}</strong>`;
        } catch (error) {
          progressText.textContent = error.message || "Could not read the current X tab";
          return;
        }
      }

      message = {
        type: "START_CAPTURE_USER",
        username,
        maxPages: optionalPageCount("maxPagesUser"),
        autoScroll: !!autoScrollUser.checked,
        tabId,
        pageUrl,
        resumeAutoScroll:
          !!autoScrollUser.checked &&
          !!resumableAutoScroll &&
          resumableAutoScroll.resumable &&
          normalizeUsernameForCompare(resumableAutoScroll.username) === normalizeUsernameForCompare(username) &&
          resumableAutoScroll.tabId === tabId,
      };
    } else if (activeTab === "search") {
      const query = document.getElementById("searchQuery").value.trim();
      if (!query) {
        progressText.textContent = "Enter a search query first!";
        return;
      }
      message = {
        type: "START_CAPTURE_SEARCH",
        query,
        maxPages: optionalPageCount("maxPagesSearch"),
      };
    } else if (activeTab === "likes") {
      const username = document.getElementById("likesUsername").value.trim();
      if (!username) {
        progressText.textContent = "Enter a username first!";
        return;
      }
      message = {
        type: "START_CAPTURE_LIKES",
        username,
        maxPages: optionalPageCount("maxPagesLikes"),
      };
    }

    sendRuntimeMessage(message).then((response) => {
      if (response?.error) {
        progressText.textContent = response.error;
      } else {
        startBtn.style.display = "none";
        stopBtn.style.display = "block";
        progressText.textContent = response?.resumed ? "Resuming..." : "Starting...";
      }
    }).catch((error) => {
      progressText.textContent = error.message || "Failed to start capture";
    });
  });

  // ── Stop capture ──
  stopBtn.addEventListener("click", () => {
    progressText.textContent = "Stopping...";
    sendRuntimeMessage({ type: "STOP_CAPTURE" }).then(() => {
      startBtn.style.display = "block";
      stopBtn.style.display = "none";
      progressText.textContent = "Stopped";
    }).catch((error) => {
      startBtn.style.display = "block";
      stopBtn.style.display = "none";
      progressText.textContent = error.message || "Stopped";
    });
  });

  // ── Export to JSON ──
  exportBtn.addEventListener("click", () => {
    sendRuntimeMessage({ type: "EXPORT_LOCAL" }).then((data) => {
      if (!data || data.count === 0) {
        progressText.textContent = "No tweets to export";
        return;
      }

      const blob = new Blob([JSON.stringify(data.tweets, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `twitter_capture_${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      progressText.textContent = `Exported ${data.count} tweets`;
    }).catch((error) => {
      progressText.textContent = error.message || "Export failed";
    });
  });

  // ── Reset ──
  resetBtn.addEventListener("click", () => {
    sendRuntimeMessage({ type: "RESET_STATS" }).then(() => {
      return setLocalStorage({ storedTweets: [] });
    }).then(() => {
      tweetsCount.textContent = "0";
      pagesCount.textContent = "0";
      dupsCount.textContent = "0";
      errorsCount.textContent = "0";
      progressText.textContent = "Reset complete";
    }).catch((error) => {
      progressText.textContent = error.message || "Reset failed";
    });
  });

  // ── Status updates from background ──
  extApi.runtime.onMessage.addListener((message) => {
    if (message.type === "STATUS_UPDATE") {
      progressText.textContent = message.message;
      if (message.stats) {
        updateStats(message.stats);
      }

      // Check if capture is done
      if (
        message.stats?.status === "complete" ||
        message.stats?.status === "stopped" ||
        message.stats?.status === "error" ||
        message.stats?.status === "paused"
      ) {
        startBtn.style.display = "block";
        stopBtn.style.display = "none";
        statusDot.classList.remove("capturing");
        setStartButtonLabel();
      }
    }
  });

  function updateStats(stats) {
    tweetsCount.textContent = (stats.newTweets || 0).toLocaleString();
    pagesCount.textContent = stats.currentPage || 0;
    dupsCount.textContent = stats.duplicates || 0;
    errorsCount.textContent = stats.errors || 0;
    if (stats.errorMessage) {
      progressText.textContent = stats.errorMessage;
    }
  }

  // ── Poll for status ──
  function pollStatus() {
    sendRuntimeMessage({ type: "GET_STATS" }).then((response) => {
      if (!response) return;

      // Backend status
      if (response.backendConnected) {
        statusDot.classList.add("connected");
        statusText.textContent = `Backend connected | ${response.totalStored} tweets stored`;
      } else {
        statusDot.classList.remove("connected");
        statusText.textContent = "Backend offline (tweets saved locally)";
      }

      // Capture status
      if (response.isCapturing) {
        statusDot.classList.add("capturing");
        startBtn.style.display = "none";
        stopBtn.style.display = "block";
        if (response.stats) updateStats(response.stats);
      } else {
        statusDot.classList.remove("capturing");
        resumableAutoScroll = response.resumableAutoScroll || null;
        startBtn.style.display = "block";
        stopBtn.style.display = "none";
        if (response.stats?.status === "error" && response.stats?.errorMessage) {
          progressText.textContent = response.stats.errorMessage;
        } else if (response.stats?.status === "paused") {
          progressText.textContent = `Paused: ${response.stats?.newTweets || 0} tweets captured. Click Resume.`;
        } else if (response.stats?.status === "complete" && response.stats?.newTweets != null) {
          progressText.textContent = `Finished: ${response.stats.newTweets} tweets captured`;
        } else if (response.stats?.status === "stopped") {
          progressText.textContent = "Stopped";
        }
        setStartButtonLabel();
      }
    }).catch(() => {
      statusDot.classList.remove("capturing");
      startBtn.style.display = "block";
      stopBtn.style.display = "none";
      setStartButtonLabel();
    });
  }

  // Poll every 2 seconds
  pollStatus();
  setInterval(pollStatus, 2000);
});
