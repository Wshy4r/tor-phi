#!/usr/bin/env python3
"""Export the TOR Phi social archive for the browser.

This exporter reads TOR Phi's own SQLite archive in data/torphi-social.db. It
does not read Social Analyzer's existing tweet databases.
"""

from __future__ import annotations

import json
import os
import re
import sqlite3
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
ANALYZER_CONFIG = ROOT / "Social Analyzer" / "backend" / "config.json"
REGISTRY_PATH = ROOT / "public" / "source" / "social" / "accounts.json"
DB_PATH = ROOT / "data" / "torphi-social.db"
OUT_JS = ROOT / "src" / "socialArchiveSnapshot.js"
OUT_JSON = ROOT / "public" / "source" / "social" / "twitter-snapshot.json"
OUT_PROFILE_JS = ROOT / "src" / "socialProfileArchive.js"
OUT_PROFILE_JSON = ROOT / "public" / "source" / "social" / "profile-archive.json"
OUT_PROFILE_DIR = ROOT / "public" / "source" / "social" / "profiles"
SNAPSHOT_TWEET_LIMIT = int(os.environ.get("SOCIAL_SNAPSHOT_TWEET_LIMIT", "2500"))
PROFILE_RECENT_LIMIT = int(os.environ.get("SOCIAL_PROFILE_RECENT_LIMIT", "60"))
PROFILE_MENTION_LIMIT = int(os.environ.get("SOCIAL_PROFILE_MENTION_LIMIT", "180"))
PUBLIC_ONLY = os.environ.get("TORPHI_SOCIAL_EXPORT_PUBLIC_ONLY") == "1"

KURDISTAN_LENS_TERMS = [
    ("Kurdistan", re.compile(r"\bk[uü]rdistan\b", re.I)),
    ("Kurds / Kurdish", re.compile(r"\bkurd(?:s|ish)?\b|\bk[uü]rt(?:ler|çe|ce)?\b", re.I)),
    ("KRG / IKBY", re.compile(r"\bkrg\b|\bikby\b|kurdistan regional government|k[uü]rdistan b[oö]lgesel y[oö]netimi", re.I)),
    ("Erbil / Hewler", re.compile(r"\berbil\b|\birbil\b|\bhewl[eê]r\b|\bhawler\b", re.I)),
    ("Peshmerga", re.compile(r"\bpeshmerga\b|\bpe[sş]merge\b", re.I)),
    ("Northern Iraq", re.compile(r"\bnorthern iraq\b|\bnorth(?:ern)? of iraq\b|kuzey [iı]rak", re.I)),
    ("Iraq / Baghdad / Kirkuk", re.compile(r"\biraq(?:i)?\b|\bbaghdad\b|\bmosul\b|\bkirkuk\b|\birak\b|\bba[ğg]dat\b|\bmusul\b|\bkerk[uü]k\b", re.I)),
    ("Syria / Rojava", re.compile(r"\bsyria(?:n)?\b|\bsuriye\b|\brojava\b", re.I)),
    ("PKK", re.compile(r"\bp\.?k\.?k\.?\b", re.I)),
    ("YPG / SDF", re.compile(r"\bypg\b|\bsdf\b|\bsd[gq]\b|suriye demokratik g[uü][cç]leri", re.I)),
    ("Yazidi / Sinjar", re.compile(r"\byazidi\b|\byezidi\b|\bezidi\b|\bsinjar\b|\b[sş]engal\b|\bsincar\b", re.I)),
    ("Oil / Energy", re.compile(r"\boil\b|\benergy\b|\bpipeline\b|\bpetrol\b|\benerji\b|boru hatt[ıi]", re.I)),
]

