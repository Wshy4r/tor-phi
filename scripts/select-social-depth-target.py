#!/usr/bin/env python3
"""Select the next TOR Phi social depth target for short online harvest jobs."""

from __future__ import annotations

import argparse
import os
import sqlite3
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DB_PATH = ROOT / "data" / "torphi-social.db"
DEFAULT_TIERS = [100, 200, 500, 1000, 2000, 5000, 10000]


def parse_tiers(value: str) -> list[int]:
    tiers = []
    for part in value.split(","):
        part = part.strip()
        if not part:
            continue
        tiers.append(max(1, int(part)))
    return sorted(set(tiers)) or DEFAULT_TIERS


def count_under_target(connection: sqlite3.Connection, country: str, owner_type: str, target: int) -> int:
    return int(
        connection.execute(
            """
            WITH tweet_counts AS (
              SELECT handle, COUNT(*) AS tweet_count
              FROM tweets
              GROUP BY handle
            )
            SELECT COUNT(*)
            FROM accounts a
            LEFT JOIN tweet_counts t ON t.handle = a.handle
            WHERE (? = 'all' OR a.country_id = ?)
              AND (? = 'all' OR a.owner_type = ?)
              AND COALESCE(t.tweet_count, 0) < ?
            """,
            (country, country, owner_type, owner_type, target),
        ).fetchone()[0]
    )


def max_account_tweets(connection: sqlite3.Connection, country: str, owner_type: str) -> int:
    return int(
        connection.execute(
            """
            WITH tweet_counts AS (
              SELECT handle, COUNT(*) AS tweet_count
              FROM tweets
              GROUP BY handle
            )
            SELECT COALESCE(MAX(COALESCE(t.tweet_count, 0)), 0)
            FROM accounts a
            LEFT JOIN tweet_counts t ON t.handle = a.handle
            WHERE (? = 'all' OR a.country_id = ?)
              AND (? = 'all' OR a.owner_type = ?)
            """,
            (country, country, owner_type, owner_type),
        ).fetchone()[0]
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Choose an automatic social scrape depth target.")
    parser.add_argument("--db", default=str(DB_PATH))
    parser.add_argument("--country", default="usa")
    parser.add_argument("--owner-type", default="Congress")
    parser.add_argument("--requested", default="auto", help="Number or auto.")
    parser.add_argument("--tiers", default=",".join(str(item) for item in DEFAULT_TIERS))
    parser.add_argument("--github-env", default=os.environ.get("GITHUB_ENV", ""))
    args = parser.parse_args()

    requested = f"{args.requested or 'auto'}".strip().lower()
    if requested and requested != "auto":
        target = max(1, int(requested))
        under_count = -1
    else:
        connection = sqlite3.connect(args.db)
        tiers = parse_tiers(args.tiers)
        target = tiers[-1]
        under_count = 0
        for tier in tiers:
            under_count = count_under_target(connection, args.country, args.owner_type, tier)
            if under_count > 0:
                target = tier
                break
        else:
            highest = max_account_tweets(connection, args.country, args.owner_type)
            target = max(tiers[-1] * 2, ((highest // 1000) + 1) * 1000)
            under_count = count_under_target(connection, args.country, args.owner_type, target)

    print(f"[TOR Phi] Selected social depth target: {target} tweets ({under_count} accounts below target; requested={args.requested}).")
    if args.github_env:
        with open(args.github_env, "a", encoding="utf-8") as handle:
            handle.write(f"TORPHI_SOCIAL_TARGET_TWEETS={target}\n")


if __name__ == "__main__":
    main()
