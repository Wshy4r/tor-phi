// Background service worker - makes direct API calls to Twitter's GraphQL endpoints
// Works fully in the background, no tab focus needed

const BACKEND_URL = "http://localhost:5001";
const TWITTER_BEARER =
  "AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA";

// ── State ──
let isCapturing = false;
let captureStats = {
  total: 0,
  newTweets: 0,
  duplicates: 0,
  errors: 0,
  startTime: null,
  currentPage: 0,
};
let captureConfig = null;
let stopRequested = false;
const seenTweetIds = new Set();
let lastAutoScrollSession = null;

const ICONS = {
  idle: {
    path: {
      16: "icons/icon-white.svg",
      32: "icons/icon-white.svg",
    },
    title: "Twitter Analyzer",
  },
  capturing: {
    path: {
      16: "icons/icon-green.svg",
      32: "icons/icon-green.svg",
    },
    title: "Twitter Analyzer - Capturing",
  },
  stopped: {
    path: {
      16: "icons/icon-red.svg",
      32: "icons/icon-red.svg",
    },
    title: "Twitter Analyzer - Stopped",
  },
};

function normalizeUsername(username) {
  return (username || "").replace(/^@/, "").trim().toLowerCase();
}

function pageMatchesCapture(pageUrl, username) {
  try {
    const url = new URL(pageUrl || "");
    const firstPath = (url.pathname.split("/").filter(Boolean)[0] || "").toLowerCase();
    return firstPath === normalizeUsername(username);
  } catch {
    return false;
  }
}

function endpointAllowedForAutoScroll(endpoint) {
  return endpoint === "UserTweets" || endpoint === "UserTweetsAndReplies";
}

function storageGet(keys) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(keys, (result) => {
      const err = chrome.runtime && chrome.runtime.lastError;
      if (err) {
        reject(new Error(err.message));
        return;
      }
      resolve(result || {});
    });
  });
}

