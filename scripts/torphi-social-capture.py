#!/usr/bin/env python3
"""Capture X/Twitter updates for TOR Phi's own mapped-account archive.

This script intentionally does not read Social Analyzer's tweet databases. It
only reuses the cookie/config pattern and GraphQL method so TOR Phi can build a
separate archive from internal project profiles.
"""

from __future__ import annotations

import argparse
import email.utils
import html
import json
import math
import os
import queue
import random
import re
import sqlite3
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
ANALYZER_CONFIG = ROOT / "Social Analyzer" / "backend" / "config.json"
REGISTRY_PATH = ROOT / "public" / "source" / "social" / "accounts.json"
DATA_DIR = ROOT / "data"
DB_PATH = DATA_DIR / "torphi-social.db"
QUERY_CACHE_PATH = DATA_DIR / "torphi-social-query-ids.json"

BEARER_TOKEN = "AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA"

FALLBACK_QUERY_IDS = {
    "UserTweets": "x3B_xLqC0yZawOB7WQhaVQ",
    "UserByScreenName": "IGgvgiOx4QZndDHuD3x9TQ",
    "SearchTimeline": "pCd62NDD9dlCDgEGgEVHMg",
    "UserTweetsAndReplies": "Yt1JzwcBsBWYEEi3jMTe2Q",
}

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

WATCH_TERMS = [
    ("Kurdistan", re.compile(r"\bkurdistan\b", re.I)),
    ("KRG", re.compile(r"\bkrg\b|\bikby\b", re.I)),
    ("Erbil", re.compile(r"\berbil\b|\birbil\b", re.I)),
    ("Peshmerga", re.compile(r"\bpeshmerga\b", re.I)),
    ("Northern Iraq", re.compile(r"\bnorthern iraq\b", re.I)),
    ("Iraq", re.compile(r"\biraq(?:i)?\b|\bbaghdad\b|\bmosul\b|\bkirkuk\b", re.I)),
    ("Syria", re.compile(r"\bsyria(?:n)?\b|\byPG\b|\bsdf\b", re.I)),
    ("Turkiye", re.compile(r"\bturkey\b|\bturkiye\b|\btürkiye\b|\bankara\b", re.I)),
    ("Iran", re.compile(r"\biran(?:ian)?\b|\btehran\b", re.I)),
]

LANE_SEARCH_TERMS = {
    "kurdistan": [
        "Kurdistan",
        "KRG",
        "IKBY",
        "Erbil",
        "Peshmerga",
        "Barzani",
        "Northern Iraq",
        "Sinjar",
        "Yazidi",
    ],
    "iraq": [
        "Iraq",
        "Iraqi",
        "Baghdad",
        "Mosul",
        "Kirkuk",
        "Basra",
        "Daesh",
        "ISIS",
    ],
}

SEARCH_OWNER_PRIORITY = {
    "Foreign ministry": 0,
    "Government office": 1,
    "Kurdistan representation": 2,
    "Country profile actor": 3,
    "Profile": 4,
    "Think tank": 5,
    "Media": 6,
    "Congress": 7,
    "Parliament": 8,
    "Manual": 9,
}


def parse_cookie_values(text: str) -> dict[str, str]:
    def extract(name: str) -> str:
        patterns = [
            rf"^{name}\s*=\s*([^\s;]+)",
            rf"(?:^|[;\s]){name}=([^;\s]+)",
        ]
        for pattern in patterns:
            match = re.search(pattern, text, re.M)
            if match:
                return match.group(1).strip().strip("\"'")
        return ""

    return {
        "ct0": extract("ct0"),
        "auth_token": extract("auth_token"),
    }


def load_twitter_identity_configs() -> list[dict[str, Any]]:
    configs: list[dict[str, Any]] = []

    def add_config(label: str, config: dict[str, Any]) -> None:
        ct0 = config.get("ct0") or ""
        auth_token = config.get("auth_token") or ""
        if not ct0 or not auth_token:
            return
        fingerprint = (ct0[-12:], auth_token[-8:])
        if any((item.get("ct0", "")[-12:], item.get("auth_token", "")[-8:]) == fingerprint for item in configs):
            return
        configs.append({"label": label, "ct0": ct0, "auth_token": auth_token})

    add_config("env:default", {
        "ct0": os.environ.get("TORPHI_X_CT0") or os.environ.get("X_CT0") or "",
        "auth_token": os.environ.get("TORPHI_X_AUTH_TOKEN") or os.environ.get("X_AUTH_TOKEN") or "",
    })

    for index in range(1, 11):
        add_config(f"env:{index}", {
            "ct0": os.environ.get(f"TORPHI_X_CT0_{index}") or "",
            "auth_token": os.environ.get(f"TORPHI_X_AUTH_TOKEN_{index}") or "",
        })

    if ANALYZER_CONFIG.exists():
        try:
            config = json.loads(ANALYZER_CONFIG.read_text())
            add_config("local:social-analyzer", config)
        except (OSError, json.JSONDecodeError):
            pass

    for cookie_file in sorted(DATA_DIR.glob("x-account-*-cookie.txt")):
        try:
            add_config(f"local:{cookie_file.name}", parse_cookie_values(cookie_file.read_text(errors="replace")))
        except OSError:
            pass

    return configs