SOCIAL_FRAME_PATTERNS = [
    ("Supportive / partnership", re.compile(r"\bsupport\b|\bstand with\b|\bally\b|\ballies\b|\bpartner(?:ship)?\b|\bcooperat(?:e|ion)\b|\bfriend(?:s|ship)?\b|\brecogniz(?:e|ing|ed)\b|\bautonomy\b|\bright(?:s)?\b|\bdemocracy\b|\bstability\b|\bself[- ]?determination\b", re.I)),
    ("Security / counterterrorism", re.compile(r"\bterror(?:ism|ist)?\b|\bcounterterror\b|\bsecurity\b|\bborder\b|\boperation\b|\bthreat\b|\bpkk\b|\bypg\b|\bsdf\b|\bisis\b|\bdaesh\b|\bmilitia\b|\bsanction\b|\bstrike\b|\bsald[ıi]r[ıi]\b|\bter[oö]r\b|\bg[uü]venlik\b", re.I)),
    ("Diplomatic / official contact", re.compile(r"\bmeeting\b|\bmet with\b|\bcall(?:ed)?\b|\bvisit(?:ed)?\b|\bdelegation\b|\bprime minister\b|\bpresident\b|\bminister\b|\bconsul(?:ate)?\b|\bembassy\b|\breadout\b|\bstatement\b", re.I)),
    ("Humanitarian / minority protection", re.compile(r"\bhumanitarian\b|\brefugee\b|\bdisplaced\b|\byazidi\b|\byezidi\b|\bsinjar\b|\bgenocide\b|\bminority\b|\baid\b|\breconstruction\b|\brecovery\b", re.I)),
    ("Energy / economic", re.compile(r"\boil\b|\benergy\b|\bpipeline\b|\bgas\b|\btrade\b|\binvest(?:ment)?\b|\bbusiness\b|\beconomic\b|\brevenue\b|\bexport\b", re.I)),
    ("Critical / hostile language", re.compile(r"\bso[- ]called\b|\billegal\b|\bseparatist\b|\bpuppet\b|\bcondemn\b|\boppose\b|\bterror corridor\b|\battack(?:ed)?\b|\bbetray(?:al|ed)?\b|\bs[oö]zde\b|\bb[oö]l[uü]c[uü]\b", re.I)),
]


def load_auth_status() -> dict:
    if not ANALYZER_CONFIG.exists():
        return {"twitterCookiesConfigured": False, "facebookCookiesConfigured": False}
    try:
        data = json.loads(ANALYZER_CONFIG.read_text())
    except (OSError, json.JSONDecodeError):
        return {"twitterCookiesConfigured": False, "facebookCookiesConfigured": False}

    return {
        "twitterCookiesConfigured": bool(data.get("ct0") and data.get("auth_token")),
        "facebookCookiesConfigured": bool(
            data.get("facebook_cookies", {}).get("c_user")
            and data.get("facebook_cookies", {}).get("xs")
        ),
    }


def load_registry() -> dict:
    if not REGISTRY_PATH.exists():
        return {"accounts": [], "totals": {"accounts": 0}, "countries": {}, "ownerTypes": {}}
    try:
        return json.loads(REGISTRY_PATH.read_text())
    except (OSError, json.JSONDecodeError):
        return {"accounts": [], "totals": {"accounts": 0}, "countries": {}, "ownerTypes": {}}


def connect_db() -> sqlite3.Connection | None:
    if not DB_PATH.exists():
        return None
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def decode_json(value, fallback):
    if not value:
        return fallback
    try:
        return json.loads(value)
    except (TypeError, json.JSONDecodeError):
        return fallback


def make_tweet(row: sqlite3.Row, account_by_handle: dict) -> dict:
    handle = (row["handle"] or row["username"] or "").lower()
    account = account_by_handle.get(handle, {})
    metrics = decode_json(row["metrics_json"], {})
    tags = decode_json(row["tags_json"], [])
    urls = decode_json(row["urls_json"], [])
    text = row["text"] or ""
    matched_terms = match_kurdistan_terms(text)
    frames = match_social_frames(text)
    return {
        "id": row["id"],
        "handle": handle,
        "username": row["username"] or row["handle"],
        "displayName": row["display_name"],
        "ownerName": account.get("ownerName"),
        "ownerType": account.get("ownerType"),
        "countryId": account.get("countryId"),
        "profileHref": account.get("profileHref"),
        "text": text,
        "createdAt": row["created_at_iso"] or row["created_at"],
        "timestamp": row["created_at_ts"],
        "tweetType": row["tweet_type"],
        "language": row["language"],
        "metrics": metrics,
        "tags": tags,
        "kurdistanTerms": matched_terms,
        "frames": frames,
        "urls": urls,
        "url": f"https://x.com/{row['username'] or row['handle']}/status/{row['id']}",
    }


