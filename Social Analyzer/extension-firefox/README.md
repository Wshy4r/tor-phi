# Firefox Extension

This folder contains a Firefox-targeted build of the Twitter Analyzer extension.

It talks to the local backend at:

- `http://localhost:5001`

## Load in Firefox

1. Start the local site:
   - `cd "/Users/wshyar/Documents/SideProjects/Twitter Analyzer"`
   - `./run-local.command`
2. Open Firefox.
3. Go to `about:debugging#/runtime/this-firefox`
4. Click `Load Temporary Add-on...`
5. Choose:
   - `/Users/wshyar/Documents/SideProjects/Twitter Analyzer/extension-firefox/manifest.json`

## Use

1. Stay logged in on `x.com` in Firefox.
2. Open the extension popup.
3. Start a capture.
4. You can switch tabs while it runs in the background.

The captured tweets are sent to your local Twitter Analyzer site and also cached in extension storage.
