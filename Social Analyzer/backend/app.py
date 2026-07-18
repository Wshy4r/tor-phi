"""
Social Analyzer - Twitter & Facebook scraper and archive.
No extension needed. Just provide your auth cookies.
"""

import json
import csv
import io
import re
import threading
from datetime import date, datetime
from flask import Flask, request, jsonify, Response, render_template_string
from flask_cors import CORS
from database import (insert_tweets, detect_threads, search_tweets, get_stats,
                       export_tweets, get_thread, get_threads_for_user, get_db,
                       get_progress, save_progress,
                       get_groups, set_user_group, remove_user_group,
                       delete_group, rename_group, get_group_usernames,
                       insert_fb_posts, search_fb_posts, get_fb_stats, get_fb_users,
                       export_fb_posts, get_fb_groups, set_fb_user_group,
                       remove_fb_user_group, delete_fb_group, rename_fb_group,
                       get_fb_group_usernames)
from scraper import scraper
from facebook_scraper import fb_scraper, AuthRequiredError

app = Flask(__name__)
CORS(app)

# ── Active scrape jobs ──
active_jobs = {}


def add_months(dt, months):
    """Add or subtract whole months from a date."""
    month_index = dt.month - 1 + months
    year = dt.year + month_index // 12
    month = month_index % 12 + 1
    return date(year, month, 1)


def previous_month_windows(years):
    """Return month-sized windows covering full calendar years before the current year."""
    total_months = max(1, years) * 12
    end = date(date.today().year, 1, 1)
    windows = []
    for _ in range(total_months):
        start = add_months(end, -1)
        windows.append((start, end))
        end = start
    return windows


def parse_max_pages(value, hard_limit):
    """Allow blank page limits, which means run until cancelled or exhausted."""
    if value in (None, "", "null"):
        return None
    try:
        return min(max(int(value), 1), hard_limit)
    except (ValueError, TypeError):
        return None


# ══════════════════════════════════════
#  API ENDPOINTS
# ══════════════════════════════════════

@app.route("/api/health", methods=["GET"])
def health():
    stats = get_stats()
    result = {
        "status": "ok",
        "authenticated": scraper.is_authenticated(),
        "total_tweets": stats["total_tweets"],
        "unique_users": stats["unique_users"],
    }
    if scraper.is_authenticated():
        me = scraper.get_me()
        if me:
            result["user"] = me
    return jsonify(result)


@app.route("/api/setup", methods=["POST"])
def setup_auth():
    """Set auth cookies. Send ct0 and auth_token."""
    data = request.get_json()
    ct0 = data.get("ct0", "").strip()
    auth_token = data.get("auth_token", "").strip()

    if not ct0 or not auth_token:
        return jsonify({"error": "Both ct0 and auth_token are required"}), 400

    scraper.save_config(ct0, auth_token)
    return jsonify({"status": "ok", "message": "Auth configured successfully"})


@app.route("/api/setup/json", methods=["POST"])
def setup_auth_json():
    """Import auth from a JSON cookie export (EditThisCookie, cookie-editor, etc.)."""
    data = request.get_json()
    cookies = data if isinstance(data, list) else data.get("cookies", data)

    ct0 = None
    auth_token = None

    if isinstance(cookies, list):
        # Array of cookie objects: [{name, value, domain, ...}, ...]
        for c in cookies:
            name = c.get("name", "")
            value = c.get("value", "")
            if name == "ct0":
                ct0 = value
            elif name == "auth_token":
                auth_token = value
    elif isinstance(cookies, dict):
        # Simple {name: value} map or nested object
        ct0 = cookies.get("ct0")
        auth_token = cookies.get("auth_token")

    if not ct0 or not auth_token:
        return jsonify({
            "error": "Could not find ct0 and auth_token in the JSON. "
                     "Make sure you export cookies from x.com that include these two."
        }), 400

    scraper.save_config(ct0, auth_token)
    return jsonify({"status": "ok", "message": "Auth imported from JSON successfully"})


@app.route("/api/scrape/user", methods=["POST"])
def scrape_user():
    """Start scraping a user's tweets. Runs in background."""
    if not scraper.is_authenticated():
        return jsonify({"error": "Not authenticated. POST to /api/setup first."}), 401

    data = request.get_json()
    username = data.get("username", "").lstrip("@").strip()
    max_pages = parse_max_pages(data.get("max_pages"), 1000)
    include_replies = data.get("include_replies", False)

    if not username:
        return jsonify({"error": "Username required"}), 400

    job_id = f"user_{username}"
    if job_id in active_jobs and active_jobs[job_id].get("status") == "running":
        return jsonify({"error": f"Already scraping @{username}"}), 409

    active_jobs[job_id] = {"status": "running", "username": username, "progress": {}, "cancel": False, "type": "user", "label": f"@{username}" + (" +replies" if include_replies else "")}

    def run():
        def callback(progress):
            active_jobs[job_id]["progress"] = progress
            if active_jobs[job_id].get("cancel"):
                raise Exception("Cancelled by user")

        try:
            result = scraper.scrape_user_tweets(
                username,
                max_pages,
                callback,
                include_replies=include_replies,
                cancel_check=lambda: active_jobs[job_id].get("cancel", False),
            )
            if active_jobs[job_id].get("cancel"):
                active_jobs[job_id]["status"] = "cancelled"
            else:
                active_jobs[job_id]["status"] = "complete"
                active_jobs[job_id]["result"] = result
        except Exception as e:
            if "Cancelled" in str(e):
                active_jobs[job_id]["status"] = "cancelled"
            else:
                active_jobs[job_id]["status"] = "error"
                active_jobs[job_id]["error"] = str(e)

    thread = threading.Thread(target=run, daemon=True)
    thread.start()

    return jsonify({"status": "started", "job_id": job_id, "username": username})


@app.route("/api/scrape/search", methods=["POST"])
def scrape_search():
    """Start scraping tweets matching a search query."""
    if not scraper.is_authenticated():
        return jsonify({"error": "Not authenticated"}), 401

    data = request.get_json()
    query = data.get("query", "").strip()
    max_pages = parse_max_pages(data.get("max_pages"), 500)

    if not query:
        return jsonify({"error": "Query required"}), 400

    job_id = f"search_{hash(query)}"
    if job_id in active_jobs and active_jobs[job_id].get("status") == "running":
        return jsonify({"error": f"Already searching for that query"}), 409

    active_jobs[job_id] = {"status": "running", "query": query, "progress": {}, "cancel": False, "type": "search", "label": f'Search: "{query}"'}

    def run():
        def callback(progress):
            active_jobs[job_id]["progress"] = progress
            if active_jobs[job_id].get("cancel"):
                raise Exception("Cancelled by user")

        try:
            result = scraper.scrape_search(
                query,
                max_pages,
                callback,
                cancel_check=lambda: active_jobs[job_id].get("cancel", False),
            )
            if active_jobs[job_id].get("cancel"):
                active_jobs[job_id]["status"] = "cancelled"
            else:
                active_jobs[job_id]["status"] = "complete"
                active_jobs[job_id]["result"] = result
        except Exception as e:
            if "Cancelled" in str(e):
                active_jobs[job_id]["status"] = "cancelled"
            else:
                active_jobs[job_id]["status"] = "error"
                active_jobs[job_id]["error"] = str(e)

    thread = threading.Thread(target=run, daemon=True)
    thread.start()

    return jsonify({"status": "started", "job_id": job_id})


@app.route("/api/scrape/backfill/user", methods=["POST"])
def scrape_user_backfill():
    """Backfill older tweets via month-by-month search windows."""
    if not scraper.is_authenticated():
        return jsonify({"error": "Not authenticated"}), 401

    data = request.get_json()
    username = data.get("username", "").lstrip("@").strip()
    years = min(max(int(data.get("years", 2)), 1), 10)
    max_pages = min(max(int(data.get("max_pages", 15)), 1), 100)

    if not username:
        return jsonify({"error": "Username required"}), 400

    job_id = f"backfill_{username}"
    if job_id in active_jobs and active_jobs[job_id].get("status") == "running":
        return jsonify({"error": f"Already backfilling @{username}"}), 409

    windows = previous_month_windows(years)
    active_jobs[job_id] = {
        "status": "running",
        "username": username,
        "progress": {},
        "cancel": False,
        "type": "backfill",
        "label": f"Backfill: @{username} ({years}y)",
    }

    def run():
        total_new = 0
        consecutive_empty = 0
        windows_skipped = 0
        EMPTY_STOP = 4  # Stop after 4 consecutive empty months (search index boundary)

        try:
            for idx, (start_dt, end_dt) in enumerate(windows):
                if active_jobs[job_id].get("cancel"):
                    raise Exception("Cancelled by user")

                label = f"{start_dt.strftime('%Y-%m')}"
                window_key = f"backfill_{username}_{label}"
                query = f"from:{username} since:{start_dt.isoformat()} until:{end_dt.isoformat()}"

                # Skip windows completed in a previous run
                prev = get_progress(window_key)
                if prev and prev["status"] == "complete":
                    windows_skipped += 1
                    if prev.get("tweets_saved", 0) == 0:
                        consecutive_empty += 1
                    else:
                        consecutive_empty = 0
                    active_jobs[job_id]["progress"] = {
                        "window_index": idx + 1, "window_total": len(windows),
                        "window_label": label, "total_new": total_new,
                        "message": f"Window {idx+1}/{len(windows)} ({label}) · already done, skipping",
                        "status": "running",
                    }
                    if consecutive_empty >= EMPTY_STOP:
                        break
                    continue

                def callback(progress):
                    merged = dict(progress or {})
                    merged["window_index"] = idx + 1
                    merged["window_total"] = len(windows)
                    merged["window_label"] = label
                    merged["query"] = query
                    merged["total_new"] = total_new + int(progress.get("total_new", 0) or 0)

                    if merged.get("status") == "rate_limited":
                        wait = merged.get("wait_seconds")
                        merged["message"] = (
                            f"Window {idx + 1}/{len(windows)} ({label}) · "
                            f"rate limited, waiting about {wait}s"
                        )
                    elif merged.get("status") == "starting":
                        merged["message"] = f"Window {idx + 1}/{len(windows)} ({label}) · starting"
                    else:
                        merged["message"] = (
                            f"Window {idx + 1}/{len(windows)} ({label}) · "
                            f"page {merged.get('page', 0)} · "
                            f"{merged['total_new']} tweets captured"
                        )

                    active_jobs[job_id]["progress"] = merged
                    if active_jobs[job_id].get("cancel"):
                        raise Exception("Cancelled by user")

                result = scraper.scrape_search(
                    query,
                    max_pages=max_pages,
                    callback=callback,
                    cancel_check=lambda: active_jobs[job_id].get("cancel", False),
                    run_thread_detection=False,
                )
                window_new = result.get("new_tweets", 0)
                total_new += window_new

                # Record this window as done so future runs can skip it
                save_progress(window_key, username, "backfill_window", None, 1, window_new, "complete")

                if window_new == 0:
                    consecutive_empty += 1
                else:
                    consecutive_empty = 0

                stop_early = consecutive_empty >= EMPTY_STOP
                active_jobs[job_id]["progress"] = {
                    "window_index": idx + 1, "window_total": len(windows),
                    "window_label": label, "total_new": total_new,
                    "message": (
                        f"Stopped early — {consecutive_empty} empty months in a row (reached search index limit)"
                        if stop_early else
                        f"Window {idx+1}/{len(windows)} ({label}) · +{window_new} new · {total_new} total"
                    ),
                    "status": "running",
                }
                if stop_early:
                    break

                scraper._sleep_with_cancel(3, lambda: active_jobs[job_id].get("cancel", False))

            if active_jobs[job_id].get("cancel"):
                active_jobs[job_id]["status"] = "cancelled"
            else:
                detect_threads()
                active_jobs[job_id]["status"] = "complete"
                active_jobs[job_id]["result"] = {
                    "username": username,
                    "new_tweets": total_new,
                    "windows": len(windows),
                    "windows_skipped": windows_skipped,
                }
        except Exception as e:
            if "Cancelled" in str(e):
                active_jobs[job_id]["status"] = "cancelled"
            else:
                active_jobs[job_id]["status"] = "error"
                active_jobs[job_id]["error"] = str(e)

    thread = threading.Thread(target=run, daemon=True)
    thread.start()

    return jsonify({"status": "started", "job_id": job_id, "username": username, "years": years})


@app.route("/api/scrape/likes", methods=["POST"])
def scrape_likes():
    """Start scraping a user's liked tweets."""
    if not scraper.is_authenticated():
        return jsonify({"error": "Not authenticated"}), 401

    data = request.get_json()
    username = data.get("username", "").lstrip("@").strip()
    max_pages = parse_max_pages(data.get("max_pages"), 500)

    if not username:
        return jsonify({"error": "Username required"}), 400

    job_id = f"likes_{username}"
    if job_id in active_jobs and active_jobs[job_id].get("status") == "running":
        return jsonify({"error": f"Already scraping likes for @{username}"}), 409

    active_jobs[job_id] = {"status": "running", "username": username, "progress": {}, "cancel": False, "type": "likes", "label": f"Likes: @{username}"}

    def run():
        def callback(progress):
            active_jobs[job_id]["progress"] = progress
            if active_jobs[job_id].get("cancel"):
                raise Exception("Cancelled by user")

        try:
            result = scraper.scrape_likes(
                username,
                max_pages,
                callback,
                cancel_check=lambda: active_jobs[job_id].get("cancel", False),
            )
            if active_jobs[job_id].get("cancel"):
                active_jobs[job_id]["status"] = "cancelled"
            else:
                active_jobs[job_id]["status"] = "complete"
                active_jobs[job_id]["result"] = result
        except Exception as e:
            if "Cancelled" in str(e):
                active_jobs[job_id]["status"] = "cancelled"
            else:
                active_jobs[job_id]["status"] = "error"
                active_jobs[job_id]["error"] = str(e)

    thread = threading.Thread(target=run, daemon=True)
    thread.start()

    return jsonify({"status": "started", "job_id": job_id})