def make_user(row: sqlite3.Row, registry_account: dict | None = None) -> dict:
    registry_account = registry_account or {}
    return {
        "username": row["display_handle"] or row["handle"],
        "displayName": row["display_name"] or registry_account.get("ownerName"),
        "ownerName": registry_account.get("ownerName") or row["owner_name"],
        "ownerType": registry_account.get("ownerType") or row["owner_type"],
        "countryId": registry_account.get("countryId") or row["country_id"],
        "role": registry_account.get("role") or row["role"],
        "profileHref": registry_account.get("profileHref") or row["profile_href"],
        "url": registry_account.get("url") or row["url"],
        "status": row["status"],
        "lastScrapedAt": row["last_scraped_at"],
        "lastError": row["last_error"],
        "profileImageUrl": row["profile_image_url"],
        "followersCount": row["followers_count"],
        "followingCount": row["following_count"],
        "verified": bool(row["verified"]),
    }


def load_archive(registry: dict) -> dict:
    registry_accounts = registry.get("accounts") or []
    account_by_handle = {f"{account.get('handle', '')}".lower(): account for account in registry_accounts}
    connection = connect_db()
    if connection is None:
        return {
            "accounts": [
                {
                    **account,
                    "status": "pending",
                    "lastScrapedAt": None,
                    "lastError": None,
                }
                for account in registry_accounts
            ],
            "users": [],
            "tweets": [],
            "capturedAccounts": 0,
            "errorAccounts": 0,
            "tweetCount": 0,
            "lastCaptureAt": None,
        }

    account_rows = connection.execute("SELECT * FROM accounts ORDER BY country_id, owner_type, owner_name").fetchall()
    tweet_rows = connection.execute(
        "SELECT * FROM tweets ORDER BY COALESCE(created_at_ts, 0) DESC, captured_at DESC LIMIT ?",
        (SNAPSHOT_TWEET_LIMIT,),
    ).fetchall()
    tweet_count = connection.execute("SELECT COUNT(*) AS count FROM tweets").fetchone()["count"]
    last_capture = connection.execute("SELECT MAX(last_scraped_at) AS value FROM accounts").fetchone()["value"]

    account_handles_seen = {row["handle"] for row in account_rows}
    accounts = [make_user(row, account_by_handle.get(row["handle"])) for row in account_rows]
    for registry_account in registry_accounts:
        handle = f"{registry_account.get('handle', '')}".lower()
        if handle and handle not in account_handles_seen:
            accounts.append({
                **registry_account,
                "status": "pending",
                "lastScrapedAt": None,
                "lastError": None,
            })

    users = [account for account in accounts if account.get("status") in {"captured", "search-captured"}]
    tweets = [make_tweet(row, account_by_handle) for row in tweet_rows]
    error_accounts = sum(1 for account in accounts if account.get("status") == "error")

    return {
        "accounts": accounts,
        "users": users,
        "tweets": tweets,
        "capturedAccounts": len(users),
        "errorAccounts": error_accounts,
        "tweetCount": tweet_count,
        "lastCaptureAt": last_capture,
    }


