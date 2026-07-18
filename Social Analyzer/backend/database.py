import sqlite3
import json
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "tweets.db")


def get_db():
    conn = sqlite3.connect(DB_PATH, timeout=30)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db():
    conn = get_db()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS tweets (
            id TEXT PRIMARY KEY,
            text TEXT NOT NULL,
            created_at TEXT,
            created_at_ts INTEGER,
            user_id TEXT,
            username TEXT,
            display_name TEXT,
            verified INTEGER DEFAULT 0,
            retweet_count INTEGER DEFAULT 0,
            reply_count INTEGER DEFAULT 0,
            like_count INTEGER DEFAULT 0,
            quote_count INTEGER DEFAULT 0,
            bookmark_count INTEGER DEFAULT 0,
            view_count INTEGER,
            urls_json TEXT,
            is_retweet INTEGER DEFAULT 0,
            is_reply INTEGER DEFAULT 0,
            in_reply_to TEXT,
            conversation_id TEXT,
            language TEXT,
            capture_source TEXT,
            capture_endpoint TEXT,
            captured_at TEXT
        );

        CREATE TABLE IF NOT EXISTS scrape_progress (
            key TEXT PRIMARY KEY,
            username TEXT NOT NULL,
            endpoint TEXT NOT NULL,
            cursor TEXT,
            direction TEXT DEFAULT 'backward',
            pages_fetched INTEGER DEFAULT 0,
            tweets_saved INTEGER DEFAULT 0,
            status TEXT DEFAULT 'in_progress',
            updated_at TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_tweets_username ON tweets(username);
        CREATE INDEX IF NOT EXISTS idx_tweets_created_at_ts ON tweets(created_at_ts);
        CREATE INDEX IF NOT EXISTS idx_tweets_user_id ON tweets(user_id);
        CREATE INDEX IF NOT EXISTS idx_tweets_conversation_id ON tweets(conversation_id);
        CREATE INDEX IF NOT EXISTS idx_tweets_language ON tweets(language);

        CREATE TABLE IF NOT EXISTS user_groups (
            username TEXT NOT NULL,
            group_name TEXT NOT NULL,
            PRIMARY KEY (username, group_name)
        );

        CREATE TABLE IF NOT EXISTS facebook_posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            post_id TEXT UNIQUE NOT NULL,
            author_username TEXT,
            author_name TEXT,
            author_id TEXT,
            text TEXT,
            created_at TEXT,
            created_at_ts INTEGER,
            post_type TEXT DEFAULT 'post',
            likes INTEGER DEFAULT 0,
            comments INTEGER DEFAULT 0,
            shares INTEGER DEFAULT 0,
            views INTEGER DEFAULT 0,
            post_url TEXT,
            media_json TEXT,
            raw_json TEXT,
            scraped_at INTEGER
        );

        CREATE INDEX IF NOT EXISTS idx_fb_posts_username ON facebook_posts(author_username);
        CREATE INDEX IF NOT EXISTS idx_fb_posts_created_at_ts ON facebook_posts(created_at_ts);
        CREATE INDEX IF NOT EXISTS idx_fb_posts_type ON facebook_posts(post_type);

        CREATE TABLE IF NOT EXISTS facebook_groups (
            username TEXT NOT NULL,
            group_name TEXT NOT NULL,
            PRIMARY KEY (username, group_name)
        );
    """)

    # Add columns if missing (safe migration)
    for col, typedef in [
        ("tweet_type", "TEXT DEFAULT 'tweet'"),
        ("thread_id", "TEXT"),
        ("thread_position", "INTEGER"),
        ("media_json", "TEXT"),
    ]:
        try:
            conn.execute(f"ALTER TABLE tweets ADD COLUMN {col} {typedef}")
        except sqlite3.OperationalError:
            pass  # Column already exists

    conn.execute("CREATE INDEX IF NOT EXISTS idx_tweets_tweet_type ON tweets(tweet_type)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_tweets_thread_id ON tweets(thread_id)")

    # Backfill: populate username from capture_source for UserTweets where username is NULL
    conn.execute("""
        UPDATE tweets
        SET username = capture_source
        WHERE username IS NULL
          AND capture_endpoint = 'UserTweets'
          AND capture_source IS NOT NULL
    """)

    conn.commit()
    conn.close()


def parse_twitter_date(date_str):
    """Parse Twitter's date format: 'Wed Oct 10 20:19:24 +0000 2018'"""
    if not date_str:
        return None
    try:
        dt = datetime.strptime(date_str, "%a %b %d %H:%M:%S %z %Y")
        return int(dt.timestamp())
    except (ValueError, TypeError):
        return None


