# TOR Phi GitHub Social Plan

This plan makes GitHub scrape public X/Twitter batches online and makes the Mac pull the resulting archive automatically.

## What GitHub Does

- Runs `.github/workflows/social-harvest.yml` every 30 minutes.
- Imports `social-archive/` text chunks into a temporary SQLite DB.
- Scrapes a small batch of accounts below the target tweet depth.
- Exports updated `social-archive/` JSONL files and `public/source/social/` snapshots.
- Commits the public archive back to GitHub.

## What The Mac Does

- `sync-github-social.command` pulls latest GitHub changes.
- It imports `social-archive/` into `data/torphi-social.db`.
- It refreshes local TOR Phi social snapshots.
- If local scraping is active, it pulls but skips SQLite import for that tick.

## One-Time GitHub Setup

1. Push this project to a GitHub repository.
2. Add repository secrets:
   - `TORPHI_X_CT0`
   - `TORPHI_X_AUTH_TOKEN`
3. Enable GitHub Actions for the repository.
4. Run `install-github-social-sync.command` on the Mac after the project is a Git checkout.

## Nuclear Remove

Run:

```bash
./remove-github-social-plan.command
```

It removes the workflow, JSONL import/export scripts, local auto-sync command, LaunchAgent, and `social-archive/`.
It does not delete `data/torphi-social.db`.