def make_profile_archive(registry: dict) -> dict:
    registry_accounts = registry.get("accounts") or []
    account_by_handle = {f"{account.get('handle', '')}".lower(): account for account in registry_accounts}
    connection = connect_db()
    profiles: dict[str, dict] = {}

    for account in registry_accounts:
        profile = ensure_profile_archive(profiles, account)
        profile["accounts"].append(make_profile_account(account, None))

    if connection is None:
        return finish_profile_archive(registry, profiles)

    account_rows = connection.execute("SELECT * FROM accounts ORDER BY country_id, owner_type, owner_name").fetchall()
    for row in account_rows:
        registry_account = account_by_handle.get(row["handle"], {})
        account = {
            "countryId": registry_account.get("countryId") or row["country_id"],
            "ownerName": registry_account.get("ownerName") or row["owner_name"],
            "ownerType": registry_account.get("ownerType") or row["owner_type"],
            "role": registry_account.get("role") or row["role"],
            "handle": registry_account.get("handle") or row["display_handle"] or row["handle"],
            "url": registry_account.get("url") or row["url"],
            "profileHref": registry_account.get("profileHref") or row["profile_href"],
            "label": registry_account.get("label") or "X",
        }
        profile = ensure_profile_archive(profiles, account)
        db_account = make_profile_account(account, row)
        if not any(existing["handle"].lower() == db_account["handle"].lower() for existing in profile["accounts"]):
            profile["accounts"].append(db_account)
        else:
            profile["accounts"] = [
                {**existing, **db_account} if existing["handle"].lower() == db_account["handle"].lower() else existing
                for existing in profile["accounts"]
            ]

    tweet_rows = connection.execute(
        "SELECT * FROM tweets ORDER BY COALESCE(created_at_ts, 0) DESC, captured_at DESC"
    ).fetchall()
    for row in tweet_rows:
        handle = (row["handle"] or row["username"] or "").lower()
        account = account_by_handle.get(handle) or row_account(row, connection)
        profile = ensure_profile_archive(profiles, account)
        tweet = make_tweet(row, account_by_handle)
        profile["tweets"].append(tweet)

    return finish_profile_archive(registry, profiles)


def ensure_profile_archive(profiles: dict[str, dict], account: dict) -> dict:
    handle = normalize_handle(account.get("handle"))
    profile_href = account.get("profileHref")
    key = profile_href or f"x:{handle.lower()}"
    if key not in profiles:
        profiles[key] = {
            "key": key,
            "profileHref": profile_href,
            "ownerName": account.get("ownerName") or f"@{handle}",
            "ownerType": account.get("ownerType") or "Social account",
            "role": account.get("role"),
            "countryId": account.get("countryId"),
            "accounts": [],
            "tweets": [],
        }
    return profiles[key]


def make_profile_account(account: dict, row: sqlite3.Row | None) -> dict:
    handle = normalize_handle(account.get("handle"))
    return {
        "handle": handle,
        "url": account.get("url") or f"https://x.com/{handle}",
        "label": account.get("label") or "X",
        "status": row["status"] if row else "pending",
        "lastScrapedAt": row["last_scraped_at"] if row else None,
        "lastError": row["last_error"] if row else None,
        "displayName": row["display_name"] if row else None,
        "profileImageUrl": row["profile_image_url"] if row else None,
        "followersCount": row["followers_count"] if row else None,
        "verified": bool(row["verified"]) if row else False,
    }


def row_account(row: sqlite3.Row, connection: sqlite3.Connection) -> dict:
    account = connection.execute("SELECT * FROM accounts WHERE handle = ?", (row["handle"],)).fetchone()
    if not account:
        return {
            "handle": row["handle"] or row["username"],
            "ownerName": row["display_name"] or row["username"] or row["handle"],
            "ownerType": "Captured account",
            "countryId": None,
            "profileHref": None,
            "url": f"https://x.com/{row['username'] or row['handle']}",
        }
    return {
        "handle": account["display_handle"] or account["handle"],
        "ownerName": account["owner_name"] or row["display_name"],
        "ownerType": account["owner_type"] or "Captured account",
        "role": account["role"],
        "countryId": account["country_id"],
        "profileHref": account["profile_href"],
        "url": account["url"],
        "label": "X",
    }


