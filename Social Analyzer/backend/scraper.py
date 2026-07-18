"""
Twitter Scraper - Makes direct API calls to Twitter's GraphQL endpoints.
Uses your logged-in session cookies. No extension needed.
"""

import json
import time
import random
import os
import requests
from database import (insert_tweets, detect_threads, save_progress, get_progress,
                      get_user_tweet_count, update_tweet_media_json)

# Downloaded tweet images live under the same media root the web app serves
# at /media/...  (shared with Facebook media).
MEDIA_ROOT = os.path.join(os.path.dirname(__file__), "fb_media")

BEARER_TOKEN = "AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA"
CONFIG_PATH = os.path.join(os.path.dirname(__file__), "config.json")

# Last-resort fallback IDs — used when JS extraction fails entirely.
# These go stale when Twitter redeploys, but buy time until the cache refreshes.
FALLBACK_QUERY_IDS = {
    "UserTweets":           "3AS73VJOTCg8ePuvJndFew",
    "UserByScreenName":     "IGgvgiOx4QZndDHuD3x9TQ",
    "SearchTimeline":       "099UqLkXma7fhT81Jv4n9g",
    "Likes":                "a5tnuYtSDnZ9rdUBSqS5Og",
    "UserTweetsAndReplies": "Yhdsu6wWbof5lwXjYqxXEg",
    "TweetDetail":          "ju7f1DGV1TxWM2fCuD1Qmg",
}

# Default features for GraphQL queries
FEATURES = {
    "rweb_tipjar_consumption_enabled": True,
    "responsive_web_graphql_exclude_directive_enabled": True,
    "verified_phone_label_enabled": False,
    "creator_subscriptions_tweet_preview_api_enabled": True,
    "responsive_web_graphql_timeline_navigation_enabled": True,
    "responsive_web_graphql_skip_user_profile_image_extensions_enabled": False,
    "communities_web_enable_tweet_community_results_fetch": True,
    "c9s_tweet_anatomy_moderator_badge_enabled": True,
    "articles_preview_enabled": True,
    "responsive_web_edit_tweet_api_enabled": True,
    "graphql_is_translatable_rweb_tweet_is_translatable_enabled": True,
    "view_counts_everywhere_api_enabled": True,
    "longform_notetweets_consumption_enabled": True,
    "responsive_web_twitter_article_tweet_consumption_enabled": True,
    "tweet_awards_web_tipping_enabled": False,
    "creator_subscriptions_quote_tweet_preview_enabled": False,
    "freedom_of_speech_not_reach_fetch_enabled": True,
    "standardized_nudges_misinfo": True,
    "tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled": True,
    "rweb_video_timestamps_enabled": True,
    "longform_notetweets_rich_text_read_enabled": True,
    "longform_notetweets_inline_media_enabled": True,
    "responsive_web_enhance_cards_enabled": False,
    "tweetypie_unmention_optimization_enabled": True,
    "responsive_web_text_conversations_enabled": False,
    "interactive_text_enabled": True,
    "responsive_web_media_download_video_enabled": False,
}

USER_FEATURES = {
    "hidden_profile_subscriptions_enabled": True,
    "rweb_tipjar_consumption_enabled": True,
    "responsive_web_graphql_exclude_directive_enabled": True,
    "verified_phone_label_enabled": False,
    "subscriptions_verification_info_is_identity_verified_enabled": True,
    "subscriptions_verification_info_verified_since_enabled": True,
    "highlights_tweets_tab_ui_enabled": True,
    "responsive_web_twitter_article_notes_tab_enabled": True,
    "subscriptions_feature_can_gift_premium": True,
    "creator_subscriptions_tweet_preview_api_enabled": True,
    "responsive_web_graphql_skip_user_profile_image_extensions_enabled": False,
    "responsive_web_graphql_timeline_navigation_enabled": True,
}