class TorPhiTwitterClient:
    def __init__(self, config: dict[str, Any] | None = None) -> None:
        self.config = config or self._load_config()
        self.query_ids: dict[str, str] = {}
        self.label = self.config.get("label") or "default"

    def is_authenticated(self) -> bool:
        return bool(self.config.get("ct0") and self.config.get("auth_token"))

    def _load_config(self) -> dict[str, Any]:
        configs = load_twitter_identity_configs()
        return configs[0] if configs else {}

    def _headers(self) -> dict[str, str]:
        ct0 = self.config.get("ct0", "")
        auth_token = self.config.get("auth_token", "")
        return {
            "authorization": f"Bearer {BEARER_TOKEN}",
            "x-csrf-token": ct0,
            "x-twitter-active-user": "yes",
            "x-twitter-auth-type": "OAuth2Session",
            "x-twitter-client-language": "en",
            "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
            "accept": "*/*",
            "accept-language": "en-US,en;q=0.9",
            "referer": "https://x.com/",
            "cookie": f"ct0={ct0}; auth_token={auth_token}",
        }

    def _rate_limit_wait_seconds(self, exc: urllib.error.HTTPError) -> int:
        retry_after = exc.headers.get("retry-after")
        reset = exc.headers.get("x-rate-limit-reset")
        wait_seconds = 60
        if retry_after:
            if retry_after.isdigit():
                wait_seconds = max(int(retry_after), 10)
            else:
                try:
                    retry_at = email.utils.parsedate_to_datetime(retry_after)
                    wait_seconds = max(int(retry_at.timestamp()) - int(time.time()), 10)
                except (TypeError, ValueError):
                    wait_seconds = 60
        elif reset and reset.isdigit():
            wait_seconds = max(int(reset) - int(time.time()), 10)
        max_rate_wait = max(int(os.environ.get("TORPHI_X_MAX_RATE_WAIT", "900")), 0)
        if max_rate_wait == 0:
            raise RuntimeError("X rate limit hit; TORPHI_X_MAX_RATE_WAIT=0 so this run will not wait.") from exc
        return min(wait_seconds, max_rate_wait)

    def _open_with_rate_limit(self, request: urllib.request.Request, *, timeout: int, context: str, attempts: int = 8) -> bytes:
        for attempt in range(1, attempts + 1):
            try:
                with urllib.request.urlopen(request, timeout=timeout) as response:
                    return response.read()
            except urllib.error.HTTPError as exc:
                if exc.code != 429:
                    raise
                wait_seconds = self._rate_limit_wait_seconds(exc)
                wait_until = int(time.time()) + wait_seconds
                print(f"[TOR Phi] Rate limited by X; waiting {wait_seconds}s until {iso_from_epoch(wait_until)} ({context}; attempt {attempt}/{attempts}).")
                time.sleep(wait_seconds)
        raise RuntimeError(f"X rate limit did not clear after {attempts} attempts for {context}. Resume later with the same filters; already scraped accounts are preserved.")

    def _get_text(self, url: str, *, headers: dict[str, str] | None = None, timeout: int = 25, context: str = "X request") -> str:
        request = urllib.request.Request(url, headers=headers or self._headers())
        return self._open_with_rate_limit(request, timeout=timeout, context=context).decode("utf-8", errors="replace")

    def _get_json(self, url: str, *, headers: dict[str, str] | None = None, timeout: int = 35, context: str = "X JSON request") -> dict[str, Any]:
        request = urllib.request.Request(url, headers=headers or self._headers())
        return json.loads(self._open_with_rate_limit(request, timeout=timeout, context=context).decode("utf-8"))

    def _extract_query_ids(self) -> None:
        if self.query_ids:
            return
        if QUERY_CACHE_PATH.exists():
            try:
                cache = json.loads(QUERY_CACHE_PATH.read_text())
                cached_ids = cache.get("ids") or {}
                if time.time() - float(cache.get("timestamp", 0)) < 3600 and cached_ids:
                    self.query_ids = cached_ids
                    if all(operation in self.query_ids for operation in FALLBACK_QUERY_IDS):
                        return
            except (OSError, ValueError, json.JSONDecodeError):
                pass

        print("[TOR Phi] Refreshing X GraphQL query IDs...")
        headers = {"user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"}
        operations = list(FALLBACK_QUERY_IDS)
        try:
            html = self._get_text("https://x.com", headers=headers, timeout=20)
            script_urls = re.findall(r'"(https://abs\.twimg\.com/[^"]+\.js)"', html)
            for script_url in script_urls[:12]:
                if all(op in self.query_ids for op in operations):
                    break
                try:
                    js = self._get_text(script_url, timeout=20)
                except Exception:
                    continue
                for operation in operations:
                    if operation in self.query_ids:
                        continue
                    for pattern in (
                        rf'queryId:"([^"]+)",operationName:"{operation}"',
                        rf'"queryId":"([^"]+)","operationName":"{operation}"',
                        rf'queryId:"([^"]+)"[^}}]{{0,80}}operationName:"{operation}"',
                    ):
                        match = re.search(pattern, js)
                        if match:
                            self.query_ids[operation] = match.group(1)
                            break
        except Exception as exc:
            print(f"[TOR Phi] Query ID refresh warning: {exc}")

        for operation, fallback in FALLBACK_QUERY_IDS.items():
            self.query_ids.setdefault(operation, fallback)

        DATA_DIR.mkdir(parents=True, exist_ok=True)
        QUERY_CACHE_PATH.write_text(json.dumps({"timestamp": time.time(), "ids": self.query_ids}, indent=2))

    def api_call(self, operation_name: str, variables: dict[str, Any], features: dict[str, Any] | None = None) -> dict[str, Any]:
        self._extract_query_ids()
        query_id = self.query_ids[operation_name]
        params = urllib.parse.urlencode({
            "variables": json.dumps(variables, separators=(",", ":")),
            "features": json.dumps(features or FEATURES, separators=(",", ":")),
        })
        url = f"https://x.com/i/api/graphql/{query_id}/{operation_name}?{params}"

        for attempt in range(3):
            try:
                return self._get_json(url, context=f"GraphQL {operation_name}")
            except urllib.error.HTTPError as exc:
                if exc.code in (401, 403):
                    raise RuntimeError("X authentication failed. Refresh the Social Analyzer cookies, then rerun capture.") from exc
                detail = exc.read(240).decode("utf-8", errors="replace")
                raise RuntimeError(f"X API error {exc.code}: {detail}") from exc
            except urllib.error.URLError as exc:
                if attempt == 2:
                    raise RuntimeError(f"Network error calling X: {exc}") from exc
                time.sleep(4 + attempt * 4)

        raise RuntimeError("X API call failed after retries.")

    def get_user(self, username: str) -> tuple[str, dict[str, Any]]:
        data = self.api_call(
            "UserByScreenName",
            {"screen_name": normalize_handle(username), "withSafetyModeUserFields": True},
            USER_FEATURES,
        )
        user = data.get("data", {}).get("user", {}).get("result", {})
        user_id = user.get("rest_id")
        if not user_id:
            raise RuntimeError(f"@{username} was not found by X.")
        return user_id, user.get("legacy", {})

    def fetch_user_tweets(self, username: str, *, pages: int = 1, include_replies: bool = False) -> tuple[dict[str, Any], list[dict[str, Any]]]:
        handle = normalize_handle(username)
        endpoint = "UserTweetsAndReplies" if include_replies else "UserTweets"
        user_id, user_info = self.get_user(handle)
        tweets: list[dict[str, Any]] = []
        cursor = None

        for page in range(pages):
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
                data = self.api_call(endpoint, variables)
            except RuntimeError as exc:
                if include_replies and "X API error 404" in str(exc):
                    print(f"[TOR Phi] @{handle}: replies endpoint unavailable; falling back to top-level timeline.")
                    return self.fetch_user_tweets(handle, pages=pages, include_replies=False)
                raise
            page_tweets = self.extract_tweets(data)
            for tweet in page_tweets:
                tweet.setdefault("user", {})
                tweet["user"]["username"] = tweet["user"].get("username") or handle
            tweets.extend(page_tweets)
            next_cursor = self.extract_cursor(data)
            if not next_cursor or next_cursor == cursor:
                break
            cursor = next_cursor
            if page < pages - 1:
                time.sleep(random.uniform(1.8, 4.2))

        return user_info, dedupe_tweets(tweets)

    def search_latest(self, query: str, *, pages: int = 1) -> list[dict[str, Any]]:
        tweets: list[dict[str, Any]] = []
        cursor = None

        for page in range(pages):
            variables = {
                "rawQuery": query,
                "count": 40,
                "querySource": "typed_query",
                "product": "Latest",
            }
            if cursor:
                variables["cursor"] = cursor
            data = self.api_call("SearchTimeline", variables)
            tweets.extend(self.extract_tweets(data))
            next_cursor = self.extract_cursor(data)
            if not next_cursor or next_cursor == cursor:
                break
            cursor = next_cursor
            if page < pages - 1:
                time.sleep(random.uniform(1.8, 4.2))

        return dedupe_tweets(tweets)

    def fetch_syndication_tweets(self, username: str, *, pages: int = 1) -> tuple[dict[str, Any], list[dict[str, Any]]]:
        handle = normalize_handle(username)
        limit = min(max(int(pages or 1) * 20, 20), 100)
        params = urllib.parse.urlencode({
            "dnt": "false",
            "embedId": "twitter-widget-0",
            "features": "eyJ0ZndfdGltZWxpbmVfbGlzdCI6eyJidWNrZXQiOlsiY3R4V2l0aG91dENvdW50cyJdLCJ2ZXJzaW9uIjpudWxsfSwidGZ3X2ZvbGxvd2luZyI6eyJidWNrZXQiOlsiY3R4V2l0aG91dENvdW50cyJdLCJ2ZXJzaW9uIjpudWxsfX0=",
            "frame": "false",
            "hideBorder": "false",
            "hideFooter": "false",
            "hideHeader": "false",
            "hideScrollBar": "false",
            "lang": "en",
            "limit": str(limit),
            "origin": "https://x.com",
            "sessionId": "torphi",
            "showHeader": "true",
            "showReplies": "false",
            "transparent": "false",
            "widgetsVersion": "2615f7e52b7e0:1702314776716",
        })
        url = f"https://syndication.twitter.com/srv/timeline-profile/screen-name/{urllib.parse.quote(handle)}?{params}"
        headers = {
            "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
            "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "referer": "https://platform.twitter.com/",
        }
        page = self._get_text(url, headers=headers, timeout=30, context=f"Syndication @{handle}")
        match = re.search(r'<script id="__NEXT_DATA__" type="application/json">([\s\S]*?)</script>', page)
        if not match:
            raise RuntimeError("Syndication profile did not expose embedded tweet data.")
        data = json.loads(html.unescape(match.group(1)))
        timeline = data.get("props", {}).get("pageProps", {}).get("timeline", {})
        entries = timeline.get("entries") or []
        tweets = []
        user_info: dict[str, Any] = {}
        for entry in entries:
            tweet = (entry.get("content") or {}).get("tweet")
            parsed = self.parse_syndication_tweet(tweet)
            if not parsed:
                continue
            if not user_info:
                user_info = self.syndication_user_info(tweet.get("user") or {})
            tweets.append(parsed)
        if not user_info:
            user_info = {"screen_name": handle, "name": handle}
        return user_info, dedupe_tweets(tweets)

    def parse_syndication_tweet(self, tweet: dict[str, Any] | None) -> dict[str, Any] | None:
        if not isinstance(tweet, dict):
            return None
        tweet_id = tweet.get("id_str") or f"{tweet.get('id') or ''}"
        if not tweet_id:
            return None
        user = tweet.get("user") or {}
        entities = tweet.get("entities") or {}
        urls = [
            {
                "url": item.get("url"),
                "expanded_url": item.get("expanded_url"),
                "display_url": item.get("display_url"),
            }
            for item in entities.get("urls", []) or []
        ]
        media = [
            {
                "type": item.get("type"),
                "url": item.get("media_url_https") or item.get("media_url"),
                "alt_text": item.get("ext_alt_text"),
            }
            for item in entities.get("media", []) or []
        ]
        text = tweet.get("full_text") or tweet.get("text") or ""
        return {
            "id": tweet_id,
            "text": text,
            "created_at": tweet.get("created_at"),
            "user": {
                "id": user.get("id_str") or f"{user.get('id') or ''}",
                "username": user.get("screen_name"),
                "display_name": user.get("name"),
                "verified": bool(user.get("verified") or user.get("is_blue_verified") or user.get("verified_type")),
                "profile_image_url": user.get("profile_image_url_https"),
                "followers_count": user.get("followers_count") or user.get("normal_followers_count"),
                "following_count": user.get("friends_count"),
            },
            "metrics": {
                "retweet_count": tweet.get("retweet_count", 0),
                "reply_count": tweet.get("reply_count", 0),
                "like_count": tweet.get("favorite_count", 0),
                "quote_count": tweet.get("quote_count", 0),
                "bookmark_count": 0,
                "view_count": None,
            },
            "urls": urls,
            "media": media,
            "is_retweet": bool(tweet.get("retweeted_status")) or text.startswith("RT @"),
            "is_reply": bool(tweet.get("in_reply_to_status_id_str")),
            "in_reply_to": tweet.get("in_reply_to_status_id_str"),
            "conversation_id": tweet.get("conversation_id_str"),
            "language": tweet.get("lang"),
            "raw": tweet,
        }

    def syndication_user_info(self, user: dict[str, Any]) -> dict[str, Any]:
        return {
            "id_str": user.get("id_str") or f"{user.get('id') or ''}",
            "name": user.get("name"),
            "screen_name": user.get("screen_name"),
            "profile_image_url_https": user.get("profile_image_url_https"),
            "followers_count": user.get("followers_count") or user.get("normal_followers_count"),
            "friends_count": user.get("friends_count"),
            "verified": bool(user.get("verified") or user.get("is_blue_verified") or user.get("verified_type")),
            "raw": user,
        }

    def extract_tweets(self, data: dict[str, Any]) -> list[dict[str, Any]]:
        tweets: list[dict[str, Any]] = []

        def walk(obj: Any, depth: int = 0) -> None:
            if obj is None or depth > 25 or not isinstance(obj, (dict, list)):
                return
            if isinstance(obj, dict):
                if isinstance(obj.get("tweet_results"), dict):
                    result = obj["tweet_results"].get("result")
                    tweet = self.parse_tweet(result)
                    if tweet:
                        tweets.append(tweet)
                    return
                if obj.get("__typename") == "Tweet" and "legacy" in obj and "core" in obj:
                    tweet = self.parse_tweet(obj)
                    if tweet:
                        tweets.append(tweet)
                    return
                for value in obj.values():
                    walk(value, depth + 1)
            else:
                for item in obj:
                    walk(item, depth + 1)

        walk(data)
        return tweets

    def parse_tweet(self, result: dict[str, Any] | None) -> dict[str, Any] | None:
        if not isinstance(result, dict):
            return None
        try:
            if result.get("__typename") == "TweetWithVisibilityResults":
                result = result.get("tweet", result)
            legacy = result.get("legacy")
            if not legacy:
                return None
            tweet_id = legacy.get("id_str") or result.get("rest_id")
            if not tweet_id:
                return None
            user_result = (
                result.get("core", {}).get("user_results", {}).get("result")
                or result.get("core", {}).get("user_result", {}).get("result")
                or {}
            )
            user_legacy = user_result.get("legacy", {})
            urls = [
                {
                    "url": item.get("url"),
                    "expanded_url": item.get("expanded_url"),
                    "display_url": item.get("display_url"),
                }
                for item in legacy.get("entities", {}).get("urls", []) or []
            ]
            raw_media = legacy.get("extended_entities", {}).get("media") or legacy.get("entities", {}).get("media") or []
            media = [
                {
                    "type": item.get("type"),
                    "url": item.get("media_url_https"),
                    "alt_text": item.get("ext_alt_text"),
                }
                for item in raw_media
            ]
            view_count = result.get("views", {}).get("count")
            return {
                "id": tweet_id,
                "text": legacy.get("full_text") or "",
                "created_at": legacy.get("created_at"),
                "user": {
                    "id": user_legacy.get("id_str") or user_result.get("rest_id"),
                    "username": user_legacy.get("screen_name"),
                    "display_name": user_legacy.get("name"),
                    "verified": bool(user_legacy.get("verified") or user_result.get("is_blue_verified")),
                    "profile_image_url": user_legacy.get("profile_image_url_https"),
                    "followers_count": user_legacy.get("followers_count"),
                    "following_count": user_legacy.get("friends_count"),
                },
                "metrics": {
                    "retweet_count": legacy.get("retweet_count", 0),
                    "reply_count": legacy.get("reply_count", 0),
                    "like_count": legacy.get("favorite_count", 0),
                    "quote_count": legacy.get("quote_count", 0),
                    "bookmark_count": legacy.get("bookmark_count", 0),
                    "view_count": int(view_count) if str(view_count or "").isdigit() else None,
                },
                "urls": urls,
                "media": media,
                "is_retweet": bool(legacy.get("retweeted_status_result")),
                "is_reply": bool(legacy.get("in_reply_to_status_id_str")),
                "in_reply_to": legacy.get("in_reply_to_status_id_str"),
                "conversation_id": legacy.get("conversation_id_str"),
                "language": legacy.get("lang"),
                "raw": result,
            }
        except Exception:
            return None

    def extract_cursor(self, data: dict[str, Any]) -> str | None:
        cursor = None

        def walk(obj: Any, depth: int = 0) -> None:
            nonlocal cursor
            if cursor or obj is None or depth > 20 or not isinstance(obj, (dict, list)):
                return
            if isinstance(obj, dict):
                cursor_type = f"{obj.get('cursorType') or ''}".lower()
                if "bottom" in cursor_type:
                    cursor = obj.get("value")
                    return
                entry_id = obj.get("entryId", "")
                if isinstance(entry_id, str) and entry_id.startswith("cursor-bottom"):
                    cursor = obj.get("content", {}).get("value")
                    return
                for value in obj.values():
                    walk(value, depth + 1)
            else:
                for item in obj:
                    walk(item, depth + 1)

        walk(data)
        return cursor


