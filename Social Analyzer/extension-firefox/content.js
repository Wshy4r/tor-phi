// Content script - injects fetch interceptor and captures query IDs from live traffic

(function () {
  "use strict";

  let autoScrollTimer = null;
  let autoScrollStep = 0;
  let lastScrollHeight = 0;
  let stagnantTicks = 0;
  let captureActive = false;
  let lockedUsername = null;

  function normalizeUsername(username) {
    return (username || "").replace(/^@/, "").trim().toLowerCase();
  }

  function currentPageUsername() {
    try {
      const parts = window.location.pathname.split("/").filter(Boolean);
      return normalizeUsername(parts[0] || "");
    } catch {
      return "";
    }
  }

  function getScrollRoot() {
    return document.scrollingElement || document.documentElement || document.body;
  }

  function getScrollHeight() {
    const root = getScrollRoot();
    return Math.max(
      root?.scrollHeight || 0,
      document.body?.scrollHeight || 0,
      document.documentElement?.scrollHeight || 0
    );
  }

  function jumpToBottom() {
    const root = getScrollRoot();
    const targetTop = getScrollHeight();

    if (root) {
      root.scrollTop = targetTop;
    }
    window.scrollTo(0, targetTop);
    window.dispatchEvent(new Event("scroll"));
  }

  // ── Inject the fetch interceptor into the page context ──
  const script = document.createElement("script");
  script.src = chrome.runtime.getURL("injected.js");
  script.onload = () => script.remove();
  (document.head || document.documentElement).appendChild(script);

  // ── Listen for intercepted API responses ──
  window.addEventListener("message", (event) => {
    if (event.source !== window) return;

    if (event.data?.type === "TWITTER_ANALYZER_API_RESPONSE") {
      // Only forward captured payloads while this exact profile tab is actively locked for capture.
      if (captureActive && lockedUsername && currentPageUsername() === lockedUsername) {
        chrome.runtime.sendMessage(
          {
            type: "CAPTURED_API_RESPONSE",
            endpoint: event.data.endpoint,
            url: event.data.url,
            data: event.data.data,
            timestamp: event.data.timestamp,
            pageUrl: window.location.href,
          },
          () => {}
        );
      }

      // Extract and store the query ID from the URL
      const url = event.data.url;
      const match = url.match(/\/graphql\/([^/]+)\/([^?]+)/);
      if (match) {
        chrome.runtime.sendMessage(
          {
            type: "STORE_QUERY_ID",
            queryId: match[1],
            operationName: match[2],
          },
          () => {}
        );
      }
    }
  });

  function stopAutoScroll(notify = true, reason = "paused") {
    if (autoScrollTimer) {
      clearInterval(autoScrollTimer);
      autoScrollTimer = null;
    }
    captureActive = false;
    lockedUsername = null;
    if (notify) {
      chrome.runtime.sendMessage({ type: "AUTO_SCROLL_DONE", reason }, () => {});
    }
  }

  function startAutoScroll(options = {}) {
    stopAutoScroll(false);
    autoScrollStep = options.resume ? (options.resumeStep || autoScrollStep || 0) : 0;
    lastScrollHeight = getScrollHeight();
    stagnantTicks = 0;

    jumpToBottom();

    autoScrollTimer = setInterval(() => {
      autoScrollStep += 1;
      jumpToBottom();

      chrome.runtime.sendMessage(
        { type: "AUTO_SCROLL_STATUS", step: autoScrollStep, pageUrl: window.location.href },
        () => {}
      );

      const currentHeight = getScrollHeight();

      if (currentHeight <= lastScrollHeight + 20) {
        stagnantTicks += 1;
      } else {
        stagnantTicks = 0;
        lastScrollHeight = currentHeight;
      }

      if (stagnantTicks >= 6) {
        stopAutoScroll(true, "paused");
      }
    }, 2500);
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "START_AUTO_SCROLL_CAPTURE") {
      captureActive = true;
      lockedUsername = normalizeUsername(message.username);
      startAutoScroll({
        resume: !!message.resume,
        resumeStep: message.resumeStep || 0,
      });
      sendResponse({ started: true, resumed: !!message.resume });
      return true;
    }
    if (message.type === "STOP_AUTO_SCROLL_CAPTURE") {
      stopAutoScroll(true, "stopped");
      sendResponse({ stopped: true, step: autoScrollStep });
      return true;
    }
    return false;
  });

  console.log("[Twitter Analyzer] Content script loaded");
})();