def tweet_exists(tweet_id):
    conn = get_db()
    row = conn.execute("SELECT 1 FROM tweets WHERE id = ?", (tweet_id,)).fetchone()
    conn.close()
    return row is not None


def classify_tweet(tweet):
    """Classify a tweet as tweet, reply, or retweet. Threads are detected separately."""
    if tweet.get("is_retweet"):
        return "retweet"
    if tweet.get("is_reply"):
        return "reply"
    return "tweet"


def insert_tweets(tweets, source_info=None):
    conn = get_db()
    inserted = 0
    duplicates = 0

    for tweet in tweets:
        try:
            ts = parse_twitter_date(tweet.get("created_at"))
            user = tweet.get("user", {})
            metrics = tweet.get("metrics", {})
            tweet_type = classify_tweet(tweet)

            media = tweet.get("media") or []

            cursor = conn.execute("""
                INSERT OR IGNORE INTO tweets (
                    id, text, created_at, created_at_ts,
                    user_id, username, display_name, verified,
                    retweet_count, reply_count, like_count, quote_count,
                    bookmark_count, view_count,
                    urls_json, media_json,
                    is_retweet, is_reply, in_reply_to, conversation_id,
                    language,
                    tweet_type,
                    capture_source, capture_endpoint, captured_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                tweet.get("id"),
                tweet.get("text"),
                tweet.get("created_at"),
                ts,
                user.get("id"),
                user.get("username"),
                user.get("display_name"),
                1 if user.get("verified") else 0,
                metrics.get("retweet_count", 0),
                metrics.get("reply_count", 0),
                metrics.get("like_count", 0),
                metrics.get("quote_count", 0),
                metrics.get("bookmark_count", 0),
                metrics.get("view_count"),
                json.dumps(tweet.get("urls", [])),
                json.dumps(media) if media else None,
                1 if tweet.get("is_retweet") else 0,
                1 if tweet.get("is_reply") else 0,
                tweet.get("in_reply_to"),
                tweet.get("conversation_id"),
                tweet.get("language"),
                tweet_type,
                source_info.get("source_identifier") if source_info else None,
                source_info.get("endpoint") if source_info else None,
                source_info.get("captured_at") if source_info else datetime.utcnow().isoformat(),
            ))

            if cursor.rowcount > 0:
                inserted += 1
            else:
                duplicates += 1
        except Exception as e:
            print(f"Error inserting tweet {tweet.get('id')}: {e}")
            duplicates += 1

    conn.commit()
    conn.close()
    return {"inserted": inserted, "duplicates": duplicates}


def detect_threads(conn=None):
    """Detect threads: self-reply chains by the same user in the same conversation."""
    should_close = False
    if conn is None:
        conn = get_db()
        should_close = True

    # Find conversations where the same user has multiple tweets
    # A thread is when user replies to themselves (in_reply_to points to their own tweet)
    # conversation_id groups them, and user_id ties them to one author
    rows = conn.execute("""
        SELECT conversation_id, user_id, username, COUNT(*) as cnt
        FROM tweets
        WHERE conversation_id IS NOT NULL
          AND user_id IS NOT NULL
          AND thread_id IS NULL
        GROUP BY conversation_id, user_id
        HAVING cnt >= 2
    """).fetchall()

    threads_found = 0
    for row in rows:
        conv_id = row["conversation_id"]
        uid = row["user_id"]

        # Get all tweets in this conversation by this user, ordered chronologically
        thread_tweets = conn.execute("""
            SELECT id, in_reply_to, created_at_ts
            FROM tweets
            WHERE conversation_id = ? AND user_id = ?
            ORDER BY created_at_ts ASC
        """, (conv_id, uid)).fetchall()

        if len(thread_tweets) < 2:
            continue

        # Verify it's actually a thread: each tweet should reply to the previous one
        # (or the first tweet starts the conversation)
        tweet_ids = {t["id"] for t in thread_tweets}
        is_thread = True
        for t in thread_tweets[1:]:
            # The reply should point to another tweet in this same set
            if t["in_reply_to"] and t["in_reply_to"] not in tweet_ids:
                is_thread = False
                break

        if not is_thread:
            continue

        # Mark all tweets in this thread
        thread_id = conv_id  # Use conversation_id as thread_id
        for pos, t in enumerate(thread_tweets):
            tweet_type = "thread" if pos > 0 else "tweet"
            conn.execute("""
                UPDATE tweets SET thread_id = ?, thread_position = ?, tweet_type = ?
                WHERE id = ?
            """, (thread_id, pos + 1, tweet_type, t["id"]))

        threads_found += 1

    if threads_found > 0:
        conn.commit()
        print(f"[DB] Detected {threads_found} threads")

    if should_close:
        conn.close()
    return threads_found


# ── Scrape progress (save/resume) ──

def save_progress(key, username, endpoint, cursor, pages_fetched, tweets_saved, status="in_progress"):
    conn = get_db()
    conn.execute("""
        INSERT OR REPLACE INTO scrape_progress
        (key, username, endpoint, cursor, pages_fetched, tweets_saved, status, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (key, username, endpoint, cursor, pages_fetched, tweets_saved, status,
          datetime.utcnow().isoformat()))
    conn.commit()
    conn.close()


def get_progress(key):
    conn = get_db()
    row = conn.execute("SELECT * FROM scrape_progress WHERE key = ?", (key,)).fetchone()
    conn.close()
    return dict(row) if row else None


def get_newest_tweet_ts(username):
    """Get the timestamp of the newest tweet we have for a user."""
    conn = get_db()
    row = conn.execute(
        "SELECT MAX(created_at_ts) as ts FROM tweets WHERE username = ?",
        (username,)
    ).fetchone()
    conn.close()
    return row["ts"] if row else None


def get_user_tweet_count(username):
    conn = get_db()
    row = conn.execute(
        "SELECT COUNT(*) as cnt FROM tweets WHERE username = ?",
        (username,)
    ).fetchone()
    conn.close()
    return row["cnt"] if row else 0


def get_thread(thread_id):
    """Get all tweets in a thread, ordered by position."""
    conn = get_db()
    rows = conn.execute("""
        SELECT * FROM tweets WHERE thread_id = ?
        ORDER BY thread_position ASC
    """, (thread_id,)).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_threads_for_user(username, limit=20, offset=0):
    """Get all threads started by a user."""
    conn = get_db()
    rows = conn.execute("""
        SELECT thread_id, MIN(text) as first_text, COUNT(*) as tweet_count,
               MIN(created_at) as started_at, MAX(created_at) as ended_at,
               SUM(like_count) as total_likes, SUM(view_count) as total_views
        FROM tweets
        WHERE username = ? AND thread_id IS NOT NULL
        GROUP BY thread_id
        ORDER BY MIN(created_at_ts) DESC
        LIMIT ? OFFSET ?
    """, (username.lstrip("@"), limit, offset)).fetchall()

    total = conn.execute("""
        SELECT COUNT(DISTINCT thread_id) FROM tweets
        WHERE username = ? AND thread_id IS NOT NULL
    """, (username.lstrip("@"),)).fetchone()[0]

    conn.close()
    return {"threads": [dict(r) for r in rows], "total": total}


def search_tweets(query=None, username=None, start_date=None, end_date=None,
                  min_likes=None, has_media=False, language=None, tweet_type=None,
                  limit=50, offset=0, sort_by="created_at_ts", sort_order="DESC"):
    conn = get_db()
    conditions = []
    params = []

    if query:
        conditions.append("text LIKE ?")
        params.append(f"%{query}%")
    if username:
        if isinstance(username, list):
            cleaned = [u.lstrip("@") for u in username if u]
            if cleaned:
                placeholders = ",".join("?" * len(cleaned))
                conditions.append(f"username IN ({placeholders})")
                params.extend(cleaned)
        else:
            conditions.append("username = ?")
            params.append(username.lstrip("@"))
    if tweet_type:
        if tweet_type == "thread":
            conditions.append("thread_id IS NOT NULL AND thread_position = 1")
        else:
            conditions.append("tweet_type = ?")
            params.append(tweet_type)
    if start_date:
        conditions.append("created_at_ts >= ?")
        params.append(int(datetime.fromisoformat(start_date).timestamp()))
    if end_date:
        conditions.append("created_at_ts <= ?")
        params.append(int(datetime.fromisoformat(end_date).timestamp()))
    if has_media:
        conditions.append("media_json IS NOT NULL AND media_json != '[]'")
    if min_likes:
        conditions.append("like_count >= ?")
        params.append(int(min_likes))
    if language:
        conditions.append("language = ?")
        params.append(language)

    where = " AND ".join(conditions) if conditions else "1=1"

    valid_sorts = {"created_at_ts", "like_count", "retweet_count", "reply_count", "view_count", "quote_count"}
    if sort_by not in valid_sorts:
        sort_by = "created_at_ts"
    if sort_order not in ("ASC", "DESC"):
        sort_order = "DESC"

    sql = f"""
        SELECT * FROM tweets
        WHERE {where}
        ORDER BY {sort_by} {sort_order}
        LIMIT ? OFFSET ?
    """
    params.extend([limit, offset])

    rows = conn.execute(sql, params).fetchall()

    count_sql = f"SELECT COUNT(*) FROM tweets WHERE {where}"
    total = conn.execute(count_sql, params[:-2]).fetchone()[0]

    conn.close()
    return {
        "tweets": [dict(r) for r in rows],
        "total": total,
        "limit": limit,
        "offset": offset,
    }


def get_stats(username=None):
    conn = get_db()
    stats = {}

    w  = "WHERE username = ?"  if username else ""
    aw = "AND username = ?"    if username else ""
    p  = [username.lstrip("@")] if username else []

    stats["total_tweets"]  = conn.execute(f"SELECT COUNT(*) FROM tweets {w}", p).fetchone()[0]
    stats["unique_users"]  = conn.execute(f"SELECT COUNT(DISTINCT username) FROM tweets {w}", p).fetchone()[0]

    oldest = conn.execute(f"SELECT MIN(created_at) FROM tweets WHERE created_at IS NOT NULL {aw}", p).fetchone()[0]
    newest = conn.execute(f"SELECT MAX(created_at) FROM tweets WHERE created_at IS NOT NULL {aw}", p).fetchone()[0]
    stats["oldest_tweet"] = oldest
    stats["newest_tweet"] = newest

    if not username:
        top_users = conn.execute("""
            SELECT username, COUNT(*) as count
            FROM tweets
            WHERE username IS NOT NULL
            GROUP BY username
            ORDER BY count DESC
            LIMIT 10
        """).fetchall()
        stats["top_users"] = [{"username": r["username"], "count": r["count"]} for r in top_users]

    stats["total_retweets"] = conn.execute(
        f"SELECT COUNT(*) FROM tweets WHERE tweet_type = 'retweet' {aw}", p
    ).fetchone()[0]
    stats["total_replies"]  = conn.execute(
        f"SELECT COUNT(*) FROM tweets WHERE tweet_type = 'reply' {aw}", p
    ).fetchone()[0]
    stats["total_threads"]  = conn.execute(
        f"SELECT COUNT(DISTINCT thread_id) FROM tweets WHERE thread_id IS NOT NULL {aw}", p
    ).fetchone()[0]
    stats["total_original"] = conn.execute(
        f"SELECT COUNT(*) FROM tweets WHERE tweet_type = 'tweet' {aw}", p
    ).fetchone()[0]

    conn.close()
    return stats


def export_tweets(format="json", username=None, limit=None):
    conn = get_db()
    conditions = []
    params = []

    if username:
        conditions.append("username = ?")
        params.append(username.lstrip("@"))

    where = " AND ".join(conditions) if conditions else "1=1"
    sql = f"SELECT * FROM tweets WHERE {where} ORDER BY created_at_ts DESC"

    if limit:
        sql += " LIMIT ?"
        params.append(limit)

    rows = conn.execute(sql, params).fetchall()
    conn.close()
    return [dict(r) for r in rows]


# ── Groups ──

def get_groups():
    """Return all groups with their accounts and tweet stats."""
    conn = get_db()

    # All group assignments joined with per-user stats
    rows = conn.execute("""
        SELECT ug.group_name, ug.username,
               s.display_name, s.tweet_count, s.newest_tweet
        FROM user_groups ug
        LEFT JOIN (
            SELECT username,
                   MAX(display_name) as display_name,
                   COUNT(*) as tweet_count,
                   MAX(created_at) as newest_tweet
            FROM tweets GROUP BY username
        ) s ON ug.username = s.username
        ORDER BY ug.group_name, ug.username
    """).fetchall()

    # Accounts that have no group assignment
    uncategorized = conn.execute("""
        SELECT username,
               MAX(display_name) as display_name,
               COUNT(*) as tweet_count,
               MAX(created_at) as newest_tweet
        FROM tweets
        WHERE username IS NOT NULL
          AND username NOT IN (SELECT DISTINCT username FROM user_groups)
        GROUP BY username
        ORDER BY tweet_count DESC
    """).fetchall()

    conn.close()

    groups = {}
    for r in rows:
        gn = r["group_name"]
        if gn not in groups:
            groups[gn] = {"name": gn, "accounts": []}
        groups[gn]["accounts"].append({
            "username": r["username"],
            "display_name": r["display_name"],
            "tweet_count": r["tweet_count"] or 0,
            "newest_tweet": r["newest_tweet"],
        })

    return {
        "groups": list(groups.values()),
        "uncategorized": [dict(r) for r in uncategorized],
    }


def set_user_group(username, group_name):
    conn = get_db()
    conn.execute(
        "INSERT OR IGNORE INTO user_groups (username, group_name) VALUES (?, ?)",
        (username.lstrip("@"), group_name),
    )
    conn.commit()
    conn.close()


def remove_user_group(username, group_name):
    conn = get_db()
    conn.execute(
        "DELETE FROM user_groups WHERE username = ? AND group_name = ?",
        (username.lstrip("@"), group_name),
    )
    conn.commit()
    conn.close()


def delete_group(group_name):
    conn = get_db()
    conn.execute("DELETE FROM user_groups WHERE group_name = ?", (group_name,))
    conn.commit()
    conn.close()


def rename_group(old_name, new_name):
    conn = get_db()
    conn.execute(
        "UPDATE user_groups SET group_name = ? WHERE group_name = ?",
        (new_name, old_name),
    )
    conn.commit()
    conn.close()


def get_group_usernames(group_name):
    conn = get_db()
    rows = conn.execute(
        "SELECT username FROM user_groups WHERE group_name = ?", (group_name,)
    ).fetchall()
    conn.close()
    return [r["username"] for r in rows]


# ═══════════════════════════════════════
#  Facebook
# ═══════════════════════════════════════

def insert_fb_posts(posts):
    """Insert a list of Facebook post dicts. Returns {inserted, duplicates}."""
    conn = get_db()
    inserted = 0
    duplicates = 0
    now = int(datetime.utcnow().timestamp())
    for p in posts:
        try:
            cur = conn.execute("""
                INSERT OR IGNORE INTO facebook_posts
                (post_id, author_username, author_name, author_id,
                 text, created_at, created_at_ts,
                 post_type, likes, comments, shares, views,
                 post_url, media_json, raw_json, scraped_at)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            """, (
                p.get("post_id"), p.get("author_username"), p.get("author_name"),
                p.get("author_id"), p.get("text"), p.get("created_at"),
                p.get("created_at_ts"), p.get("post_type", "post"),
                p.get("likes", 0), p.get("comments", 0), p.get("shares", 0),
                p.get("views", 0), p.get("post_url"),
                json.dumps(p["media"]) if p.get("media") else None,
                json.dumps(p.get("raw")) if p.get("raw") else None,
                now,
            ))
            if cur.rowcount > 0:
                inserted += 1
            else:
                duplicates += 1
                # Backfill media on an existing row (e.g. re-scraped with images)
                if p.get("media"):
                    conn.execute(
                        "UPDATE facebook_posts SET media_json=? "
                        "WHERE post_id=? AND (media_json IS NULL OR media_json='' "
                        "OR media_json='null')",
                        (json.dumps(p["media"]), p.get("post_id")),
                    )
        except Exception as e:
            print(f"[FB] Error inserting post {p.get('post_id')}: {e}")
            duplicates += 1
    conn.commit()
    conn.close()
    return {"inserted": inserted, "duplicates": duplicates}


def search_fb_posts(query=None, username=None, start_date=None, end_date=None,
                    min_likes=None, post_type=None, limit=50, offset=0,
                    sort_by="created_at_ts", sort_order="DESC"):
    conn = get_db()
    conditions = []
    params = []

    if query:
        conditions.append("text LIKE ?")
        params.append(f"%{query}%")
    if username:
        if isinstance(username, list):
            cleaned = [u.lstrip("@") for u in username if u]
            if cleaned:
                placeholders = ",".join("?" * len(cleaned))
                conditions.append(f"author_username IN ({placeholders})")
                params.extend(cleaned)
        else:
            conditions.append("author_username = ?")
            params.append(username.lstrip("@"))
    if post_type:
        conditions.append("post_type = ?")
        params.append(post_type)
    if start_date:
        conditions.append("created_at_ts >= ?")
        params.append(int(datetime.fromisoformat(start_date).timestamp()))
    if end_date:
        conditions.append("created_at_ts <= ?")
        params.append(int(datetime.fromisoformat(end_date).timestamp()))
    if min_likes:
        conditions.append("likes >= ?")
        params.append(int(min_likes))

    where = " AND ".join(conditions) if conditions else "1=1"
    valid_sorts = {"created_at_ts", "likes", "comments", "shares", "views"}
    if sort_by not in valid_sorts:
        sort_by = "created_at_ts"
    if sort_order not in ("ASC", "DESC"):
        sort_order = "DESC"

    sql = f"SELECT * FROM facebook_posts WHERE {where} ORDER BY {sort_by} {sort_order} LIMIT ? OFFSET ?"
    params.extend([limit, offset])

    rows = conn.execute(sql, params).fetchall()
    total = conn.execute(f"SELECT COUNT(*) FROM facebook_posts WHERE {where}", params[:-2]).fetchone()[0]
    conn.close()

    return {"posts": [dict(r) for r in rows], "total": total, "limit": limit, "offset": offset}


def get_fb_stats(username=None, query=None, start_date=None, end_date=None):
    conn = get_db()

    # Build a shared filter clause so chip counts reflect the active search.
    conds, params = [], []
    if username:
        conds.append("author_username = ?")
        params.append(username.lstrip("@"))
    if query:
        conds.append("text LIKE ?")
        params.append(f"%{query}%")
    if start_date:
        conds.append("created_at_ts >= ?")
        params.append(int(datetime.fromisoformat(start_date).timestamp()))
    if end_date:
        conds.append("created_at_ts <= ?")
        params.append(int(datetime.fromisoformat(end_date).timestamp()))

    base = (" WHERE " + " AND ".join(conds)) if conds else ""
    extra = (" AND " + " AND ".join(conds)) if conds else ""

    stats = {}
    stats["total_posts"]  = conn.execute(f"SELECT COUNT(*) FROM facebook_posts{base}", params).fetchone()[0]
    stats["unique_pages"] = conn.execute(f"SELECT COUNT(DISTINCT author_username) FROM facebook_posts{base}", params).fetchone()[0]
    stats["total_photos"] = conn.execute(f"SELECT COUNT(*) FROM facebook_posts WHERE post_type='photo'{extra}", params).fetchone()[0]
    stats["total_videos"] = conn.execute(f"SELECT COUNT(*) FROM facebook_posts WHERE post_type='video'{extra}", params).fetchone()[0]

    oldest = conn.execute(f"SELECT MIN(created_at) FROM facebook_posts WHERE created_at IS NOT NULL{extra}", params).fetchone()[0]
    newest = conn.execute(f"SELECT MAX(created_at) FROM facebook_posts WHERE created_at IS NOT NULL{extra}", params).fetchone()[0]
    stats["oldest_post"] = oldest
    stats["newest_post"] = newest

    conn.close()
    return stats


def update_fb_media_json(post_id, media):
    """Overwrite the media_json for a single post (used after async image download)."""
    conn = get_db()
    conn.execute("UPDATE facebook_posts SET media_json=? WHERE post_id=?",
                 (json.dumps(media), post_id))
    conn.commit()
    conn.close()


def update_tweet_media_json(tweet_id, media):
    """Overwrite media_json for a single tweet (after async image download)."""
    conn = get_db()
    conn.execute("UPDATE tweets SET media_json=? WHERE id=?",
                 (json.dumps(media), str(tweet_id)))
    conn.commit()
    conn.close()


def get_fb_post_ids(page_name):
    """Return the set of post_ids already saved for a page (for resume logic)."""
    conn = get_db()
    rows = conn.execute(
        "SELECT post_id FROM facebook_posts WHERE author_username = ?",
        (page_name.lstrip("@"),),
    ).fetchall()
    conn.close()
    return {r[0] for r in rows}


def get_fb_users():
    conn = get_db()
    rows = conn.execute("""
        SELECT f.author_username, MAX(f.author_name) as author_name,
               COUNT(*) as post_count,
               MIN(f.created_at) as oldest_post,
               MAX(f.created_at) as newest_post,
               sp.status as scrape_status
        FROM facebook_posts f
        LEFT JOIN scrape_progress sp ON sp.key = 'fb_' || f.author_username
        WHERE f.author_username IS NOT NULL
        GROUP BY f.author_username
        ORDER BY post_count DESC
    """).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def export_fb_posts(username=None, limit=None):
    conn = get_db()
    conditions = []
    params = []
    if username:
        conditions.append("author_username = ?")
        params.append(username.lstrip("@"))
    where = " AND ".join(conditions) if conditions else "1=1"
    sql = f"SELECT * FROM facebook_posts WHERE {where} ORDER BY created_at_ts DESC"
    if limit:
        sql += " LIMIT ?"; params.append(limit)
    rows = conn.execute(sql, params).fetchall()
    conn.close()
    return [dict(r) for r in rows]


# ── Facebook Groups ──

def get_fb_groups():
    conn = get_db()
    rows = conn.execute("""
        SELECT fg.group_name, fg.username,
               s.author_name, s.post_count, s.newest_post
        FROM facebook_groups fg
        LEFT JOIN (
            SELECT author_username,
                   MAX(author_name) as author_name,
                   COUNT(*) as post_count,
                   MAX(created_at) as newest_post
            FROM facebook_posts GROUP BY author_username
        ) s ON fg.username = s.author_username
        ORDER BY fg.group_name, fg.username
    """).fetchall()

    uncategorized = conn.execute("""
        SELECT author_username,
               MAX(author_name) as author_name,
               COUNT(*) as post_count,
               MAX(created_at) as newest_post
        FROM facebook_posts
        WHERE author_username IS NOT NULL
          AND author_username NOT IN (SELECT DISTINCT username FROM facebook_groups)
        GROUP BY author_username
        ORDER BY post_count DESC
    """).fetchall()

    conn.close()

    groups = {}
    for r in rows:
        gn = r["group_name"]
        if gn not in groups:
            groups[gn] = {"name": gn, "accounts": []}
        groups[gn]["accounts"].append({
            "username": r["username"], "author_name": r["author_name"],
            "post_count": r["post_count"] or 0, "newest_post": r["newest_post"],
        })

    return {
        "groups": list(groups.values()),
        "uncategorized": [dict(r) for r in uncategorized],
    }


def set_fb_user_group(username, group_name):
    conn = get_db()
    conn.execute("INSERT OR IGNORE INTO facebook_groups (username, group_name) VALUES (?, ?)",
                 (username.lstrip("@"), group_name))
    conn.commit(); conn.close()


def remove_fb_user_group(username, group_name):
    conn = get_db()
    conn.execute("DELETE FROM facebook_groups WHERE username = ? AND group_name = ?",
                 (username.lstrip("@"), group_name))
    conn.commit(); conn.close()


def delete_fb_group(group_name):
    conn = get_db()
    conn.execute("DELETE FROM facebook_groups WHERE group_name = ?", (group_name,))
    conn.commit(); conn.close()


def rename_fb_group(old_name, new_name):
    conn = get_db()
    conn.execute("UPDATE facebook_groups SET group_name = ? WHERE group_name = ?", (new_name, old_name))
    conn.commit(); conn.close()


def get_fb_group_usernames(group_name):
    conn = get_db()
    rows = conn.execute("SELECT username FROM facebook_groups WHERE group_name = ?", (group_name,)).fetchall()
    conn.close()
    return [r["username"] for r in rows]


# Initialize DB on import
init_db()