def init_db() -> sqlite3.Connection:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DB_PATH, timeout=60)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA journal_mode=WAL")
    connection.execute("PRAGMA busy_timeout=60000")
    connection.executescript(
        """
        CREATE TABLE IF NOT EXISTS accounts (
          handle TEXT PRIMARY KEY,
          display_handle TEXT,
          country_id TEXT,
          owner_name TEXT,
          owner_type TEXT,
          role TEXT,
          profile_href TEXT,
          url TEXT,
          status TEXT DEFAULT 'pending',
          last_scraped_at TEXT,
          last_error TEXT,
          user_id TEXT,
          display_name TEXT,
          profile_image_url TEXT,
          followers_count INTEGER,
          following_count INTEGER,
          verified INTEGER DEFAULT 0,
          raw_json TEXT,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS tweets (
          id TEXT PRIMARY KEY,
          handle TEXT NOT NULL,
          username TEXT,
          display_name TEXT,
          text TEXT,
          created_at TEXT,
          created_at_iso TEXT,
          created_at_ts INTEGER,
          tweet_type TEXT,
          language TEXT,
          metrics_json TEXT,
          urls_json TEXT,
          media_json TEXT,
          tags_json TEXT,
          source_endpoint TEXT,
          captured_at TEXT NOT NULL,
          raw_json TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_tweets_handle_created ON tweets(handle, created_at_ts DESC);
        CREATE INDEX IF NOT EXISTS idx_tweets_created ON tweets(created_at_ts DESC);
        """
    )
    return connection


