// Content script - injects fetch interceptor and captures query IDs from live traffic

(function () {
  "use strict";

  // ── Inject the fetch interceptor into the page context ──
  const script = document.createElement("script");
  script.src = chrome.runtime.getURL("injected.js");
  script.onload = () => script.remove();
  (document.head || document.documentElement).appendChild(script);

  // ── Listen for intercepted API responses ──
  window.addEventListener("message", (event) => {
    if (event.source !== window) return;

    if (event.data?.type === "TWITTER_ANALYZER_API_RESPONSE") {
      // Forward to background for processing (fallback capture mode)
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

  console.log("[Twitter Analyzer] Content script loaded");
})();
