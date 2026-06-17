# tapto

Reprogrammable NFC/QR tags. A tag carries a short, stable URL —
`https://neves.cloud/tapto/#<slug>` — and *where it goes* lives in editable config,
not baked into the tag. Repoint a tag by editing config; never rewrite the tag.

The same slug URL works on any carrier: an NFC tag, a printed QR code, or a plain
link. A normal QR generator bakes a dead URL into the pixels; a tapto QR encodes the
slug, so the printed code is dynamic too.

## How it works

```
tap / scan ─▶ neves.cloud/tapto/#<slug> ─▶ look up <slug> in the tag map ─▶ redirect or render
```

- **Resolver** (`index.html`) — a static page. The `#slug` fragment never leaves the
  browser, so one file routes every tag. It reads the tag map (public, unauthenticated)
  and either redirects or renders a page in place.
- **Tag map** — JSON in a public GitHub gist:
  ```json
  {
    "version": 1,
    "tags": {
      "desk": { "type": "redirect", "url": "https://example.com" },
      "wifi": { "type": "page", "title": "Guest Wi-Fi", "body": "Network: …\nPassword: …" }
    }
  }
  ```
  `redirect` sends the visitor to a URL (any scheme — `https:`, `tel:`, `mailto:`,
  `geo:`, `spotify:`). `page` renders title + body in place.
- **Creator** (`extension/`) — a browser extension to add/edit tags and get the
  URL + QR. It’s the only piece that signs in; the resolver only reads.

> The tag map is **public** — anyone with the gist can read every destination. Keep
> private targets (home Wi-Fi, private docs) out of it.

## Creating tags (extension)

1. Load `extension/` as an unpacked extension (`chrome://extensions` → Developer
   mode → Load unpacked), or install the published build.
2. Click the tapto toolbar icon to open the side panel, then sign in — GitHub
   opens in a tab beside the panel to authorize.
3. Add a slug + destination. Save writes the tag map to your gist and shows the
   URL + QR; the panel also lists your tags to edit or delete.
4. Write the URL to an NFC tag (NFC Tools / a Shortcut on iPhone, or a USB writer),
   or print the QR.

## Self-hosting

Edit the constants at the top of `index.html` (`OWNER`, `GIST_FILE`) and
`extension/store.js` (`CONFIG`). For the extension’s one-tap sign-in, register a
GitHub OAuth App with Device Flow enabled and `gist` scope, and set
`CONFIG.CLIENT_ID`. Until then the extension’s “paste a token” option works with a
fine-grained `gist`-scoped token.
