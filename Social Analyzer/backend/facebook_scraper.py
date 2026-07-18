"""
Facebook post scraper using Playwright (headless Chromium).
Intercepts the GraphQL feed API to get clean structured post data.
"""

import json
import os
import re
import time
from datetime import datetime

CONFIG_PATH = os.path.join(os.path.dirname(__file__), "config.json")


class AuthRequiredError(Exception):
    """Raised when Facebook shows a login wall."""


class FacebookScraper:
    def __init__(self):
        self._cookies = self._load_config()

    # ── Config ────────────────────────────────────────────

    def _load_config(self):
        try:
            with open(CONFIG_PATH) as f:
                cfg = json.load(f)
            return cfg.get("facebook_cookies") or {
                k: cfg.get("facebook", {}).get(k, "")
                for k in ("c_user", "xs")
            }
        except (FileNotFoundError, json.JSONDecodeError):
            return {}

    def save_config(self, cookies_dict: dict):
        try:
            with open(CONFIG_PATH) as f:
                cfg = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            cfg = {}
        cfg["facebook"] = {
            "c_user": cookies_dict.get("c_user", ""),
            "xs": cookies_dict.get("xs", ""),
        }
        cfg["facebook_cookies"] = cookies_dict
        with open(CONFIG_PATH, "w") as f:
            json.dump(cfg, f, indent=2)
        self._cookies = cookies_dict

    def save_config_from_list(self, cookie_list: list):
        d = {}
        for c in cookie_list:
            name = c.get("name") or c.get("Name")
            value = c.get("value") or c.get("Value") or ""
            if name:
                d[name] = value
        if not d.get("c_user") or not d.get("xs"):
            raise ValueError(
                "Could not find c_user and xs. Export cookies from facebook.com."
            )
        self.save_config(d)

    def is_authenticated(self):
        return bool(self._cookies.get("c_user") and self._cookies.get("xs"))

    def get_me(self):
        if not self.is_authenticated():
            return None
        return {"user_id": self._cookies.get("c_user")}

    # ── Playwright cookies ────────────────────────────────

    def _playwright_cookies(self):
        from urllib.parse import unquote
        httponly = {"xs", "fr", "datr", "sb", "ps_l", "ps_n"}
        return [
            {
                "name": name,
                "value": unquote(str(value)),
                "domain": ".facebook.com",
                "path": "/",
                "httpOnly": name in httponly,
                "secure": True,
                "sameSite": "None",
            }
            for name, value in self._cookies.items()
        ]

    # ── Main scraper ──────────────────────────────────────

    def scrape_page(self, page_name: str, max_scrolls=None,
                    callback=None, cancel_check=None):
        """
        Scrape posts using cursor-based GraphQL pagination.
        Phase 1: loads the page and scrolls a few times to capture the feed
                 GraphQL request template and first batch of posts.
        Phase 2: replays the feed request with successive cursors (no browser
                 scrolling needed) until there are no more posts or max_scrolls
                 is reached. max_scrolls=None means run until exhausted.
        Returns {"new_posts": int, "total_fetched": int}
        """
        from playwright.sync_api import sync_playwright
        from database import insert_fb_posts
        from urllib.parse import parse_qs

        page_name = page_name.lstrip("@").strip("/").strip()

        if not self.is_authenticated():
            raise AuthRequiredError(
                "Facebook requires login. Connect your Facebook account first."
            )

        # Request-side filter: only capture requests that look like feed pagination
        # (keeps the template small/relevant). Response-side: capture everything
        # from api/graphql and let the parser decide what is useful.
        _REQ_FEED_KEYS = (
            "timeline_list_feed_units",
            "timeline_feed_units",
            "user_timeline_feed_units",
            "CometUserTimelineFeed",
            "CometTimelineFeed",
            "ProfileCometTimeline",
            "Story",
        )

        total_new = 0
        total_fetched = 0
        seen_ids: set = set()
        feed_template: dict = {}
        graphql_bodies: list = []

        def on_request(request):
            if "api/graphql" not in request.url or feed_template:
                return
            try:
                pd = request.post_data or ""
                if not any(k in pd for k in _REQ_FEED_KEYS):
                    return
                params = {k: v[0] for k, v in parse_qs(pd).items()}
                feed_template.update({"url": request.url, "params": params})
            except Exception:
                pass

        def on_response(response):
            if "api/graphql" not in response.url:
                return
            try:
                body = response.text()
                # Accept any graphql response that might contain Story nodes —
                # don't filter here so we never silently drop posts.
                if '"__typename"' in body and len(body) > 200:
                    graphql_bodies.append(body)
            except Exception:
                pass

        def _process(bodies):
            nonlocal total_new, total_fetched
            cursor = None
            for body in bodies:
                c = self._extract_cursor_from_bodies([body])
                if c:
                    cursor = c
                for p in self._parse_graphql_feed(body, page_name):
                    if p["post_id"] not in seen_ids:
                        r = insert_fb_posts([p])
                        total_new += r.get("inserted", 0)
                        total_fetched += 1
                        seen_ids.add(p["post_id"])
            return cursor

        user_data_dir = os.path.join(os.path.dirname(__file__), ".fb_browser_profile")

        with sync_playwright() as pw:
            ctx = pw.chromium.launch_persistent_context(
                user_data_dir,
                headless=True,
                user_agent=(
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/122.0.0.0 Safari/537.36"
                ),
                viewport={"width": 1280, "height": 900},
                locale="en-US",
                timezone_id="America/New_York",
                args=[
                    "--disable-blink-features=AutomationControlled",
                    "--disable-dev-shm-usage",
                    "--no-sandbox",
                ],
                ignore_default_args=["--enable-automation"],
                extra_http_headers={
                    "Accept-Language": "en-US,en;q=0.9",
                    "sec-ch-ua": '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
                    "sec-ch-ua-mobile": "?0",
                    "sec-ch-ua-platform": '"macOS"',
                },
            )
            browser_page = ctx.new_page()
            browser_page.on("request", on_request)
            browser_page.on("response", on_response)

            def _logged_in():
                return any(c["name"] == "c_user"
                           for c in ctx.cookies("https://www.facebook.com"))

            try:
                if callback:
                    callback({"page": 0, "total_new": 0, "status": "running",
                              "message": f"Opening {page_name}..."})

                if not _logged_in():
                    if not self._cookies:
                        raise AuthRequiredError(
                            "No Facebook session saved. Connect your account first."
                        )
                    ctx.add_cookies(self._playwright_cookies())

                # For numeric-ID pages, go straight to the /posts tab
                m_id = re.search(r"profile\.php[?].*\bid=(\d+)", page_name)
                if m_id:
                    start_url = (f"https://www.facebook.com/profile.php"
                                 f"?id={m_id.group(1)}&sk=timeline")
                else:
                    start_url = f"https://www.facebook.com/{page_name}"

                browser_page.goto(start_url, wait_until="domcontentloaded",
                                  timeout=30000)
                browser_page.wait_for_timeout(5000)

                cur_url = browser_page.url.lower()
                if ("/login" in cur_url or "/checkpoint" in cur_url
                        or browser_page.query_selector('input[name="email"]')
                        or not _logged_in()):
                    raise AuthRequiredError(
                        "Facebook session expired — reconnect your account."
                    )

                # Try clicking the Posts / Timeline tab if visible
                for selector in [
                    'a[href*="sk=timeline"]',
                    'a[href*="/posts"]',
                    '[role="tab"]:has-text("Posts")',
                ]:
                    try:
                        el = browser_page.query_selector(selector)
                        if el:
                            el.click()
                            browser_page.wait_for_timeout(3000)
                            break
                    except Exception:
                        pass

                # ── Phase 1: scroll several times to trigger the feed API ──
                for _ in range(8):
                    browser_page.evaluate(
                        "() => window.scrollTo(0, document.body.scrollHeight)"
                    )
                    browser_page.wait_for_timeout(3000)
                    if feed_template and graphql_bodies:
                        break

                cursor = _process(list(graphql_bodies))
                graphql_bodies.clear()

                if callback:
                    callback({"page": 1, "total_new": total_new, "status": "running",
                              "message": f"Page 1 · {total_new} posts"})

                # ── Phase 2: cursor-based pagination via in-browser fetch ──
                if feed_template and cursor:
                    page_n = 2
                    empty_streak = 0
                    while True:
                        if cancel_check and cancel_check():
                            break
                        if max_scrolls and page_n > max_scrolls:
                            break
                        if not cursor:
                            break

                        body = self._fetch_next_page(ctx, feed_template, cursor)
                        if not body:
                            empty_streak += 1
                            if empty_streak >= 3:
                                break
                            time.sleep(3)
                            continue

                        empty_streak = 0
                        new_cursor = self._extract_cursor_from_bodies([body])
                        _process([body])

                        if callback:
                            callback({
                                "page": page_n,
                                "total_new": total_new,
                                "status": "running",
                                "message": f"Page {page_n} · {total_new} posts captured",
                            })

                        cursor = new_cursor
                        page_n += 1
                        time.sleep(1.2 + (0.3 * (page_n % 4)))

                else:
                    # Fallback: keep scrolling automatically until nothing new loads
                    empty_streak = 0
                    scroll_n = 1
                    while True:
                        if cancel_check and cancel_check():
                            break
                        if max_scrolls and scroll_n >= max_scrolls:
                            break

                        prev_h = browser_page.evaluate(
                            "() => document.body.scrollHeight"
                        )
                        before = total_fetched
                        browser_page.evaluate(
                            "() => window.scrollTo(0, document.body.scrollHeight)"
                        )
                        browser_page.wait_for_timeout(3000)
                        _process(list(graphql_bodies))
                        graphql_bodies.clear()

                        if callback:
                            callback({
                                "page": scroll_n + 1,
                                "total_new": total_new,
                                "status": "running",
                                "message": f"Scroll {scroll_n+1} · {total_new} posts captured",
                            })

                        new_h = browser_page.evaluate(
                            "() => document.body.scrollHeight"
                        )
                        if new_h == prev_h and total_fetched == before:
                            empty_streak += 1
                            if empty_streak >= 3:
                                break
                        else:
                            empty_streak = 0
                        scroll_n += 1

            finally:
                ctx.close()

        return {"new_posts": total_new, "total_fetched": total_fetched}

    # ── Cursor extraction ─────────────────────────────────

    def _extract_cursor_from_bodies(self, bodies: list) -> str | None:
        """Find the next-page cursor in a list of GraphQL response bodies."""
        for body in bodies:
            for line in body.strip().split("\n"):
                line = line.strip()
                if not line:
                    continue
                try:
                    data = json.loads(line)
                except Exception:
                    continue
                cursor = self._find_cursor(data)
                if cursor:
                    return cursor
        return None

    def _find_cursor(self, obj, depth=0) -> str | None:
        """Recursively find a 'page_info' end cursor or a timeline cursor value."""
        if not obj or not isinstance(obj, dict) or depth > 15:
            return None
        # page_info style
        pi = obj.get("page_info") or {}
        if pi.get("has_next_page") and pi.get("end_cursor"):
            return pi["end_cursor"]
        # cursor entry style (timeline cursors)
        if obj.get("cursor_type") in ("after", "next") and obj.get("value"):
            return obj["value"]
        if obj.get("cursorType") in ("Bottom",) and obj.get("value"):
            return obj["value"]
        for v in obj.values():
            if isinstance(v, dict):
                c = self._find_cursor(v, depth + 1)
                if c:
                    return c
            elif isinstance(v, list):
                for item in v:
                    if isinstance(item, dict):
                        c = self._find_cursor(item, depth + 1)
                        if c:
                            return c
        return None

    # ── Direct paginated API call ─────────────────────────

    def _fetch_next_page(self, ctx, template: dict, cursor: str) -> str | None:
        """
        Replay the captured feed GraphQL request with a new cursor using
        the browser context's live session (so cookies are always fresh).
        Returns the raw response body string, or None on failure.
        """
        from urllib.parse import urlencode

        params = dict(template["params"])

        # Inject cursor into variables JSON if present, else into fb_api_req_friendly_name
        if "variables" in params:
            try:
                variables = json.loads(params["variables"])
                variables["cursor"] = cursor
                params["variables"] = json.dumps(variables)
            except Exception:
                params["cursor"] = cursor
        else:
            params["cursor"] = cursor

        post_body = urlencode(params)
        url = template["url"]

        # Use page.evaluate to make the fetch inside the browser context
        # so the browser's cookies and session are used automatically.
        page = ctx.new_page()
        try:
            result = page.evaluate(
                """async ({url, body}) => {
                    try {
                        const r = await fetch(url, {
                            method: 'POST',
                            credentials: 'include',
                            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                            body: body,
                        });
                        return await r.text();
                    } catch(e) { return null; }
                }""",
                {"url": url, "body": post_body},
            )
            return result or None
        except Exception:
            return None
        finally:
            page.close()

    # ── Manual scroll mode ────────────────────────────────

    def scrape_page_manual(self, page_name: str, callback=None, cancel_check=None,
                           headless=True, download_images=False):
        """
        Auto-scroll a Facebook page continuously, capturing posts in real-time.
        Runs headless (in the background) by default; pass headless=False to
        watch the browser window. Stops when cancelled, the window is closed,
        or no new content loads after several attempts.
        If download_images is True, every post's images are saved locally for
        offline access.
        Returns {"new_posts": int, "total_fetched": int}
        """
        from playwright.sync_api import sync_playwright
        from database import insert_fb_posts

        page_name = page_name.lstrip("@").strip("/").strip()

        if not self.is_authenticated():
            raise AuthRequiredError(
                "Facebook requires login. Connect your Facebook account first."
            )

        total_new = 0
        total_fetched = 0
        seen_ids: set = set()
        # Resume-state vars (referenced in finally even if scraping aborts early)
        scroll_n = 0
        known_count = 0
        finished_naturally = False

        # Image downloads run in a background thread pool so they never block
        # the scroll/parse loop (this was the main slowdown with images on).
        from concurrent.futures import ThreadPoolExecutor
        img_pool = ThreadPoolExecutor(max_workers=6) if download_images else None

        _DEBUG = os.environ.get("FB_DEBUG") == "1"
        _DEBUG_DIR = os.path.join(os.path.dirname(__file__), "fb_debug")
        if _DEBUG:
            os.makedirs(_DEBUG_DIR, exist_ok=True)
        self._dbg_seen_graphql = 0
        self._dbg_seen_story = 0
        self._dbg_dumped = 0

        def on_response(response):
            nonlocal total_new, total_fetched
            if "api/graphql" not in response.url:
                return
            try:
                body = response.text()
            except Exception as e:
                if _DEBUG:
                    print(f"[fb-debug] could not read body: {e}")
                return
            try:
                self._dbg_seen_graphql += 1
                has_story = '"Story"' in body
                if has_story:
                    self._dbg_seen_story += 1
                if _DEBUG and has_story and self._dbg_dumped < 3:
                    path = os.path.join(
                        _DEBUG_DIR, f"resp_{self._dbg_dumped}.txt"
                    )
                    with open(path, "w") as f:
                        f.write(body)
                    self._dbg_dumped += 1
                    print(f"[fb-debug] dumped story response -> {path} "
                          f"({len(body)} bytes)")

                if '"__typename"' not in body or len(body) < 200:
                    return
                parsed = self._parse_graphql_feed(body, page_name)
                if _DEBUG and has_story:
                    print(f"[fb-debug] response has Story; parsed "
                          f"{len(parsed)} posts")
                for p in parsed:
                    if p["post_id"] not in seen_ids:
                        r = insert_fb_posts([p])
                        total_new += r.get("inserted", 0)
                        total_fetched += 1
                        seen_ids.add(p["post_id"])
                        # Queue image download in the background (non-blocking)
                        if img_pool and p.get("media"):
                            img_pool.submit(self._download_and_store,
                                            dict(p), page_name)
            except Exception as e:
                if _DEBUG:
                    import traceback
                    print(f"[fb-debug] parse error: {e}")
                    traceback.print_exc()

        user_data_dir = os.path.join(os.path.dirname(__file__), ".fb_browser_profile")

        with sync_playwright() as pw:
            ctx = pw.chromium.launch_persistent_context(
                user_data_dir,
                headless=headless,   # background by default; visible if requested
                user_agent=(
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/122.0.0.0 Safari/537.36"
                ),
                viewport={"width": 1280, "height": 900},
                locale="en-US",
                timezone_id="America/New_York",
                args=[
                    "--disable-blink-features=AutomationControlled",
                    "--disable-dev-shm-usage",
                    "--no-sandbox",
                ],
                ignore_default_args=["--enable-automation"],
            )
            page = ctx.new_page()
            page.on("response", on_response)

            def _logged_in():
                return any(c["name"] == "c_user"
                           for c in ctx.cookies("https://www.facebook.com"))

            try:
                if not _logged_in():
                    if not self._cookies:
                        raise AuthRequiredError(
                            "No Facebook session saved. Connect your account first."
                        )
                    ctx.add_cookies(self._playwright_cookies())

                m_id = re.search(r"profile\.php[?].*\bid=(\d+)", page_name)
                start_url = (
                    f"https://www.facebook.com/profile.php?id={m_id.group(1)}&sk=timeline"
                    if m_id else f"https://www.facebook.com/{page_name}"
                )
                page.goto(start_url, wait_until="domcontentloaded", timeout=30000)
                page.wait_for_timeout(4000)

                if callback:
                    callback({"total_new": 0, "status": "running",
                              "message": "Auto-scrolling... capturing posts in real-time."})

                # ── Resume support ───────────────────────────────
                # Known posts let us "fast-forward" through the part of the
                # feed we've already downloaded. We still scroll past every
                # post (never skipping), just faster while it's all known.
                from database import get_fb_post_ids
                known_ids = get_fb_post_ids(page_name)
                known_count = len(known_ids)
                fast_forward = bool(known_ids)   # only at the start, if we have history
                if fast_forward and callback:
                    callback({"total_new": 0, "status": "running",
                              "message": f"Resuming — fast-forwarding past "
                                         f"{known_count} already-saved posts..."})

                empty_streak = 0
                while True:
                    if cancel_check and cancel_check():
                        break
                    try:
                        if page.is_closed():
                            break
                    except Exception:
                        break

                    before_fetched = total_fetched
                    before_new = total_new
                    prev_h = page.evaluate("() => document.body.scrollHeight")

                    page.evaluate("() => window.scrollBy(0, window.innerHeight * 2)")
                    # Fast while burning through known posts; full pace once we
                    # reach genuinely new content (so FB has time to lazy-load).
                    page.wait_for_timeout(900 if fast_forward else 2500)

                    new_h = page.evaluate("() => document.body.scrollHeight")
                    scroll_n += 1

                    # Once we capture posts that weren't already saved, we've
                    # reached new territory — drop to full pace and stay there.
                    if total_new > before_new:
                        fast_forward = False

                    if callback:
                        msg = (f"Fast-forwarding · {total_fetched} seen"
                               if fast_forward else
                               f"Scroll {scroll_n} · {total_new} new posts captured")
                        callback({"total_new": total_new,
                                  "total_fetched": total_fetched,
                                  "status": "running", "message": msg})

                    progressed = (new_h != prev_h) or (total_fetched != before_fetched)
                    if progressed:
                        empty_streak = 0
                        continue

                    # Nothing loaded this round.
                    empty_streak += 1
                    # Anti-skip: if we were fast-forwarding, slow down and retry
                    # before concluding there's no more content — FB may just
                    # not have kept up with the fast scrolling.
                    if fast_forward and empty_streak >= 2:
                        fast_forward = False
                        empty_streak = 0
                        page.wait_for_timeout(3000)
                        continue
                    if empty_streak >= 5:
                        # Final confirmation with a longer pause + bigger scroll
                        page.wait_for_timeout(5000)
                        page.evaluate("() => window.scrollBy(0, window.innerHeight * 3)")
                        page.wait_for_timeout(3500)
                        if page.evaluate("() => document.body.scrollHeight") == new_h \
                                and total_fetched == before_fetched:
                            finished_naturally = True
                            break   # truly no more content
                        empty_streak = 0

            finally:
                # ── Persist resume state (runs even if cancelled) ──
                # complete = we reached the end of the feed; otherwise it was
                # stopped early, so mark "cancelled" → shown as resumable.
                try:
                    from database import save_progress
                    cancelled = bool(cancel_check and cancel_check())
                    status = ("complete" if finished_naturally and not cancelled
                              else "cancelled")
                    if scroll_n > 0:   # only record if we actually scrolled
                        save_progress(f"fb_{page_name}", page_name, "fb_page",
                                      None, scroll_n, known_count + total_new, status)
                except Exception:
                    pass
                if _DEBUG:
                    print(f"[fb-debug] SUMMARY: graphql responses seen="
                          f"{self._dbg_seen_graphql}, with Story="
                          f"{self._dbg_seen_story}, posts captured="
                          f"{total_fetched}")
                try:
                    ctx.close()
                except Exception:
                    pass
                # Let any in-flight image downloads finish
                if img_pool:
                    if callback:
                        callback({"total_new": total_new, "status": "running",
                                  "message": "Finishing image downloads..."})
                    img_pool.shutdown(wait=True)

        return {"new_posts": total_new, "total_fetched": total_fetched}

    # ── GraphQL parsing ───────────────────────────────────

    # Feed edge container keys used across different FB page/profile types
    _FEED_UNIT_KEYS = (
        "timeline_list_feed_units",
        "timeline_feed_units",
        "user_timeline_feed_units",
    )

    def _parse_graphql_feed(self, body: str, page_name: str):
        """Parse NDJSON GraphQL response into post dicts."""
        posts = []
        for line in body.strip().split("\n"):
            line = line.strip()
            if not line:
                continue
            try:
                data = json.loads(line)
            except Exception:
                continue

            nodes = self._extract_story_nodes(data)
            for node in nodes:
                p = self._parse_story_node(node, page_name)
                if p:
                    posts.append(p)

        return posts

    def _extract_story_nodes(self, data: dict) -> list:
        """
        Recursively walk the entire GraphQL response tree and collect every
        object whose __typename is 'Story'.  This is structure-agnostic so it
        works regardless of which feed key Facebook happens to use.
        """
        seen_ids: set = set()
        nodes: list = []

        def walk(obj, depth=0):
            if not obj or not isinstance(obj, dict) or depth > 20:
                return
            if obj.get("__typename") == "Story":
                oid = obj.get("id", "") or obj.get("post_id", "")
                if oid not in seen_ids:
                    seen_ids.add(oid)
                    nodes.append(obj)
                return   # don't recurse into a Story's children
            for v in obj.values():
                if isinstance(v, dict):
                    walk(v, depth + 1)
                elif isinstance(v, list):
                    for item in v:
                        if isinstance(item, dict):
                            walk(item, depth + 1)

        walk(data)
        return nodes

    def _parse_story_node(self, node: dict, page_name: str):
        """Extract a clean post dict from a GraphQL Story node."""
        import base64

        # ── Post URL + ID ─────────────────────────────────
        post_url = node.get("permalink_url", "")
        m = re.search(r"/posts/(pfbid\w+|\d+)", post_url)
        post_id = m.group(1) if m else node.get("post_id", "")
        if not post_id:
            b64 = node.get("id", "")
            try:
                decoded = base64.b64decode(b64 + "==").decode("utf-8", errors="ignore")
                nums = re.findall(r"\d{13,16}", decoded)
                post_id = nums[0] if nums else b64[:20]
            except Exception:
                post_id = b64[:20]
        if not post_id:
            return None

        # ── Creation time ─────────────────────────────────
        created_at_ts = None
        try:
            created_at_ts = int(
                node["comet_sections"]["timestamp"]["story"]["creation_time"]
            )
        except (KeyError, TypeError, ValueError):
            s = json.dumps(node, separators=(",", ":"))
            ts_m = re.search(r'"creation_time":(\d{9,10})', s)
            if ts_m:
                created_at_ts = int(ts_m.group(1))

        created_at = (
            datetime.fromtimestamp(created_at_ts).isoformat()
            if created_at_ts else None
        )

        # ── Text ──────────────────────────────────────────
        text = ""
        try:
            msg = (node["comet_sections"]["content"]["story"].get("message") or {})
            if isinstance(msg, dict):
                text = msg.get("text", "")
        except (KeyError, TypeError):
            pass
        if not text:
            s = json.dumps(node, separators=(",", ":"))
            msg_m = re.search(
                r'"message":\{"text":"((?:[^"\\]|\\u[0-9a-fA-F]{4}|\\["\\/bfnrt])*)"', s
            )
            if msg_m:
                text = msg_m.group(1)

        # ── Engagement ────────────────────────────────────
        s = json.dumps(node, separators=(",", ":"))
        rc = re.search(r'"reaction_count":\{"count":(\d+)', s)
        cc = re.search(r'"comment_count":\{"total_count":(\d+)', s)
        sc = re.search(r'"share_count":\{"count":(\d+)', s)
        likes    = int(rc.group(1)) if rc else 0
        comments = int(cc.group(1)) if cc else 0
        shares   = int(sc.group(1)) if sc else 0

        # ── Post type ─────────────────────────────────────
        post_type = "post"
        for att in node.get("attachments") or []:
            typename = (att.get("media") or {}).get("__typename", "")
            if typename == "Video":
                post_type = "video"
                break
            elif typename == "Photo":
                post_type = "photo"

        # ── Author ────────────────────────────────────────
        author_name = page_name
        actors = node.get("actors") or []
        if actors:
            author_name = actors[0].get("name") or page_name

        # ── Media (image URLs) ────────────────────────────
        media = self._extract_media(node)

        return {
            "post_id": f"{page_name}_{post_id}",
            "author_username": page_name,
            "author_name": author_name,
            "text": text[:3000],
            "created_at": created_at,
            "created_at_ts": created_at_ts,
            "post_type": post_type,
            "likes": likes,
            "comments": comments,
            "shares": shares,
            "post_url": post_url or f"https://www.facebook.com/{page_name}",
            "media": media,
        }

    def _extract_media(self, node: dict) -> list:
        """
        Pull image/video URLs out of a Story node. Structure varies a lot, so
        we scan the serialized node for the known image-URI shapes and keep the
        highest-quality unique URLs.
        """
        s = json.dumps(node, separators=(",", ":"))
        urls = []
        seen = set()

        # Full-size photo URIs: "image":{"uri":"https://scontent..."} and
        # variants like photo_image / viewer_image / large_share_image.
        patterns = [
            r'"(?:image|photo_image|viewer_image|large_share_image|'
            r'preferred_thumbnail|placeholder_image|blurred_image)"'
            r':\{"uri":"([^"]+)"',
            r'"playable_url(?:_quality_hd)?":"([^"]+)"',  # videos
        ]
        for pat in patterns:
            for m in re.finditer(pat, s):
                raw = m.group(1)
                url = raw.encode().decode("unicode_escape")
                url = url.replace("\\/", "/")
                if url in seen:
                    continue
                if not url.startswith("http"):
                    continue
                # Skip tiny emoji/reaction sprites and profile glyphs
                if any(x in url for x in ("emoji.php", "/rsrc.php", "static.xx")):
                    continue
                seen.add(url)
                kind = "video" if "playable" in pat else "photo"
                urls.append({"type": kind, "url": url})

        return urls

    # Where downloaded images live (served by the web app at /media/...)
    MEDIA_ROOT = os.path.join(os.path.dirname(__file__), "fb_media")

    def _download_and_store(self, post: dict, page_name: str):
        """Background task: download a post's images, then persist local paths."""
        try:
            self._download_post_media(post, page_name)
            if any(m.get("local") for m in post.get("media", [])):
                from database import update_fb_media_json
                update_fb_media_json(post["post_id"], post["media"])
        except Exception:
            pass

    def _download_post_media(self, post: dict, page_name: str):
        """
        Download a post's images to fb_media/<page>/<post_id>_<i>.<ext> and add
        a 'local' path to each media item so they can be viewed offline.
        Mutates post['media'] in place.
        """
        import urllib.request

        safe_page = re.sub(r"[^\w.-]", "_", page_name)[:60]
        safe_pid = re.sub(r"[^\w.-]", "_", post.get("post_id", "x"))[:80]
        dest_dir = os.path.join(self.MEDIA_ROOT, safe_page)
        os.makedirs(dest_dir, exist_ok=True)

        for i, item in enumerate(post.get("media", [])):
            if item.get("type") != "photo":
                continue  # only images for offline viewing
            url = item.get("url")
            if not url:
                continue
            ext = ".jpg"
            m = re.search(r"\.(jpg|jpeg|png|gif|webp)", url.lower())
            if m:
                ext = "." + m.group(1)
            fname = f"{safe_pid}_{i}{ext}"
            fpath = os.path.join(dest_dir, fname)
            rel = os.path.join(safe_page, fname)
            if os.path.exists(fpath):
                item["local"] = rel
                continue
            try:
                req = urllib.request.Request(
                    url, headers={"User-Agent": "Mozilla/5.0"}
                )
                with urllib.request.urlopen(req, timeout=20) as resp:
                    data = resp.read()
                if data and len(data) > 1000:   # skip broken/placeholder
                    with open(fpath, "wb") as f:
                        f.write(data)
                    item["local"] = rel
            except Exception:
                pass

    # ── One-time browser login ────────────────────────────

    def setup_session_via_browser(self, callback=None):
        """
        Open a VISIBLE Chromium window so the user can log into Facebook
        manually. Once logged in, the session is saved to the persistent
        profile — giving the scraper its OWN xs token that is completely
        independent of the user's regular browser.
        After this, the user can log out of Facebook in their browser and
        the scraper will keep working.
        Returns True on success.
        """
        from playwright.sync_api import sync_playwright

        user_data_dir = os.path.join(os.path.dirname(__file__), ".fb_browser_profile")
        import shutil
        # Start fresh so there's no stale state
        if os.path.exists(user_data_dir):
            shutil.rmtree(user_data_dir)

        if callback:
            callback({"status": "waiting",
                      "message": "A browser window will open — log into Facebook there, then close it."})

        with sync_playwright() as pw:
            ctx = pw.chromium.launch_persistent_context(
                user_data_dir,
                headless=False,           # ← VISIBLE window
                user_agent=(
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/122.0.0.0 Safari/537.36"
                ),
                viewport={"width": 1280, "height": 900},
                locale="en-US",
                args=["--disable-blink-features=AutomationControlled"],
                ignore_default_args=["--enable-automation"],
            )
            page = ctx.new_page()
            page.goto("https://www.facebook.com/login",
                      wait_until="domcontentloaded", timeout=30000)

            # Poll until c_user cookie appears (user logged in) or timeout (5 min)
            deadline = time.time() + 300
            logged_in = False
            while time.time() < deadline:
                cookies = {c["name"]: c["value"]
                           for c in ctx.cookies("https://www.facebook.com")}
                if "c_user" in cookies and "xs" in cookies:
                    logged_in = True
                    # Save the fresh cookies back to config for reference
                    self._cookies = dict(cookies)
                    self.save_config(cookies)
                    if callback:
                        callback({"status": "success",
                                  "message": "Logged in! Session saved. You can close this window."})
                    page.wait_for_timeout(2000)
                    break
                time.sleep(1)

            ctx.close()

        if not logged_in:
            raise AuthRequiredError("Login timed out — no login detected within 5 minutes.")
        return True

    @staticmethod
    def _sleep_check(seconds: float, cancel_check=None):
        deadline = time.time() + seconds
        while time.time() < deadline:
            if cancel_check and cancel_check():
                return
            time.sleep(min(0.5, deadline - time.time()))


