.PHONY: help oauth-app set-client-id dev

# GitHub OAuth App for the creator's sign-in. Device Flow (public client, NO
# secret, NO callback exchange) — so the only output to wire up is the Client ID,
# which goes into extension/store.js (CONFIG.CLIENT_ID), not a server secret.
OAUTH_NAME     := tapto
OAUTH_HOMEPAGE := https://neves.cloud/tapto
# Device Flow ignores the callback, but GitHub's form requires the field — reuse homepage.
OAUTH_CALLBACK := https://neves.cloud/tapto

help:
	@echo ""
	@echo "\033[2mOne-time setup\033[0m"
	@echo "  \033[36moauth-app\033[0m       Open GitHub's OAuth App registration (prefilled, nevescloud-owned)"
	@echo "  \033[36mset-client-id\033[0m   ID=Ov23li…  → write CONFIG.CLIENT_ID into extension/store.js"
	@echo ""
	@echo "\033[2mDev\033[0m"
	@echo "  \033[36mdev\033[0m             Serve docs/ at http://localhost:8000 (landing + resolver)"
	@echo ""

# Open GitHub's OAuth App registration, prefilled. GitHub has no API to create
# OAuth Apps, so this is the closest to one-shot: form fields are prefilled via
# query params (best-effort — values printed below to paste if GitHub stops
# honoring them). Registered under the nevescloud org so users see "Authorize tapto"
# owned by the org, not a personal account.
oauth-app:
	@URL='https://github.com/organizations/nevescloud/settings/applications/new?oauth_application[name]=$(OAUTH_NAME)&oauth_application[url]=$(OAUTH_HOMEPAGE)&oauth_application[callback_url]=$(OAUTH_CALLBACK)'; \
	echo ""; \
	echo "Register a new GitHub OAuth App with these values:"; \
	echo "  Application name:           $(OAUTH_NAME)"; \
	echo "  Homepage URL:               $(OAUTH_HOMEPAGE)"; \
	echo "  Authorization callback URL: $(OAUTH_CALLBACK)  (unused by device flow)"; \
	echo "  → after creating: tick \033[1mEnable Device Flow\033[0m. No client secret needed."; \
	echo "    (the 'gist' scope is requested at sign-in time, not configured on the app.)"; \
	echo ""; \
	echo "Then: make set-client-id ID=<the Client ID>"; \
	echo ""; \
	( command -v open >/dev/null 2>&1 && open "$$URL" ) \
		|| ( command -v xdg-open >/dev/null 2>&1 && xdg-open "$$URL" ) \
		|| echo "Open this URL manually: $$URL"

# Write the Client ID into the extension (macOS sed).
set-client-id:
	@test -n "$(ID)" || { echo "usage: make set-client-id ID=Ov23li..."; exit 1; }
	@sed -i '' "s/CLIENT_ID: '[^']*'/CLIENT_ID: '$(ID)'/" extension/store.js
	@echo "set CONFIG.CLIENT_ID = $(ID)  in extension/store.js"

# Local preview of the published site (root path differs from neves.cloud/tapto/,
# but the landing + #slug resolver behave identically).
dev:
	@cd docs && python3 -m http.server 8000