def load_registry() -> dict[str, Any]:
    if not REGISTRY_PATH.exists():
        raise SystemExit("Missing public/source/social/accounts.json. Run npm run sync:social-accounts first.")
    return json.loads(REGISTRY_PATH.read_text())


def seed_accounts(connection: sqlite3.Connection, accounts: list[dict[str, Any]]) -> None:
    now = utc_now()
    for account in accounts:
        handle = normalize_handle(account["handle"]).lower()
        connection.execute(
            """
            INSERT INTO accounts (handle, display_handle, country_id, owner_name, owner_type, role, profile_href, url, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(handle) DO UPDATE SET
              display_handle=excluded.display_handle,
              country_id=excluded.country_id,
              owner_name=excluded.owner_name,
              owner_type=excluded.owner_type,
              role=excluded.role,
              profile_href=excluded.profile_href,
              url=excluded.url,
              updated_at=excluded.updated_at
            """,
            (
                handle,
                normalize_handle(account["handle"]),
                account.get("countryId"),
                account.get("ownerName"),
                account.get("ownerType"),
                account.get("role"),
                account.get("profileHref"),
                account.get("url"),
                now,
            ),
        )
    connection.commit()


def save_capture(
    connection: sqlite3.Connection,
    account: dict[str, Any],
    user_info: dict[str, Any],
    tweets: list[dict[str, Any]],
    *,
    endpoint: str,
) -> int:
    handle = normalize_handle(account["handle"]).lower()
    now = utc_now()
    connection.execute(
        """
        UPDATE accounts
        SET status='captured',
            last_scraped_at=?,
            last_error=NULL,
            user_id=?,
            display_name=?,
            profile_image_url=?,
            followers_count=?,
            following_count=?,
            verified=?,
            raw_json=?,
            updated_at=?
        WHERE handle=?
        """,
        (
            now,
            user_info.get("id_str"),
            user_info.get("name"),
            user_info.get("profile_image_url_https"),
            user_info.get("followers_count"),
            user_info.get("friends_count"),
            1 if user_info.get("verified") else 0,
            json.dumps(user_info, ensure_ascii=False),
            now,
            handle,
        ),
    )

    inserted = 0
    for tweet in tweets:
        tweet_user = tweet.get("user", {})
        created_iso, created_ts = parse_twitter_date(tweet.get("created_at"))
        tags = classify_tags(tweet.get("text"))
        tweet_type = "retweet" if tweet.get("is_retweet") else "reply" if tweet.get("is_reply") else "tweet"
        before = connection.total_changes
        connection.execute(
            """
            INSERT INTO tweets (
              id, handle, username, display_name, text, created_at, created_at_iso, created_at_ts,
              tweet_type, language, metrics_json, urls_json, media_json, tags_json, source_endpoint,
              captured_at, raw_json
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              handle=excluded.handle,
              username=excluded.username,
              display_name=excluded.display_name,
              text=excluded.text,
              created_at=excluded.created_at,
              created_at_iso=excluded.created_at_iso,
              created_at_ts=excluded.created_at_ts,
              tweet_type=excluded.tweet_type,
              language=excluded.language,
              metrics_json=excluded.metrics_json,
              urls_json=excluded.urls_json,
              media_json=excluded.media_json,
              tags_json=excluded.tags_json,
              source_endpoint=excluded.source_endpoint,
              captured_at=excluded.captured_at,
              raw_json=excluded.raw_json
            """,
            (
                tweet["id"],
                handle,
                tweet_user.get("username") or account["handle"],
                tweet_user.get("display_name"),
                tweet.get("text"),
                tweet.get("created_at"),
                created_iso,
                created_ts,
                tweet_type,
                tweet.get("language"),
                json.dumps(tweet.get("metrics") or {}, ensure_ascii=False),
                json.dumps(tweet.get("urls") or [], ensure_ascii=False),
                json.dumps(tweet.get("media") or [], ensure_ascii=False),
                json.dumps(tags, ensure_ascii=False),
                endpoint,
                now,
                json.dumps(tweet.get("raw") or {}, ensure_ascii=False),
            ),
        )
        if connection.total_changes > before:
            inserted += 1
    connection.commit()
    return inserted