function storageSet(values) {
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

function cookiesGetAll(details) {
  return new Promise((resolve, reject) => {
    chrome.cookies.getAll(details, (cookies) => {
      const err = chrome.runtime && chrome.runtime.lastError;
      if (err) {
        reject(new Error(err.message));
        return;
      }
      resolve(cookies || []);
    });
  });
}

// ── Twitter API endpoint configs ──
// These are the GraphQL query IDs - they may change, so we also try to extract them dynamically
const ENDPOINTS = {
  UserTweets: {
    queryId: "x3B_xLqC0yZawOB7WQhaVQ",
    operationName: "UserTweets",
    variables: (userId, cursor) => ({
      userId,
      count: 40,
      cursor: cursor || undefined,
      includePromotedContent: false,
      withQuickPromoteEligibilityTweetFields: false,
      withVoice: true,
      withV2Timeline: true,
    }),
    features: {
      rweb_tipjar_consumption_enabled: true,
      responsive_web_graphql_exclude_directive_enabled: true,
      verified_phone_label_enabled: false,
      creator_subscriptions_tweet_preview_api_enabled: true,
      responsive_web_graphql_timeline_navigation_enabled: true,
      responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
      communities_web_enable_tweet_community_results_fetch: true,
      c9s_tweet_anatomy_moderator_badge_enabled: true,
      articles_preview_enabled: true,
      responsive_web_edit_tweet_api_enabled: true,
      graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
      view_counts_everywhere_api_enabled: true,
      longform_notetweets_consumption_enabled: true,
      responsive_web_twitter_article_tweet_consumption_enabled: true,
      tweet_awards_web_tipping_enabled: false,
      creator_subscriptions_quote_tweet_preview_enabled: false,
      freedom_of_speech_not_reach_fetch_enabled: true,
      standardized_nudges_misinfo: true,
      tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
      rweb_video_timestamps_enabled: true,
      longform_notetweets_rich_text_read_enabled: true,
      longform_notetweets_inline_media_enabled: true,
      responsive_web_enhance_cards_enabled: false,
      tweetypie_unmention_optimization_enabled: true,
      responsive_web_text_conversations_enabled: false,
      interactive_text_enabled: true,
      responsive_web_media_download_video_enabled: false,
    },
  },
  UserByScreenName: {
    queryId: "IGgvgiOx4QZndDHuD3x9TQ",
    operationName: "UserByScreenName",
    variables: (screenName) => ({
      screen_name: screenName,
      withSafetyModeUserFields: true,
    }),
    features: {
      hidden_profile_subscriptions_enabled: true,
      rweb_tipjar_consumption_enabled: true,
      responsive_web_graphql_exclude_directive_enabled: true,
      verified_phone_label_enabled: false,
      subscriptions_verification_info_is_identity_verified_enabled: true,
      subscriptions_verification_info_verified_since_enabled: true,
      highlights_tweets_tab_ui_enabled: true,
      responsive_web_twitter_article_notes_tab_enabled: true,
      subscriptions_feature_can_gift_premium: true,
      creator_subscriptions_tweet_preview_api_enabled: true,
      responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
      responsive_web_graphql_timeline_navigation_enabled: true,
    },
  },
  SearchTimeline: {
    queryId: "pCd62NDD9dlCDgEGgEVHMg",
    operationName: "SearchTimeline",
    variables: (query, cursor) => ({
      rawQuery: query,
      count: 40,
      cursor: cursor || undefined,
      querySource: "typed_query",
      product: "Latest",
    }),
    features: {
      rweb_tipjar_consumption_enabled: true,
      responsive_web_graphql_exclude_directive_enabled: true,
      verified_phone_label_enabled: false,
      creator_subscriptions_tweet_preview_api_enabled: true,
      responsive_web_graphql_timeline_navigation_enabled: true,
      responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
      communities_web_enable_tweet_community_results_fetch: true,
      c9s_tweet_anatomy_moderator_badge_enabled: true,
      articles_preview_enabled: true,
      responsive_web_edit_tweet_api_enabled: true,
      graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
      view_counts_everywhere_api_enabled: true,
      longform_notetweets_consumption_enabled: true,
      responsive_web_twitter_article_tweet_consumption_enabled: true,
      tweet_awards_web_tipping_enabled: false,
      creator_subscriptions_quote_tweet_preview_enabled: false,
      freedom_of_speech_not_reach_fetch_enabled: true,
      standardized_nudges_misinfo: true,
      tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
      rweb_video_timestamps_enabled: true,
      longform_notetweets_rich_text_read_enabled: true,
      longform_notetweets_inline_media_enabled: true,
      responsive_web_enhance_cards_enabled: false,
      tweetypie_unmention_optimization_enabled: true,
      responsive_web_text_conversations_enabled: false,
      interactive_text_enabled: true,
      responsive_web_media_download_video_enabled: false,
    },
  },
  Likes: {
    queryId: "KPuet6dGbC8LB2sOLx7tZQ",
    operationName: "Likes",
    variables: (userId, cursor) => ({
      userId,
      count: 40,
      cursor: cursor || undefined,
      includePromotedContent: false,
      withClientEventToken: false,
      withBirdwatchNotes: false,
      withVoice: true,
      withV2Timeline: true,
    }),
    features: {
      rweb_tipjar_consumption_enabled: true,
      responsive_web_graphql_exclude_directive_enabled: true,
      verified_phone_label_enabled: false,
      creator_subscriptions_tweet_preview_api_enabled: true,
      responsive_web_graphql_timeline_navigation_enabled: true,
      responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
      communities_web_enable_tweet_community_results_fetch: true,
      c9s_tweet_anatomy_moderator_badge_enabled: true,
      articles_preview_enabled: true,
      responsive_web_edit_tweet_api_enabled: true,
      graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
      view_counts_everywhere_api_enabled: true,
      longform_notetweets_consumption_enabled: true,
      responsive_web_twitter_article_tweet_consumption_enabled: true,
      tweet_awards_web_tipping_enabled: false,
      creator_subscriptions_quote_tweet_preview_enabled: false,
      freedom_of_speech_not_reach_fetch_enabled: true,
      standardized_nudges_misinfo: true,
      tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
      rweb_video_timestamps_enabled: true,
      longform_notetweets_rich_text_read_enabled: true,
      longform_notetweets_inline_media_enabled: true,
      responsive_web_enhance_cards_enabled: false,
      tweetypie_unmention_optimization_enabled: true,
      responsive_web_text_conversations_enabled: false,
      interactive_text_enabled: true,
      responsive_web_media_download_video_enabled: false,
    },
  },
  UserTweetsAndReplies: {
    queryId: "Yt1JzwcBsBWYEEi3jMTe2Q",
    operationName: "UserTweetsAndReplies",
    variables: (userId, cursor) => ({
      userId,
      count: 40,
      cursor: cursor || undefined,
      includePromotedContent: false,
      withQuickPromoteEligibilityTweetFields: false,
      withVoice: true,
      withV2Timeline: true,
    }),
    features: {
      rweb_tipjar_consumption_enabled: true,
      responsive_web_graphql_exclude_directive_enabled: true,
      verified_phone_label_enabled: false,
      creator_subscriptions_tweet_preview_api_enabled: true,
      responsive_web_graphql_timeline_navigation_enabled: true,
      responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
      communities_web_enable_tweet_community_results_fetch: true,
      c9s_tweet_anatomy_moderator_badge_enabled: true,
      articles_preview_enabled: true,
      responsive_web_edit_tweet_api_enabled: true,
      graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
      view_counts_everywhere_api_enabled: true,
      longform_notetweets_consumption_enabled: true,
      responsive_web_twitter_article_tweet_consumption_enabled: true,
      tweet_awards_web_tipping_enabled: false,
      creator_subscriptions_quote_tweet_preview_enabled: false,
      freedom_of_speech_not_reach_fetch_enabled: true,
      standardized_nudges_misinfo: true,
      tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
      rweb_video_timestamps_enabled: true,
      longform_notetweets_rich_text_read_enabled: true,
      longform_notetweets_inline_media_enabled: true,
      responsive_web_enhance_cards_enabled: false,
      tweetypie_unmention_optimization_enabled: true,
      responsive_web_text_conversations_enabled: false,
      interactive_text_enabled: true,
      responsive_web_media_download_video_enabled: false,
    },
  },
  TweetDetail: {
    queryId: "rU08O-YiXdr0IZfE7qaUMg",
    operationName: "TweetDetail",
    variables: (focalTweetId) => ({
      focalTweetId,
      referrer: "tweet",
      with_rux_injections: false,
      rankingMode: "Relevance",
      includePromotedContent: false,
      withCommunity: true,
      withQuickPromoteEligibilityTweetFields: false,
      withBirdwatchNotes: false,
      withVoice: true,
    }),
    features: {
      rweb_tipjar_consumption_enabled: true,
      responsive_web_graphql_exclude_directive_enabled: true,
      verified_phone_label_enabled: false,
      creator_subscriptions_tweet_preview_api_enabled: true,
      responsive_web_graphql_timeline_navigation_enabled: true,
      responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
      communities_web_enable_tweet_community_results_fetch: true,
      c9s_tweet_anatomy_moderator_badge_enabled: true,
      articles_preview_enabled: true,
      responsive_web_edit_tweet_api_enabled: true,
      graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
      view_counts_everywhere_api_enabled: true,
      longform_notetweets_consumption_enabled: true,
      responsive_web_twitter_article_tweet_consumption_enabled: true,
      tweet_awards_web_tipping_enabled: false,
      creator_subscriptions_quote_tweet_preview_enabled: false,
      freedom_of_speech_not_reach_fetch_enabled: true,
      standardized_nudges_misinfo: true,
      tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
      rweb_video_timestamps_enabled: true,
      longform_notetweets_rich_text_read_enabled: true,
      longform_notetweets_inline_media_enabled: true,
      responsive_web_enhance_cards_enabled: false,
      tweetypie_unmention_optimization_enabled: true,
      responsive_web_text_conversations_enabled: false,
      interactive_text_enabled: true,
      responsive_web_media_download_video_enabled: false,
    },
  },
};

// ── Auth helpers ──

async function getAuthHeaders() {
  const cookies = await cookiesGetAll({ domain: ".x.com" });
  const ct0 = cookies.find((c) => c.name === "ct0");

  if (!ct0) {
    // Try twitter.com domain
    const twitterCookies = await cookiesGetAll({
      domain: ".twitter.com",
    });
    const ct0Twitter = twitterCookies.find((c) => c.name === "ct0");
    if (!ct0Twitter) {
      throw new Error(
        "Not logged in to Twitter/X. Please log in first."
      );
    }
    return {
      authorization: `Bearer ${TWITTER_BEARER}`,
      "x-csrf-token": ct0Twitter.value,
      "x-twitter-active-user": "yes",
      "x-twitter-auth-type": "OAuth2Session",
      "x-twitter-client-language": "en",
      "content-type": "application/json",
    };
  }

  return {
    authorization: `Bearer ${TWITTER_BEARER}`,
    "x-csrf-token": ct0.value,
    "x-twitter-active-user": "yes",
    "x-twitter-auth-type": "OAuth2Session",
    "x-twitter-client-language": "en",
    "content-type": "application/json",
  };
}

// ── GraphQL query ID extraction ──
// Twitter's GraphQL endpoints require a queryId that changes with deployments
// We extract these from Twitter's main.js bundle

async function extractQueryIds() {
  try {
    // Try to get query IDs from stored cache first
    const { queryIdCache } = await storageGet("queryIdCache");
    if (queryIdCache && Date.now() - queryIdCache.timestamp < 3600000) {
      // 1 hour cache
      Object.entries(queryIdCache.ids).forEach(([op, id]) => {
        if (ENDPOINTS[op]) ENDPOINTS[op].queryId = id;
      });
      console.log("[Twitter Analyzer] Using cached query IDs");
      return true;
    }
  } catch (e) {}

  try {
    // Fetch Twitter's main page to find JS bundle URLs
    const headers = await getAuthHeaders();
    const mainResp = await fetch("https://x.com/home", {
      headers,
      credentials: "include",
    });
    const html = await mainResp.text();

    // Find main JS bundles
    const scriptUrls = [
      ...html.matchAll(/src="(https:\/\/abs\.twimg\.com\/responsive-web\/client-web[^"]*\.js)"/g),
    ].map((m) => m[1]);

    // Search through bundles for query IDs
    const ids = {};
    for (const url of scriptUrls.slice(0, 10)) {
      try {
        const resp = await fetch(url);
        const js = await resp.text();

        for (const opName of Object.keys(ENDPOINTS)) {
          // Pattern: {queryId:"abc123",operationName:"UserTweets"
          const patterns = [
            new RegExp(
              `queryId:"([^"]+)",operationName:"${opName}"`,
              "g"
            ),
            new RegExp(
              `operationName:"${opName}"[^}]*queryId:"([^"]+)"`,
              "g"
            ),
            new RegExp(
              `{[^}]*"queryId":"([^"]+)"[^}]*"operationName":"${opName}"`,
              "g"
            ),
          ];

          for (const pattern of patterns) {
            const match = pattern.exec(js);
            if (match) {
              ids[opName] = match[1];
              break;
            }
          }
        }
      } catch (e) {}
    }

    if (Object.keys(ids).length > 0) {
      Object.entries(ids).forEach(([op, id]) => {
        if (ENDPOINTS[op]) ENDPOINTS[op].queryId = id;
      });

      // Cache the IDs
      await storageSet({
        queryIdCache: { ids, timestamp: Date.now() },
      });

      console.log("[Twitter Analyzer] Extracted query IDs:", ids);
      return true;
    }
  } catch (e) {
    console.error("[Twitter Analyzer] Failed to extract query IDs:", e);
  }

  return false;
}