def finish_profile_archive(registry: dict, profiles: dict[str, dict]) -> dict:
    OUT_PROFILE_DIR.mkdir(parents=True, exist_ok=True)
    for stale in OUT_PROFILE_DIR.glob("*.json"):
        stale.unlink()

    profile_items = []
    for profile in profiles.values():
        tweets = sorted(profile.pop("tweets"), key=lambda item: item.get("timestamp") or 0, reverse=True)
        mentions = [tweet for tweet in tweets if tweet.get("kurdistanTerms")]
        profile_slug = slugify(profile.get("profileHref") or profile.get("ownerName") or profile["key"]) or "profile"
        archive_url = f"/source/social/profiles/{profile_slug}.json"
        full_profile = {
            **profile,
            "tweetCount": len(tweets),
            "kurdistanMentionCount": len(mentions),
            "earliestTweetAt": min((tweet.get("createdAt") for tweet in tweets if tweet.get("createdAt")), default=None),
            "latestTweetAt": max((tweet.get("createdAt") for tweet in tweets if tweet.get("createdAt")), default=None),
            "termCounts": count_terms(mentions, "kurdistanTerms"),
            "frameCounts": count_terms(mentions, "frames"),
            "recentTweets": tweets[:PROFILE_RECENT_LIMIT],
            "kurdistanMentions": mentions[:PROFILE_MENTION_LIMIT],
            "archiveUrl": archive_url,
        }
        full_profile["assessment"] = make_social_assessment(full_profile)
        (OUT_PROFILE_DIR / f"{profile_slug}.json").write_text(
            json.dumps({**full_profile, "tweets": tweets}, indent=2, ensure_ascii=False) + "\n"
        )
        profile_items.append(full_profile)

    profile_items.sort(
        key=lambda item: (
            -(item.get("kurdistanMentionCount") or 0),
            -(item.get("tweetCount") or 0),
            item.get("countryId") or "",
            item.get("ownerName") or "",
        )
    )
    href_index = {
        item["profileHref"]: index
        for index, item in enumerate(profile_items)
        if item.get("profileHref")
    }
    handle_index = {}
    for index, item in enumerate(profile_items):
        for account in item.get("accounts", []):
            handle = normalize_handle(account.get("handle")).lower()
            if handle:
                handle_index[handle] = index

    return {
        "generatedAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "source": "TOR Phi per-profile social archive",
        "database": "data/torphi-social.db",
        "methodSource": "Project-owned SQLite archive populated with Social Analyzer-style X GraphQL capture. Existing Social Analyzer databases are not imported.",
        "limits": {
            "recentTweetsPerProfile": PROFILE_RECENT_LIMIT,
            "kurdistanMentionsPerProfile": PROFILE_MENTION_LIMIT,
        },
        "totals": {
            "mappedAccounts": len(registry.get("accounts") or []),
            "profiles": len(profile_items),
            "profilesWithTweets": sum(1 for item in profile_items if item.get("tweetCount")),
            "profilesWithKurdistanMentions": sum(1 for item in profile_items if item.get("kurdistanMentionCount")),
            "tweetsInProfileWindows": sum(len(item.get("recentTweets") or []) for item in profile_items),
            "kurdistanMentionsInProfileWindows": sum(len(item.get("kurdistanMentions") or []) for item in profile_items),
        },
        "profiles": profile_items,
        "hrefIndex": href_index,
        "handleIndex": handle_index,
    }


def match_kurdistan_terms(text: str | None) -> list[str]:
    value = text or ""
    return [label for label, pattern in KURDISTAN_LENS_TERMS if pattern.search(value)]


def match_social_frames(text: str | None) -> list[str]:
    value = text or ""
    return [label for label, pattern in SOCIAL_FRAME_PATTERNS if pattern.search(value)]


def count_terms(tweets: list[dict], key: str) -> list[dict]:
    counts: dict[str, int] = {}
    for tweet in tweets:
        for term in tweet.get(key) or []:
            counts[term] = counts.get(term, 0) + 1
    return [
        {"term": term, "count": count}
        for term, count in sorted(counts.items(), key=lambda item: (-item[1], item[0]))
    ]


