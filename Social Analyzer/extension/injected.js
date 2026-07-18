// This script runs in the page context (not the extension context)
// It intercepts fetch() calls to capture Twitter API responses

(function () {
  "use strict";

  const TWITTER_API_PATTERNS = [
    "/i/api/graphql/",
    "/i/api/2/",
    "/i/api/1.1/",
  ];

  const TWEET_ENDPOINTS = [
    "TweetDetail",
    "UserTweets",
    "UserTweetsAndReplies",
    "UserMedia",
    "SearchTimeline",
    "HomeTimeline",
    "HomeLatestTimeline",
    "ListLatestTweetsTimeline",
    "Bookmarks",
    "Likes",
    "TweetResultByRestId",
    "CommunityTweetsTimeline",
  ];

  function isTwitterApiUrl(url) {
    return TWITTER_API_PATTERNS.some((p) => url.includes(p));
  }

  function getEndpointName(url) {
    for (const endpoint of TWEET_ENDPOINTS) {
      if (url.includes(endpoint)) return endpoint;
    }
    return null;
  }

  // Override fetch
  const originalFetch = window.fetch;
  window.fetch = async function (...args) {
    const response = await originalFetch.apply(this, args);

    try {
      const url = typeof args[0] === "string" ? args[0] : args[0]?.url || "";

      if (isTwitterApiUrl(url)) {
        const endpointName = getEndpointName(url);
        if (endpointName) {
          // Clone the response so we can read the body without consuming it
          const cloned = response.clone();
          cloned
            .json()
            .then((data) => {
              window.postMessage(
                {
                  type: "TWITTER_ANALYZER_API_RESPONSE",
                  endpoint: endpointName,
                  url: url,
                  data: data,
                  timestamp: Date.now(),
                },
                "*"
              );
            })
            .catch(() => {
              // Silently ignore parse errors
            });
        }
      }
    } catch (e) {
      // Don't interfere with normal page operation
    }

    return response;
  };

  // Also override XMLHttpRequest for older API calls
  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this._twitterAnalyzerUrl = url;
    return originalXHROpen.call(this, method, url, ...rest);
  };

  XMLHttpRequest.prototype.send = function (...args) {
    const url = this._twitterAnalyzerUrl || "";

    if (isTwitterApiUrl(url)) {
      const endpointName = getEndpointName(url);
      if (endpointName) {
        this.addEventListener("load", function () {
          try {
            const data = JSON.parse(this.responseText);
            window.postMessage(
              {
                type: "TWITTER_ANALYZER_API_RESPONSE",
                endpoint: endpointName,
                url: url,
                data: data,
                timestamp: Date.now(),
              },
              "*"
            );
          } catch (e) {
            // Silently ignore
          }
        });
      }
    }

    return originalXHRSend.apply(this, args);
  };

  console.log("[Twitter Analyzer] API interceptor loaded");
})();