// ── Intercept query IDs from page traffic ──
// Alternative: content script watches actual API calls and captures query IDs

function storeQueryId(operationName, queryId) {
  if (ENDPOINTS[operationName]) {
    ENDPOINTS[operationName].queryId = queryId;
  }
}

// ── Make Twitter API call ──

async function twitterApiCall(endpointName, params, cursor) {
  const endpoint = ENDPOINTS[endpointName];
  if (!endpoint) throw new Error(`Unknown endpoint: ${endpointName}`);

  // Build the query ID - try multiple methods
  let queryId = endpoint.queryId;
  if (!queryId) {
    await extractQueryIds();
    queryId = endpoint.queryId;
  }
  if (!queryId) {
    throw new Error(
      `No query ID for ${endpointName}. Visit twitter.com first to capture it.`
    );
  }

  const headers = await getAuthHeaders();

  let variables;
  if (endpointName === "UserByScreenName") {
    variables = endpoint.variables(params);
  } else if (endpointName === "SearchTimeline") {
    variables = endpoint.variables(params, cursor);
  } else {
    variables = endpoint.variables(params, cursor);
  }

  const queryParams = new URLSearchParams({
    variables: JSON.stringify(variables),
    features: JSON.stringify(endpoint.features),
  });

  const url = `https://x.com/i/api/graphql/${queryId}/${endpointName}?${queryParams}`;

  const response = await fetch(url, {
    method: "GET",
    headers,
    credentials: "include",
  });

  if (response.status === 429) {
    // Rate limited - wait and retry
    const retryAfter = response.headers.get("x-rate-limit-reset");
    const waitTime = retryAfter
      ? (parseInt(retryAfter) * 1000 - Date.now())
      : 60000;
    console.log(
      `[Twitter Analyzer] Rate limited, waiting ${Math.ceil(waitTime / 1000)}s`
    );
    await sleep(Math.min(waitTime, 120000)); // Max 2 minute wait
    return twitterApiCall(endpointName, params, cursor);
  }

  if (!response.ok) {
    throw new Error(`API error ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

// ── Get user ID from username ──

async function getUserId(username) {
  // Check cache
  const cacheKey = `userId_${username.toLowerCase()}`;
  const { [cacheKey]: cached } = await storageGet(cacheKey);
  if (cached) return cached;

  const data = await twitterApiCall("UserByScreenName", username);
  const userId = data?.data?.user?.result?.rest_id;

  if (!userId) throw new Error(`User @${username} not found`);

  // Cache it
  await storageSet({ [cacheKey]: userId });
  return userId;
}

// ── Tweet extraction ──

function extractTweets(data) {
  const tweets = [];

  function walkObject(obj, depth = 0) {
    if (!obj || typeof obj !== "object" || depth > 25) return;

    if (obj.tweet_results?.result) {
      const tweet = parseTweetResult(obj.tweet_results.result);
      if (tweet) tweets.push(tweet);
      return;
    }

    if (obj.__typename === "Tweet" && obj.legacy && obj.core) {
      const tweet = parseTweetResult(obj);
      if (tweet) tweets.push(tweet);
      return;
    }

    if (Array.isArray(obj)) {
      for (const item of obj) walkObject(item, depth + 1);
    } else {
      for (const key of Object.keys(obj)) walkObject(obj[key], depth + 1);
    }
  }

  function parseTweetResult(result) {
    try {
      if (result.__typename === "TweetWithVisibilityResults") {
        result = result.tweet;
      }
      if (!result?.legacy) return null;

      const legacy = result.legacy;
      const tweetId = legacy.id_str || result.rest_id;
      if (!tweetId) return null;

      const isNew = !seenTweetIds.has(tweetId);
      seenTweetIds.add(tweetId);

      const userResult =
        result.core?.user_results?.result ||
        result.core?.user_result?.result;
      const userLegacy = userResult?.legacy || {};

      const media = (
        legacy.extended_entities?.media ||
        legacy.entities?.media ||
        []
      ).map((m) => ({
        type: m.type,
        url: m.media_url_https || m.media_url,
        expanded_url: m.expanded_url,
        video_url: m.video_info?.variants
          ?.filter((v) => v.content_type === "video/mp4")
          ?.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))?.[0]?.url,
      }));

      const urls = (legacy.entities?.urls || []).map((u) => ({
        url: u.url,
        expanded_url: u.expanded_url,
        display_url: u.display_url,
      }));

      let quotedTweet = null;
      if (result.quoted_status_result?.result) {
        quotedTweet = parseTweetResult(result.quoted_status_result.result);
      }

      return {
        id: tweetId,
        text: legacy.full_text,
        created_at: legacy.created_at,
        is_new: isNew,
        user: {
          id: userLegacy.id_str || userResult?.rest_id,
          username: userLegacy.screen_name,
          display_name: userLegacy.name,
          profile_image: userLegacy.profile_image_url_https,
          verified: userLegacy.verified || userResult?.is_blue_verified,
          followers_count: userLegacy.followers_count,
          following_count: userLegacy.friends_count,
          description: userLegacy.description,
        },
        metrics: {
          retweet_count: legacy.retweet_count,
          reply_count: legacy.reply_count,
          like_count: legacy.favorite_count,
          quote_count: legacy.quote_count,
          bookmark_count: legacy.bookmark_count,
          view_count: result.views?.count
            ? parseInt(result.views.count)
            : null,
        },
        media,
        urls,
        is_retweet: !!legacy.retweeted_status_result,
        is_reply: !!legacy.in_reply_to_status_id_str,
        in_reply_to: legacy.in_reply_to_status_id_str,
        conversation_id: legacy.conversation_id_str,
        language: legacy.lang,
        source: legacy.source,
        quoted_tweet: quotedTweet,
      };
    } catch (e) {
      return null;
    }
  }

  walkObject(data);
  return tweets;
}

// ── Extract cursor for pagination ──

function extractCursor(data, direction = "bottom") {
  let cursor = null;

  function walk(obj, depth = 0) {
    if (!obj || typeof obj !== "object" || depth > 20 || cursor) return;

    // Look for cursor entries
    if (obj.entryType === "TimelineTimelineCursor" || obj.cursorType) {
      const cursorType = (obj.cursorType || "").toLowerCase();
      if (
        (direction === "bottom" && cursorType.includes("bottom")) ||
        (direction === "top" && cursorType.includes("top"))
      ) {
        cursor = obj.value;
        return;
      }
    }

    // Also check for cursor in entry content
    if (obj.entryId && typeof obj.entryId === "string") {
      if (
        obj.entryId.startsWith("cursor-bottom") &&
        direction === "bottom"
      ) {
        cursor = obj.content?.value;
        return;
      }
    }

    if (Array.isArray(obj)) {
      for (const item of obj) walk(item, depth + 1);
    } else {
      for (const key of Object.keys(obj)) walk(obj[key], depth + 1);
    }
  }

  walk(data);
  return cursor;
}

// ── Main capture loop ──

async function captureUserTweets(username, maxPages = null) {
  console.log(`[Twitter Analyzer] Starting capture for @${username}`);

  captureStats = {
    total: 0,
    newTweets: 0,
    duplicates: 0,
    errors: 0,
    startTime: Date.now(),
    currentPage: 0,
    username,
    status: "running",
  };
  isCapturing = true;
  stopRequested = false;
  broadcastStatus(`Starting capture for @${username}...`);

  try {
    // Resolve user ID
    broadcastStatus("Resolving user ID...");
    const userId = await getUserId(username);
    console.log(`[Twitter Analyzer] User ID for @${username}: ${userId}`);

    let cursor = null;
    let emptyPages = 0;

    for (let page = 0; maxPages == null || page < maxPages; page++) {
      if (stopRequested) {
        captureStats.status = "stopped";
        break;
      }

      captureStats.currentPage = page + 1;
      broadcastStatus(
        `Fetching page ${page + 1}... (${captureStats.newTweets} tweets captured)`
      );

      try {
        const data = await twitterApiCall("UserTweets", userId, cursor);
        const tweets = extractTweets(data);

        const newTweets = tweets.filter((t) => t.is_new);

        if (tweets.length === 0) {
          emptyPages++;
          if (emptyPages >= 3) {
            console.log("[Twitter Analyzer] No more tweets available");
            captureStats.status = "complete";
            break;
          }
        } else {
          emptyPages = 0;
        }

        captureStats.total += tweets.length;
        captureStats.newTweets += newTweets.length;
        captureStats.duplicates += tweets.length - newTweets.length;

        // Send to backend
        if (newTweets.length > 0) {
          await sendToBackend(newTweets, "UserTweets", username);
          await storeLocally(newTweets);
        }

        // Get next cursor
        const nextCursor = extractCursor(data, "bottom");
        if (!nextCursor || nextCursor === cursor) {
          console.log("[Twitter Analyzer] No more pages");
          captureStats.status = "complete";
          break;
        }
        cursor = nextCursor;

        // Rate limit delay - be nice to the API
        await sleep(2000 + Math.random() * 1000);
      } catch (e) {
        captureStats.errors++;
        console.error(`[Twitter Analyzer] Page ${page + 1} error:`, e);

        if (e.message.includes("Rate limited")) {
          broadcastStatus("Rate limited, waiting...");
          // The retry is handled inside twitterApiCall
        } else if (captureStats.errors >= 5) {
          captureStats.status = "error";
          broadcastStatus(`Too many errors, stopping: ${e.message}`);
          break;
        }
      }
    }

    if (!captureStats.status || captureStats.status === "running") {
      captureStats.status = "complete";
    }
  } catch (e) {
    captureStats.status = "error";
    captureStats.errorMessage = e.message;
    broadcastStatus(`Error for @${username}: ${e.message}`);
    console.error("[Twitter Analyzer] Capture error:", e);
  }

  isCapturing = false;
  broadcastStatus(
    `Done! Captured ${captureStats.newTweets} tweets from @${captureStats.username}`
  );
  return captureStats;
}

async function captureSearch(query, maxPages = null) {
  console.log(`[Twitter Analyzer] Starting search capture: "${query}"`);

  captureStats = {
    total: 0,
    newTweets: 0,
    duplicates: 0,
    errors: 0,
    startTime: Date.now(),
    currentPage: 0,
    query,
    status: "running",
  };
  isCapturing = true;
  stopRequested = false;
  broadcastStatus(`Starting search for "${query}"...`);

  try {
    let cursor = null;
    let emptyPages = 0;

    for (let page = 0; maxPages == null || page < maxPages; page++) {
      if (stopRequested) {
        captureStats.status = "stopped";
        break;
      }

      captureStats.currentPage = page + 1;
      broadcastStatus(
        `Searching page ${page + 1}... (${captureStats.newTweets} tweets)`
      );

      try {
        const data = await twitterApiCall("SearchTimeline", query, cursor);
        const tweets = extractTweets(data);
        const newTweets = tweets.filter((t) => t.is_new);

        if (tweets.length === 0) {
          emptyPages++;
          if (emptyPages >= 3) {
            captureStats.status = "complete";
            break;
          }
        } else {
          emptyPages = 0;
        }

        captureStats.total += tweets.length;
        captureStats.newTweets += newTweets.length;
        captureStats.duplicates += tweets.length - newTweets.length;

        if (newTweets.length > 0) {
          await sendToBackend(newTweets, "SearchTimeline", query);
          await storeLocally(newTweets);
        }

        const nextCursor = extractCursor(data, "bottom");
        if (!nextCursor || nextCursor === cursor) {
          captureStats.status = "complete";
          break;
        }
        cursor = nextCursor;

        await sleep(2500 + Math.random() * 1500);
      } catch (e) {
        captureStats.errors++;
        if (captureStats.errors >= 5) {
          captureStats.status = "error";
          break;
        }
      }
    }

    if (captureStats.status === "running") captureStats.status = "complete";
  } catch (e) {
    captureStats.status = "error";
    captureStats.errorMessage = e.message;
    broadcastStatus(`Search error: ${e.message}`);
  }

  isCapturing = false;
  broadcastStatus(
    `Done! Captured ${captureStats.newTweets} tweets from search "${query}"`
  );
  return captureStats;
}

async function captureLikes(username, maxPages = null) {
  console.log(`[Twitter Analyzer] Starting likes capture for @${username}`);

  captureStats = {
    total: 0,
    newTweets: 0,
    duplicates: 0,
    errors: 0,
    startTime: Date.now(),
    currentPage: 0,
    username,
    status: "running",
  };
  isCapturing = true;
  stopRequested = false;
  broadcastStatus(`Starting likes capture for @${username}...`);

  try {
    const userId = await getUserId(username);
    let cursor = null;
    let emptyPages = 0;

    for (let page = 0; maxPages == null || page < maxPages; page++) {
      if (stopRequested) {
        captureStats.status = "stopped";
        break;
      }

      captureStats.currentPage = page + 1;
      broadcastStatus(
        `Fetching likes page ${page + 1}... (${captureStats.newTweets} tweets)`
      );

      try {
        const data = await twitterApiCall("Likes", userId, cursor);
        const tweets = extractTweets(data);
        const newTweets = tweets.filter((t) => t.is_new);

        if (tweets.length === 0) {
          emptyPages++;
          if (emptyPages >= 3) {
            captureStats.status = "complete";
            break;
          }
        } else {
          emptyPages = 0;
        }

        captureStats.total += tweets.length;
        captureStats.newTweets += newTweets.length;
        captureStats.duplicates += tweets.length - newTweets.length;

        if (newTweets.length > 0) {
          await sendToBackend(newTweets, "Likes", username);
          await storeLocally(newTweets);
        }

        const nextCursor = extractCursor(data, "bottom");
        if (!nextCursor || nextCursor === cursor) {
          captureStats.status = "complete";
          break;
        }
        cursor = nextCursor;

        await sleep(2500 + Math.random() * 1500);
      } catch (e) {
        captureStats.errors++;
        if (captureStats.errors >= 5) {
          captureStats.status = "error";
          break;
        }
      }
    }

    if (captureStats.status === "running") captureStats.status = "complete";
  } catch (e) {
    captureStats.status = "error";
    captureStats.errorMessage = e.message;
    broadcastStatus(`Likes error for @${username}: ${e.message}`);
  }

  isCapturing = false;
  return captureStats;
}

// ── Backend communication ──

async function sendToBackend(tweets, endpoint, source) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/tweets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tweets,
        source: {
          endpoint,
          source_identifier: source,
          captured_at: new Date().toISOString(),
        },
      }),
    });
    return response.ok;
  } catch (e) {
    // Backend not running, that's fine - tweets are stored locally too
    return false;
  }
}

async function checkBackend() {
  try {
    const resp = await fetch(`${BACKEND_URL}/api/health`);
    return resp.ok;
  } catch {
    return false;
  }
}

async function getStoredTweetCount() {
  try {
    const { storedTweets = [] } = await storageGet("storedTweets");
    return storedTweets.length;
  } catch {
    return 0;
  }
}

// ── Local storage ──

async function storeLocally(tweets) {
  try {
    const { storedTweets = [] } = await storageGet("storedTweets");
    const updated = [...storedTweets, ...tweets];
    const trimmed = updated.slice(-50000);
    await storageSet({ storedTweets: trimmed });
  } catch (e) {
    console.error("[Twitter Analyzer] Storage error:", e);
  }
}

// ── Helpers ──

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeMaxPages(value, fallback = null) {
  if (value === null || value === undefined || value === "") return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function broadcastStatus(message) {
  try {
    chrome.runtime.sendMessage(
      {
        type: "STATUS_UPDATE",
        message,
        stats: { ...captureStats },
      },
      () => {
        if (chrome.runtime && chrome.runtime.lastError) {
          // Popup might not be open, which is fine.
        }
      }
    );
  } catch (e) {
    // Ignore popup messaging failures.
  }
}

function setToolbarState(state) {
  const icon = ICONS[state] || ICONS.idle;
  try {
    chrome.browserAction.setIcon({ path: icon.path });
    chrome.browserAction.setTitle({ title: icon.title });
  } catch (e) {
    // Ignore toolbar update failures.
  }
}

function finalizeStoppedCapture(message = "Stopped") {
  if (captureConfig?.type === "auto_scroll_user" && captureConfig.tabId != null) {
    lastAutoScrollSession = {
      username: captureConfig.username,
      tabId: captureConfig.tabId,
      pageUrl: captureConfig.pageUrl || "",
      stats: { ...captureStats },
      resumable: true,
    };
  }
  isCapturing = false;
  stopRequested = false;
  captureStats.status = "stopped";
  captureConfig = null;
  setToolbarState("stopped");
  broadcastStatus(message);
}

function startAutoScrollCapture(username, tabId, pageUrl, sendResponse, options = {}) {
  const resume = !!options.resume;
  const captureStartedAt = Date.now();
  const resumedStats = resume ? (lastAutoScrollSession?.stats || {}) : {};
  captureStats = {
    total: resumedStats.total || 0,
    newTweets: resumedStats.newTweets || 0,
    duplicates: resumedStats.duplicates || 0,
    errors: resumedStats.errors || 0,
    startTime: Date.now(),
    currentPage: resumedStats.currentPage || 0,
    username,
    status: "running",
    mode: "auto_scroll",
  };
  captureConfig = {
    type: "auto_scroll_user",
    username: normalizeUsername(username),
    tabId,
    pageUrl: pageUrl || "",
  };
  isCapturing = true;
  stopRequested = false;
  lastAutoScrollSession = {
    username: normalizeUsername(username),
    tabId,
    pageUrl: pageUrl || "",
    stats: { ...captureStats },
    resumable: true,
  };
  setToolbarState("capturing");
  broadcastStatus(`${resume ? "Resuming" : "Auto-scrolling"} @${username}...`);

  chrome.tabs.sendMessage(
    tabId,
    {
      type: "START_AUTO_SCROLL_CAPTURE",
      username,
      resume,
      resumeStep: resumedStats.currentPage || 0,
    },
    (response) => {
      const err = chrome.runtime && chrome.runtime.lastError;
      if (err || !response?.started) {
        isCapturing = false;
        captureStats.status = "error";
        captureStats.errorMessage = err?.message || response?.error || "Could not start auto-scroll on this tab";
        lastAutoScrollSession = {
          username: normalizeUsername(username),
          tabId,
          pageUrl: pageUrl || "",
          stats: { ...captureStats },
          resumable: true,
        };
        setToolbarState("stopped");
        broadcastStatus(captureStats.errorMessage);
      }
    }
  );

  setTimeout(() => {
    if (
      isCapturing &&
      captureConfig?.type === "auto_scroll_user" &&
      captureConfig.tabId === tabId &&
      captureStats.startTime === captureStartedAt &&
      (captureStats.currentPage || 0) === 0 &&
      (captureStats.newTweets || 0) === 0
    ) {
      isCapturing = false;
      captureStats.status = "paused";
      captureStats.errorMessage = "Auto-scroll did not attach. Reload the profile if needed, then click Resume.";
      lastAutoScrollSession = {
        username: normalizeUsername(username),
        tabId,
        pageUrl: pageUrl || "",
        stats: { ...captureStats },
        resumable: true,
      };
      captureConfig = null;
      setToolbarState("stopped");
      broadcastStatus(captureStats.errorMessage);
    }
  }, 8000);

  sendResponse({ status: "started", username, mode: "auto_scroll", resumed: resume });
}

// ── Keep service worker alive during capture ──

chrome.alarms.create("keepalive", { periodInMinutes: 0.5 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "keepalive" && isCapturing) {
    // Just accessing chrome API keeps the worker alive
    console.log(
      `[Twitter Analyzer] Keepalive - capturing: ${isCapturing}, tweets: ${captureStats.newTweets}`
    );
  }
});

// ── Message handler ──

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case "START_CAPTURE_USER": {
      if (isCapturing) {
        sendResponse({ error: "Already capturing" });
        return;
      }
      const username = message.username.replace("@", "").trim();
      if (message.autoScroll && message.tabId) {
        const canResume =
          !!message.resumeAutoScroll &&
          lastAutoScrollSession &&
          lastAutoScrollSession.resumable &&
          lastAutoScrollSession.tabId === message.tabId &&
          lastAutoScrollSession.username === normalizeUsername(username) &&
          pageMatchesCapture(message.pageUrl, username);
        startAutoScrollCapture(username, message.tabId, message.pageUrl, sendResponse, {
          resume: canResume,
        });
        return true;
      }
      const maxPages = normalizeMaxPages(message.maxPages, null);
      captureConfig = { type: "direct_user", username: normalizeUsername(username) };
      setToolbarState("capturing");
      captureUserTweets(username, maxPages).then((stats) => {
        setToolbarState(stats.status === "error" ? "stopped" : "idle");
        broadcastStatus(`Finished @${username}: ${stats.newTweets} tweets`);
        captureConfig = null;
      });
      sendResponse({ status: "started", username });
      return true;
    }

    case "START_CAPTURE_SEARCH": {
      if (isCapturing) {
        sendResponse({ error: "Already capturing" });
        return;
      }
      const query = message.query.trim();
      const maxPages = normalizeMaxPages(message.maxPages, null);
      setToolbarState("capturing");
      captureSearch(query, maxPages).then((stats) => {
        setToolbarState(stats.status === "error" ? "stopped" : "idle");
        broadcastStatus(
          `Finished search "${query}": ${stats.newTweets} tweets`
        );
      });
      sendResponse({ status: "started", query });
      return true;
    }

    case "START_CAPTURE_LIKES": {
      if (isCapturing) {
        sendResponse({ error: "Already capturing" });
        return;
      }
      const username = message.username.replace("@", "").trim();
      const maxPages = normalizeMaxPages(message.maxPages, null);
      setToolbarState("capturing");
      captureLikes(username, maxPages).then((stats) => {
        setToolbarState(stats.status === "error" ? "stopped" : "idle");
        broadcastStatus(
          `Finished @${username} likes: ${stats.newTweets} tweets`
        );
      });
      sendResponse({ status: "started", username });
      return true;
    }

    case "STOP_CAPTURE":
      stopRequested = true;
      if (captureConfig?.type === "auto_scroll_user" && captureConfig.tabId != null) {
        chrome.tabs.sendMessage(captureConfig.tabId, { type: "STOP_AUTO_SCROLL_CAPTURE" }, () => {
          if (chrome.runtime && chrome.runtime.lastError) {
            // Ignore; tab might be gone.
          }
          finalizeStoppedCapture("Stopped");
        });
        sendResponse({ status: "stopping" });
        return true;
      }
      finalizeStoppedCapture("Stopped");
      sendResponse({ status: "stopping" });
      break;

    case "GET_STATS":
      Promise.all([checkBackend(), getStoredTweetCount()]).then(([connected, storedCount]) => {
        sendResponse({
          isCapturing,
          stats: { ...captureStats },
          backendConnected: connected,
          totalStored: storedCount,
          resumableAutoScroll: lastAutoScrollSession ? { ...lastAutoScrollSession } : null,
        });
      });
      return true;

    case "RESET_STATS":
      seenTweetIds.clear();
      lastAutoScrollSession = null;
      captureStats = {
        total: 0,
        newTweets: 0,
        duplicates: 0,
        errors: 0,
        startTime: null,
        currentPage: 0,
      };
      setToolbarState("idle");
      sendResponse({ status: "reset" });
      break;

    case "EXPORT_LOCAL":
      chrome.storage.local.get("storedTweets", (data) => {
        sendResponse({
          tweets: data.storedTweets || [],
          count: (data.storedTweets || []).length,
        });
      });
      return true;

    // Handle query IDs from content script
    case "STORE_QUERY_ID":
      storeQueryId(message.operationName, message.queryId);
      sendResponse({ stored: true });
      break;

    case "AUTO_SCROLL_STATUS":
      if (isCapturing && captureConfig?.type === "auto_scroll_user") {
        if (sender.tab?.id !== captureConfig.tabId || !pageMatchesCapture(message.pageUrl, captureConfig.username)) {
          finalizeStoppedCapture("Stopped: capture tab left the selected profile");
          sendResponse({ ok: true, stopped: true });
          return true;
        }
        captureStats.currentPage = message.step || captureStats.currentPage;
        broadcastStatus(
          `Auto-scrolling @${captureStats.username}... (${captureStats.newTweets} tweets captured)`
        );
      }
      sendResponse({ ok: true });
      return true;

    case "AUTO_SCROLL_DONE":
      if (captureConfig?.type === "auto_scroll_user" && sender.tab?.id === captureConfig.tabId) {
        if (stopRequested) {
          finalizeStoppedCapture("Stopped");
        } else if (isCapturing) {
          isCapturing = false;
          const reason = message.reason || "paused";
          captureStats.status = reason === "done" ? "complete" : "paused";
          lastAutoScrollSession = {
            username: captureConfig.username,
            tabId: captureConfig.tabId,
            pageUrl: captureConfig.pageUrl || "",
            stats: { ...captureStats },
            resumable: reason !== "done",
          };
          captureConfig = null;
          if (reason === "done") {
            setToolbarState("idle");
            broadcastStatus(`Finished @${captureStats.username}: ${captureStats.newTweets} tweets`);
          } else {
            setToolbarState("stopped");
            broadcastStatus(`Paused @${captureStats.username}. Click Resume to continue from this profile.`);
          }
        }
      }
      sendResponse({ ok: true });
      return true;

    case "CAPTURED_API_RESPONSE": {
      if (!isCapturing || captureConfig?.type !== "auto_scroll_user") {
        sendResponse({ ignored: true, reason: "passive_capture_disabled" });
        return true;
      }
      if (sender.tab?.id !== captureConfig.tabId) {
        sendResponse({ ignored: true, reason: "different_tab" });
        return true;
      }
      if (!pageMatchesCapture(message.pageUrl, captureConfig.username)) {
        finalizeStoppedCapture("Stopped: capture tab left the selected profile");
        sendResponse({ ignored: true, reason: "page_changed" });
        return true;
      }
      if (!endpointAllowedForAutoScroll(message.endpoint)) {
        sendResponse({ ignored: true, reason: "endpoint_not_allowed" });
        return true;
      }

      const tweets = extractTweets(message.data).filter((tweet) => {
        return normalizeUsername(tweet.user?.username) === captureConfig.username;
      });
      const newTweets = tweets.filter((t) => t.is_new);

      captureStats.total += tweets.length;
      captureStats.newTweets += newTweets.length;
      captureStats.duplicates += tweets.length - newTweets.length;
      if (lastAutoScrollSession && lastAutoScrollSession.tabId === captureConfig.tabId) {
        lastAutoScrollSession.stats = { ...captureStats };
      }

      if (newTweets.length > 0) {
        sendToBackend(newTweets, "UserTweets", captureStats.username);
        storeLocally(newTweets);
      }

      broadcastStatus(
        `Auto-scrolling @${captureStats.username}... (${captureStats.newTweets} tweets captured)`
      );

      sendResponse({ newTweets: newTweets.length, totalMatched: tweets.length });
      return true;
    }
  }

  return true;
});

console.log("[Twitter Analyzer] Background service worker loaded");
setToolbarState("idle");