def make_social_assessment(profile: dict) -> dict:
    mentions = profile.get("kurdistanMentions") or []
    term_counts = {item["term"]: item["count"] for item in profile.get("termCounts") or []}
    frame_counts = {item["term"]: item["count"] for item in profile.get("frameCounts") or []}
    direct_count = sum(term_counts.get(term, 0) for term in ["Kurdistan", "Kurds / Kurdish", "KRG / IKBY", "Erbil / Hewler", "Peshmerga", "Northern Iraq"])
    security_count = frame_counts.get("Security / counterterrorism", 0)
    supportive_count = frame_counts.get("Supportive / partnership", 0)
    diplomatic_count = frame_counts.get("Diplomatic / official contact", 0)
    humanitarian_count = frame_counts.get("Humanitarian / minority protection", 0)
    energy_count = frame_counts.get("Energy / economic", 0)
    critical_count = frame_counts.get("Critical / hostile language", 0)

    if not mentions:
        return {
            "posture": "No captured Kurdistan social posture yet",
            "confidence": "None",
            "summary": "The local archive has not captured a tweet from this account that matches TOR Phi's Kurdistan Lens terms yet. Capture more timeline pages and targeted Kurdistan searches before drawing a social-media conclusion.",
            "whatItWasLike": "No Kurdistan, Kurds, KRG/IKBY, Erbil, Peshmerga, Northern Iraq, PKK/YPG, Iraq/Syria, Yazidi/Sinjar, or energy-linked tweet is present in the profile window yet.",
            "dominantFrame": "No matched frame",
        }

    if security_count >= max(2, supportive_count + diplomatic_count, humanitarian_count):
        posture = "Security-first / counterterrorism frame"
        dominant = "security and counterterrorism language"
    elif supportive_count >= max(1, security_count) or diplomatic_count >= max(2, security_count):
        posture = "Constructive or diplomatic signal"
        dominant = "support, partnership, or official-contact language"
    elif humanitarian_count >= max(1, security_count):
        posture = "Humanitarian / minority-protection signal"
        dominant = "humanitarian or minority-protection language"
    elif energy_count > 0 and direct_count > 0:
        posture = "Pragmatic economic / energy signal"
        dominant = "energy, trade, or economic language"
    elif critical_count > 0:
        posture = "Critical or hostile-language signal"
        dominant = "critical language that needs source-level review"
    elif direct_count > 0:
        posture = "Direct but mixed Kurdistan signal"
        dominant = "direct Kurdistan/Kurdish-region references without a single dominant frame"
    else:
        posture = "Kurdistan-adjacent regional signal"
        dominant = "Iraq, Syria, PKK/YPG, or regional language rather than explicit KRG language"

    confidence = "Medium-high" if len(mentions) >= 20 else "Medium" if len(mentions) >= 6 else "Low"
    top_terms = ", ".join(item["term"] for item in (profile.get("termCounts") or [])[:4]) or "matched Kurdistan Lens terms"
    newest = mentions[0]
    summary = (
        f"The captured X archive has {len(mentions):,} Kurdistan Lens tweet hit"
        f"{'' if len(mentions) == 1 else 's'} for {profile.get('ownerName')}. "
        f"The social-media posture reads as {posture.lower()} because the strongest matched frame is {dominant}. "
        f"Top matched terms: {top_terms}."
    )
    what_it_was_like = (
        f"When this account mentioned the Kurdish file, the language most often clustered around {dominant}. "
        f"I count {direct_count:,} direct Kurdistan/Kurdish-region term hit{'' if direct_count == 1 else 's'}, "
        f"{security_count:,} security-frame hit{'' if security_count == 1 else 's'}, "
        f"{supportive_count + diplomatic_count:,} supportive or diplomatic hit{'' if supportive_count + diplomatic_count == 1 else 's'}, "
        f"{humanitarian_count:,} humanitarian/minority hit{'' if humanitarian_count == 1 else 's'}, and "
        f"{energy_count:,} energy/economic hit{'' if energy_count == 1 else 's'} in the exported profile window. "
        f"The latest matched tweet is dated {newest.get('createdAt') or 'unknown date'} and should be opened before treating this as a final stance."
    )

    return {
        "posture": posture,
        "confidence": confidence,
        "summary": summary,
        "whatItWasLike": what_it_was_like,
        "dominantFrame": dominant,
        "directTermHits": direct_count,
        "securityFrameHits": security_count,
        "supportiveDiplomaticHits": supportive_count + diplomatic_count,
        "humanitarianHits": humanitarian_count,
        "energyHits": energy_count,
    }