def save_search_tweets(
    connection: sqlite3.Connection,
    tweets: list[dict[str, Any]],
    *,
    query: str,
    registry_by_handle: dict[str, dict[str, Any]],
    country_id: str | None,
    lane: str | None,
) -> int:
    now = utc_now()
    inserted = 0

    for tweet in tweets:
        tweet_user = tweet.get("user") or {}
        handle = normalize_handle(tweet_user.get("username") or "").lower()
        if not handle:
            continue
        account = registry_by_handle.get(handle, {})
        display_handle = account.get("handle") or tweet_user.get("username") or handle
        connection.execute(
            """
            INSERT INTO accounts (handle, display_handle, country_id, owner_name, owner_type, role, profile_href, url, status, last_scraped_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'search-captured', ?, ?)
            ON CONFLICT(handle) DO UPDATE SET
              display_handle=COALESCE(excluded.display_handle, display_handle),
              country_id=COALESCE(excluded.country_id, country_id),
              owner_name=COALESCE(excluded.owner_name, owner_name),
              owner_type=COALESCE(excluded.owner_type, owner_type),
              role=COALESCE(excluded.role, role),
              profile_href=COALESCE(excluded.profile_href, profile_href),
              url=COALESCE(excluded.url, url),
              status=CASE WHEN status='captured' THEN status ELSE 'search-captured' END,
              last_scraped_at=excluded.last_scraped_at,
              last_error=NULL,
              updated_at=excluded.updated_at
            """,
            (
                handle,
                display_handle,
                account.get("countryId") or country_id,
                account.get("ownerName") or tweet_user.get("display_name"),
                account.get("ownerType") or "Search result",
                account.get("role") or f"{lane or 'Social'} search hit",
                account.get("profileHref"),
                account.get("url") or f"https://x.com/{display_handle}",
                now,
                now,
            ),
        )

        created_iso, created_ts = parse_twitter_date(tweet.get("created_at"))
        tags = classify_tags(tweet.get("text"))
        if lane and lane.title() not in tags:
            tags.append(lane.title())
        tweet_type = "retweet" if tweet.get("is_retweet") else "reply" if tweet.get("is_reply") else "tweet"
        before = connection.total_changes
        connection.execute(
            """
            INSERT INTO tweets (
              id, handle, username, display_name, text, created_at, created_at_iso, created_at_ts,
              tweet_type, language, metrics_json, urls_json, media_json, tags_json, source_endpoint,
              captured_at, raw_json
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              handle=excluded.handle,
              username=excluded.username,
              display_name=excluded.display_name,
              text=excluded.text,
              created_at=excluded.created_at,
              created_at_iso=excluded.created_at_iso,
              created_at_ts=excluded.created_at_ts,
              tweet_type=excluded.tweet_type,
              language=excluded.language,
              metrics_json=excluded.metrics_json,
              urls_json=excluded.urls_json,
              media_json=excluded.media_json,
              tags_json=excluded.tags_json,
              source_endpoint=excluded.source_endpoint,
              captured_at=excluded.captured_at,
              raw_json=excluded.raw_json
            """,
            (
                tweet["id"],
                handle,
                tweet_user.get("username") or display_handle,
                tweet_user.get("display_name"),
                tweet.get("text"),
                tweet.get("created_at"),
                created_iso,
                created_ts,
                tweet_type,
                tweet.get("language"),
                json.dumps(tweet.get("metrics") or {}, ensure_ascii=False),
                json.dumps(tweet.get("urls") or [], ensure_ascii=False),
                json.dumps(tweet.get("media") or [], ensure_ascii=False),
                json.dumps(tags, ensure_ascii=False),
                f"SearchTimeline: {query}",
                now,
                json.dumps(tweet.get("raw") or {}, ensure_ascii=False),
            ),
        )
        if connection.total_changes > before:
            inserted += 1

    connection.commit()
    return inserted


def save_error(connection: sqlite3.Connection, account: dict[str, Any], error: str) -> None:
    now = utc_now()
    connection.execute(
        """
        UPDATE accounts
        SET status='error', last_error=?, updated_at=?
        WHERE handle=?
        """,
        (error[:600], now, normalize_handle(account["handle"]).lower()),
    )
    connection.commit()


def select_targets(registry: dict[str, Any], args: argparse.Namespace) -> list[dict[str, Any]]:
    accounts = filter_accounts(list(registry.get("accounts") or []), args)
    if args.country:
        wanted = {item.lower() for item in args.country}
        accounts = [account for account in accounts if f"{account.get('countryId')}".lower() in wanted]
    if args.handle:
        wanted_handles = {normalize_handle(item).lower() for item in args.handle}
        existing = {normalize_handle(account["handle"]).lower() for account in accounts}
        accounts = [account for account in accounts if normalize_handle(account["handle"]).lower() in wanted_handles]
        for handle in sorted(wanted_handles - existing):
            accounts.append({
                "countryId": "unassigned",
                "ownerName": f"@{handle}",
                "ownerType": "Manual",
                "role": "Manual capture target",
                "handle": handle,
                "url": f"https://x.com/{handle}",
                "profileHref": None,
                "label": "X",
            })
    accounts = dedupe_accounts_by_handle(accounts)
    if not args.all:
        accounts = accounts[: args.limit]
    return accounts


def select_search_accounts(registry: dict[str, Any], args: argparse.Namespace) -> list[dict[str, Any]]:
    accounts = filter_accounts(list(registry.get("accounts") or []), args)
    if args.country:
        wanted = {item.lower() for item in args.country}
        accounts = [account for account in accounts if f"{account.get('countryId')}".lower() in wanted]
    if args.handle:
        wanted_handles = {normalize_handle(item).lower() for item in args.handle}
        accounts = [account for account in accounts if normalize_handle(account.get("handle", "")).lower() in wanted_handles]

    accounts = sorted(
        dedupe_accounts_by_handle(accounts),
        key=lambda account: (
            SEARCH_OWNER_PRIORITY.get(account.get("ownerType"), 99),
            account.get("countryId") or "",
            account.get("ownerName") or "",
            account.get("handle") or "",
        ),
    )

    if args.all_search_accounts:
        return accounts
    return accounts[: max(args.search_account_limit, 0)]


def dedupe_accounts_by_handle(accounts: list[dict[str, Any]]) -> list[dict[str, Any]]:
    output: dict[str, dict[str, Any]] = {}
    for account in sorted(
        accounts,
        key=lambda item: (
            SEARCH_OWNER_PRIORITY.get(item.get("ownerType"), 99),
            item.get("countryId") or "",
            item.get("ownerName") or "",
            item.get("profileHref") or "",
        ),
    ):
        handle = normalize_handle(account.get("handle", "")).lower()
        if not handle or handle in output:
            continue
        output[handle] = account
    return list(output.values())


def filter_accounts(accounts: list[dict[str, Any]], args: argparse.Namespace) -> list[dict[str, Any]]:
    if args.owner_type:
        wanted_types = {item.lower() for item in args.owner_type}
        accounts = [account for account in accounts if f"{account.get('ownerType')}".lower() in wanted_types]
    if args.exclude_owner_type:
        blocked_types = {item.lower() for item in args.exclude_owner_type}
        accounts = [account for account in accounts if f"{account.get('ownerType')}".lower() not in blocked_types]
    return accounts