@app.route("/api/scrape/cancel/<job_id>", methods=["POST"])
def cancel_scrape(job_id):
    """Cancel a running scrape job."""
    job = active_jobs.get(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404
    if job.get("status") != "running":
        return jsonify({"error": f"Job is not running (status: {job.get('status')})"}), 400
    job["cancel"] = True
    job["status"] = "cancelled"
    return jsonify({"status": "cancelled", "job_id": job_id})


@app.route("/api/scrape/job/<job_id>", methods=["DELETE"])
def delete_job(job_id):
    """Remove a finished job from active_jobs."""
    job = active_jobs.get(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404
    if job.get("status") == "running":
        return jsonify({"error": "Cannot delete a running job. Cancel it first."}), 400
    del active_jobs[job_id]
    return jsonify({"status": "deleted", "job_id": job_id})


@app.route("/api/scrape/clear", methods=["POST"])
def clear_finished_jobs():
    """Remove completed/cancelled/error jobs from active_jobs."""
    to_remove = [k for k, v in active_jobs.items() if v.get("status") in ("complete", "cancelled", "error")]
    for k in to_remove:
        del active_jobs[k]
    return jsonify({"cleared": len(to_remove)})


@app.route("/api/scrape/status", methods=["GET"])
def scrape_status():
    """Get status of all scrape jobs."""
    return jsonify(active_jobs)


@app.route("/api/scrape/status/<job_id>", methods=["GET"])
def scrape_job_status(job_id):
    """Get status of a specific scrape job."""
    job = active_jobs.get(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404
    return jsonify(job)


# ── Tweet query endpoints (also used by extension) ──

@app.route("/api/tweets", methods=["POST"])
def receive_tweets():
    """Receive tweets from the browser extension."""
    data = request.get_json()
    if not data or "tweets" not in data:
        return jsonify({"error": "No tweets provided"}), 400

    result = insert_tweets(data["tweets"], data.get("source", {}))
    if result["inserted"] > 0:
        detect_threads()
    return jsonify({
        "status": "ok",
        "inserted": result["inserted"],
        "duplicates": result["duplicates"],
    })


@app.route("/api/tweets", methods=["GET"])
def query_tweets():
    # Support comma-separated usernames for multi-select
    raw_username = request.args.get("username")
    if raw_username and "," in raw_username:
        username = [u.strip() for u in raw_username.split(",") if u.strip()]
    else:
        username = raw_username

    params = {
        "query": request.args.get("q"),
        "username": username,
        "start_date": request.args.get("start_date"),
        "end_date": request.args.get("end_date"),
        "min_likes": request.args.get("min_likes"),
        "has_media": request.args.get("has_media", "").lower() == "true",
        "language": request.args.get("language"),
        "tweet_type": request.args.get("tweet_type"),
        "limit": min(int(request.args.get("limit", 50)), 500),
        "offset": int(request.args.get("offset", 0)),
        "sort_by": request.args.get("sort_by", "created_at_ts"),
        "sort_order": request.args.get("sort_order", "DESC"),
    }

    result = search_tweets(**params)
    _parse_json_fields(result["tweets"])
    return jsonify(result)


@app.route("/api/stats", methods=["GET"])
def stats():
    username = request.args.get("username", "").lstrip("@").strip() or None
    return jsonify(get_stats(username=username))


@app.route("/api/export", methods=["GET"])
def export():
    fmt = request.args.get("format", "json")
    username = request.args.get("username")
    limit = int(request.args.get("limit")) if request.args.get("limit") else None

    tweets = export_tweets(format=fmt, username=username, limit=limit)

    if fmt == "csv":
        output = io.StringIO()
        if tweets:
            fields = ["id", "text", "created_at", "username", "display_name",
                       "like_count", "retweet_count", "reply_count", "view_count",
                       "language", "is_retweet", "is_reply"]
            writer = csv.DictWriter(output, fieldnames=fields, extrasaction="ignore")
            writer.writeheader()
            writer.writerows(tweets)

        return Response(
            output.getvalue(),
            mimetype="text/csv",
            headers={"Content-Disposition": "attachment; filename=tweets.csv"},
        )
    else:
        _parse_json_fields(tweets)
        return Response(
            json.dumps(tweets, indent=2, ensure_ascii=False),
            mimetype="application/json",
            headers={"Content-Disposition": "attachment; filename=tweets.json"},
        )


def _clean_tweet_text(text):
    if not text:
        return ""
    text = re.sub(r'^RT @\w+:\s*', '', text)        # strip retweet prefix
    text = re.sub(r'https?://t\.co/\S+', '', text)  # strip t.co short-links
    text = re.sub(r'pic\.twitter\.com/\S+', '', text)
    text = re.sub(r'[ \t]+', ' ', text).strip()
    return text


def _get_ai_blocks(username, include_replies=False, include_retweets=False,
                   min_likes=0, start_date=None, end_date=None, include_dates=True):
    """Fetch and format tweets for a single user as clean AI-ready text blocks."""
    conn = get_db()
    conditions = ["username = ?"]
    params = [username]
    if not include_retweets:
        conditions.append("tweet_type != 'retweet'")
    if not include_replies:
        conditions.append("tweet_type IN ('tweet', 'thread')")
    if min_likes > 0:
        conditions.append("like_count >= ?")
        params.append(min_likes)
    if start_date:
        conditions.append("created_at_ts >= ?")
        params.append(int(datetime.fromisoformat(start_date).timestamp()))
    if end_date:
        conditions.append("created_at_ts <= ?")
        params.append(int(datetime.fromisoformat(end_date).timestamp()))

    where = " AND ".join(conditions)
    rows = conn.execute(f"""
        SELECT text, created_at_ts, tweet_type, thread_id, thread_position
        FROM tweets WHERE {where} ORDER BY created_at_ts ASC
    """, params).fetchall()
    conn.close()

    seen_threads = set()
    blocks = []
    for tweet in [dict(r) for r in rows]:
        thread_id = tweet.get("thread_id")
        ts = tweet.get("created_at_ts")
        date_str = datetime.utcfromtimestamp(ts).strftime("%Y-%m-%d") if ts else ""
        prefix = f"[{date_str}] " if include_dates and date_str else ""

        if thread_id:
            if thread_id in seen_threads:
                continue
            seen_threads.add(thread_id)
            parts = [_clean_tweet_text(t.get("text", "")) for t in get_thread(thread_id)]
            parts = [p for p in parts if p]
            if parts:
                blocks.append(prefix + " ".join(parts))
            continue

        text = _clean_tweet_text(tweet.get("text", ""))
        if text:
            blocks.append(prefix + text)

    return blocks


@app.route("/api/export/ai", methods=["GET"])
def export_ai():
    username = request.args.get("username", "").lstrip("@").strip()
    if not username:
        return jsonify({"error": "Username required"}), 400

    include_replies   = request.args.get("include_replies", "false").lower() == "true"
    include_retweets  = request.args.get("include_retweets", "false").lower() == "true"
    min_likes         = int(request.args.get("min_likes") or 0)
    include_dates     = request.args.get("include_dates", "true").lower() != "false"
    start_date        = request.args.get("start_date")
    end_date          = request.args.get("end_date")

    blocks = _get_ai_blocks(username, include_replies, include_retweets,
                            min_likes, start_date, end_date, include_dates)

    filters = []
    if not include_retweets: filters.append("no retweets")
    if not include_replies:  filters.append("no replies")
    if min_likes > 0:        filters.append(f"min {min_likes} likes")

    header = (
        f"# Tweets by @{username}\n"
        f"# {len(blocks)} entries | {', '.join(filters) if filters else 'all tweets'}\n#\n"
        f"# Tweets and threads from @{username}. Threads are single paragraphs.\n"
        f"# Use this to understand the person's ideas and patterns of thought.\n\n---\n\n"
    )
    return Response(header + "\n\n".join(blocks), mimetype="text/plain; charset=utf-8",
                    headers={"Content-Disposition": f"attachment; filename={username}_ai_export.txt"})


# ── Group endpoints ──

@app.route("/api/groups", methods=["GET"])
def list_groups():
    return jsonify(get_groups())


@app.route("/api/groups", methods=["POST"])
def create_group():
    data = request.get_json()
    name = (data.get("name") or "").strip()
    if not name:
        return jsonify({"error": "Group name required"}), 400
    # Insert a placeholder so the group exists even with no accounts yet
    # (we just return success; accounts are added separately)
    return jsonify({"status": "ok", "name": name})


@app.route("/api/groups/<group_name>", methods=["DELETE"])
def api_delete_group(group_name):
    delete_group(group_name)
    return jsonify({"status": "ok"})


@app.route("/api/groups/<group_name>", methods=["PATCH"])
def api_rename_group(group_name):
    data = request.get_json()
    new_name = (data.get("name") or "").strip()
    if not new_name:
        return jsonify({"error": "New name required"}), 400
    rename_group(group_name, new_name)
    return jsonify({"status": "ok", "name": new_name})


@app.route("/api/groups/<group_name>/accounts", methods=["POST"])
def api_add_to_group(group_name):
    data = request.get_json()
    username = (data.get("username") or "").lstrip("@").strip()
    if not username:
        return jsonify({"error": "Username required"}), 400
    set_user_group(username, group_name)
    return jsonify({"status": "ok"})


@app.route("/api/groups/<group_name>/accounts/<username>", methods=["DELETE"])
def api_remove_from_group(group_name, username):
    remove_user_group(username, group_name)
    return jsonify({"status": "ok"})


@app.route("/api/export/ai/group/<group_name>", methods=["GET"])
def export_ai_group(group_name):
    usernames = get_group_usernames(group_name)
    if not usernames:
        return jsonify({"error": "Group not found or empty"}), 404

    include_replies   = request.args.get("include_replies", "false").lower() == "true"
    include_retweets  = request.args.get("include_retweets", "false").lower() == "true"
    min_likes         = int(request.args.get("min_likes") or 0)
    include_dates     = request.args.get("include_dates", "true").lower() != "false"

    filters = []
    if not include_retweets: filters.append("no retweets")
    if not include_replies:  filters.append("no replies")
    if min_likes > 0:        filters.append(f"min {min_likes} likes")
    filter_str = ", ".join(filters) if filters else "all tweets"

    sections = []
    total = 0
    for uname in usernames:
        blocks = _get_ai_blocks(uname, include_replies, include_retweets,
                                min_likes, None, None, include_dates)
        total += len(blocks)
        if blocks:
            sections.append(f"## @{uname} ({len(blocks)} entries)\n\n" + "\n\n".join(blocks))

    header = (
        f"# Group: {group_name}\n"
        f"# {len(usernames)} accounts | {total} total entries | {filter_str}\n#\n"
        f"# Tweets from each person in this group. Threads are single paragraphs.\n"
        f"# Use this to understand their collective ideas and perspectives.\n\n---\n\n"
    )
    safe_name = re.sub(r'[^\w\-]', '_', group_name)
    return Response(header + "\n\n---\n\n".join(sections),
                    mimetype="text/plain; charset=utf-8",
                    headers={"Content-Disposition": f"attachment; filename={safe_name}_group_ai_export.txt"})


@app.route("/api/users", methods=["GET"])
def list_users():
    conn = get_db()
    rows = conn.execute("""
        SELECT username, display_name, user_id,
               COUNT(*) as tweet_count,
               MIN(created_at) as oldest_tweet,
               MAX(created_at) as newest_tweet
        FROM tweets
        WHERE username IS NOT NULL
        GROUP BY username
        ORDER BY tweet_count DESC
    """).fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])


@app.route("/api/timeline/<username>", methods=["GET"])
def user_timeline(username):
    result = search_tweets(
        username=username,
        limit=min(int(request.args.get("limit", 100)), 500),
        offset=int(request.args.get("offset", 0)),
        sort_by="created_at_ts",
        sort_order=request.args.get("order", "DESC"),
    )
    _parse_json_fields(result["tweets"])
    return jsonify(result)


@app.route("/api/thread/<thread_id>", methods=["GET"])
def get_thread_endpoint(thread_id):
    """Get all tweets in a thread, ordered by position."""
    tweets = get_thread(thread_id)
    _parse_json_fields(tweets)
    return jsonify({"tweets": tweets, "total": len(tweets), "thread_id": thread_id})


@app.route("/api/threads/user/<username>", methods=["GET"])
def get_user_threads(username):
    """Get all threads started by a user."""
    limit = min(int(request.args.get("limit", 20)), 100)
    offset = int(request.args.get("offset", 0))
    result = get_threads_for_user(username, limit, offset)
    return jsonify(result)


def _parse_json_fields(tweets):
    for tweet in tweets:
        for field in ("media_json", "urls_json", "quoted_tweet_json", "raw_json"):
            if tweet.get(field):
                try:
                    tweet[field] = json.loads(tweet[field])
                except (json.JSONDecodeError, TypeError):
                    pass


# ══════════════════════════════════════
#  FACEBOOK API
# ══════════════════════════════════════

@app.route("/api/fb/health", methods=["GET"])
def fb_health():
    stats = get_fb_stats()
    result = {
        "status": "ok",
        "authenticated": fb_scraper.is_authenticated(),
        "total_posts": stats["total_posts"],
        "unique_pages": stats["unique_pages"],
    }
    if fb_scraper.is_authenticated():
        me = fb_scraper.get_me()
        if me:
            result["user"] = me
    return jsonify(result)


@app.route("/api/fb/setup", methods=["POST"])
def fb_setup_auth():
    data = request.get_json()
    c_user = data.get("c_user", "").strip()
    xs = data.get("xs", "").strip()
    if not c_user or not xs:
        return jsonify({"error": "Both c_user and xs are required"}), 400
    fb_scraper.save_config({"c_user": c_user, "xs": xs})
    return jsonify({"status": "ok", "message": "Facebook auth configured"})


@app.route("/api/fb/setup/json", methods=["POST"])
def fb_setup_json():
    data = request.get_json()
    cookies = data if isinstance(data, list) else data.get("cookies", data)
    try:
        if isinstance(cookies, list):
            fb_scraper.save_config_from_list(cookies)
        elif isinstance(cookies, dict):
            if not cookies.get("c_user") or not cookies.get("xs"):
                raise ValueError("Could not find c_user and xs in the JSON.")
            fb_scraper.save_config(cookies)
        else:
            raise ValueError("Expected a JSON array or object of cookies.")
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    return jsonify({"status": "ok", "message": "Facebook auth imported successfully"})


@app.route("/api/fb/setup/browser-login", methods=["POST"])
def fb_browser_login():
    """Open a visible browser window so the user can log in independently."""
    job_id = "fb_browser_login"
    if job_id in active_jobs and active_jobs[job_id].get("status") == "running":
        return jsonify({"error": "Login already in progress"}), 409

    active_jobs[job_id] = {
        "status": "running", "progress": {}, "cancel": False,
        "type": "fb_login", "label": "FB: Browser Login", "platform": "facebook",
    }

    def run():
        def callback(progress):
            active_jobs[job_id]["progress"] = progress
        try:
            fb_scraper.setup_session_via_browser(callback)
            active_jobs[job_id]["status"] = "complete"
            active_jobs[job_id]["result"] = {"message": "Session saved — you can now log out of your browser."}
        except Exception as e:
            active_jobs[job_id]["status"] = "error"
            active_jobs[job_id]["error"] = str(e)

    threading.Thread(target=run, daemon=True).start()
    return jsonify({"status": "started", "job_id": job_id})


@app.route("/api/fb/scrape/page", methods=["POST"])
def fb_scrape_page():
    data = request.get_json()
    page_name = data.get("page_name", "").strip().lstrip("@")
    max_pages = parse_max_pages(data.get("max_pages"), 200)
    download_images = bool(data.get("download_images", True))

    if not page_name:
        return jsonify({"error": "Page name required"}), 400

    job_id = f"fb_page_{page_name}"
    if job_id in active_jobs and active_jobs[job_id].get("status") == "running":
        return jsonify({"error": f"Already scraping {page_name}"}), 409

    label = f"FB: {page_name}" + (" +images" if download_images else "")
    active_jobs[job_id] = {
        "status": "running", "username": page_name, "progress": {}, "cancel": False,
        "type": "fb_page", "label": label, "platform": "facebook",
    }

    def run():
        def callback(progress):
            active_jobs[job_id]["progress"] = progress
            if active_jobs[job_id].get("cancel"):
                raise Exception("Cancelled by user")
        try:
            # Reliable headless auto-scroll (runs in the background)
            result = fb_scraper.scrape_page_manual(
                page_name,
                callback=callback,
                cancel_check=lambda: active_jobs[job_id].get("cancel", False),
                headless=True,
                download_images=download_images,
            )
            if active_jobs[job_id].get("cancel"):
                active_jobs[job_id]["status"] = "cancelled"
            else:
                active_jobs[job_id]["status"] = "complete"
                active_jobs[job_id]["result"] = result
        except AuthRequiredError as e:
            active_jobs[job_id]["status"] = "error"
            active_jobs[job_id]["error"] = str(e)
            active_jobs[job_id]["auth_required"] = True
        except Exception as e:
            if "Cancelled" in str(e):
                active_jobs[job_id]["status"] = "cancelled"
            else:
                active_jobs[job_id]["status"] = "error"
                active_jobs[job_id]["error"] = str(e)

    threading.Thread(target=run, daemon=True).start()
    return jsonify({"status": "started", "job_id": job_id, "page_name": page_name})


@app.route("/api/fb/scrape/manual", methods=["POST"])
def fb_scrape_manual():
    """Open a visible browser for manual scrolling on a Facebook page."""
    data = request.get_json()
    page_name = data.get("page_name", "").strip().lstrip("@")

    if not page_name:
        return jsonify({"error": "Page name required"}), 400

    job_id = f"fb_manual_{page_name}"
    if job_id in active_jobs and active_jobs[job_id].get("status") == "running":
        return jsonify({"error": f"Already running manual session for {page_name}"}), 409

    active_jobs[job_id] = {
        "status": "running", "username": page_name, "progress": {}, "cancel": False,
        "type": "fb_manual", "label": f"FB Visible: {page_name}", "platform": "facebook",
    }

    def run():
        def callback(progress):
            active_jobs[job_id]["progress"] = progress
        try:
            result = fb_scraper.scrape_page_manual(
                page_name,
                callback=callback,
                cancel_check=lambda: active_jobs[job_id].get("cancel", False),
                headless=False,   # visible window for this endpoint
            )
            if active_jobs[job_id].get("cancel"):
                active_jobs[job_id]["status"] = "cancelled"
            else:
                active_jobs[job_id]["status"] = "complete"
                active_jobs[job_id]["result"] = result
        except AuthRequiredError as e:
            active_jobs[job_id]["status"] = "error"
            active_jobs[job_id]["error"] = str(e)
            active_jobs[job_id]["auth_required"] = True
        except Exception as e:
            active_jobs[job_id]["status"] = "error"
            active_jobs[job_id]["error"] = str(e)

    threading.Thread(target=run, daemon=True).start()
    return jsonify({"status": "started", "job_id": job_id, "page_name": page_name})


@app.route("/api/fb/posts", methods=["GET"])
def fb_query_posts():
    raw_username = request.args.get("username")
    if raw_username and "," in raw_username:
        username = [u.strip() for u in raw_username.split(",") if u.strip()]
    else:
        username = raw_username

    params = {
        "query": request.args.get("q"),
        "username": username,
        "start_date": request.args.get("start_date"),
        "end_date": request.args.get("end_date"),
        "min_likes": request.args.get("min_likes"),
        "post_type": request.args.get("post_type"),
        "limit": min(int(request.args.get("limit", 50)), 500),
        "offset": int(request.args.get("offset", 0)),
        "sort_by": request.args.get("sort_by", "created_at_ts"),
        "sort_order": request.args.get("sort_order", "DESC"),
    }
    result = search_fb_posts(**params)
    for post in result.get("posts", []):
        if post.get("media_json"):
            try:
                post["media"] = json.loads(post["media_json"])
            except (json.JSONDecodeError, TypeError):
                post["media"] = []
        else:
            post["media"] = []
    return jsonify(result)


@app.route("/api/fb/stats", methods=["GET"])
def fb_stats():
    username = request.args.get("username", "").lstrip("@").strip() or None
    return jsonify(get_fb_stats(
        username=username,
        query=request.args.get("q") or None,
        start_date=request.args.get("start_date") or None,
        end_date=request.args.get("end_date") or None,
    ))


@app.route("/api/fb/users", methods=["GET"])
def fb_list_users():
    return jsonify(get_fb_users())


@app.route("/api/fb/export", methods=["GET"])
def fb_export():
    fmt = request.args.get("format", "json")
    username = request.args.get("username")
    limit = int(request.args.get("limit")) if request.args.get("limit") else None
    posts = export_fb_posts(username=username, limit=limit)

    if fmt == "csv":
        output = io.StringIO()
        if posts:
            fields = ["id", "post_id", "author_username", "author_name", "text",
                      "created_at", "post_type", "likes", "comments", "shares",
                      "views", "post_url"]
            writer = csv.DictWriter(output, fieldnames=fields, extrasaction="ignore")
            writer.writeheader()
            writer.writerows(posts)
        return Response(output.getvalue(), mimetype="text/csv",
                        headers={"Content-Disposition": "attachment; filename=facebook_posts.csv"})
    else:
        return Response(json.dumps(posts, indent=2, ensure_ascii=False),
                        mimetype="application/json",
                        headers={"Content-Disposition": "attachment; filename=facebook_posts.json"})


@app.route("/api/fb/export/ai", methods=["GET"])
def fb_export_ai():
    username = request.args.get("username", "").lstrip("@").strip()
    if not username:
        return jsonify({"error": "Username required"}), 400

    include_dates = request.args.get("include_dates", "true").lower() != "false"
    min_likes = int(request.args.get("min_likes") or 0)

    posts = export_fb_posts(username=username)
    blocks = []
    for p in posts:
        text = (p.get("text") or "").strip()
        if not text:
            continue
        if min_likes and p.get("likes", 0) < min_likes:
            continue
        ts = p.get("created_at_ts")
        date_str = datetime.utcfromtimestamp(ts).strftime("%Y-%m-%d") if ts else ""
        prefix = f"[{date_str}] " if include_dates and date_str else ""
        blocks.append(prefix + text)

    header = (
        f"# Facebook posts by {username}\n"
        f"# {len(blocks)} entries\n#\n"
        f"# Use this to understand the page's ideas and patterns.\n\n---\n\n"
    )
    return Response(header + "\n\n".join(blocks), mimetype="text/plain; charset=utf-8",
                    headers={"Content-Disposition": f"attachment; filename={username}_fb_ai.txt"})


# ── Facebook Groups endpoints ──

@app.route("/api/fb/groups", methods=["GET"])
def fb_list_groups():
    return jsonify(get_fb_groups())


@app.route("/api/fb/groups", methods=["POST"])
def fb_create_group():
    data = request.get_json()
    name = (data.get("name") or "").strip()
    if not name:
        return jsonify({"error": "Group name required"}), 400
    return jsonify({"status": "ok", "name": name})


@app.route("/api/fb/groups/<group_name>", methods=["DELETE"])
def fb_delete_group(group_name):
    delete_fb_group(group_name)
    return jsonify({"status": "ok"})


@app.route("/api/fb/groups/<group_name>", methods=["PATCH"])
def fb_rename_group(group_name):
    data = request.get_json()
    new_name = (data.get("name") or "").strip()
    if not new_name:
        return jsonify({"error": "New name required"}), 400
    rename_fb_group(group_name, new_name)
    return jsonify({"status": "ok", "name": new_name})


@app.route("/api/fb/groups/<group_name>/accounts", methods=["POST"])
def fb_add_to_group(group_name):
    data = request.get_json()
    username = (data.get("username") or "").lstrip("@").strip()
    if not username:
        return jsonify({"error": "Username required"}), 400
    set_fb_user_group(username, group_name)
    return jsonify({"status": "ok"})


@app.route("/api/fb/groups/<group_name>/accounts/<username>", methods=["DELETE"])
def fb_remove_from_group(group_name, username):
    remove_fb_user_group(username, group_name)
    return jsonify({"status": "ok"})


@app.route("/api/fb/export/ai/group/<group_name>", methods=["GET"])
def fb_export_ai_group(group_name):
    usernames = get_fb_group_usernames(group_name)
    if not usernames:
        return jsonify({"error": "Group not found or empty"}), 404

    include_dates = request.args.get("include_dates", "true").lower() != "false"
    min_likes = int(request.args.get("min_likes") or 0)

    sections = []
    total = 0
    for uname in usernames:
        posts = export_fb_posts(username=uname)
        blocks = []
        for p in posts:
            text = (p.get("text") or "").strip()
            if not text:
                continue
            if min_likes and p.get("likes", 0) < min_likes:
                continue
            ts = p.get("created_at_ts")
            date_str = datetime.utcfromtimestamp(ts).strftime("%Y-%m-%d") if ts else ""
            prefix = f"[{date_str}] " if include_dates and date_str else ""
            blocks.append(prefix + text)
        total += len(blocks)
        if blocks:
            sections.append(f"## {uname} ({len(blocks)} posts)\n\n" + "\n\n".join(blocks))

    safe_name = re.sub(r'[^\w\-]', '_', group_name)
    header = (
        f"# Facebook Group: {group_name}\n"
        f"# {len(usernames)} pages | {total} total posts\n\n---\n\n"
    )
    return Response(header + "\n\n---\n\n".join(sections),
                    mimetype="text/plain; charset=utf-8",
                    headers={"Content-Disposition": f"attachment; filename={safe_name}_fb_group_ai.txt"})


# ══════════════════════════════════════
#  WEB UI
# ══════════════════════════════════════

@app.route("/media/<path:relpath>")
def serve_media(relpath):
    """Serve locally-downloaded Facebook images for offline viewing."""
    from flask import send_from_directory
    return send_from_directory(fb_scraper.MEDIA_ROOT, relpath)


@app.route("/")
def index():
    return render_template_string(WEB_UI)


WEB_UI = """
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Social Analyzer</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;500;700&family=Noto+Kufi+Arabic:wght@400;600&display=swap" rel="stylesheet">
<style>
  :root {
    --sb: 240px;
    --bg: #0d1117;
    --surface: #161b22;
    --surface2: #21262d;
    --border: #30363d;
    --text: #e6edf3;
    --muted: #7d8590;
    --accent: #58a6ff;
    --accent-bg: rgba(88,166,255,0.12);
    --green: #3fb950;
    --red: #f85149;
    --orange: #d29922;
    --r: 8px;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: var(--bg);
    color: var(--text);
    min-height: 100vh;
    display: flex;
  }

  /* ── Sidebar ── */
  .sidebar {
    width: var(--sb);
    background: var(--surface);
    border-right: 1px solid var(--border);
    position: fixed;
    top: 0; left: 0;
    height: 100vh;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    z-index: 20;
  }
  .sb-logo {
    padding: 18px 16px 14px;
    border-bottom: 1px solid var(--border);
  }
  .sb-logo h1 { font-size: 14px; font-weight: 700; letter-spacing: -0.2px; }
  .sb-logo .sub { font-size: 11px; color: var(--muted); margin-top: 2px; }

  .sb-section {
    padding: 14px 16px;
    border-bottom: 1px solid var(--border);
  }
  .sb-section:last-child { border-bottom: none; flex: 1; }
  .sb-label {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--muted);
    margin-bottom: 10px;
  }

  /* Auth pill */
  .auth-pill {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    background: var(--surface2);
    border-radius: var(--r);
    font-size: 13px;
  }
  .auth-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
  .auth-dot.ok { background: var(--green); }
  .auth-dot.err { background: var(--red); }
  .auth-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 500; }
  .auth-btn { font-size: 12px; font-weight: 600; color: var(--accent); cursor: pointer; flex-shrink: 0; }
  .auth-btn:hover { text-decoration: underline; }

  /* Stats */
  .stat-row { display: flex; justify-content: space-between; align-items: baseline; font-size: 13px; margin-bottom: 7px; }
  .stat-row:last-child { margin-bottom: 0; }
  .stat-row .lbl { color: var(--muted); }
  .stat-row .val { font-weight: 600; font-variant-numeric: tabular-nums; }
  .stat-row .val.hi { color: var(--accent); }

  /* Jobs */
  .no-jobs { font-size: 12px; color: var(--muted); font-style: italic; }
  .job-card { background: var(--surface2); border-radius: var(--r); padding: 9px 10px; margin-bottom: 6px; }
  .job-card:last-child { margin-bottom: 0; }
  .job-head { display: flex; align-items: center; gap: 6px; margin-bottom: 3px; }
  .job-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
  .job-dot.running { background: var(--accent); animation: pulse 1s infinite; }
  .job-dot.complete { background: var(--green); }
  .job-dot.cancelled { background: var(--orange); }
  .job-dot.error { background: var(--red); }
  .job-name { font-size: 12px; font-weight: 600; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .job-action { font-size: 11px; font-weight: 600; cursor: pointer; flex-shrink: 0; }
  .job-action.stop { color: var(--red); }
  .job-action.stop:hover { text-decoration: underline; }
  .job-action.dismiss { color: var(--muted); }
  .job-action.dismiss:hover { color: var(--text); }
  .job-prog { font-size: 11px; color: var(--muted); padding-left: 12px; line-height: 1.3; }

  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.25} }

  /* ── Main ── */
  .main { margin-left: var(--sb); flex: 1; min-height: 100vh; display: flex; flex-direction: column; }

  /* Tabbar */
  .tabbar {
    display: flex;
    border-bottom: 1px solid var(--border);
    background: var(--surface);
    padding: 0 20px;
    position: sticky;
    top: 0;
    z-index: 10;
  }
  .tbtab {
    padding: 13px 14px;
    font-size: 14px;
    font-weight: 600;
    color: var(--muted);
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    cursor: pointer;
    font-family: inherit;
    transition: color 0.12s;
  }
  .tbtab.active { color: var(--text); border-bottom-color: var(--accent); }
  .tbtab:hover:not(.active) { color: var(--text); }

  /* Content */
  .content { padding: 24px 20px; max-width: 780px; }
  .tab-pane { display: none; }
  .tab-pane.active { display: block; }

  /* Auth panel (inline) */
  .auth-panel {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 20px;
  }
  .auth-panel h3 { font-size: 14px; font-weight: 700; margin-bottom: 5px; }
  .auth-panel p { font-size: 13px; color: var(--muted); line-height: 1.5; margin-bottom: 12px; }

  /* Forms */
  .row { display: flex; gap: 8px; margin-bottom: 10px; align-items: center; flex-wrap: wrap; }
  input, select, textarea {
    padding: 8px 12px;
    border: 1px solid var(--border);
    border-radius: var(--r);
    background: var(--bg);
    color: var(--text);
    font-size: 14px;
    font-family: inherit;
    outline: none;
    transition: border-color 0.12s;
  }
  input:focus, textarea:focus { border-color: var(--accent); }
  input::placeholder { color: var(--muted); }
  textarea { width: 100%; resize: vertical; }
  select { cursor: pointer; }
  input[type=checkbox] { accent-color: var(--accent); width: 14px; height: 14px; }
  label { font-size: 13px; color: var(--muted); display: flex; align-items: center; gap: 6px; cursor: pointer; white-space: nowrap; }

  .btn { padding: 8px 16px; border: none; border-radius: var(--r); font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit; white-space: nowrap; transition: filter 0.12s; }
  .btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .btn-primary { background: var(--accent); color: #fff; }
  .btn-primary:hover:not(:disabled) { filter: brightness(1.1); }
  .btn-ghost { background: transparent; color: var(--muted); border: 1px solid var(--border); }
  .btn-ghost:hover { color: var(--text); border-color: var(--muted); }

  /* Browse */
  .filter-bar { display: flex; gap: 6px; margin-bottom: 14px; flex-wrap: wrap; align-items: center; }
  .date-range { display: flex; gap: 6px; align-items: center; margin-left: auto; }
  .date-range input { font-size: 13px; padding: 7px 10px; }
  .date-sep { color: var(--muted); font-size: 13px; }
  .chip { padding: 5px 12px; border-radius: 20px; font-size: 13px; font-weight: 500; cursor: pointer; background: transparent; border: 1px solid var(--border); color: var(--muted); font-family: inherit; transition: all 0.1s; }
  .chip:hover { border-color: var(--accent); color: var(--text); }
  .chip.active { background: var(--accent-bg); color: var(--accent); border-color: var(--accent); }
  .chip .cnt { font-size: 11px; opacity: 0.6; margin-left: 3px; }

  /* Tweet list */
  .tweet-list { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; }
  .tweet-empty { padding: 48px 20px; text-align: center; color: var(--muted); font-size: 14px; }
  .tweet { display: block; padding: 14px 18px; border-bottom: 1px solid var(--border); text-decoration: none; color: inherit; transition: background 0.1s; }
  .tweet:last-child { border-bottom: none; }
  .tweet:hover { background: var(--surface2); }
  .t-meta { display: flex; align-items: center; gap: 7px; margin-bottom: 6px; }
  .t-avatar { width: 32px; height: 32px; border-radius: 50%; background: var(--surface2); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; color: var(--muted); flex-shrink: 0; }
  .t-name { font-weight: 700; font-size: 14px; }
  .t-handle { color: var(--muted); font-size: 13px; }
  .t-date { color: var(--muted); font-size: 12px; margin-left: auto; }
  .t-badge { font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 10px; text-transform: uppercase; letter-spacing: 0.4px; }
  .badge-rt { background: rgba(63,185,80,.15); color: var(--green); }
  .badge-reply { background: rgba(210,153,34,.15); color: var(--orange); }
  .badge-thread { background: var(--accent-bg); color: var(--accent); }
  .t-body { font-size: 14px; line-height: 1.5; margin-bottom: 8px; word-break: break-word; }
  .t-stats { display: flex; gap: 16px; color: var(--muted); font-size: 12px; }
  .t-stats span { display: flex; align-items: center; gap: 3px; }
  .thread-toggle { font-size: 12px; color: var(--accent); cursor: pointer; margin-top: 5px; display: inline-block; }
  .thread-toggle:hover { text-decoration: underline; }
  .thread-chain { border-left: 2px solid var(--border); margin: 6px 0 0 16px; padding-left: 14px; }
  .thread-chain .tweet { padding: 8px 0; border-bottom: 1px solid var(--border); background: transparent !important; }
  .thread-chain .tweet:last-child { border-bottom: none; }

  /* Pagination */
  .pager { display: flex; align-items: center; gap: 8px; margin-top: 14px; justify-content: center; }
  .pager .info { color: var(--muted); font-size: 13px; }

  /* Scrape sub-tabs */
  .stabs { display: inline-flex; gap: 3px; padding: 4px; background: var(--surface); border: 1px solid var(--border); border-radius: 10px; margin-bottom: 16px; }
  .stab { padding: 6px 13px; border-radius: 7px; font-size: 13px; font-weight: 600; background: transparent; border: none; color: var(--muted); cursor: pointer; font-family: inherit; transition: all 0.12s; }
  .stab.active { background: var(--surface2); color: var(--text); }
  .stab:hover:not(.active) { color: var(--text); }

  .sform { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 18px 20px; }
  .sform h3 { font-size: 14px; font-weight: 700; margin-bottom: 4px; }
  .sform .desc { font-size: 12px; color: var(--muted); margin-bottom: 14px; line-height: 1.4; }

  /* Export */
  .export-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 16px; }
  .export-card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 18px 20px; }
  .export-card h3 { font-size: 14px; font-weight: 700; margin-bottom: 4px; }
  .export-card p { font-size: 13px; color: var(--muted); margin-bottom: 14px; line-height: 1.4; }

  /* Groups */
  .group-card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; margin-bottom: 12px; overflow: hidden; }
  .group-card:last-child { margin-bottom: 0; }
  .group-head { display: flex; align-items: center; gap: 8px; padding: 12px 16px; border-bottom: 1px solid var(--border); }
  .group-name { font-size: 14px; font-weight: 700; flex: 1; }
  .group-count { font-size: 12px; color: var(--muted); }
  .group-actions { display: flex; gap: 6px; }
  .group-body { padding: 10px 12px; }
  .group-add { padding: 8px 12px; border-top: 1px solid var(--border); }
  .uncategorized-head { color: var(--muted); font-style: italic; }

  /* Saved accounts */
  .acct-row { display:flex; align-items:center; gap:10px; padding:9px 12px; background:var(--surface); border:1px solid var(--border); border-radius:8px; margin-bottom:6px; transition:border-color 0.1s; }
  .acct-row:hover { border-color:var(--accent); }
  .acct-row:last-child { margin-bottom:0; }
  .acct-avatar { width:30px; height:30px; border-radius:50%; background:var(--surface2); display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700; color:var(--muted); flex-shrink:0; }
  .acct-info { flex:1; min-width:0; }
  .acct-name { font-size:13px; font-weight:600; }
  .acct-meta { font-size:11px; color:var(--muted); margin-top:1px; }
  .acct-actions { display:flex; gap:6px; flex-shrink:0; }

  .hidden { display: none !important; }
  a { color: var(--accent); }

  /* ── Platform switcher ── */
  .platform-bar {
    display: flex;
    gap: 0;
    padding: 0 20px;
    background: var(--bg);
    border-bottom: 2px solid var(--border);
    position: sticky;
    top: 0;
    z-index: 11;
  }
  .ptab {
    padding: 11px 18px;
    font-size: 14px;
    font-weight: 700;
    color: var(--muted);
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    margin-bottom: -2px;
    cursor: pointer;
    font-family: inherit;
    transition: all 0.12s;
    display: flex;
    align-items: center;
    gap: 7px;
  }
  .ptab .ptab-icon { font-size: 16px; }
  .ptab.active { color: var(--text); border-bottom-color: var(--accent); }
  .ptab:hover:not(.active) { color: var(--text); }

  .platform-wrap { display: none; flex-direction: column; flex: 1; }
  .platform-wrap.active { display: flex; }

  /* ── Facebook post cards ── */
  .fb-post { display: block; padding: 14px 18px; border-bottom: 1px solid var(--border); text-decoration: none; color: inherit; transition: background 0.1s; }
  .fb-post:last-child { border-bottom: none; }
  .fb-post:hover { background: var(--surface2); }
  .fb-meta { display: flex; align-items: center; gap: 7px; margin-bottom: 6px; }
  .fb-avatar { width: 32px; height: 32px; border-radius: 50%; background: #1877f2; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; color: #fff; flex-shrink: 0; }
  .fb-name { font-weight: 700; font-size: 14px; }
  .fb-date { color: var(--muted); font-size: 12px; margin-left: auto; }
  .fb-body {
    font-family: 'Noto Naskh Arabic', 'Geeza Pro', 'Segoe UI', -apple-system, sans-serif;
    font-size: 15px;
    line-height: 1.9;
    margin-bottom: 8px;
    word-break: break-word;
    white-space: pre-wrap;
    unicode-bidi: plaintext;   /* auto-detect RTL/LTR per paragraph */
    text-align: start;
  }
  .fb-link-btn {
    flex-shrink: 0;
    font-size: 14px;
    line-height: 1;
    padding: 3px 7px;
    border-radius: 6px;
    border: 1px solid var(--border);
    background: var(--surface2);
    color: var(--muted);
    cursor: pointer;
    text-decoration: none;
    transition: all 0.12s;
  }
  .fb-link-btn:hover { color: var(--accent); border-color: var(--accent); }
  .fb-body.copied-flash { background: var(--accent-bg); border-radius: 6px; }
  .fb-img { cursor: zoom-in; }

  /* Toast */
  #toast {
    position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%) translateY(20px);
    background: var(--green); color: #fff; font-size: 13px; font-weight: 600;
    padding: 8px 18px; border-radius: 20px; z-index: 1000;
    opacity: 0; pointer-events: none; transition: all 0.2s;
  }
  #toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }

  /* Lightbox */
  #lightbox {
    display: none; position: fixed; inset: 0; z-index: 900;
    background: rgba(0,0,0,0.9); align-items: center; justify-content: center;
  }
  #lightbox.show { display: flex; }
  #lbImg { max-width: 92vw; max-height: 90vh; object-fit: contain; border-radius: 6px; }
  .lb-close {
    position: absolute; top: 18px; right: 26px; color: #fff; font-size: 40px;
    cursor: pointer; line-height: 1; opacity: 0.8;
  }
  .lb-close:hover { opacity: 1; }
  .lb-arrow {
    position: absolute; top: 50%; transform: translateY(-50%);
    color: #fff; font-size: 44px; cursor: pointer; padding: 12px 18px;
    user-select: none; opacity: 0.7; transition: opacity 0.12s;
  }
  .lb-arrow:hover { opacity: 1; }
  .lb-prev { left: 12px; }
  .lb-next { right: 12px; }
  .lb-counter {
    position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%);
    color: #fff; font-size: 14px; font-weight: 600; background: rgba(0,0,0,0.5);
    padding: 4px 14px; border-radius: 14px;
  }
  .fb-stats { display: flex; gap: 16px; color: var(--muted); font-size: 12px; }
  .fb-stats span { display: flex; align-items: center; gap: 3px; }
  .fb-imgs { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 6px; margin: 8px 0; }
  .fb-img { width: 100%; height: 120px; object-fit: cover; border-radius: 8px; border: 1px solid var(--border); background: var(--surface2); }
  .badge-fb-photo { background: rgba(24,119,242,.15); color: #1877f2; }
  .badge-fb-video { background: rgba(63,185,80,.15); color: var(--green); }
  .badge-fb-share { background: rgba(210,153,34,.15); color: var(--orange); }
  .fb-stat-section { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 16px 20px; margin-bottom: 14px; }
  .fb-stat-section h3 { font-size: 13px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; }
</style>
</head>
<body>
<div class="sidebar">
  <div class="sb-logo">
    <h1 id="sbTitle">Social Analyzer</h1>
    <div class="sub" id="sbSub">Local archive</div>
  </div>

  <!-- Twitter auth (shown on Twitter platform) -->
  <div class="sb-section" id="twAuthSection">
    <div class="sb-label">Twitter / X Account</div>
    <div class="auth-pill">
      <div class="auth-dot err" id="authDot"></div>
      <span class="auth-name" id="authName">Not connected</span>
      <span class="auth-btn" id="authBtn" onclick="toggleAuthPanel()">Connect</span>
    </div>
  </div>

  <!-- Facebook auth (shown on Facebook platform) -->
  <div class="sb-section hidden" id="fbAuthSection">
    <div class="sb-label">Facebook Account</div>
    <div class="auth-pill">
      <div class="auth-dot err" id="fbAuthDot"></div>
      <span class="auth-name" id="fbAuthName">Not connected</span>
      <span class="auth-btn" id="fbAuthBtn" onclick="toggleFbAuthPanel()">Connect</span>
    </div>
    <div style="font-size:11px;color:var(--muted);margin-top:6px;line-height:1.4;">
      Public pages work without login
    </div>
  </div>

  <!-- Twitter stats -->
  <div class="sb-section" id="twStatsSection">
    <div class="sb-label">Stats</div>
    <div class="stat-row"><span class="lbl">Total tweets</span><span class="val hi" id="statTotal">—</span></div>
    <div class="stat-row"><span class="lbl">Accounts</span><span class="val" id="statUsers">—</span></div>
    <div class="stat-row"><span class="lbl">Original</span><span class="val" id="statOriginal">—</span></div>
    <div class="stat-row"><span class="lbl">Replies</span><span class="val" id="statReplies">—</span></div>
    <div class="stat-row"><span class="lbl">Retweets</span><span class="val" id="statRetweets">—</span></div>
    <div class="stat-row"><span class="lbl">Threads</span><span class="val" id="statThreads">—</span></div>
  </div>

  <!-- Facebook stats -->
  <div class="sb-section hidden" id="fbStatsSection">
    <div class="sb-label">Stats</div>
    <div class="stat-row"><span class="lbl">Total posts</span><span class="val hi" id="fbStatTotal">—</span></div>
    <div class="stat-row"><span class="lbl">Pages</span><span class="val" id="fbStatPages">—</span></div>
    <div class="stat-row"><span class="lbl">Photos</span><span class="val" id="fbStatPhotos">—</span></div>
    <div class="stat-row"><span class="lbl">Videos</span><span class="val" id="fbStatVideos">—</span></div>
  </div>

  <div class="sb-section">
    <div class="sb-label">Active Scrapes</div>
    <div id="jobsList"><div class="no-jobs">No active scrapes</div></div>
  </div>
</div>

<div class="main">
  <!-- Platform switcher -->
  <div class="platform-bar">
    <button class="ptab active" id="ptab-twitter" onclick="switchPlatform('twitter',this)">
      <span class="ptab-icon">&#120143;</span> Twitter
    </button>
    <button class="ptab" id="ptab-facebook" onclick="switchPlatform('facebook',this)">
      <span class="ptab-icon">&#128241;</span> Facebook
    </button>
  </div>

  <!-- ═══════════════ TWITTER PLATFORM ═══════════════ -->
  <div id="platform-twitter" class="platform-wrap active">
  <div class="tabbar">
    <button class="tbtab active" onclick="switchTab('browse',this)">Browse</button>
    <button class="tbtab" onclick="switchTab('scrape',this)">Scrape</button>
    <button class="tbtab" onclick="switchTab('groups',this)">Groups</button>
    <button class="tbtab" onclick="switchTab('export',this)">Export</button>
  </div>

  <div class="content">

    <!-- Auth panel -->
    <div id="authPanel" class="auth-panel hidden">
      <h3>Connect your X account</h3>
      <p>Go to x.com, open Cookie-Editor (or any cookie export extension), export as JSON, and paste it below.</p>
      <textarea id="cookieInput" rows="5" placeholder="Paste cookies JSON here..."></textarea>
      <div class="row" style="margin-top:10px;">
        <button class="btn btn-primary" onclick="importCookies()">Connect</button>
        <button class="btn btn-ghost" onclick="toggleAuthPanel()">Cancel</button>
      </div>
    </div>

    <!-- BROWSE -->
    <div id="tab-browse" class="tab-pane active">
      <div class="row">
        <input type="text" id="browseQuery" placeholder="Search tweets..." style="flex:1;min-width:160px;">
        <select id="browseAccount" onchange="onAccountChange()" style="min-width:180px;">
          <option value="">All accounts</option>
        </select>
        <button class="btn btn-primary" onclick="browseTweets(0)">Search</button>
      </div>
      <div class="filter-bar">
        <button class="chip active" onclick="filterType(this,null)">All<span class="cnt" id="countAll"></span></button>
        <button class="chip" onclick="filterType(this,'tweet')">Tweets<span class="cnt" id="countTweet"></span></button>
        <button class="chip" onclick="filterType(this,'reply')">Replies<span class="cnt" id="countReply"></span></button>
        <button class="chip" onclick="filterType(this,'retweet')">Retweets<span class="cnt" id="countRetweet"></span></button>
        <button class="chip" onclick="filterType(this,'thread')">Threads<span class="cnt" id="countThread"></span></button>
        <div class="date-range">
          <input type="date" id="startDate">
          <span class="date-sep">to</span>
          <input type="date" id="endDate">
        </div>
      </div>
      <div id="tweetList"></div>
      <div id="pager" class="pager"></div>
    </div>

    <!-- SCRAPE -->
    <div id="tab-scrape" class="tab-pane">
      <div class="stabs">
        <button class="stab active" onclick="switchScrapeTab('user',this)">User Timeline</button>
        <button class="stab" onclick="switchScrapeTab('search',this)">Search</button>
        <button class="stab" onclick="switchScrapeTab('likes',this)">Likes</button>
        <button class="stab" onclick="switchScrapeTab('backfill',this)">Backfill</button>
      </div>

      <div id="st-user" class="sform">
        <h3>Scrape user timeline</h3>
        <p class="desc">Downloads a user's tweets. Resumes automatically if interrupted.</p>
        <div class="row">
          <input type="text" id="userInput" placeholder="Username" style="flex:1;">
          <input type="number" id="userPages" placeholder="Pages (blank = all)" min="1" max="1000" style="width:190px;">
          <label><input type="checkbox" id="inclReplies"> Replies</label>
          <button class="btn btn-primary" onclick="doScrapeUser()">Start</button>
        </div>
      </div>

      <div id="savedAcctPanel" style="margin-top:14px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
          <div class="sb-label" style="margin-bottom:0;">Saved Accounts</div>
          <button class="btn btn-ghost" style="font-size:12px;padding:4px 10px;" onclick="updateAllAccounts()">&#8635; Update All</button>
        </div>
        <div id="savedAcctList"><div class="no-jobs">No accounts scraped yet</div></div>
      </div>

      <div id="st-search" class="sform hidden">
        <h3>Search scrape</h3>
        <p class="desc">Scrapes tweets matching any search query. Supports Twitter's advanced operators like <code>from:</code>, <code>since:</code>, <code>until:</code>.</p>
        <div class="row">
          <input type="text" id="searchInput" placeholder="e.g. from:user since:2024-01-01" style="flex:1;">
          <input type="number" id="searchPages" placeholder="Pages (blank = all)" min="1" max="500" style="width:190px;">
          <button class="btn btn-primary" onclick="doScrapeSearch()">Start</button>
        </div>
      </div>

      <div id="st-likes" class="sform hidden">
        <h3>Scrape liked tweets</h3>
        <p class="desc">Downloads tweets that a user has liked.</p>
        <div class="row">
          <input type="text" id="likesInput" placeholder="Username" style="flex:1;">
          <input type="number" id="likesPages" placeholder="Pages (blank = all)" min="1" max="500" style="width:190px;">
          <button class="btn btn-primary" onclick="doScrapeLikes()">Start</button>
        </div>
      </div>

      <div id="st-backfill" class="sform hidden">
        <h3>Backfill older tweets</h3>
        <p class="desc">Scrapes older tweets month-by-month using date-windowed searches. Useful for going deeper than the timeline API allows.</p>
        <div class="row">
          <input type="text" id="backfillInput" placeholder="Username" style="flex:1;">
          <input type="number" id="backfillYears" value="2" min="1" max="10" style="width:80px;" title="Years to go back">
          <span style="color:var(--muted);font-size:13px;">years back</span>
          <button class="btn btn-primary" onclick="doBackfill()">Start</button>
        </div>
      </div>
    </div>

    <!-- EXPORT -->
    <div id="tab-export" class="tab-pane">
      <div class="row" style="margin-bottom:16px;">
        <select id="exportAccount" style="min-width:200px;" onchange="onExportAccountChange()">
          <option value="">All accounts</option>
        </select>
        <span id="exportTweetCount" style="font-size:13px;color:var(--muted);"></span>
      </div>

      <!-- AI Export (primary) -->
      <div class="export-card" style="border-color:var(--accent);margin-bottom:12px;">
        <h3 style="color:var(--accent);">AI Export</h3>
        <p>Clean text for feeding into an AI. Threads are reconstructed into single paragraphs. Retweets and replies excluded by default — only original thinking.</p>
        <div class="row" style="margin-bottom:10px;">
          <label><input type="checkbox" id="aiIncludeReplies"> Replies</label>
          <label><input type="checkbox" id="aiIncludeRetweets"> Retweets</label>
          <label><input type="checkbox" id="aiIncludeDates" checked> Dates</label>
          <input type="number" id="aiMinLikes" placeholder="Min likes" min="0" style="width:120px;">
        </div>
        <button class="btn btn-primary" onclick="doExportAI()">Download for AI</button>
      </div>

      <div class="export-grid">
        <div class="export-card">
          <h3>JSON</h3>
          <p>Full export with all fields. Best for programmatic use.</p>
          <button class="btn btn-primary" onclick="doExport('json')">Download JSON</button>
        </div>
        <div class="export-card">
          <h3>CSV</h3>
          <p>Spreadsheet-friendly with key engagement metrics.</p>
          <button class="btn btn-primary" onclick="doExport('csv')">Download CSV</button>
        </div>
      </div>
    </div>

    <!-- GROUPS -->
    <div id="tab-groups" class="tab-pane">
      <div class="row" style="margin-bottom:16px;">
        <input type="text" id="newGroupInput" placeholder="New group name..." style="flex:1;" onkeydown="if(event.key==='Enter')createGroup()">
        <button class="btn btn-primary" onclick="createGroup()">+ New Group</button>
      </div>
      <div id="groupsList"><div class="no-jobs" style="padding:24px 0;">No groups yet — create one above</div></div>
    </div>

  </div><!-- .content (twitter) -->
  </div><!-- #platform-twitter -->

  <!-- ═══════════════ FACEBOOK PLATFORM ═══════════════ -->
  <div id="platform-facebook" class="platform-wrap">
  <div class="tabbar">
    <button class="tbtab active" onclick="switchFbTab('browse',this)">Browse</button>
    <button class="tbtab" onclick="switchFbTab('scrape',this)">Scrape</button>
    <button class="tbtab" onclick="switchFbTab('groups',this)">Groups</button>
    <button class="tbtab" onclick="switchFbTab('export',this)">Export</button>
  </div>

  <div class="content">

    <!-- Facebook Auth panel -->
    <div id="fbAuthPanel" class="auth-panel hidden">
      <h3>Connect Facebook account</h3>
      <p style="margin-bottom:14px;">A browser window will open — log in with your scraper account there. This creates an <strong>independent session</strong> so you can freely log out of your main browser.</p>
      <button class="btn btn-primary" style="width:100%;margin-bottom:12px;" onclick="startFbBrowserLogin()">&#127758; Open Login Window</button>
      <details style="margin-top:4px;">
        <summary style="font-size:12px;color:var(--muted);cursor:pointer;">Or paste cookies manually (temporary)</summary>
        <p style="font-size:12px;color:var(--muted);margin:8px 0;">Cookie sessions are shared with your browser — they break when you log out.</p>
        <textarea id="fbCookieInput" rows="4" placeholder="Paste Cookie-Editor JSON here..."></textarea>
        <div class="row" style="margin-top:8px;">
          <button class="btn btn-ghost" style="font-size:13px;" onclick="importFbCookies()">Import Cookies</button>
        </div>
      </details>
      <div style="margin-top:10px;">
        <button class="btn btn-ghost" onclick="toggleFbAuthPanel()">Cancel</button>
      </div>
    </div>

    <!-- FACEBOOK BROWSE -->
    <div id="fb-tab-browse" class="tab-pane active">
      <div class="row">
        <input type="text" id="fbBrowseQuery" placeholder="Search posts..." style="flex:1;min-width:160px;" onkeydown="if(event.key==='Enter')browseFbPosts(0)">
        <select id="fbBrowseAccount" onchange="onFbAccountChange()" style="min-width:180px;">
          <option value="">All pages</option>
        </select>
        <button class="btn btn-primary" onclick="browseFbPosts(0)">Search</button>
      </div>
      <div class="filter-bar">
        <button class="chip active" onclick="fbFilterType(this,null)">All<span class="cnt" id="fbCountAll"></span></button>
        <button class="chip" onclick="fbFilterType(this,'post')">Posts<span class="cnt" id="fbCountPost"></span></button>
        <button class="chip" onclick="fbFilterType(this,'photo')">Photos<span class="cnt" id="fbCountPhoto"></span></button>
        <button class="chip" onclick="fbFilterType(this,'video')">Videos<span class="cnt" id="fbCountVideo"></span></button>
        <div class="date-range">
          <input type="date" id="fbStartDate">
          <span class="date-sep">to</span>
          <input type="date" id="fbEndDate">
        </div>
      </div>
      <div id="fbPostList"></div>
      <div id="fbPager" class="pager"></div>
    </div>

    <!-- FACEBOOK SCRAPE -->
    <div id="fb-tab-scrape" class="tab-pane hidden">
      <div class="stabs">
        <button class="stab active" onclick="switchFbScrapeTab('page',this)">Page / Profile</button>
      </div>

      <div id="fb-st-page" class="sform">
        <h3>Scrape Facebook page or public profile</h3>
        <p class="desc">Enter the page slug (e.g. <strong>BBCNews</strong>) or paste the full URL. For pages with a numeric ID use the full URL: <em>facebook.com/profile.php?id=…</em>. Runs in the background and downloads every photo so you can view posts offline.</p>
        <div class="row">
          <input type="text" id="fbPageInput" placeholder="e.g. BBCNews or full URL" style="flex:1;" list="fbPagesDatalist">
          <datalist id="fbPagesDatalist"></datalist>
          <input type="number" id="fbPages" placeholder="Max pages (blank = unlimited)" min="1" style="width:210px;">
          <button class="btn btn-primary" onclick="doFbScrapePage(true)" title="Downloads posts and all images for offline viewing">&#128247; Scrape</button>
        </div>
      </div>

      <div id="fbSavedPagesPanel" style="margin-top:14px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
          <div class="sb-label" style="margin-bottom:0;">Saved Pages</div>
          <button class="btn btn-ghost" style="font-size:12px;padding:4px 10px;" onclick="fbUpdateAll()">&#8635; Update All</button>
        </div>
        <div id="fbSavedPagesList"><div class="no-jobs">No pages scraped yet</div></div>
      </div>
    </div>

    <!-- FACEBOOK GROUPS -->
    <div id="fb-tab-groups" class="tab-pane hidden">
      <div class="row" style="margin-bottom:16px;">
        <input type="text" id="fbNewGroupInput" placeholder="New group name..." style="flex:1;" onkeydown="if(event.key===\'Enter\')createFbGroup()">
        <button class="btn btn-primary" onclick="createFbGroup()">+ New Group</button>
      </div>
      <div id="fbGroupsList"><div class="no-jobs" style="padding:24px 0;">No groups yet — create one above</div></div>
    </div>

    <!-- FACEBOOK EXPORT -->
    <div id="fb-tab-export" class="tab-pane hidden">
      <div class="row" style="margin-bottom:16px;">
        <select id="fbExportAccount" style="min-width:200px;" onchange="onFbExportAccountChange()">
          <option value="">All pages</option>
        </select>
        <span id="fbExportPostCount" style="font-size:13px;color:var(--muted);"></span>
      </div>
      <div class="export-card" style="border-color:var(--accent);margin-bottom:12px;">
        <h3 style="color:var(--accent);">AI Export</h3>
        <p>Clean text for feeding into an AI. One post per paragraph. Ideal for analyzing a page's messaging and patterns.</p>
        <div class="row" style="margin-bottom:10px;">
          <label><input type="checkbox" id="fbAiIncludeDates" checked> Dates</label>
          <input type="number" id="fbAiMinLikes" placeholder="Min likes" min="0" style="width:120px;">
        </div>
        <button class="btn btn-primary" onclick="doFbExportAI()">Download for AI</button>
      </div>
      <div class="export-grid">
        <div class="export-card">
          <h3>JSON</h3>
          <p>Full export with all fields. Best for programmatic use.</p>
          <button class="btn btn-primary" onclick="doFbExport(\'json\')">Download JSON</button>
        </div>
        <div class="export-card">
          <h3>CSV</h3>
          <p>Spreadsheet-friendly with engagement metrics.</p>
          <button class="btn btn-primary" onclick="doFbExport(\'csv\')">Download CSV</button>
        </div>
      </div>
    </div>

  </div><!-- .content (facebook) -->
  </div><!-- #platform-facebook -->

</div><!-- .main -->

<!-- Image lightbox -->
<div id="lightbox" onclick="lbClose()">
  <span class="lb-close" onclick="lbClose()">&times;</span>
  <span class="lb-arrow lb-prev" id="lbPrev" onclick="lbStep(event,-1)">&#10094;</span>
  <img id="lbImg" src="" onclick="event.stopPropagation()">
  <span class="lb-arrow lb-next" id="lbNext" onclick="lbStep(event,1)">&#10095;</span>
  <div class="lb-counter" id="lbCounter"></div>
</div>

<script>
const API = '';
let currentOffset = 0;
let currentType = null;
let selectedUser = '';
let availableUsers = [];
let activeJobs = {};
let pollTimer = null;

function esc(s) {
  const d = document.createElement('div');
  d.textContent = String(s == null ? '' : s);
  return d.innerHTML;
}
function fmt(n) {
  if (n == null) return '–';
  if (n >= 1e6) return (n/1e6).toFixed(1)+'M';
  if (n >= 1e3) return (n/1e3).toFixed(1)+'K';
  return String(n);
}
function fmtn(n) { return (n||0).toLocaleString(); }
function optPages(id) {
  const v = document.getElementById(id).value.trim();
  if (!v) return null;
  const n = parseInt(v,10);
  return Number.isFinite(n) ? n : null;
}

// ── Tabs ──
function switchTab(name, btn) {
  document.querySelectorAll('.tbtab').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.tab-pane').forEach(p=>p.classList.remove('active'));
  document.getElementById('tab-'+name).classList.add('active');
  if (name === 'groups') loadGroups();
}
function switchScrapeTab(name, btn) {
  document.querySelectorAll('.stab').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  ['user','search','likes','backfill'].forEach(t=>{
    document.getElementById('st-'+t).classList.toggle('hidden', t!==name);
  });
  const sap = document.getElementById('savedAcctPanel');
  if (sap) sap.classList.toggle('hidden', name !== 'user');
}

// ── Auth ──
function toggleAuthPanel() {
  const p = document.getElementById('authPanel');
  p.classList.toggle('hidden');
}
async function checkAuth() {
  try {
    const resp = await fetch(API+'/api/health');
    const data = await resp.json();
    const dot = document.getElementById('authDot');
    const name = document.getElementById('authName');
    const btn = document.getElementById('authBtn');
    if (data.authenticated) {
      dot.className = 'auth-dot ok';
      const u = data.user;
      name.textContent = u ? '@'+u.username : 'Connected';
      btn.textContent = 'Change';
      document.getElementById('authPanel').classList.add('hidden');
    } else {
      dot.className = 'auth-dot err';
      name.textContent = 'Not connected';
      btn.textContent = 'Connect';
      document.getElementById('authPanel').classList.remove('hidden');
    }
    loadStats();
  } catch(e) {}
}
async function importCookies() {
  const text = document.getElementById('cookieInput').value.trim();
  if (!text) return alert('Paste your cookies JSON first');
  let json;
  try { json = JSON.parse(text); } catch(e) { return alert('Invalid JSON'); }
  const resp = await fetch(API+'/api/setup/json', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify(json),
  });
  const data = await resp.json();
  if (data.status==='ok') {
    document.getElementById('cookieInput').value='';
    checkAuth();
  } else {
    alert(data.error||'Failed to connect');
  }
}

// ── Stats ──
async function loadStats(username) {
  try {
    let url = API+'/api/stats';
    if (username) url += '?username='+encodeURIComponent(username);
    const resp = await fetch(url);
    const data = await resp.json();
    // Sidebar always shows global — only update when no account filter
    if (!username) {
      const set = (id,v) => { const el=document.getElementById(id); if(el) el.textContent=fmtn(v); };
      set('statTotal', data.total_tweets);
      set('statUsers', data.unique_users);
      set('statOriginal', data.total_original);
      set('statReplies', data.total_replies);
      set('statRetweets', data.total_retweets);
      set('statThreads', data.total_threads);
    }
    // Browse-tab chips always reflect current account filter
    const c = (id,v) => { const el=document.getElementById(id); if(el) el.textContent=v!=null?' ('+fmtn(v)+')':''; };
    c('countAll',     data.total_tweets);
    c('countTweet',   data.total_original);
    c('countReply',   data.total_replies);
    c('countRetweet', data.total_retweets);
    c('countThread',  data.total_threads);
  } catch(e) {}
}

// ── Users ──
async function loadUsers() {
  try {
    const resp = await fetch(API+'/api/users');
    availableUsers = await resp.json();
    renderAccountSelects();
    renderSavedAccounts();
  } catch(e) {}
}
function renderSavedAccounts() {
  const el = document.getElementById('savedAcctList');
  if (!el) return;
  if (!availableUsers.length) {
    el.innerHTML = '<div class="no-jobs">No accounts scraped yet</div>';
    return;
  }
  el.innerHTML = availableUsers.map(u => {
    const newest = u.newest_tweet ? new Date(u.newest_tweet).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}) : '–';
    const isRunning = Object.values(activeJobs).some(j=>j.status==='running'&&j.username===u.username&&j.platform!=='facebook');
    const btnDis = isRunning ? ' disabled' : '';
    const btnTxt = isRunning ? '&#8987; Running' : '&#8635; Update';
    return '<div class="acct-row">'+
      '<div class="acct-avatar">'+esc((u.display_name||u.username||'?')[0].toUpperCase())+'</div>'+
      '<div class="acct-info">'+
        '<div class="acct-name">@'+esc(u.username)+'</div>'+
        '<div class="acct-meta">'+fmtn(u.tweet_count)+' tweets &middot; latest: '+esc(newest)+'</div>'+
      '</div>'+
      '<div class="acct-actions">'+
        '<button class="btn btn-ghost" style="font-size:12px;padding:5px 10px;" data-user="'+esc(u.username)+'"'+btnDis+' onclick="quickUpdate(this.dataset.user)">'+btnTxt+'</button>'+
      '</div>'+
    '</div>';
  }).join('');
}
function quickUpdate(username) {
  document.getElementById('userInput').value = username;
  doScrapeUser();
}
async function updateAllAccounts() {
  if (!availableUsers.length) return alert('No accounts to update');
  const n = availableUsers.length;
  if (!confirm('Start update scrape for all '+n+' account'+(n===1?'':'s')+'?')) return;
  let started = 0;
  for (const u of availableUsers) {
    const resp = await fetch(API+'/api/scrape/user',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({username:u.username})});
    const data = await resp.json();
    if (!data.error) started++;
  }
  startPolling();
}
function renderAccountSelects() {
  for (const id of ['browseAccount','exportAccount']) {
    const el = document.getElementById(id);
    if (!el) continue;
    const cur = el.value;
    let html = '<option value="">All accounts</option>';
    for (const u of availableUsers) {
      const sel = cur===u.username?' selected':'';
      html += '<option value="'+esc(u.username)+'"'+sel+'>@'+esc(u.username)+' ('+fmtn(u.tweet_count)+')</option>';
    }
    el.innerHTML = html;
  }
}
function onAccountChange() {
  selectedUser = document.getElementById('browseAccount').value;
  browseTweets(0);
  loadStats(selectedUser || null);
}

// ── Type filter ──
function filterType(btn, type) {
  currentType = type;
  document.querySelectorAll('.chip').forEach(c=>c.classList.remove('active'));
  btn.classList.add('active');
  browseTweets(0);
}

// ── Browse ──
async function browseTweets(offset) {
  currentOffset = offset;
  const params = new URLSearchParams();
  const q = document.getElementById('browseQuery').value.trim();
  const s = document.getElementById('startDate').value;
  const e = document.getElementById('endDate').value;
  if (q) params.set('q', q);
  if (selectedUser) params.set('username', selectedUser);
  if (s) params.set('start_date', s);
  if (e) params.set('end_date', e);
  if (currentType) params.set('tweet_type', currentType);
  params.set('limit','20'); params.set('offset',offset);
  params.set('sort_by','created_at_ts'); params.set('sort_order','DESC');
  try {
    const resp = await fetch(API+'/api/tweets?'+params);
    const data = await resp.json();
    renderTweets(data);
  } catch(err) {}
}

function initials(name) { return esc((name||'?')[0].toUpperCase()); }
function badge(t) {
  if (t.tweet_type==='retweet'||t.is_retweet) return '<span class="t-badge badge-rt">RT</span>';
  if (t.tweet_type==='reply'&&!t.thread_id) return '<span class="t-badge badge-reply">Reply</span>';
  if (t.thread_id) return '<span class="t-badge badge-thread">Thread</span>';
  return '';
}
function tweetCard(t, isChain) {
  const date = t.created_at ? new Date(t.created_at).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}) : '';
  const url = 'https://x.com/'+(t.username||'_')+'/status/'+t.id;
  const bdg = isChain ? '' : badge(t);
  const threadBtn = (!isChain && t.thread_id && t.thread_position===1)
    ? '<span class="thread-toggle" onclick="event.preventDefault();toggleThread(\\''+t.thread_id+'\\',this)">Show thread &#8595;</span>'
    : '';
  // Image grid — prefer locally-saved copies (offline), else remote URL
  let imgs = '';
  const media = t.media_json || [];
  const photos = media.filter(m=>m.type==='photo' && (m.local||m.url));
  if (photos.length) {
    const srcs = photos.map(m => m.local ? (API+'/media/'+m.local) : m.url);
    imgs = '<div class="fb-imgs">' + srcs.slice(0,6).map((src)=>
      '<img loading="lazy" src="'+esc(src)+'" class="fb-img" onclick="fbLightbox(event,this)" title="Click to view">'
    ).join('') + '</div>';
  }
  return '<a href="'+url+'" target="_blank" rel="noopener" class="tweet">'+
    '<div class="t-meta">'+
      '<div class="t-avatar">'+initials(t.display_name||t.username)+'</div>'+
      '<span class="t-name">'+esc(t.display_name||'')+'</span>'+
      '<span class="t-handle">@'+esc(t.username||'')+'</span>'+
      bdg+
      '<span class="t-date">'+date+'</span>'+
    '</div>'+
    '<div class="t-body">'+esc(t.text||'')+'</div>'+
    imgs+
    '<div class="t-stats">'+
      '<span>&#9829; '+fmt(t.like_count)+'</span>'+
      '<span>&#8634; '+fmt(t.retweet_count)+'</span>'+
      '<span>&#8617; '+fmt(t.reply_count)+'</span>'+
      '<span>&#128065; '+fmt(t.view_count)+'</span>'+
    '</div>'+
    threadBtn+
  '</a>';
}
async function toggleThread(id, el) {
  const tweetEl = el.closest('.tweet');
  const existing = document.getElementById('tc-'+id);
  if (existing) { existing.remove(); el.innerHTML='Show thread &#8595;'; return; }
  el.textContent='Loading...';
  try {
    const resp = await fetch(API+'/api/thread/'+id);
    const data = await resp.json();
    if (data.tweets&&data.tweets.length>1) {
      const html='<div id="tc-'+id+'" class="thread-chain">'+data.tweets.slice(1).map(t=>tweetCard(t,true)).join('')+'</div>';
      tweetEl.insertAdjacentHTML('afterend',html);
      el.innerHTML='Hide thread &#8593;';
    } else { el.textContent='No more tweets in thread'; }
  } catch(e) { el.textContent='Error loading thread'; }
}
function renderTweets(data) {
  const list = document.getElementById('tweetList');
  if (!data.tweets||!data.tweets.length) {
    list.innerHTML='<div class="tweet-list"><div class="tweet-empty">No tweets found</div></div>';
    document.getElementById('pager').innerHTML='';
    return;
  }
  list.innerHTML='<div class="tweet-list">'+data.tweets.map(t=>tweetCard(t,false)).join('')+'</div>';
  const pg=document.getElementById('pager');
  const {total,limit,offset}=data;
  let html='';
  if(offset>0) html+='<button class="btn btn-ghost" onclick="browseTweets('+Math.max(0,offset-limit)+')">&#8592; Prev</button>';
  html+='<span class="info">'+(offset+1)+'&#8211;'+Math.min(offset+limit,total)+' of '+total.toLocaleString()+'</span>';
  if(offset+limit<total){
    html+='<button class="btn btn-ghost" onclick="browseTweets('+(offset+limit)+')">Next &#8594;</button>';
    const last=Math.floor((total-1)/limit)*limit;
    if(last>offset+limit) html+='<button class="btn btn-ghost" onclick="browseTweets('+last+')">Last</button>';
  }
  pg.innerHTML=html;
}

// ── Scrape ──
async function doScrapeUser() {
  const username = document.getElementById('userInput').value.trim();
  if (!username) return alert('Enter a username');
  const resp = await fetch(API+'/api/scrape/user',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({username, max_pages:optPages('userPages'), include_replies:document.getElementById('inclReplies').checked})});
  const data = await resp.json();
  if (data.error) return alert(data.error);
  startPolling();
}
async function doScrapeSearch() {
  const query = document.getElementById('searchInput').value.trim();
  if (!query) return alert('Enter a query');
  const resp = await fetch(API+'/api/scrape/search',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({query, max_pages:optPages('searchPages')})});
  const data = await resp.json();
  if (data.error) return alert(data.error);
  startPolling();
}
async function doScrapeLikes() {
  const username = document.getElementById('likesInput').value.trim();
  if (!username) return alert('Enter a username');
  const resp = await fetch(API+'/api/scrape/likes',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({username, max_pages:optPages('likesPages')})});
  const data = await resp.json();
  if (data.error) return alert(data.error);
  startPolling();
}
async function doBackfill() {
  const username = document.getElementById('backfillInput').value.trim();
  const years = parseInt(document.getElementById('backfillYears').value)||2;
  if (!username) return alert('Enter a username');
  const resp = await fetch(API+'/api/scrape/backfill/user',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({username, years, max_pages:15})});
  const data = await resp.json();
  if (data.error) return alert(data.error);
  startPolling();
}
async function cancelJob(id) {
  await fetch(API+'/api/scrape/cancel/'+id,{method:'POST'});
  pollJobs();
}

// ── Job polling ──
function startPolling() {
  if (pollTimer) return;
  pollJobs();
  pollTimer = setInterval(pollJobs, 2500);
}
async function pollJobs() {
  try {
    const resp = await fetch(API+'/api/scrape/status');
    activeJobs = await resp.json();
    renderJobs(activeJobs);
    renderSavedAccounts();
    if (!Object.values(activeJobs).some(j=>j.status==='running') && pollTimer) {
      clearInterval(pollTimer); pollTimer=null;
      loadStats(); loadUsers(); browseTweets(currentOffset);
      if (currentPlatform==='facebook') { loadFbStats(); loadFbUsers(); browseFbPosts(0); }
    }
  } catch(e) {}
}
function renderJobs(jobs) {
  const list = document.getElementById('jobsList');
  const entries = Object.entries(jobs);
  if (!entries.length) { list.innerHTML='<div class="no-jobs">No active scrapes</div>'; return; }
  let html='';
  for (const [id,job] of entries) {
    const st=job.status||'running';
    const lbl=job.label||id;
    const p=job.progress||{};
    let prog='', action='';
    if (st==='running') {
      prog = p.message ? esc(p.message) : (p.status==='rate_limited' ? 'Rate limited, waiting '+(p.wait_seconds||'?')+'s' : 'Page '+(p.page||0)+' &middot; '+(p.total_new||0)+' tweets');
      action='<span class="job-action stop" onclick="cancelJob(\\''+id+'\\')">Stop</span>';
    } else if (st==='complete') {
      const r = job.result||{};
      prog = 'Done &mdash; '+(r.new_posts!=null ? r.new_posts+' new posts' : (r.new_tweets||0)+' new tweets');
      action='<span class="job-action dismiss" onclick="dismissJob(\\''+id+'\\')">&#10005;</span>';
    } else if (st==='cancelled') {
      prog='Cancelled';
      action='<span class="job-action dismiss" onclick="dismissJob(\\''+id+'\\')">&#10005;</span>';
    } else if (st==='error') {
      if (job.auth_required) {
        prog='&#128274; Login required — <span style="color:var(--accent);cursor:pointer;" onclick="goConnectFb()">Connect Facebook account</span>';
      } else {
        prog='Error: '+esc(job.error||'unknown');
      }
      action='<span class="job-action dismiss" onclick="dismissJob(\\''+id+'\\')">&#10005;</span>';
    }
    html+='<div class="job-card" id="job-'+id+'">'+
      '<div class="job-head"><div class="job-dot '+st+'"></div><div class="job-name">'+esc(lbl)+'</div>'+action+'</div>'+
      '<div class="job-prog">'+prog+'</div>'+
    '</div>';
  }
  list.innerHTML=html;
}
async function dismissJob(id) {
  await fetch(API+'/api/scrape/job/'+id,{method:'DELETE'}).catch(()=>{});
  const el=document.getElementById('job-'+id);
  if(el) el.remove();
  if(!document.querySelector('.job-card')) document.getElementById('jobsList').innerHTML='<div class="no-jobs">No active scrapes</div>';
}

// ── Groups ──
async function loadGroups() {
  try {
    const resp = await fetch(API+'/api/groups');
    const data = await resp.json();
    renderGroups(data.groups || [], data.uncategorized || []);
  } catch(e) {}
}
function renderGroups(groups, uncategorized) {
  const el = document.getElementById('groupsList');
  if (!el) return;
  if (!groups.length && !uncategorized.length) {
    el.innerHTML = '<div class="no-jobs" style="padding:24px 0;">No groups yet — create one above</div>';
    return;
  }
  let html = '';
  for (const g of groups) {
    const name = g.name;
    html += '<div class="group-card">';
    // Header
    html += '<div class="group-head">';
    html += '<span class="group-name">'+esc(name)+'</span>';
    html += '<span class="group-count">'+g.accounts.length+' account'+(g.accounts.length===1?'':'s')+'</span>';
    html += '<div class="group-actions">';
    html += '<button class="btn btn-ghost" style="font-size:12px;padding:5px 10px;" data-group="'+esc(name)+'" onclick="updateGroupAll(this.dataset.group)">&#8635; Update All</button>';
    html += '<button class="btn btn-ghost" style="font-size:12px;padding:5px 10px;" data-group="'+esc(name)+'" onclick="exportGroupAI(this.dataset.group)">AI Export</button>';
    html += '<button class="btn btn-ghost" style="font-size:12px;padding:5px 10px;color:var(--muted);" data-group="'+esc(name)+'" onclick="renameGroupPrompt(this.dataset.group)">Rename</button>';
    html += '<button class="btn btn-ghost" style="font-size:12px;padding:5px 10px;color:var(--red);" data-group="'+esc(name)+'" onclick="deleteGroupConfirm(this.dataset.group)">Delete</button>';
    html += '</div></div>';
    // Accounts
    html += '<div class="group-body">';
    if (!g.accounts.length) {
      html += '<div style="font-size:13px;color:var(--muted);font-style:italic;">No accounts yet — add one below</div>';
    }
    for (const u of g.accounts) {
      const newest = u.newest_tweet ? new Date(u.newest_tweet).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}) : '–';
      html += '<div class="acct-row">';
      html += '<div class="acct-avatar">'+esc((u.display_name||u.username||'?')[0].toUpperCase())+'</div>';
      html += '<div class="acct-info"><div class="acct-name">@'+esc(u.username)+'</div>';
      html += '<div class="acct-meta">'+fmtn(u.tweet_count)+' tweets &middot; '+esc(newest)+'</div></div>';
      html += '<button class="btn btn-ghost" style="font-size:12px;padding:4px 8px;color:var(--muted);" data-group="'+esc(name)+'" data-user="'+esc(u.username)+'" onclick="removeFromGroup(this.dataset.group,this.dataset.user)" title="Remove from group">&#10005;</button>';
      html += '</div>';
    }
    html += '</div>';
    // Add account row
    html += '<div class="group-add">';
    html += '<select style="width:100%;font-size:13px;" data-group="'+esc(name)+'" onchange="addToGroupFromSelect(this)">';
    html += '<option value="">+ Add account to this group...</option>';
    const inGroup = new Set(g.accounts.map(a => a.username));
    for (const u of availableUsers) {
      if (!inGroup.has(u.username)) {
        html += '<option value="'+esc(u.username)+'">@'+esc(u.username)+'</option>';
      }
    }
    html += '</select></div>';
    html += '</div>'; // group-card
  }
  // Uncategorized
  if (uncategorized.length) {
    html += '<div class="group-card" style="border-style:dashed;opacity:0.7;">';
    html += '<div class="group-head"><span class="group-name uncategorized-head">Ungrouped</span>';
    html += '<span class="group-count">'+uncategorized.length+' account'+(uncategorized.length===1?'':'s')+'</span></div>';
    html += '<div class="group-body">';
    for (const u of uncategorized) {
      html += '<div class="acct-row">';
      html += '<div class="acct-avatar">'+esc((u.display_name||u.username||'?')[0].toUpperCase())+'</div>';
      html += '<div class="acct-info"><div class="acct-name">@'+esc(u.username)+'</div>';
      html += '<div class="acct-meta">'+fmtn(u.tweet_count)+' tweets</div></div>';
      html += '</div>';
    }
    html += '</div></div>';
  }
  el.innerHTML = html;
}
async function createGroup() {
  const inp = document.getElementById('newGroupInput');
  const name = (inp.value || '').trim();
  if (!name) return inp.focus();
  await fetch(API+'/api/groups', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({name})});
  inp.value = '';
  // Create with first account if none yet — just reload to show empty group
  // Since backend doesn't store empty groups, we seed with a placeholder fetch then reload
  loadGroups();
}
async function deleteGroupConfirm(name) {
  if (!confirm('Delete group "'+name+'"? Accounts will not be deleted, only the grouping.')) return;
  await fetch(API+'/api/groups/'+encodeURIComponent(name), {method:'DELETE'});
  loadGroups();
}
async function renameGroupPrompt(name) {
  const newName = prompt('Rename group:', name);
  if (!newName || newName.trim() === name) return;
  await fetch(API+'/api/groups/'+encodeURIComponent(name), {
    method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({name: newName.trim()})
  });
  loadGroups();
}
async function addToGroupFromSelect(select) {
  const group = select.dataset.group;
  const username = select.value;
  if (!username) return;
  select.value = '';
  await fetch(API+'/api/groups/'+encodeURIComponent(group)+'/accounts', {
    method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({username})
  });
  loadGroups();
}
async function removeFromGroup(group, username) {
  await fetch(API+'/api/groups/'+encodeURIComponent(group)+'/accounts/'+encodeURIComponent(username), {method:'DELETE'});
  loadGroups();
}
async function updateGroupAll(group) {
  const resp = await fetch(API+'/api/groups');
  const data = await resp.json();
  const g = (data.groups||[]).find(x=>x.name===group);
  if (!g || !g.accounts.length) return alert('No accounts in this group');
  if (!confirm('Start update scrape for all '+g.accounts.length+' accounts in "'+group+'"?')) return;
  let started = 0;
  for (const u of g.accounts) {
    const r = await fetch(API+'/api/scrape/user',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:u.username})});
    const d = await r.json();
    if (!d.error) started++;
  }
  startPolling();
  switchTab('scrape', document.querySelector('.tbtab:nth-child(2)'));
}
function exportGroupAI(group) {
  let url = API+'/api/export/ai/group/'+encodeURIComponent(group);
  url += '?include_replies=false&include_retweets=false&include_dates=true';
  window.open(url,'_blank');
}

// ── Export ──
function onExportAccountChange() {
  const user = document.getElementById('exportAccount').value;
  const el = document.getElementById('exportTweetCount');
  if (!el) return;
  if (!user) { el.textContent = ''; return; }
  const u = availableUsers.find(a => a.username === user);
  el.textContent = u ? fmtn(u.tweet_count) + ' tweets' : '';
}
function doExport(fmt) {
  const user=document.getElementById('exportAccount').value;
  let url=API+'/api/export?format='+fmt;
  if(user) url+='&username='+encodeURIComponent(user);
  window.open(url,'_blank');
}
function doExportAI() {
  const user = document.getElementById('exportAccount').value;
  if (!user) return alert('Select an account first — AI export is per-account');
  const includeReplies = document.getElementById('aiIncludeReplies').checked;
  const includeRetweets = document.getElementById('aiIncludeRetweets').checked;
  const includeDates = document.getElementById('aiIncludeDates').checked;
  const minLikes = parseInt(document.getElementById('aiMinLikes').value) || 0;
  let url = API+'/api/export/ai?username='+encodeURIComponent(user);
  if (includeReplies) url += '&include_replies=true';
  if (includeRetweets) url += '&include_retweets=true';
  if (!includeDates) url += '&include_dates=false';
  if (minLikes > 0) url += '&min_likes='+minLikes;
  window.open(url, '_blank');
}

// ── Platform switcher ──
let currentPlatform = 'twitter';
function switchPlatform(name, btn) {
  currentPlatform = name;
  try { localStorage.setItem('activePlatform', name); } catch(e) {}
  document.querySelectorAll('.ptab').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.platform-wrap').forEach(p=>p.classList.remove('active'));
  document.getElementById('platform-'+name).classList.add('active');
  // Sidebar: show correct auth + stats
  document.getElementById('twAuthSection').classList.toggle('hidden', name!=='twitter');
  document.getElementById('fbAuthSection').classList.toggle('hidden', name!=='facebook');
  document.getElementById('twStatsSection').classList.toggle('hidden', name!=='twitter');
  document.getElementById('fbStatsSection').classList.toggle('hidden', name!=='facebook');
  if (name==='facebook') {
    checkFbAuth();
    loadFbStats();
    loadFbUsers();
    browseFbPosts(0);
  }
}

// ── Facebook Auth ──
async function startFbBrowserLogin() {
  const btn = document.querySelector('#fbAuthPanel .btn-primary');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Opening browser…'; }
  try {
    const resp = await fetch(API+'/api/fb/setup/browser-login', {method:'POST'});
    const data = await resp.json();
    if (data.error) { alert(data.error); return; }
    startPolling();
    // poll until job is done, then refresh auth status
    const check = setInterval(async () => {
      const s = await fetch(API+'/api/scrape/status').then(r=>r.json());
      const job = s['fb_browser_login'];
      if (!job || job.status === 'running') return;
      clearInterval(check);
      if (btn) { btn.disabled = false; btn.innerHTML = '&#127758; Open Login Window'; }
      if (job.status === 'complete') {
        document.getElementById('fbAuthPanel').classList.add('hidden');
        checkFbAuth();
        loadFbStats();
      } else {
        alert('Login failed: ' + (job.error || 'unknown error'));
      }
    }, 2000);
  } catch(e) {
    if (btn) { btn.disabled = false; btn.innerHTML = '&#127758; Open Login Window'; }
    alert('Error: ' + e.message);
  }
}
function goConnectFb() {
  switchPlatform('facebook', document.getElementById('ptab-facebook'));
  toggleFbAuthPanel();
}
async function checkFbAuth() {
  try {
    const resp = await fetch(API+'/api/fb/health');
    const data = await resp.json();
    const dot  = document.getElementById('fbAuthDot');
    const name = document.getElementById('fbAuthName');
    const btn  = document.getElementById('fbAuthBtn');
    if (data.authenticated) {
      dot.className = 'auth-dot ok';
      name.textContent = 'Connected (uid: '+(data.user&&data.user.user_id||'?')+')';
      btn.textContent = 'Change';
      document.getElementById('fbAuthPanel').classList.add('hidden');
    } else {
      dot.className = 'auth-dot err';
      name.textContent = 'Not connected';
      btn.textContent = 'Connect';
    }
  } catch(e) {}
}
function toggleFbAuthPanel() {
  document.getElementById('fbAuthPanel').classList.toggle('hidden');
}
async function importFbCookies() {
  const text = document.getElementById('fbCookieInput').value.trim();
  if (!text) return alert('Paste your Facebook cookies JSON first');
  let json;
  try { json = JSON.parse(text); } catch(e) { return alert('Invalid JSON'); }
  const resp = await fetch(API+'/api/fb/setup/json', {
    method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(json)
  });
  const data = await resp.json();
  if (data.status==='ok') {
    document.getElementById('fbCookieInput').value = '';
    checkFbAuth();
  } else {
    alert(data.error||'Failed to connect');
  }
}

// ── Facebook Stats ──
async function loadFbStats(username) {
  // Chip counts reflect the active filters (page + search word + dates).
  const params = new URLSearchParams();
  const u = (username !== undefined) ? username : fbSelectedUser;
  const q = (document.getElementById('fbBrowseQuery')||{}).value;
  const s = (document.getElementById('fbStartDate')||{}).value;
  const e = (document.getElementById('fbEndDate')||{}).value;
  if (u) params.set('username', u);
  if (q && q.trim()) params.set('q', q.trim());
  if (s) params.set('start_date', s);
  if (e) params.set('end_date', e);
  const filtered = !!(u || (q && q.trim()) || s || e);
  try {
    const resp = await fetch(API+'/api/fb/stats?'+params);
    const data = await resp.json();
    // Sidebar shows the whole-archive totals — only when nothing is filtered.
    if (!filtered) {
      const set = (id,v) => { const el=document.getElementById(id); if(el) el.textContent=fmtn(v); };
      set('fbStatTotal',  data.total_posts);
      set('fbStatPages',  data.unique_pages);
      set('fbStatPhotos', data.total_photos);
      set('fbStatVideos', data.total_videos);
    }
    const c = (id,v) => { const el=document.getElementById(id); if(el) el.textContent=v!=null?' ('+fmtn(v)+')':''; };
    c('fbCountAll',   data.total_posts);
    c('fbCountPost',  (data.total_posts||0)-(data.total_photos||0)-(data.total_videos||0));
    c('fbCountPhoto', data.total_photos);
    c('fbCountVideo', data.total_videos);
  } catch(e) {}
}

// ── Facebook Users ──
let fbUsers = [];
async function loadFbUsers() {
  try {
    const resp = await fetch(API+'/api/fb/users');
    fbUsers = await resp.json();
    renderFbAccountSelects();
    renderFbSavedPages();
  } catch(e) {}
}
function renderFbAccountSelects() {
  for (const id of ['fbBrowseAccount','fbExportAccount']) {
    const el = document.getElementById(id);
    if (!el) continue;
    const cur = el.value;
    let html = '<option value="">All pages</option>';
    for (const u of fbUsers) {
      const sel = cur===u.author_username?' selected':'';
      html += '<option value="'+esc(u.author_username)+'"'+sel+'>'+esc(u.author_username)+' ('+fmtn(u.post_count)+')</option>';
    }
    el.innerHTML = html;
  }
}
function renderFbSavedPages() {
  // Autocomplete datalist on the scrape input — type to re-enter a page name
  const dl = document.getElementById('fbPagesDatalist');
  if (dl) dl.innerHTML = fbUsers.map(u=>'<option value="'+esc(u.author_username)+'">').join('');

  const el = document.getElementById('fbSavedPagesList');
  if (!el) return;
  if (!fbUsers.length) {
    el.innerHTML = '<div class="no-jobs">No pages scraped yet</div>';
    return;
  }
  el.innerHTML = fbUsers.map(u => {
    const newest = u.newest_post ? new Date(u.newest_post).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}) : '–';
    const isRunning = Object.values(activeJobs).some(j=>j.status==='running'&&j.username===u.author_username&&j.platform==='facebook');
    const partial = u.scrape_status === 'cancelled';
    const statusTag = isRunning ? ''
      : (partial
          ? ' &middot; <span style="color:var(--orange);">&#9680; partial</span>'
          : (u.scrape_status === 'complete'
              ? ' &middot; <span style="color:var(--green);">&#10003; complete</span>' : ''));
    const btnDis = isRunning ? ' disabled' : '';
    const btnTxt = isRunning ? '&#8987; Running' : (partial ? '&#9654; Resume' : '&#8635; Update');
    return '<div class="acct-row">'+
      '<div class="fb-avatar">'+esc((u.author_name||u.author_username||'?')[0].toUpperCase())+'</div>'+
      '<div class="acct-info" style="cursor:pointer;" title="Click to put this name in the scrape box" data-user="'+esc(u.author_username)+'" onclick="fbFillInput(this.dataset.user)">'+
        '<div class="acct-name">'+esc(u.author_username)+'</div>'+
        '<div class="acct-meta">'+fmtn(u.post_count)+' posts &middot; latest: '+esc(newest)+statusTag+'</div>'+
      '</div>'+
      '<div class="acct-actions">'+
        '<button class="btn btn-ghost" style="font-size:12px;padding:5px 10px;" data-user="'+esc(u.author_username)+'"'+btnDis+' onclick="fbQuickUpdate(this.dataset.user)">'+btnTxt+'</button>'+
      '</div>'+
    '</div>';
  }).join('');
}
function fbFillInput(page_name) {
  const input = document.getElementById('fbPageInput');
  input.value = page_name;
  input.focus();
}
function fbQuickUpdate(page_name) {
  document.getElementById('fbPageInput').value = page_name;
  doFbScrapePage(true);
}
async function fbUpdateAll() {
  if (!fbUsers.length) return alert('No pages to update');
  const n = fbUsers.length;
  if (!confirm('Start update scrape for all '+n+' page'+(n===1?'':'s')+'?')) return;
  for (const u of fbUsers) {
    const resp = await fetch(API+'/api/fb/scrape/page',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({page_name:u.author_username})});
    await resp.json();
  }
  startPolling();
}

// ── Facebook Tab switching ──
let fbCurrentType = null;
let fbSelectedUser = '';
function switchFbTab(name, btn) {
  document.querySelectorAll('#platform-facebook .tbtab').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  ['browse','scrape','groups','export'].forEach(t=>{
    const el = document.getElementById('fb-tab-'+t);
    if (el) el.classList.toggle('hidden', t!==name);
    if (el) el.classList.toggle('active', t===name);
  });
  if (name==='groups') loadFbGroups();
  if (name==='scrape') renderFbSavedPages();
}
function switchFbScrapeTab(name, btn) {
  document.querySelectorAll('#fb-tab-scrape .stab').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('#fb-tab-scrape .sform').forEach(s=>s.classList.add('hidden'));
  const el = document.getElementById('fb-st-'+name);
  if (el) el.classList.remove('hidden');
}
function onFbAccountChange() {
  fbSelectedUser = document.getElementById('fbBrowseAccount').value;
  browseFbPosts(0);
  loadFbStats(fbSelectedUser || null);
}
function fbFilterType(btn, type) {
  fbCurrentType = type;
  document.querySelectorAll('#fb-tab-browse .chip').forEach(c=>c.classList.remove('active'));
  btn.classList.add('active');
  browseFbPosts(0);
}

// ── Facebook Browse ──
async function browseFbPosts(offset) {
  const params = new URLSearchParams();
  const q = document.getElementById('fbBrowseQuery').value.trim();
  const s = document.getElementById('fbStartDate').value;
  const e = document.getElementById('fbEndDate').value;
  if (q) params.set('q', q);
  if (fbSelectedUser) params.set('username', fbSelectedUser);
  if (s) params.set('start_date', s);
  if (e) params.set('end_date', e);
  if (fbCurrentType) params.set('post_type', fbCurrentType);
  params.set('limit','20'); params.set('offset', offset);
  try {
    const resp = await fetch(API+'/api/fb/posts?'+params);
    const data = await resp.json();
    renderFbPosts(data, offset);
    loadFbStats();   // refresh chip counts to match the active search/filter
  } catch(err) {}
}
function fbCopyText(ev, el) {
  ev.preventDefault();
  ev.stopPropagation();
  const text = el.dataset.copy || '';
  const done = () => {
    el.classList.add('copied-flash');
    setTimeout(()=>el.classList.remove('copied-flash'), 400);
    showToast('Copied');
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done).catch(()=>fallbackCopy(text, done));
  } else {
    fallbackCopy(text, done);
  }
  return false;
}
function fallbackCopy(text, done) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed'; ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); done(); } catch(e) {}
  document.body.removeChild(ta);
}
let _toastTimer = null;
function showToast(msg) {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(()=>t.classList.remove('show'), 1300);
}

// ── Image lightbox ──
let _lbSrcs = [];
let _lbIdx = 0;
function fbLightbox(ev, img) {
  ev.preventDefault();
  ev.stopPropagation();
  const grid = img.closest('.fb-imgs');
  const imgs = grid ? Array.from(grid.querySelectorAll('img.fb-img')) : [img];
  _lbSrcs = imgs.map(i => i.src);
  _lbIdx = Math.max(0, imgs.indexOf(img));
  lbRender();
  document.getElementById('lightbox').classList.add('show');
}
function lbRender() {
  const im = document.getElementById('lbImg');
  if (im) im.src = _lbSrcs[_lbIdx] || '';
  const counter = document.getElementById('lbCounter');
  if (counter) counter.textContent = _lbSrcs.length > 1 ? (_lbIdx+1)+' / '+_lbSrcs.length : '';
  const multi = _lbSrcs.length > 1;
  document.getElementById('lbPrev').style.display = multi ? '' : 'none';
  document.getElementById('lbNext').style.display = multi ? '' : 'none';
}
function lbStep(ev, d) {
  if (ev) ev.stopPropagation();
  if (!_lbSrcs.length) return;
  _lbIdx = (_lbIdx + d + _lbSrcs.length) % _lbSrcs.length;
  lbRender();
}
function lbClose() {
  document.getElementById('lightbox').classList.remove('show');
}
document.addEventListener('keydown', (e)=>{
  const lb = document.getElementById('lightbox');
  if (!lb || !lb.classList.contains('show')) return;
  if (e.key === 'Escape') lbClose();
  else if (e.key === 'ArrowLeft') lbStep(null, -1);
  else if (e.key === 'ArrowRight') lbStep(null, 1);
});
function fbPostCard(p) {
  const date = p.created_at ? new Date(p.created_at).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}) : '';
  const url = p.post_url || '';
  let badge = '';
  if (p.post_type==='photo') badge = '<span class="t-badge badge-fb-photo">Photo</span>';
  else if (p.post_type==='video') badge = '<span class="t-badge badge-fb-video">Video</span>';
  else if (p.post_type==='share') badge = '<span class="t-badge badge-fb-share">Share</span>';

  // Image grid — prefer locally-saved copies (offline), else remote URL.
  // Each image carries the full photo list of its post for the lightbox.
  let imgs = '';
  const photos = (p.media||[]).filter(m=>m.type==='photo' && (m.local||m.url));
  if (photos.length) {
    const srcs = photos.map(m => m.local ? (API+'/media/'+m.local) : m.url);
    imgs = '<div class="fb-imgs">' + srcs.slice(0,6).map((src)=>
      '<img loading="lazy" src="'+esc(src)+'" class="fb-img" onclick="fbLightbox(event,this)" title="Click to view">'
    ).join('') + '</div>';
  }

  // URL icon → opens the original post in Facebook
  const linkBtn = url
    ? '<a class="fb-link-btn" href="'+esc(url)+'" target="_blank" rel="noopener" title="Open post in Facebook" onclick="event.stopPropagation()">&#128279;</a>'
    : '';
  // Clicking the text copies it
  const bodyAttrs = (p.text||'').trim()
    ? ' data-copy="'+esc(p.text||'')+'" onclick="fbCopyText(event,this)" title="Click to copy text" style="cursor:pointer;"'
    : '';

  return '<div class="fb-post">'+
    '<div class="fb-meta">'+
      '<div class="fb-avatar">'+esc((p.author_name||p.author_username||'?')[0].toUpperCase())+'</div>'+
      '<span class="fb-name">'+esc(p.author_name||p.author_username||'')+'</span>'+
      badge+
      '<span class="fb-date">'+date+'</span>'+
      linkBtn+
    '</div>'+
    '<div class="fb-body"'+bodyAttrs+'>'+esc(p.text||'')+'</div>'+
    imgs+
    '<div class="fb-stats">'+
      '<span>&#128077; '+fmt(p.likes)+'</span>'+
      '<span>&#128172; '+fmt(p.comments)+'</span>'+
      '<span>&#8634; '+fmt(p.shares)+'</span>'+
      (p.views ? '<span>&#128065; '+fmt(p.views)+'</span>' : '')+
    '</div>'+
  '</div>';
}
function renderFbPosts(data, offset) {
  const list = document.getElementById('fbPostList');
  if (!data.posts||!data.posts.length) {
    list.innerHTML='<div class="tweet-list"><div class="tweet-empty">No posts found</div></div>';
    document.getElementById('fbPager').innerHTML='';
    return;
  }
  list.innerHTML='<div class="tweet-list">'+data.posts.map(p=>fbPostCard(p)).join('')+'</div>';
  const pg=document.getElementById('fbPager');
  const {total,limit}=data;
  let html='';
  if(offset>0){
    html+='<button class="btn btn-ghost" onclick="browseFbPosts(0)">&#8592;&#8592; First</button>';
    html+='<button class="btn btn-ghost" onclick="browseFbPosts('+Math.max(0,offset-limit)+')">&#8592; Prev</button>';
  }
  html+='<span class="info">'+(offset+1)+'&#8211;'+Math.min(offset+limit,total)+' of '+total.toLocaleString()+'</span>';
  if(offset+limit<total){
    html+='<button class="btn btn-ghost" onclick="browseFbPosts('+(offset+limit)+')">Next &#8594;</button>';
    const last=Math.floor((total-1)/limit)*limit;
    if(last>offset+limit) html+='<button class="btn btn-ghost" onclick="browseFbPosts('+last+')">Last &#8594;&#8594;</button>';
  }
  pg.innerHTML=html;
}

// ── Facebook Scrape ──
function fbPageNameFromInput() {
  let raw = document.getElementById('fbPageInput').value.trim();
  if (!raw) return null;
  if (raw.includes('facebook.com/')) {
    const profileId = raw.match(/facebook[.]com[/](profile[.]php[?][^# ]+)/);
    const slug = raw.match(/facebook[.]com[/]([^/?#]+)/);
    raw = profileId ? profileId[1] : (slug ? slug[1] : raw);
  }
  return raw.replace(/^@/, '').replace(/[/]$/, '');
}
async function doFbScrapePage(withImages) {
  if (withImages === undefined) withImages = true;  // images by default
  const page_name = fbPageNameFromInput();
  if (!page_name) return alert('Enter a page slug or URL');
  const resp = await fetch(API+'/api/fb/scrape/page',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({page_name, max_pages:optPages('fbPages'), download_images: !!withImages})});
  const data = await resp.json();
  if (data.error) return alert(data.error);
  document.getElementById('fbPageInput').value = '';
  startPolling();
}

// ── Facebook Groups ──
async function loadFbGroups() {
  try {
    const resp = await fetch(API+'/api/fb/groups');
    const data = await resp.json();
    renderFbGroups(data.groups||[], data.uncategorized||[]);
  } catch(e) {}
}
function renderFbGroups(groups, uncategorized) {
  const el = document.getElementById('fbGroupsList');
  if (!el) return;
  if (!groups.length && !uncategorized.length) {
    el.innerHTML = '<div class="no-jobs" style="padding:24px 0;">No groups yet — create one above</div>';
    return;
  }
  let html = '';
  for (const g of groups) {
    const name = g.name;
    html += '<div class="group-card">';
    html += '<div class="group-head">';
    html += '<span class="group-name">'+esc(name)+'</span>';
    html += '<span class="group-count">'+g.accounts.length+' page'+(g.accounts.length===1?'':'s')+'</span>';
    html += '<div class="group-actions">';
    html += '<button class="btn btn-ghost" style="font-size:12px;padding:5px 10px;" data-group="'+esc(name)+'" onclick="fbUpdateGroupAll(this.dataset.group)">&#8635; Update All</button>';
    html += '<button class="btn btn-ghost" style="font-size:12px;padding:5px 10px;" data-group="'+esc(name)+'" onclick="exportFbGroupAI(this.dataset.group)">AI Export</button>';
    html += '<button class="btn btn-ghost" style="font-size:12px;padding:5px 10px;color:var(--muted);" data-group="'+esc(name)+'" onclick="renameFbGroupPrompt(this.dataset.group)">Rename</button>';
    html += '<button class="btn btn-ghost" style="font-size:12px;padding:5px 10px;color:var(--red);" data-group="'+esc(name)+'" onclick="deleteFbGroupConfirm(this.dataset.group)">Delete</button>';
    html += '</div></div>';
    html += '<div class="group-body">';
    if (!g.accounts.length) html += '<div style="font-size:13px;color:var(--muted);font-style:italic;">No pages yet — add one below</div>';
    for (const u of g.accounts) {
      const newest = u.newest_post ? new Date(u.newest_post).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}) : '–';
      html += '<div class="acct-row">';
      html += '<div class="fb-avatar">'+esc((u.author_name||u.username||'?')[0].toUpperCase())+'</div>';
      html += '<div class="acct-info"><div class="acct-name">'+esc(u.username)+'</div>';
      html += '<div class="acct-meta">'+fmtn(u.post_count)+' posts &middot; '+esc(newest)+'</div></div>';
      html += '<button class="btn btn-ghost" style="font-size:12px;padding:4px 8px;color:var(--muted);" data-group="'+esc(name)+'" data-user="'+esc(u.username)+'" onclick="removeFbFromGroup(this.dataset.group,this.dataset.user)" title="Remove">&#10005;</button>';
      html += '</div>';
    }
    html += '</div>';
    html += '<div class="group-add">';
    html += '<select style="width:100%;font-size:13px;" data-group="'+esc(name)+'" onchange="addFbToGroupFromSelect(this)">';
    html += '<option value="">+ Add page to this group...</option>';
    const inGroup = new Set(g.accounts.map(a => a.username));
    for (const u of fbUsers) {
      if (!inGroup.has(u.author_username)) {
        html += '<option value="'+esc(u.author_username)+'">'+esc(u.author_username)+'</option>';
      }
    }
    html += '</select></div>';
    html += '</div>';
  }
  if (uncategorized.length) {
    html += '<div class="group-card" style="border-style:dashed;opacity:0.7;">';
    html += '<div class="group-head"><span class="group-name uncategorized-head">Ungrouped</span>';
    html += '<span class="group-count">'+uncategorized.length+' page'+(uncategorized.length===1?'':'s')+'</span></div>';
    html += '<div class="group-body">';
    for (const u of uncategorized) {
      html += '<div class="acct-row">';
      html += '<div class="fb-avatar">'+esc((u.author_name||u.author_username||'?')[0].toUpperCase())+'</div>';
      html += '<div class="acct-info"><div class="acct-name">'+esc(u.author_username)+'</div>';
      html += '<div class="acct-meta">'+fmtn(u.post_count)+' posts</div></div>';
      html += '</div>';
    }
    html += '</div></div>';
  }
  el.innerHTML = html;
}
async function createFbGroup() {
  const inp = document.getElementById('fbNewGroupInput');
  const name = (inp.value||'').trim();
  if (!name) return inp.focus();
  await fetch(API+'/api/fb/groups',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name})});
  inp.value = '';
  loadFbGroups();
}
async function deleteFbGroupConfirm(name) {
  if (!confirm('Delete group "'+name+'"?')) return;
  await fetch(API+'/api/fb/groups/'+encodeURIComponent(name),{method:'DELETE'});
  loadFbGroups();
}
async function renameFbGroupPrompt(name) {
  const newName = prompt('Rename group:',name);
  if (!newName||newName.trim()===name) return;
  await fetch(API+'/api/fb/groups/'+encodeURIComponent(name),{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:newName.trim()})});
  loadFbGroups();
}
async function addFbToGroupFromSelect(select) {
  const group = select.dataset.group;
  const username = select.value;
  if (!username) return;
  select.value = '';
  await fetch(API+'/api/fb/groups/'+encodeURIComponent(group)+'/accounts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username})});
  loadFbGroups();
}
async function removeFbFromGroup(group, username) {
  await fetch(API+'/api/fb/groups/'+encodeURIComponent(group)+'/accounts/'+encodeURIComponent(username),{method:'DELETE'});
  loadFbGroups();
}
async function fbUpdateGroupAll(group) {
  const resp = await fetch(API+'/api/fb/groups');
  const data = await resp.json();
  const g = (data.groups||[]).find(x=>x.name===group);
  if (!g||!g.accounts.length) return alert('No pages in this group');
  if (!confirm('Update all '+g.accounts.length+' pages in "'+group+'"?')) return;
  for (const u of g.accounts) {
    await fetch(API+'/api/fb/scrape/page',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({page_name:u.username})});
  }
  startPolling();
}
function exportFbGroupAI(group) {
  window.open(API+'/api/fb/export/ai/group/'+encodeURIComponent(group)+'?include_dates=true','_blank');
}

// ── Facebook Export ──
function onFbExportAccountChange() {
  const user = document.getElementById('fbExportAccount').value;
  const el = document.getElementById('fbExportPostCount');
  if (!el) return;
  if (!user) { el.textContent=''; return; }
  const u = fbUsers.find(a=>a.author_username===user);
  el.textContent = u ? fmtn(u.post_count)+' posts' : '';
}
function doFbExport(fmt) {
  const user = document.getElementById('fbExportAccount').value;
  let url = API+'/api/fb/export?format='+fmt;
  if (user) url += '&username='+encodeURIComponent(user);
  window.open(url,'_blank');
}
function doFbExportAI() {
  const user = document.getElementById('fbExportAccount').value;
  if (!user) return alert('Select a page first — AI export is per-page');
  const includeDates = document.getElementById('fbAiIncludeDates').checked;
  const minLikes = parseInt(document.getElementById('fbAiMinLikes').value)||0;
  let url = API+'/api/fb/export/ai?username='+encodeURIComponent(user);
  if (!includeDates) url += '&include_dates=false';
  if (minLikes>0) url += '&min_likes='+minLikes;
  window.open(url,'_blank');
}

// ── Init ──
checkAuth();
loadUsers();
browseTweets(0);
// Restore the last platform the user was on (Twitter / Facebook)
(function(){
  let saved = 'twitter';
  try { saved = localStorage.getItem('activePlatform') || 'twitter'; } catch(e) {}
  if (saved === 'facebook') {
    switchPlatform('facebook', document.getElementById('ptab-facebook'));
  }
})();
(async function(){
  try {
    const resp=await fetch(API+'/api/scrape/status');
    const jobs=await resp.json();
    if(Object.keys(jobs).length){
      renderJobs(jobs);
      if(Object.values(jobs).some(j=>j.status==='running')) startPolling();
    }
  } catch(e){}
})();
</script>
</body>
</html>
"""



if __name__ == "__main__":
    print("=" * 50)
    print("  Social Analyzer")
    print("  Open http://localhost:5001 in your browser")
    print("=" * 50)
    stats_data = get_stats()
    fb_stats = get_fb_stats()
    print(f"  Tweets in DB:    {stats_data['total_tweets']}")
    print(f"  FB posts in DB:  {fb_stats['total_posts']}")
    if not scraper.is_authenticated():
        print("  Auth: NOT CONFIGURED - visit the web UI to set up")
    else:
        print("  Auth: Configured")
    print("=" * 50)
    app.run(host="0.0.0.0", port=5001, debug=True)