def normalize_handle(value: str | None) -> str:
    handle = f"{value or ''}".strip().strip("/")
    if handle.lower().startswith("x@"):
        handle = handle[2:]
    if "@" in handle:
        handle = handle.split("@")[-1]
    return handle.strip()


def slugify(value: str | None) -> str:
    return re.sub(r"[^a-z0-9]+", "-", f"{value or ''}".lower()).strip("-")


def make_snapshot() -> dict:
    registry = load_registry()
    archive = load_archive(registry)
    registry_accounts = registry.get("accounts") or []
    return {
        "generatedAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "source": "TOR Phi social archive",
        "methodSource": "Project-owned SQLite archive populated with Social Analyzer-style X GraphQL capture.",
        "database": "data/torphi-social.db",
        "auth": load_auth_status(),
        "registry": {
            "generatedAt": registry.get("generatedAt"),
            "accounts": len(registry_accounts),
            "countries": registry.get("countries", {}),
            "ownerTypes": registry.get("ownerTypes", {}),
            "parliamentCoverage": registry.get("parliamentCoverage", {}),
        },
        "totals": {
            "accounts": len(registry_accounts),
            "uniqueHandles": len(archive["accounts"]),
            "capturedAccounts": archive["capturedAccounts"],
            "errorAccounts": archive["errorAccounts"],
            "tweets": archive["tweetCount"],
            "snapshotTweets": len(archive["tweets"]),
            "users": len(archive["users"]),
        },
        "lastCaptureAt": archive["lastCaptureAt"],
        "accounts": archive["accounts"],
        "users": archive["users"],
        "tweets": archive["tweets"],
        "notes": [
            "Existing Social Analyzer database rows are intentionally not imported.",
            "Run npm run sync:social-accounts, then npm run capture:social -- --country usa --limit 25 to populate updates.",
            "Use npm run capture:social -- --all for a full mapped-account pass when you are ready for a long capture."
        ],
    }


def main() -> None:
    registry = load_registry()
    snapshot = make_snapshot()
    profile_archive = make_profile_archive(registry)
    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUT_JSON.write_text(json.dumps(snapshot, indent=2, ensure_ascii=False) + "\n")
    OUT_PROFILE_JSON.write_text(json.dumps(profile_archive, indent=2, ensure_ascii=False) + "\n")
    if not PUBLIC_ONLY:
        OUT_JS.write_text(
            "// Generated by scripts/export-social-snapshot.py. Reads only TOR Phi's project-owned social archive.\n"
            f"export const socialArchiveSnapshot = {json.dumps(snapshot, indent=2, ensure_ascii=False)};\n"
        )
        OUT_PROFILE_JS.write_text(
            "// Generated by scripts/export-social-snapshot.py. Reads only TOR Phi's project-owned social archive.\n"
            f"export const socialProfileArchive = {json.dumps(profile_archive, indent=2, ensure_ascii=False)};\n"
        )
    print("Exported TOR Phi social snapshot" + (" public JSON only." if PUBLIC_ONLY else "."))
    print("Twitter cookies configured: " + ("yes" if snapshot["auth"]["twitterCookiesConfigured"] else "no") + " (values redacted)")
    print(f"Mapped accounts: {snapshot['totals']['accounts']}")
    print(f"Captured accounts: {snapshot['totals']['capturedAccounts']}")
    print(f"Tweets in TOR Phi archive: {snapshot['totals']['tweets']}")
    print(f"Profiles with tweets: {profile_archive['totals']['profilesWithTweets']}")
    print(f"Profiles with Kurdistan Lens tweets: {profile_archive['totals']['profilesWithKurdistanMentions']}")


if __name__ == "__main__":
    main()