class TwitterScraper:
    def __init__(self):
        self.session = requests.Session()
        self.query_ids = {}
        self._me_cache = None
        self._img_pool = None
        self._load_config()
        self._setup_session()

    # ── Image downloads (background, non-blocking) ──────────

    def _get_img_pool(self):
        if self._img_pool is None:
            from concurrent.futures import ThreadPoolExecutor
            self._img_pool = ThreadPoolExecutor(max_workers=6)
        return self._img_pool

    def queue_tweet_media(self, tweets):
        """Queue image downloads for a batch of tweets (non-blocking)."""
        pool = self._get_img_pool()
        for t in tweets:
            if any((m.get("type") == "photo" and m.get("url"))
                   for m in (t.get("media") or [])):
                pool.submit(self._download_tweet_media, t)

    def _download_tweet_media(self, tweet):
        import re as _re
        import urllib.request
        try:
            user = (tweet.get("user") or {}).get("username") or "unknown"
            safe_user = _re.sub(r"[^\w.-]", "_", user)[:60]
            tid = str(tweet.get("id") or "x")
            dest_dir = os.path.join(MEDIA_ROOT, "twitter", safe_user)
            os.makedirs(dest_dir, exist_ok=True)
            changed = False
            for i, m in enumerate(tweet.get("media") or []):
                if m.get("type") != "photo" or not m.get("url"):
                    continue
                url = m["url"]
                # Twitter image URLs accept ?name=orig for full resolution
                dl = url + ("&" if "?" in url else "?") + "name=orig"
                ext = ".jpg"
                mm = _re.search(r"\.(jpg|jpeg|png|gif|webp)", url.lower())
                if mm:
                    ext = "." + mm.group(1)
                fname = f"{tid}_{i}{ext}"
                fpath = os.path.join(dest_dir, fname)
                rel = os.path.join("twitter", safe_user, fname)
                if os.path.exists(fpath):
                    m["local"] = rel
                    changed = True
                    continue
                try:
                    req = urllib.request.Request(dl, headers={"User-Agent": "Mozilla/5.0"})
                    with urllib.request.urlopen(req, timeout=20) as resp:
                        data = resp.read()
                    if data and len(data) > 1000:
                        with open(fpath, "wb") as f:
                            f.write(data)
                        m["local"] = rel
                        changed = True
                except Exception:
                    pass
            if changed:
                update_tweet_media_json(tweet.get("id"), tweet.get("media"))
        except Exception:
            pass

    def _load_config(self):
        """Load auth config from config.json."""
        if os.path.exists(CONFIG_PATH):
            try:
                with open(CONFIG_PATH) as f:
                    self.config = json.load(f)
            except (json.JSONDecodeError, OSError) as e:
                print(f"[Scraper] Warning: could not read config ({e}), starting unauthenticated")
                self.config = {}
        else:
            self.config = {}

    def save_config(self, ct0, auth_token):
        """Save auth cookies to config."""
        self.config = {"ct0": ct0, "auth_token": auth_token}
        with open(CONFIG_PATH, "w") as f:
            json.dump(self.config, f, indent=2)
        self._setup_session()

    def _setup_session(self):
        """Configure session with auth headers."""
        ct0 = self.config.get("ct0", "")
        auth_token = self.config.get("auth_token", "")

        self.session.headers.update({
            "authorization": f"Bearer {BEARER_TOKEN}",
            "x-csrf-token": ct0,
            "x-twitter-active-user": "yes",
            "x-twitter-auth-type": "OAuth2Session",
            "x-twitter-client-language": "en",
            "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
            "accept": "*/*",
            "accept-language": "en-US,en;q=0.9",
            "referer": "https://x.com/",
        })

        self.session.cookies.set("ct0", ct0, domain=".x.com")
        self.session.cookies.set("auth_token", auth_token, domain=".x.com")

    def is_authenticated(self):
        """Check if we have valid auth tokens."""
        return bool(self.config.get("ct0")) and bool(self.config.get("auth_token"))

    def get_me(self):
        """Get the authenticated user's profile info."""
        if not self.is_authenticated():
            return None
        if self._me_cache is not None:
            return self._me_cache
        try:
            resp = self.session.get(
                "https://x.com/i/api/1.1/account/multi/list.json",
                timeout=10,
            )
            if resp.status_code == 200:
                data = resp.json()
                users = data.get("users", [])
                if users:
                    u = users[0]
                    self._me_cache = {
                        "username": u.get("screen_name"),
                        "display_name": u.get("name"),
                        "id": str(u.get("user_id", "")),
                    }
                    return self._me_cache
        except Exception as e:
            print(f"[Scraper] get_me error: {e}")
        return None

    def _extract_query_ids(self):
        """Extract GraphQL query IDs from Twitter's JS bundles."""
        if self.query_ids:
            return

        # Try cached query IDs
        cache_path = os.path.join(os.path.dirname(__file__), ".query_ids_cache.json")
        if os.path.exists(cache_path):
            with open(cache_path) as f:
                cache = json.load(f)
                if time.time() - cache.get("timestamp", 0) < 3600:
                    self.query_ids = cache.get("ids", {})
                    if self.query_ids:
                        return

        print("[Scraper] Extracting query IDs from Twitter...")
        try:
            import re
            # Use a plain GET to x.com (no auth needed) to find JS bundles
            plain_resp = requests.get("https://x.com", headers={
                "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
            }, timeout=15)
            html = plain_resp.text

            # Find all JS URLs
            script_urls = re.findall(r'"(https://abs\.twimg\.com/[^"]+\.js)"', html)

            operations = ["UserTweets", "UserByScreenName", "SearchTimeline", "Likes",
                          "UserTweetsAndReplies", "TweetDetail"]

            for url in script_urls[:10]:
                if all(op in self.query_ids for op in operations):
                    break
                try:
                    js_resp = self.session.get(url, timeout=15)
                    js = js_resp.text
                    for op in operations:
                        if op in self.query_ids:
                            continue
                        patterns = [
                            rf'queryId:"([^"]+)",operationName:"{op}"',
                            rf'"queryId":"([^"]+)","operationName":"{op}"',
                            rf'queryId:"([^"]+)"[^}}]{{0,50}}operationName:"{op}"',
                        ]
                        for pattern in patterns:
                            match = re.search(pattern, js)
                            if match:
                                self.query_ids[op] = match.group(1)
                                break
                except Exception:
                    continue

            if self.query_ids:
                with open(cache_path, "w") as f:
                    json.dump({"ids": self.query_ids, "timestamp": time.time()}, f)
                print(f"[Scraper] Found query IDs: {list(self.query_ids.keys())}")
            else:
                print("[Scraper] Warning: Could not extract query IDs from JS bundles")
        except Exception as e:
            print(f"[Scraper] Error extracting query IDs: {e}")

        # Fill in any missing operations from fallback IDs
        missing = [op for op in FALLBACK_QUERY_IDS if op not in self.query_ids]
        if missing:
            for op in missing:
                self.query_ids[op] = FALLBACK_QUERY_IDS[op]
            print(f"[Scraper] Using fallback query IDs for: {missing}")

    def _api_call(self, operation_name, variables, features=None, cancel_check=None, event_callback=None):
        """Make a GraphQL API call to Twitter."""
        self._extract_query_ids()
        self._raise_if_cancelled(cancel_check)

        query_id = self.query_ids.get(operation_name)
        if not query_id:
            raise Exception(f"No query ID for {operation_name}. Try visiting x.com first.")

        params = {
            "variables": json.dumps(variables),
            "features": json.dumps(features or FEATURES),
        }

        url = f"https://x.com/i/api/graphql/{query_id}/{operation_name}"

        for attempt in range(3):
            self._raise_if_cancelled(cancel_check)
            resp = self.session.get(url, params=params, timeout=30)

            if resp.status_code == 200:
                return resp.json()
            elif resp.status_code == 429:
                reset = resp.headers.get("x-rate-limit-reset")
                if reset:
                    wait = max(int(reset) - int(time.time()), 10)
                else:
                    wait = 60
                print(f"[Scraper] Rate limited, waiting {wait}s...")
                if event_callback:
                    event_callback({
                        "status": "rate_limited",
                        "wait_seconds": wait,
                        "message": f"Rate limited by X, waiting about {wait}s",
                    })
                self._sleep_with_cancel(min(wait, 120), cancel_check)
            elif resp.status_code == 401:
                raise Exception("Auth failed (401). Your cookies have expired. Paste fresh cookies in the web UI.")
            elif resp.status_code == 403:
                raise Exception("Auth failed (403). Your cookies may have expired. Paste fresh cookies in the web UI.")
            else:
                raise Exception(f"API error {resp.status_code}: {resp.text[:200]}")

        raise Exception("Max retries exceeded")

    def get_user_id(self, username):
        """Resolve username to user ID."""
        variables = {
            "screen_name": username,
            "withSafetyModeUserFields": True,
        }
        data = self._api_call("UserByScreenName", variables, USER_FEATURES)
        user = data.get("data", {}).get("user", {}).get("result", {})
        user_id = user.get("rest_id")
        if not user_id:
            raise Exception(f"User @{username} not found")
        return user_id, user.get("legacy", {})

    def _raise_if_cancelled(self, cancel_check=None):
        """Raise a standard cancellation error when the caller requests it."""
        if cancel_check and cancel_check():
            raise Exception("Cancelled by user")

    def _sleep_with_cancel(self, seconds, cancel_check=None, interval=0.25):
        """Sleep in short chunks so cancel requests are noticed quickly."""
        end_time = time.time() + seconds
        while time.time() < end_time:
            self._raise_if_cancelled(cancel_check)
            time.sleep(min(interval, max(0, end_time - time.time())))

    def scrape_user_tweets(self, username, max_pages=100, callback=None, include_replies=False, cancel_check=None):
        """Scrape tweets from a user's timeline with resume support.

        - Resumes from saved cursor if a previous scrape was interrupted.
        - Stops early if it hits tweets already in the DB (caught up).
        - If include_replies=True, uses UserTweetsAndReplies endpoint.
        """
        username = username.lstrip("@").strip()
        endpoint = "UserTweetsAndReplies" if include_replies else "UserTweets"
        progress_key = f"user_{username}_{endpoint}"
        existing_count = get_user_tweet_count(username)

        user_id, user_info = self.get_user_id(username)
        total_on_profile = user_info.get("statuses_count", "?")
        print(f"\n[Scraper] @{username} | {user_info.get('name', '')} | "
              f"{total_on_profile} tweets on profile, {existing_count} in DB")

        # Check for saved progress to resume
        progress = get_progress(progress_key)
        cursor = None
        start_page = 0
        total_new = 0

        if progress and progress["status"] == "in_progress" and progress.get("cursor"):
            cursor = progress["cursor"]
            start_page = progress["pages_fetched"]
            total_new = progress["tweets_saved"]
            print(f"[Scraper] Resuming from page {start_page + 1} (cursor saved, {total_new} already captured)")
            if callback:
                callback({
                    "page": start_page,
                    "new": 0,
                    "total_new": total_new,
                    "status": "resuming",
                })
        elif existing_count > 0:
            print(f"[Scraper] Already have {existing_count} tweets, fetching only new ones")

        empty_pages = 0
        consecutive_dup_pages = 0
        # When starting fresh with existing tweets, we need to push past duplicates
        # to find older tweets we haven't captured yet.
        # When resuming from a cursor, we're already past known tweets, so 2 dup pages = caught up.
        is_resuming = progress and progress["status"] == "in_progress" and progress.get("cursor")
        max_dup_pages = 2 if is_resuming else 10

        page_offset = 0
        while max_pages is None or page_offset < max_pages:
            self._raise_if_cancelled(cancel_check)
            page = start_page + page_offset + 1

            variables = {
                "userId": user_id,
                "count": 40,
                "includePromotedContent": False,
                "withQuickPromoteEligibilityTweetFields": False,
                "withVoice": True,
                "withV2Timeline": True,
            }
            if cursor:
                variables["cursor"] = cursor

            try:
                data = self._api_call(
                    endpoint,
                    variables,
                    cancel_check=cancel_check,
                    event_callback=callback,
                )
                tweets = self._extract_tweets(data)

                if not tweets:
                    empty_pages += 1
                    if empty_pages >= 3:
                        print(f"[Scraper] No more tweets available")
                        save_progress(progress_key, username, endpoint, cursor, page, total_new, "complete")
                        break
                else:
                    empty_pages = 0

                # Ensure username is populated on each tweet
                for t in tweets:
                    u = t.get("user", {})
                    if not u.get("username"):
                        u["username"] = username

                result = insert_tweets(tweets, {
                    "endpoint": endpoint,
                    "source_identifier": username,
                })
                self.queue_tweet_media(tweets)

                total_new += result["inserted"]

                # If entire page was duplicates, we may have caught up
                if result["inserted"] == 0 and result["duplicates"] > 0:
                    consecutive_dup_pages += 1
                    if consecutive_dup_pages >= max_dup_pages:
                        print(f"[Scraper] Caught up - {consecutive_dup_pages} consecutive duplicate pages")
                        save_progress(progress_key, username, endpoint, cursor, page, total_new, "complete")
                        break
                else:
                    consecutive_dup_pages = 0

                print(f"[Scraper] Page {page}: +{result['inserted']} new, {result['duplicates']} dups (total: {total_new})")

                if callback:
                    callback({
                        "page": page,
                        "new": result["inserted"],
                        "total_new": total_new,
                        "status": "running",
                    })

                # Get next cursor and save progress
                next_cursor = self._extract_cursor(data)
                if not next_cursor or next_cursor == cursor:
                    print("[Scraper] No more pages")
                    save_progress(progress_key, username, endpoint, None, page, total_new, "complete")
                    break
                cursor = next_cursor

                # Save progress after each page so we can resume
                save_progress(progress_key, username, endpoint, cursor, page, total_new, "in_progress")

                delay = random.uniform(2, 5) if random.random() > 0.1 else random.uniform(8, 15)
                self._sleep_with_cancel(delay, cancel_check)
                page_offset += 1

            except Exception as e:
                if "Cancelled" in str(e):
                    print(f"[Scraper] Cancelled by user on page {page}")
                    save_progress(progress_key, username, endpoint, cursor, page - 1, total_new, "in_progress")
                    raise
                print(f"[Scraper] Error on page {page}: {e}")
                # Save progress so we can resume later
                save_progress(progress_key, username, endpoint, cursor, page - 1, total_new, "in_progress")
                if "403" in str(e) or "Auth" in str(e):
                    break
                self._sleep_with_cancel(5, cancel_check)
                page_offset += 1

        detect_threads()
        final_count = get_user_tweet_count(username)
        print(f"\n[Scraper] Done! @{username}: {total_new} new tweets saved ({final_count} total in DB)")
        return {"username": username, "new_tweets": total_new, "total_in_db": final_count}

    def scrape_search(self, query, max_pages=50, callback=None, cancel_check=None, run_thread_detection=True):
        """Scrape tweets matching a search query."""
        print(f'\n[Scraper] Starting search: "{query}"')

        cursor = None
        total_new = 0
        total_dups = 0
        empty_pages = 0

        if callback:
            callback({
                "page": 0,
                "new": 0,
                "total_new": 0,
                "status": "starting",
            })

        page = 0
        while max_pages is None or page < max_pages:
            self._raise_if_cancelled(cancel_check)
            variables = {
                "rawQuery": query,
                "count": 40,
                "querySource": "typed_query",
                "product": "Latest",
            }
            if cursor:
                variables["cursor"] = cursor

            try:
                data = self._api_call(
                    "SearchTimeline",
                    variables,
                    cancel_check=cancel_check,
                    event_callback=callback,
                )
                tweets = self._extract_tweets(data)

                if not tweets:
                    empty_pages += 1
                    if empty_pages >= 3:
                        break
                else:
                    empty_pages = 0

                result = insert_tweets(tweets, {
                    "endpoint": "SearchTimeline",
                    "source_identifier": query,
                })
                self.queue_tweet_media(tweets)

                total_new += result["inserted"]
                total_dups += result["duplicates"]

                print(f"[Scraper] Page {page + 1}: +{result['inserted']} new (total: {total_new})")

                if callback:
                    callback({
                        "page": page + 1,
                        "new": result["inserted"],
                        "total_new": total_new,
                        "status": "running",
                    })

                next_cursor = self._extract_cursor(data)
                if not next_cursor or next_cursor == cursor:
                    break
                cursor = next_cursor

                delay = random.uniform(2, 5) if random.random() > 0.1 else random.uniform(8, 15)
                self._sleep_with_cancel(delay, cancel_check)
                page += 1

            except Exception as e:
                if "Cancelled" in str(e):
                    print(f"[Scraper] Search cancelled by user on page {page + 1}")
                    raise
                print(f"[Scraper] Error: {e}")
                if "403" in str(e):
                    break
                self._sleep_with_cancel(5, cancel_check)
                page += 1

        if run_thread_detection:
            detect_threads()
        print(f'[Scraper] Done! Search "{query}": {total_new} new tweets')
        return {"query": query, "new_tweets": total_new, "duplicates": total_dups}

    def scrape_likes(self, username, max_pages=50, callback=None, cancel_check=None):
        """Scrape a user's liked tweets."""
        username = username.lstrip("@").strip()
        print(f"\n[Scraper] Starting likes capture for @{username}")

        user_id, _ = self.get_user_id(username)
        cursor = None
        total_new = 0
        empty_pages = 0

        page = 0
        while max_pages is None or page < max_pages:
            self._raise_if_cancelled(cancel_check)
            variables = {
                "userId": user_id,
                "count": 40,
                "includePromotedContent": False,
                "withClientEventToken": False,
                "withBirdwatchNotes": False,
                "withVoice": True,
                "withV2Timeline": True,
            }
            if cursor:
                variables["cursor"] = cursor

            try:
                data = self._api_call("Likes", variables, cancel_check=cancel_check, event_callback=callback)
                tweets = self._extract_tweets(data)

                if not tweets:
                    empty_pages += 1
                    # On page 1 with no results, check if likes are restricted
                    if page == 0 and empty_pages == 1:
                        raw_str = str(data)
                        if "LikesNotAvailable" in raw_str or "TimelineMessagePrompt" in raw_str:
                            raise Exception(
                                f"@{username} has restricted their likes — "
                                "X no longer allows viewing other users' likes unless you are the account owner."
                            )
                    if empty_pages >= 3:
                        break
                else:
                    empty_pages = 0

                result = insert_tweets(tweets, {
                    "endpoint": "Likes",
                    "source_identifier": f"{username}_likes",
                })
                self.queue_tweet_media(tweets)

                total_new += result["inserted"]
                print(f"[Scraper] Page {page + 1}: +{result['inserted']} new (total: {total_new})")

                if callback:
                    callback({
                        "page": page + 1,
                        "new": result["inserted"],
                        "total_new": total_new,
                        "status": "running",
                    })

                next_cursor = self._extract_cursor(data)
                if not next_cursor or next_cursor == cursor:
                    break
                cursor = next_cursor

                delay = random.uniform(2, 5) if random.random() > 0.1 else random.uniform(8, 15)
                self._sleep_with_cancel(delay, cancel_check)
                page += 1

            except Exception as e:
                if "Cancelled" in str(e):
                    print(f"[Scraper] Likes cancelled by user on page {page + 1}")
                    raise
                print(f"[Scraper] Error: {e}")
                if "403" in str(e):
                    break
                if "restricted" in str(e).lower() or "LikesNotAvailable" in str(e):
                    raise
                self._sleep_with_cancel(5, cancel_check)
                page += 1

        detect_threads()
        print(f"[Scraper] Done! @{username} likes: {total_new} new tweets")
        return {"username": username, "new_tweets": total_new}

    def _extract_tweets(self, data):
        """Extract tweet objects from GraphQL response."""
        tweets = []

        def walk(obj, depth=0):
            if not obj or not isinstance(obj, (dict, list)) or depth > 25:
                return
            if isinstance(obj, dict):
                if "tweet_results" in obj and isinstance(obj["tweet_results"], dict):
                    result = obj["tweet_results"].get("result")
                    if result:
                        tweet = self._parse_tweet(result)
                        if tweet:
                            tweets.append(tweet)
                    return
                if obj.get("__typename") == "Tweet" and "legacy" in obj and "core" in obj:
                    tweet = self._parse_tweet(obj)
                    if tweet:
                        tweets.append(tweet)
                    return
                for v in obj.values():
                    walk(v, depth + 1)
            elif isinstance(obj, list):
                for item in obj:
                    walk(item, depth + 1)

        walk(data)
        return tweets

    def _parse_tweet(self, result):
        """Parse a single tweet result object."""
        try:
            if result.get("__typename") == "TweetWithVisibilityResults":
                result = result.get("tweet", result)

            legacy = result.get("legacy")
            if not legacy:
                return None

            tweet_id = legacy.get("id_str") or result.get("rest_id")
            if not tweet_id:
                return None

            user_result = (result.get("core", {}).get("user_results", {}).get("result") or
                           result.get("core", {}).get("user_result", {}).get("result") or {})
            user_legacy = user_result.get("legacy", {})

            urls = [{
                "url": u.get("url"),
                "expanded_url": u.get("expanded_url"),
                "display_url": u.get("display_url"),
            } for u in (legacy.get("entities", {}).get("urls") or [])]

            # Prefer extended_entities (has video/gif details); fall back to entities
            raw_media = (
                legacy.get("extended_entities", {}).get("media") or
                legacy.get("entities", {}).get("media") or
                []
            )
            media = [{
                "type": m.get("type"),          # photo | video | animated_gif
                "url": m.get("media_url_https"),
                "alt_text": m.get("ext_alt_text"),
            } for m in raw_media]

            view_count = result.get("views", {}).get("count")

            return {
                "id": tweet_id,
                "text": legacy.get("full_text"),
                "created_at": legacy.get("created_at"),
                "user": {
                    "id": user_legacy.get("id_str") or user_result.get("rest_id"),
                    "username": user_legacy.get("screen_name"),
                    "display_name": user_legacy.get("name"),
                    "verified": user_legacy.get("verified") or user_result.get("is_blue_verified"),
                },
                "metrics": {
                    "retweet_count": legacy.get("retweet_count", 0),
                    "reply_count": legacy.get("reply_count", 0),
                    "like_count": legacy.get("favorite_count", 0),
                    "quote_count": legacy.get("quote_count", 0),
                    "bookmark_count": legacy.get("bookmark_count", 0),
                    "view_count": int(view_count) if view_count else None,
                },
                "urls": urls,
                "media": media,
                "is_retweet": bool(legacy.get("retweeted_status_result")),
                "is_reply": bool(legacy.get("in_reply_to_status_id_str")),
                "in_reply_to": legacy.get("in_reply_to_status_id_str"),
                "conversation_id": legacy.get("conversation_id_str"),
                "language": legacy.get("lang"),
            }
        except Exception as e:
            print(f"[Scraper] Failed to parse tweet (result keys: {list(result.keys()) if isinstance(result, dict) else type(result)}): {e}")
            return None

    def _extract_cursor(self, data):
        """Extract bottom cursor for pagination."""
        cursor = None

        def walk(obj, depth=0):
            nonlocal cursor
            if cursor or not obj or not isinstance(obj, (dict, list)) or depth > 20:
                return
            if isinstance(obj, dict):
                cursor_type = (obj.get("cursorType") or "").lower()
                if cursor_type and "bottom" in cursor_type:
                    cursor = obj.get("value")
                    return
                entry_id = obj.get("entryId", "")
                if isinstance(entry_id, str) and entry_id.startswith("cursor-bottom"):
                    cursor = obj.get("content", {}).get("value")
                    return
                for v in obj.values():
                    walk(v, depth + 1)
            elif isinstance(obj, list):
                for item in obj:
                    walk(item, depth + 1)

        walk(data)
        return cursor


# Singleton
scraper = TwitterScraper()
