#!/usr/bin/env python3
"""Export TOR Phi social SQLite rows into repo-friendly JSONL chunks.

The GitHub automation should not commit data/torphi-social.db: it is large,
binary, and conflict-prone. This exporter writes public tweet/account rows into
small text chunks that Git can sync back to local machines.
"""

from __future__ import annotations

import argparse
import json
import sqlite3
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
DB_PATH = ROOT / "data" / "torphi-social.db"
ARCHIVE_ROOT = ROOT / "social-archive"
TWEET_COLUMNS = [
    "id",
    "handle",
    "username",
    "display_name",
    "text",
    "created_at",
    "created_at_iso",
    "created_at_ts",
    "tweet_type",
    "language",
    "metrics_json",
    "urls_json",
    "media_json",
    "tags_json",
    "source_endpoint",
    "captured_at",
]
ACCOUNT_COLUMNS = [
    "handle",
    "display_handle",
    "country_id",
    "owner_name",
    "owner_type",
    "role",
    "profile_href",
    "url",
    "status",
    "last_scraped_at",
    "last_error",
    "user_id",
    "display_name",
    "profile_image_url",
    "followers_count",
    "following_count",
    "verified",
    "updated_at",
]


def row_to_dict(row: sqlite3.Row) -> dict[str, Any]:
    return {key: row[key] for key in row.keys()}


def write_jsonl(path: Path, rows: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        for row in rows:
            handle.write(json.dumps(row, ensure_ascii=False, sort_keys=True))
            handle.write("\n")


def month_key(row: sqlite3.Row) -> str:
    iso = row["created_at_iso"] or row["captured_at"] or "unknown"
    if len(iso) >= 7 and iso[4:5] == "-":
        return iso[:7]
    return "unknown"


def main() -> None:
    parser = argparse.ArgumentParser(description="Export social archive JSONL chunks.")
    parser.add_argument("--db", default=str(DB_PATH), help="SQLite DB path.")
    parser.add_argument("--out", default=str(ARCHIVE_ROOT), help="Archive output directory.")
    args = parser.parse_args()

    db_path = Path(args.db)
    out_root = Path(args.out)
    if not db_path.exists():
        raise SystemExit(f"Missing social DB: {db_path}")

    connection = sqlite3.connect(db_path)
    connection.row_factory = sqlite3.Row

    account_rows = [
        row_to_dict(row)
        for row in connection.execute(
            f"SELECT {', '.join(ACCOUNT_COLUMNS)} FROM accounts ORDER BY country_id, owner_type, owner_name, handle"
        )
    ]
    write_jsonl(out_root / "accounts.jsonl", account_rows)

    tweets_by_month: dict[str, list[dict[str, Any]]] = {}
    for row in connection.execute(
        f"SELECT {', '.join(TWEET_COLUMNS)} FROM tweets ORDER BY created_at_ts, id"
    ):
        tweets_by_month.setdefault(month_key(row), []).append(row_to_dict(row))

    for key, rows in tweets_by_month.items():
        write_jsonl(out_root / "tweets" / f"{key}.jsonl", rows)

    manifest = {
        "version": 1,
        "accounts": len(account_rows),
        "tweets": sum(len(rows) for rows in tweets_by_month.values()),
        "months": sorted(tweets_by_month),
        "note": "Generated from public X/Twitter records captured by TOR Phi.",
    }
    out_root.mkdir(parents=True, exist_ok=True)
    (out_root / "manifest.json").write_text(json.dumps(manifest, indent=2, sort_keys=True), encoding="utf-8")
    print(f"[TOR Phi] Exported {manifest['tweets']} tweets and {manifest['accounts']} accounts to {out_root}")


if __name__ == "__main__":
    main()