def build_lane_queries(accounts: list[dict[str, Any]], lane: str, chunk_size: int) -> list[str]:
    terms = LANE_SEARCH_TERMS.get(lane)
    if not terms:
        raise SystemExit(f"Unknown lane '{lane}'. Use one of: {', '.join(sorted(LANE_SEARCH_TERMS))}.")
    unique_handles = []
    seen = set()
    for account in accounts:
        handle = normalize_handle(account.get("handle", ""))
        key = handle.lower()
        if not key or key in seen:
            continue
        seen.add(key)
        unique_handles.append(handle)

    term_query = "(" + " OR ".join(format_search_term(term) for term in terms) + ")"
    queries = []
    for chunk in chunked(unique_handles, max(chunk_size, 1)):
        handle_query = "(" + " OR ".join(f"from:{handle}" for handle in chunk) + ")"
        queries.append(f"{term_query} {handle_query}")
    return queries


def format_search_term(term: str) -> str:
    if " " in term and not (term.startswith('"') and term.endswith('"')):
        return json.dumps(term)
    return term


def chunked(values: list[str], size: int):
    for index in range(0, len(values), size):
        yield values[index:index + size]


def normalize_handle(value: str) -> str:
    handle = f"{value or ''}".strip().strip("/")
    if handle.lower().startswith("x@"):
        handle = handle[2:]
    if "@" in handle:
        handle = handle.split("@")[-1]
    return handle.strip()


def dedupe_tweets(tweets: list[dict[str, Any]]) -> list[dict[str, Any]]:
    seen = set()
    output = []
    for tweet in tweets:
        tweet_id = tweet.get("id")
        if not tweet_id or tweet_id in seen:
            continue
        seen.add(tweet_id)
        output.append(tweet)
    return output


def parse_twitter_date(value: str | None) -> tuple[str | None, int | None]:
    if not value:
        return None, None
    try:
        parsed = email.utils.parsedate_to_datetime(value)
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=timezone.utc)
        parsed = parsed.astimezone(timezone.utc)
        return parsed.isoformat().replace("+00:00", "Z"), int(parsed.timestamp())
    except Exception:
        return value, None


def classify_tags(text: str | None) -> list[str]:
    if not text:
        return []
    return [label for label, pattern in WATCH_TERMS if pattern.search(text)]


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def iso_from_epoch(timestamp: int | float) -> str:
    return datetime.fromtimestamp(timestamp, timezone.utc).isoformat().replace("+00:00", "Z")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Capture TOR Phi mapped X accounts into a project-owned archive.")
    parser.add_argument("--country", action="append", help="Limit capture to a country id, e.g. usa. Repeatable.")
    parser.add_argument("--handle", action="append", help="Capture a specific X handle. Repeatable.")
    parser.add_argument("--owner-type", action="append", help="Limit capture by TOR Phi owner type, e.g. Parliament or Congress. Repeatable.")
    parser.add_argument("--exclude-owner-type", action="append", help="Exclude a TOR Phi owner type from capture. Repeatable.")
    parser.add_argument("--limit", type=int, default=25, help="Account limit unless --all is provided. Default: 25.")
    parser.add_argument("--all", action="store_true", help="Capture every selected registry account.")
    parser.add_argument("--pages", type=int, default=1, help="Timeline pages per account. Default: 1.")
    parser.add_argument("--include-replies", action="store_true", help="Capture tweets and replies instead of only top-level tweets.")
    parser.add_argument("--search", action="append", help="Run a raw X latest-search query and store matching tweets. Repeatable.")
    parser.add_argument("--lane", choices=sorted(LANE_SEARCH_TERMS), help="Build chunked searches for a daily brief lane, e.g. kurdistan or iraq.")
    parser.add_argument("--lane-strategy", choices=["timeline", "search"], default="timeline", help="For --lane, capture prioritized timelines by default; use search for experimental X latest-search chunks.")
    parser.add_argument("--search-account-limit", type=int, default=240, help="Mapped accounts considered for lane searches unless --all-search-accounts is set. Default: 240.")
    parser.add_argument("--all-search-accounts", action="store_true", help="Use every selected mapped account for lane search chunks.")
    parser.add_argument("--search-chunk-size", type=int, default=16, help="Number of from: handles per generated lane search. Default: 16.")
    parser.add_argument("--max-search-queries", type=int, default=0, help="Maximum generated lane queries to run. 0 means no cap.")
    parser.add_argument("--with-timelines", action="store_true", help="When using --search or --lane, also run normal timeline captures.")
    parser.add_argument("--only-uncaptured", action="store_true", help="Only capture handles that have no tweets in the local TOR Phi archive yet.")
    parser.add_argument("--only-under-tweet-count", type=int, default=0, help="Only capture handles with fewer than this many archived tweets. Useful for filling shallow captures.")
    parser.add_argument("--max-capture-targets", type=int, default=0, help="After all filters, capture at most this many timeline targets. 0 means no cap.")
    parser.add_argument("--source", choices=["graphql", "syndication", "auto"], default="graphql", help="Timeline source. 'auto' falls back to public syndication when authenticated GraphQL is rate-limited.")
    parser.add_argument("--stop-after-rate-limits", type=int, default=6, help="Stop a timeline run after this many consecutive rate-limit errors. Default: 6.")
    parser.add_argument("--pause", type=float, default=2.5, help="Seconds to pause between accounts. Default: 2.5.")
    parser.add_argument("--parallel-identities", action="store_true", help="Run one timeline worker per authenticated X identity.")
    parser.add_argument("--workers", type=int, default=0, help="Parallel worker count for --parallel-identities. 0 means one worker per authenticated identity.")
    parser.add_argument("--dry-run", action="store_true", help="Only show the target account plan; do not call X.")
    return parser


def capture_timeline_account(
    connection: sqlite3.Connection,
    client: TorPhiTwitterClient,
    account: dict[str, Any],
    args: argparse.Namespace,
    endpoint: str,
    registry_by_handle: dict[str, dict[str, Any]],
) -> tuple[int, int, str]:
    handle = normalize_handle(account["handle"])
    pages = effective_capture_pages(connection, account, args)
    source_endpoint = endpoint
    if args.source == "syndication":
        user_info, tweets = client.fetch_syndication_tweets(handle, pages=pages)
    else:
        try:
            user_info, tweets = client.fetch_user_tweets(handle, pages=pages, include_replies=args.include_replies)
        except Exception as exc:
            if args.source != "auto":
                raise
            if is_timeline_rate_limit_error(exc):
                print(f"[TOR Phi] @{handle}: GraphQL timeline rate-limited ({exc}); falling back directly to syndication.", flush=True)
                user_info, tweets = client.fetch_syndication_tweets(handle, pages=pages)
                source_endpoint = "SyndicationProfile"
                saved = save_capture(connection, account, user_info, tweets, endpoint=source_endpoint)
                return len(tweets), saved, source_endpoint
            search_query = f"from:{handle}"
            if not args.include_replies:
                search_query = f"{search_query} -filter:replies"
            print(f"[TOR Phi] @{handle}: GraphQL timeline failed ({exc}); trying authenticated search: {search_query}", flush=True)
            try:
                tweets = client.search_latest(search_query, pages=pages)
                saved = save_search_tweets(
                    connection,
                    tweets,
                    query=search_query,
                    registry_by_handle=registry_by_handle,
                    country_id=account.get("countryId"),
                    lane=None,
                )
                return len(tweets), saved, "SearchTimeline"
            except Exception as search_exc:
                print(f"[TOR Phi] @{handle}: authenticated search failed ({search_exc}); falling back to syndication.", flush=True)
                user_info, tweets = client.fetch_syndication_tweets(handle, pages=pages)
                source_endpoint = "SyndicationProfile"

    saved = save_capture(connection, account, user_info, tweets, endpoint=source_endpoint)
    return len(tweets), saved, source_endpoint


