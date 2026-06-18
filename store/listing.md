# Chrome Web Store listing — canonical copy

Single source for everything pasted into the Web Store dashboard (Store listing +
Privacy tabs). The dashboard is a synced cache of this file; edit here first. Each
pasteable field below is a fenced code block — copy it verbatim. Privacy *policy*
prose lives in `docs/privacy.html` (served at `https://neves.cloud/tapto/privacy.html`);
this file holds the dashboard *fields*.

---

## Title
<!-- ≤75 chars. Keep stable — part of the item's store identity/search. -->
```
tapto — Reprogrammable NFC & QR Tags
```

## Summary (short description)
<!-- ≤132 chars. -->
```
Create NFC and QR tags you can repoint anytime — change where a tag goes without ever rewriting it. Your data in your own GitHub.
```

## Category
`Productivity` (dropdown)

## Website / Support URLs (dashboard "Store listing" → Additional fields)
Both point at the landing page; per-project support address is `extensions@neves.cloud`.

Homepage / Website:
```
https://neves.cloud/tapto/
```
Support URL:
```
https://neves.cloud/tapto/
```

## Graphic assets
The store offers five image slots; what we provide:

| Asset | Spec | Source | Status |
|---|---|---|---|
| Store icon | 128×128 | `extension/icons/icon-128.png` | auto ✓ |
| Screenshots (≥1, up to 5) | 1280×800 JPEG/PNG | `store/screenshots/01-create` (tag list + editor) · `02-share` (QR + URL) | ✓ generated (harness: `store/shots.html`) |
| Small promo tile | 440×280 | `store/screenshots/promo-small-440x280.png` | ✓ generated (harness: `store/promo-tile.html`) |
| Marquee promo tile | 1400×560 | — (same harness at 1400×560 if needed) | optional (featuring only) |
| Promo video | YouTube URL | — | skipped |

## Description
```
A tag should outlive the link behind it. tapto turns an NFC tag or a printed QR code into a short, stable address — and lets you change where it points anytime, without rewriting the tag.

What you get
- Create a tag in seconds: pick a name, point it at a link or a short note, get the URL and a QR to print.
- Repoint anytime: edit the destination and every tag already in the wild follows. Print once, change forever.
- One name, any carrier: the same address works as an NFC tag, a QR code, or a plain link.
- Your tags, listed: see, edit, and delete everything from the side panel.

How it works
Sign in with your GitHub account. tapto saves your tag map as a gist in your own GitHub — there is no tapto server. Tags resolve through neves.cloud/tapto, a static page that reads your public map and forwards.

Privacy
tapto has no server and collects nothing. Your tag map lives in a public gist on your own GitHub account — anyone holding a tag can follow it, so keep private destinations out. The only thing stored on your device is your GitHub sign-in. Full policy in the Privacy tab.

Independent project; not affiliated with GitHub.
```
<!-- CWS description is plain text — markdown bold isn't rendered, so labels are plain. -->

---

## Single purpose
```
Create and edit short, reprogrammable tags (for NFC or QR) whose destinations the user can change anytime. The tag map is stored in the user's own GitHub gist; tags resolve through neves.cloud/tapto.
```

## Permission justifications
One per declared permission (each must be exercised in code — audit before submit).

storage:
```
Store the user's GitHub sign-in token and the id of their tapto gist locally, so the panel stays signed in and loads the user's tags instantly.
```
sidePanel:
```
The entire creator UI is a Chrome side panel.
```

The dashboard collapses all hosts into **one** "Host permission" field — paste:
```
https://github.com/login/device/* and https://github.com/login/oauth/* run the GitHub Device Flow sign-in (request a device code, poll for the access token; no client secret). https://api.github.com/* reads the signed-in user's GitHub username (shown in the panel) and reads/writes the single "tapto.json" gist that holds the user's tag map (each tag's address uses that gist's id).
```

## Remote code
**No** — all JS ships in the package (the QR library is vendored under `extension/vendor/`); no external `<script>`, no `eval`, no remotely-hosted modules. The extension fetches *data* from GitHub APIs, never code.

## Data usage (dashboard "Privacy" tab — must match docs/privacy.html)
- **Check exactly two categories:**
  - **Website content** — the tags the user creates (names, destination URLs, note text) are sent to GitHub to store in the user's own gist.
  - **Authentication information** — the GitHub OAuth token (stored locally, sent only to GitHub).
- **Leave unchecked, incl. PII:** there is no tapto server, so nothing is collected by the developer. The GitHub username is read only for the panel label but is not transmitted anywhere except GitHub itself. Nothing else (no location, web history, activity, comms, financial, health).
- **Certify all three** (all true): no selling/transfer outside approved uses · no use for unrelated purposes · no creditworthiness/lending. The GitHub transfer is "for the item's single purpose," which the first certification permits.
- **Privacy policy URL** (dedicated field, never the description):
```
https://neves.cloud/tapto/privacy.html
```
