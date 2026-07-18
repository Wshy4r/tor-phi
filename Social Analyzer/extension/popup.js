// Popup script - controls for the Twitter Analyzer extension

document.addEventListener("DOMContentLoaded", () => {
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

  let activeTab = "user";

  // ── Tab switching ──
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      activeTab = tab.dataset.tab;
      document.querySelectorAll(".tab-content").forEach((c) => (c.style.display = "none"));
      document.getElementById(`tab-${activeTab}`).style.display = "block";
    });
  });

  // ── Start capture ──
  startBtn.addEventListener("click", () => {
    let message;

    if (activeTab === "user") {
      const username = document.getElementById("username").value.trim();
      if (!username) {
        progressText.textContent = "Enter a username first!";
        return;
      }
      message = {
        type: "START_CAPTURE_USER",
        username,
        maxPages: parseInt(document.getElementById("maxPagesUser").value) || 100,
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
        maxPages: parseInt(document.getElementById("maxPagesSearch").value) || 50,
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
        maxPages: parseInt(document.getElementById("maxPagesLikes").value) || 50,
      };
    }

    chrome.runtime.sendMessage(message, (response) => {
      if (response?.error) {
        progressText.textContent = response.error;
      } else {
        startBtn.style.display = "none";
        stopBtn.style.display = "block";
        progressText.textContent = "Starting...";
      }
    });
  });

  // ── Stop capture ──
  stopBtn.addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "STOP_CAPTURE" }, () => {
      startBtn.style.display = "block";
      stopBtn.style.display = "none";
      progressText.textContent = "Stopping...";
    });
  });

  // ── Export to JSON ──
  exportBtn.addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "EXPORT_LOCAL" }, (data) => {
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
    });
  });

  // ── Reset ──
  resetBtn.addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "RESET_STATS" }, () => {
      chrome.storage.local.set({ storedTweets: [] }, () => {
        tweetsCount.textContent = "0";
        pagesCount.textContent = "0";
        dupsCount.textContent = "0";
        errorsCount.textContent = "0";
        progressText.textContent = "Reset complete";
      });
    });
  });

  // ── Status updates from background ──
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "STATUS_UPDATE") {
      progressText.textContent = message.message;
      if (message.stats) {
        updateStats(message.stats);
      }

      // Check if capture is done
      if (
        message.stats?.status === "complete" ||
        message.stats?.status === "stopped" ||
        message.stats?.status === "error"
      ) {
        startBtn.style.display = "block";
        stopBtn.style.display = "none";
        statusDot.classList.remove("capturing");
      }
    }
  });

  function updateStats(stats) {
    tweetsCount.textContent = (stats.newTweets || 0).toLocaleString();
    pagesCount.textContent = stats.currentPage || 0;
    dupsCount.textContent = stats.duplicates || 0;
    errorsCount.textContent = stats.errors || 0;
  }

  // ── Poll for status ──
  function pollStatus() {
    chrome.runtime.sendMessage({ type: "GET_STATS" }, (response) => {
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
        startBtn.style.display = "block";
        stopBtn.style.display = "none";
      }
    });
  }

  // Poll every 2 seconds
  pollStatus();
  setInterval(pollStatus, 2000);
});