# ── Utilities ──────────────────────────────────────────────

def _clean_text(text: str) -> str:
    for pat in [r"Like\s*Comment\s*Share", r"\d+\s+(Comment|Share)\w*",
                r"All reactions:.*", r"View \d+ more comment\w*",
                r"See (more|less)", r"Translated?.*"]:
        text = re.sub(pat, "", text, flags=re.I | re.DOTALL)
    return re.sub(r"\s{2,}", " ", text).strip()


def _parse_fb_date(text: str):
    if not text:
        return None
    text = re.sub(r"\s+at\s+", " ", text.strip())
    for fmt in ["%B %d, %Y %I:%M %p", "%B %d, %Y", "%d %B %Y",
                "%b %d, %Y", "%Y-%m-%dT%H:%M:%S"]:
        try:
            return datetime.strptime(text, fmt)
        except ValueError:
            continue
    return None


def _parse_count(m) -> int:
    if not m:
        return 0
    raw = m.group(1).upper().replace(",", "").replace(".", "")
    try:
        if raw.endswith("K"):
            return int(float(raw[:-1]) * 1_000)
        if raw.endswith("M"):
            return int(float(raw[:-1]) * 1_000_000)
        return int(raw)
    except ValueError:
        return 0


fb_scraper = FacebookScraper()
