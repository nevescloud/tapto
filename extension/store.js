// ── tapto creator — auth + gist storage (shared) ─────────────────────────────
// The creator is the ONLY surface that authenticates. It runs as an extension so
// the device flow is proxy-free: `host_permissions` for github.com/login/* lets
// these POSTs go direct (a Pages tab can't — that's why opal/docs uses a CORS
// shim). The public resolver never imports this; it only READS the gist.
//
// Token acquisition is pluggable: device flow once you've registered the OAuth
// app + set CLIENT_ID below, or paste a fine-grained `gist`-scoped PAT to test the
// write path TODAY (no web-only OAuth-app step needed). Both end at the same
// api.github.com gist calls.

export const CONFIG = {
  // Register an OAuth App with **Device Flow enabled**, scope `gist`, then paste its
  // client id here. (OAuth-app creation is web-only, like the org.) Until then the
  // PAT path works. Reusing opal's id would make users see "Authorize opal" — make a
  // `tapto` one for clean identity.
  CLIENT_ID: 'Ov23lidEGTvQzB8Fn0bk',
  SCOPE: 'gist',
  GIST_FILE: 'tapto.json',
  RESOLVER_BASE: 'https://neves.cloud/tapto/',  // origin baked into every tag — fixed before writing tags
};

const GH = 'https://github.com';            // device endpoints (host_permissions → no proxy)
const API = 'https://api.github.com';       // gist CRUD (CORS-clean anyway)
const KEY = 'tapto-auth';

const form = (o) => new URLSearchParams(o);
const jget = async (k) => (await chrome.storage.local.get(k))[k] || null;

export async function getToken() { return (await jget(KEY))?.token || null; }
export async function getUser()  { return (await jget(KEY))?.user || null; }
export async function signOut()  { await chrome.storage.local.remove(KEY); }

async function saveSession(token) {
  const r = await fetch(`${API}/user`, { headers: { Authorization: `Bearer ${token}` } });
  const me = r.ok ? await r.json() : {};
  await chrome.storage.local.set({ [KEY]: { token, user: me.login || '', avatar: me.avatar_url || '' } });
  return me.login || '';
}

// Paste-a-token path: validates by reading /user, then persists.
export async function signInWithPAT(token) {
  const login = await saveSession(token);
  if (!login) throw new Error('That token didn’t authenticate — check it has gist scope.');
  return login;
}

// GitHub OAuth Device Flow, proxy-free (adapted from opal/docs/device-auth.js — the
// only change is BASE = github.com directly, legal here via host_permissions).
// onUserCode({user_code, verification_uri}) is called once so the caller can show the
// code while we poll. Resolves the username.
export async function connectDevice(onUserCode) {
  if (CONFIG.CLIENT_ID.startsWith('REPLACE')) throw new Error('Set CONFIG.CLIENT_ID first (or use the paste-token option).');
  const cdr = await fetch(`${GH}/login/device/code`, {
    method: 'POST', headers: { Accept: 'application/json' },
    body: form({ client_id: CONFIG.CLIENT_ID, scope: CONFIG.SCOPE }),
  });
  const cd = await cdr.json();
  if (cd.error) throw new Error(cd.error_description || cd.error);
  onUserCode?.({ user_code: cd.user_code,
    verification_uri: cd.verification_uri || `${GH}/login/device`,
    verification_uri_complete: cd.verification_uri_complete }); // _complete pre-fills the code

  let intervalMs = ((cd.interval || 5) + 1) * 1000;
  const deadline = Date.now() + (cd.expires_in || 900) * 1000;
  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, intervalMs));
    let data;
    try {
      const tr = await fetch(`${GH}/login/oauth/access_token`, {
        method: 'POST', headers: { Accept: 'application/json' },
        body: form({ client_id: CONFIG.CLIENT_ID, device_code: cd.device_code,
                     grant_type: 'urn:ietf:params:oauth:grant-type:device_code' }),
      });
      if (!tr.ok) continue;
      data = await tr.json();
    } catch { continue; }
    if (data.access_token) return await saveSession(data.access_token);
    if (data.error === 'authorization_pending') continue;
    if (data.error === 'slow_down') { intervalMs += 5000; continue; }
    throw new Error(data.error_description || data.error);
  }
  throw new Error('Sign-in timed out — the code expired.');
}

// ── gist map: find-or-create the single tapto.json gist, read/patch its JSON ──
async function findGist(token) {
  const r = await fetch(`${API}/gists?per_page=100`, { cache: 'no-store', headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) throw new Error(`gist list failed (${r.status})`);
  return (await r.json()).find(g => g.files && g.files[CONFIG.GIST_FILE]) || null;
}

export async function readMap(token) {
  const g = await findGist(token);
  if (!g) return { id: null, map: { version: 1, tags: {} } };
  const raw = await fetch(g.files[CONFIG.GIST_FILE].raw_url, { cache: 'no-store' });
  return { id: g.id, map: raw.ok ? await raw.json() : { version: 1, tags: {} } };
}

export async function writeMap(token, id, map) {
  const body = JSON.stringify({
    description: 'tapto — tag map (edited via the tapto creator)',
    public: true,
    files: { [CONFIG.GIST_FILE]: { content: JSON.stringify(map, null, 2) + '\n' } },
  });
  const r = await fetch(`${API}/gists${id ? '/' + id : ''}`, {
    method: id ? 'PATCH' : 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body,
  });
  if (!r.ok) throw new Error(`gist save failed (${r.status})`);
  return (await r.json()).id;
}

export function tagUrl(gistId, slug) {
  // Keyed on the immutable gist ID, not the username (rename-proof, direct lookup).
  return CONFIG.RESOLVER_BASE + '#' + gistId + '/' + encodeURIComponent(slug);
}