def archived_tweet_count(connection: sqlite3.Connection, account: dict[str, Any]) -> int:
    handle = normalize_handle(account.get("handle", "")).lower()
    if not handle:
        return 0
    row = connection.execute("SELECT COUNT(*) AS count FROM tweets WHERE handle = ?", (handle,)).fetchone()
    return int(row["count"] if row else 0)


def effective_capture_pages(connection: sqlite3.Connection, account: dict[str, Any], args: argparse.Namespace) -> int:
    max_pages = max(args.pages, 1)
    if args.only_under_tweet_count <= 0:
        return max_pages
    existing_count = archived_tweet_count(connection, account)
    remaining = max(args.only_under_tweet_count - existing_count, 1)
    estimated_needed_pages = math.ceil(remaining / 18) + 1
    return max(1, min(max_pages, estimated_needed_pages))


def run_parallel_timeline_capture(
    clients: list[TorPhiTwitterClient],
    targets: list[dict[str, Any]],
    args: argparse.Namespace,
    endpoint: str,
    registry_by_handle: dict[str, dict[str, Any]],
) -> int:
    worker_count = min(len(clients), max(args.workers, 1) if args.workers else len(clients), len(targets))
    if worker_count <= 1:
        return -1

    target_queue: queue.Queue[tuple[int, dict[str, Any]]] = queue.Queue()
    for index, account in enumerate(targets, start=1):
        target_queue.put((index, account))

    lock = threading.Lock()
    completed_accounts = 0
    total_saved = 0
    consecutive_rate_limits = 0

    def worker(worker_index: int, client: TorPhiTwitterClient) -> None:
        nonlocal completed_accounts, total_saved, consecutive_rate_limits
        connection = init_db()
        try:
            while True:
                try:
                    index, account = target_queue.get_nowait()
                except queue.Empty:
                    return

                handle = normalize_handle(account["handle"])
                pages = effective_capture_pages(connection, account, args)
                remaining_accounts = target_queue.qsize()
                print(
                    f"[TOR Phi] Worker {worker_index}/{worker_count} via {client.label}: "
                    f"Progress {index}/{len(targets)}; remaining {remaining_accounts}; "
                    f"capturing @{handle} ({account.get('ownerName')}); pages {pages}/{max(args.pages, 1)}",
                    flush=True,
                )
                try:
                    seen, saved, source_endpoint = capture_timeline_account(
                        connection,
                        client,
                        account,
                        args,
                        endpoint,
                        registry_by_handle,
                    )
                    with lock:
                        total_saved += saved
                        completed_accounts += 1
                        consecutive_rate_limits = 0
                        completed = completed_accounts
                        saved_total = total_saved
                    print(
                        f"[TOR Phi] @{handle}: {seen} seen from {source_endpoint}, {saved} saved or updated. "
                        f"Completed {completed}/{len(targets)}; remaining {len(targets) - completed}; "
                        f"run saved/updated {saved_total}.",
                        flush=True,
                    )
                except Exception as exc:
                    message = str(exc)
                    save_error(connection, account, message)
                    print(f"[TOR Phi] @{handle}: {message}", flush=True)
                    if is_timeline_rate_limit_error(exc):
                        with lock:
                            consecutive_rate_limits += 1
                            rate_count = consecutive_rate_limits
                        retry_after = int(time.time()) + 120
                        print(
                            f"[TOR Phi] Worker {worker_index}/{worker_count} via {client.label} hit a rate limit; "
                            f"completed {completed_accounts}/{len(targets)}; failed at {index}/{len(targets)}; "
                            f"other workers will continue. Suggested retry after {iso_from_epoch(retry_after)}.",
                            flush=True,
                        )
                        if args.stop_after_rate_limits and rate_count >= args.stop_after_rate_limits:
                            print(
                                f"[TOR Phi] Stopping worker after {rate_count} consecutive rate-limit errors. "
                                "Resume later with the same filters; already captured tweet IDs are ignored.",
                                flush=True,
                            )
                        return
                    with lock:
                        completed_accounts += 1
                finally:
                    target_queue.task_done()
                time.sleep(max(args.pause, 0))
        finally:
            connection.close()

    threads = []
    for worker_index, client in enumerate(clients[:worker_count], start=1):
        thread = threading.Thread(target=worker, args=(worker_index, client), daemon=False)
        threads.append(thread)
        thread.start()
    for thread in threads:
        thread.join()
    return total_saved


