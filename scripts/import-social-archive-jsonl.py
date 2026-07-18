#!/usr/bin/env python3
"""Import repo-friendly TOR Phi social JSONL chunks into SQLite."""

from __future__ import annotations

import argparse
import json
import sqlite3
from pathlib import Path
from typing import Any, Iterable


ROOT = Path(__file__).resolve().parents[1]
DB_PATH = ROOT / "data" / "torphi-social.db"
ARCHIVE_ROOT = ROOT / "social-archive"


def init_db(connection: sqlite3.Connection) -> None:
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


def read_jsonl(path: Path) -> Iterable[dict[str, Any]]:
    if not path.exists():
        return
    with path.open("r", encoding="utf-8") as handle:
        for line in handle:
            line = line.strip()
            if line:
                yield json.loads(line)


def import_accounts(connection: sqlite3.Connection, archive_root: Path) -> int:
    count = 0
    for row in read_jsonl(archive_root / "accounts.jsonl") or []:
        handle = f"{row.get('handle') or ''}".lower()
        if not handle:
            continue
        connection.execute(
            """
            INSERT INTO accounts (
              handle, display_handle, country_id, owner_name, owner_type, role,
              profile_href, url, status, last_scraped_at, last_error, user_id,
              display_name, profile_image_url, followers_count, following_count,
              verified, raw_json, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE((SELECT raw_json FROM accounts WHERE handle=?), '{}'), ?)
            ON CONFLICT(handle) DO UPDATE SET
              display_handle=excluded.display_handle,
              country_id=excluded.country_id,
              owner_name=excluded.owner_name,
              owner_type=excluded.owner_type,
              role=excluded.role,
              profile_href=excluded.profile_href,
              url=excluded.url,
              status=excluded.status,
              last_scraped_at=excluded.last_scraped_at,
              last_error=excluded.last_error,
              user_id=excluded.user_id,
              display_name=excluded.display_name,
              profile_image_url=excluded.profile_image_url,
              followers_count=excluded.followers_count,
              following_count=excluded.following_count,
              verified=excluded.verified,
              updated_at=excluded.updated_at
            """,
            (
                handle,
                row.get("display_handle"),
                row.get("country_id"),
                row.get("owner_name"),
                row.get("owner_type"),
                row.get("role"),
                row.get("profile_href"),
                row.get("url"),
                row.get("status") or "captured",
                row.get("last_scraped_at"),
                row.get("last_error"),
                row.get("user_id"),
                row.get("display_name"),
                row.get("profile_image_url"),
                row.get("followers_count"),
                row.get("following_count"),
                row.get("verified") or 0,
                handle,
                row.get("updated_at") or row.get("last_scraped_at") or "1970-01-01T00:00:00Z",
            ),
        )
        count += 1
    return count


def import_tweets(connection: sqlite3.Connection, archive_root: Path) -> int:
    count = 0
    for path in sorted((archive_root / "tweets").glob("*.jsonl")):
        for row in read_jsonl(path) or []:
            tweet_id = f"{row.get('id') or ''}"
            handle = f"{row.get('handle') or ''}".lower()
            if not tweet_id or not handle:
                continue
            connection.execute(
                """
                INSERT INTO tweets (
                  id, handle, username, display_name, text, created_at, created_at_iso,
                  created_at_ts, tweet_type, language, metrics_json, urls_json,
                  media_json, tags_json, source_endpoint, captured_at, raw_json
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE((SELECT raw_json FROM tweets WHERE id=?), '{}'))
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
                  captured_at=excluded.captured_at
                """,
                (
                    tweet_id,
                    handle,
                    row.get("username"),
                    row.get("display_name"),
                    row.get("text"),
                    row.get("created_at"),
                    row.get("created_at_iso"),
                    row.get("created_at_ts"),
                    row.get("tweet_type"),
                    row.get("language"),
                    row.get("metrics_json") or "{}",
                    row.get("urls_json") or "[]",
                    row.get("media_json") or "[]",
                    row.get("tags_json") or "[]",
                    row.get("source_endpoint"),
                    row.get("captured_at") or "1970-01-01T00:00:00Z",
                    tweet_id,
                ),
            )
            count += 1
    return count


def main() -> None:
    parser = argparse.ArgumentParser(description="Import TOR Phi social JSONL archive into SQLite.")
    parser.add_argument("--db", default=str(DB_PATH), help="SQLite DB path.")
    parser.add_argument("--archive", default=str(ARCHIVE_ROOT), help="Archive directory.")
    args = parser.parse_args()

    archive_root = Path(args.archive)
    if not archive_root.exists():
        print(f"[TOR Phi] No social archive found at {archive_root}; nothing to import.")
        return

    db_path = Path(args.db)
    db_path.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(db_path)
    init_db(connection)
    accounts = import_accounts(connection, archive_root)
    tweets = import_tweets(connection, archive_root)
    connection.commit()
    print(f"[TOR Phi] Imported {tweets} tweet rows and {accounts} account rows from {archive_root}")


if __name__ == "__main__":
    main()