def main() -> None:
    args = build_parser().parse_args()
    registry = load_registry()
    connection = init_db()
    seed_accounts(connection, registry.get("accounts") or [])
    registry_by_handle = {
        normalize_handle(account.get("handle", "")).lower(): account
        for account in registry.get("accounts") or []
        if normalize_handle(account.get("handle", ""))
    }
    search_queries = list(args.search or [])
    lane_timeline_targets: list[dict[str, Any]] = []
    if args.lane and args.lane_strategy == "search":
        search_accounts = select_search_accounts(registry, args)
        lane_queries = build_lane_queries(search_accounts, args.lane, args.search_chunk_size)
        if args.max_search_queries > 0:
            lane_queries = lane_queries[: args.max_search_queries]
        search_queries.extend(lane_queries)
    elif args.lane:
        lane_timeline_targets = select_search_accounts(registry, args)
        if not args.all:
            lane_timeline_targets = lane_timeline_targets[: max(args.limit, 0)]

    search_mode = bool(search_queries)
    if lane_timeline_targets:
        targets = lane_timeline_targets
    else:
        targets = select_targets(registry, args) if (args.with_timelines or not search_mode) else []
    if args.only_under_tweet_count > 0 and targets:
        targets = filter_under_tweet_count_targets(connection, targets, args.only_under_tweet_count)
    elif args.only_uncaptured and targets:
        targets = filter_uncaptured_targets(connection, targets)
    if args.max_capture_targets > 0 and targets:
        targets = targets[: args.max_capture_targets]

    print(f"[TOR Phi] Registry accounts: {len(registry.get('accounts') or [])}")
    if search_mode:
        print(f"[TOR Phi] Search queries: {len(search_queries)}")
    print(f"[TOR Phi] Capture targets: {len(targets)}")
    if not targets and not search_queries:
        return
    if args.dry_run:
        if search_queries:
            for query in search_queries[:40]:
                print(f"- search: {query}")
            if len(search_queries) > 40:
                print(f"... {len(search_queries) - 40} more search queries")
        if targets:
            for account in targets[:80]:
                print(f"- @{account['handle']} | {account.get('countryId')} | {account.get('ownerName')} / {account.get('ownerType')}")
            if len(targets) > 80:
                print(f"... {len(targets) - 80} more timeline targets")
        return

    identity_configs = load_twitter_identity_configs()
    clients = [TorPhiTwitterClient(config) for config in identity_configs] or [TorPhiTwitterClient()]
    client = clients[0]
    print(f"[TOR Phi] X identity pool: {sum(1 for item in clients if item.is_authenticated())} authenticated account(s).")
    needs_auth = args.source == "graphql" or search_mode
    if needs_auth and not any(item.is_authenticated() for item in clients):
        raise SystemExit("X cookies are missing in Social Analyzer/backend/config.json. Open Social Analyzer and refresh cookies first.")

    total_search_saved = 0
    for index, query in enumerate(search_queries, start=1):
        print(f"[TOR Phi] search {index}/{len(search_queries)}: {query}")
        try:
            tweets = client.search_latest(query, pages=max(args.pages, 1))
            saved = save_search_tweets(
                connection,
                tweets,
                query=query,
                registry_by_handle=registry_by_handle,
                country_id=args.country[0] if args.country and len(args.country) == 1 else None,
                lane=args.lane,
            )
            total_search_saved += saved
            print(f"[TOR Phi] search {index}: {len(tweets)} seen, {saved} saved or updated.")
        except Exception as exc:
            print(f"[TOR Phi] search {index}: {exc}")
        if index < len(search_queries):
            time.sleep(max(args.pause, 0))

    endpoint = "UserTweetsAndReplies" if args.include_replies else "UserTweets"
    if args.source == "syndication":
        endpoint = "SyndicationProfile"
    if targets and args.parallel_identities and len(clients) > 1:
        parallel_saved = run_parallel_timeline_capture(clients, targets, args, endpoint, registry_by_handle)
        if parallel_saved >= 0:
            print(f"[TOR Phi] Done. Timeline tweets saved/updated this run: {parallel_saved}")
            if search_mode:
                print(f"[TOR Phi] Search tweets saved/updated this run: {total_search_saved}")
            print(f"[TOR Phi] Archive: {DB_PATH}")
            connection.close()
            return

    total_saved = 0
    consecutive_rate_limits = 0
    completed_accounts = 0
    for index, account in enumerate(targets, start=1):
        client = clients[(index - 1) % len(clients)]
        handle = normalize_handle(account["handle"])
        remaining_accounts = max(len(targets) - index, 0)
        identity_note = f" via {client.label}" if len(clients) > 1 else ""
        print(f"[TOR Phi] Progress {index}/{len(targets)}; remaining {remaining_accounts}; capturing @{handle} ({account.get('ownerName')}){identity_note}")
        try:
            source_endpoint = endpoint
            if args.source == "syndication":
                user_info, tweets = client.fetch_syndication_tweets(handle, pages=max(args.pages, 1))
            else:
                try:
                    user_info, tweets = client.fetch_user_tweets(handle, pages=max(args.pages, 1), include_replies=args.include_replies)
                except Exception as exc:
                    if args.source == "auto":
                        search_query = f"from:{handle}"
                        if not args.include_replies:
                            search_query = f"{search_query} -filter:replies"
                        print(f"[TOR Phi] @{handle}: GraphQL timeline failed ({exc}); trying authenticated search: {search_query}")
                        try:
                            tweets = client.search_latest(search_query, pages=max(args.pages, 1))
                            saved = save_search_tweets(
                                connection,
                                tweets,
                                query=search_query,
                                registry_by_handle=registry_by_handle,
                                country_id=account.get("countryId"),
                                lane=None,
                            )
                            total_saved += saved
                            consecutive_rate_limits = 0
                            completed_accounts = index
                            print(f"[TOR Phi] @{handle}: {len(tweets)} search tweets seen, {saved} saved or updated. Completed {completed_accounts}/{len(targets)}; remaining {len(targets) - completed_accounts}.")
                            continue
                        except Exception as search_exc:
                            print(f"[TOR Phi] @{handle}: authenticated search failed ({search_exc}); falling back to syndication.")
                            user_info, tweets = client.fetch_syndication_tweets(handle, pages=max(args.pages, 1))
                            source_endpoint = "SyndicationProfile"
                    else:
                        raise
            saved = save_capture(connection, account, user_info, tweets, endpoint=source_endpoint)
            total_saved += saved
            consecutive_rate_limits = 0
            completed_accounts = index
            print(f"[TOR Phi] @{handle}: {len(tweets)} seen, {saved} saved or updated. Completed {completed_accounts}/{len(targets)}; remaining {len(targets) - completed_accounts}.")
        except Exception as exc:
            message = str(exc)
            save_error(connection, account, message)
            print(f"[TOR Phi] @{handle}: {message}")
            if is_timeline_rate_limit_error(exc):
                consecutive_rate_limits += 1
                remaining_after_error = max(len(targets) - index, 0)
                retry_after = int(time.time()) + 120
                print(
                    f"[TOR Phi] Rate-limit counter {consecutive_rate_limits}/{args.stop_after_rate_limits or 'unlimited'}; "
                    f"completed {completed_accounts}/{len(targets)}; failed at {index}/{len(targets)}; "
                    f"remaining {remaining_after_error}; suggested retry after {iso_from_epoch(retry_after)}."
                )
                if args.stop_after_rate_limits and consecutive_rate_limits >= args.stop_after_rate_limits:
                    print(f"[TOR Phi] Stopping after {consecutive_rate_limits} consecutive rate-limit errors. Resume later with the same filters; --only-uncaptured will skip accounts already scraped.")
                    break
            else:
                consecutive_rate_limits = 0
        if index < len(targets):
            time.sleep(max(args.pause, 0))

    print(f"[TOR Phi] Done. Timeline tweets saved/updated this run: {total_saved}")
    if search_mode:
        print(f"[TOR Phi] Search tweets saved/updated this run: {total_search_saved}")
    print(f"[TOR Phi] Archive: {DB_PATH}")


def is_timeline_rate_limit_error(error: Exception) -> bool:
    text = str(error).lower()
    return "rate limit" in text or "too many requests" in text or "429" in text


def filter_uncaptured_targets(connection: sqlite3.Connection, targets: list[dict[str, Any]]) -> list[dict[str, Any]]:
    if not targets:
        return []
    handles = [normalize_handle(account.get("handle", "")).lower() for account in targets if normalize_handle(account.get("handle", ""))]
    if not handles:
        return []
    existing = set()
    for index in range(0, len(handles), 500):
        chunk = handles[index:index + 500]
        placeholders = ",".join("?" for _ in chunk)
        rows = connection.execute(
            f"SELECT DISTINCT handle FROM tweets WHERE handle IN ({placeholders})",
            chunk,
        ).fetchall()
        existing.update(row[0] for row in rows)
    return [account for account in targets if normalize_handle(account.get("handle", "")).lower() not in existing]


def filter_under_tweet_count_targets(connection: sqlite3.Connection, targets: list[dict[str, Any]], minimum_tweets: int) -> list[dict[str, Any]]:
    if not targets:
        return []
    handles = [normalize_handle(account.get("handle", "")).lower() for account in targets if normalize_handle(account.get("handle", ""))]
    if not handles:
        return []
    counts: dict[str, int] = {}
    for index in range(0, len(handles), 500):
        chunk = handles[index:index + 500]
        placeholders = ",".join("?" for _ in chunk)
        rows = connection.execute(
            f"SELECT handle, COUNT(*) FROM tweets WHERE handle IN ({placeholders}) GROUP BY handle",
            chunk,
        ).fetchall()
        counts.update((row[0], int(row[1])) for row in rows)
    return [
        account
        for account in targets
        if counts.get(normalize_handle(account.get("handle", "")).lower(), 0) < minimum_tweets
    ]


if __name__ == "__main__":
    main()
