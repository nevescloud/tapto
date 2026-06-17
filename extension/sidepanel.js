import { getToken, getUser, signOut, connectDevice, signInWithPAT,
         readMap, writeMap, tagUrl } from './store.js';

const $ = (id) => document.getElementById(id);
const show = (el, on) => el.classList.toggle('hide', !on);

let token = null, gistId = null, map = { version: 1, tags: {} };
let type = 'redirect', editing = null, authTabId = null;

// ── views ────────────────────────────────────────────────────────────────────
async function boot() {
  token = await getToken();
  show($('auth'), !token);
  show($('app'), !!token);
  show($('acct'), !!token);
  if (!token) return;
  $('who').textContent = '@' + (await getUser());
  try { ({ id: gistId, map } = await readMap(token)); } catch (e) { setMsg(e.message); }
  renderList();
  newTag();
}

// ── auth ─────────────────────────────────────────────────────────────────────
$('signin').onclick = async () => {
  $('signin').disabled = true;
  const status = $('authStatus'); show(status, true);
  try {
    await connectDevice(({ user_code, verification_uri, verification_uri_complete }) => {
      // Open GitHub in a TAB beside the docked panel (panel stays open → poll survives).
      // _complete pre-fills the code; copy it too as a fallback.
      navigator.clipboard?.writeText(user_code).catch(() => {});
      chrome.tabs.create({ url: verification_uri_complete || verification_uri })
        .then(t => { authTabId = t.id; }).catch(() => {});
      status.innerHTML = `<span class="spin" aria-hidden="true"></span>Approve tapto in the GitHub tab.
        <span style="display:block;margin-top:4px">If it asks, the code (copied) is
        <button type="button" class="codechip" id="codechip">${user_code}</button></span>`;
      $('codechip').onclick = () => navigator.clipboard?.writeText(user_code).catch(() => {});
    });
    if (authTabId != null) chrome.tabs.remove(authTabId).catch(() => {});
    show(status, false);
    await boot();
  } catch (e) {
    status.textContent = e.message;
  } finally { $('signin').disabled = false; }
};

$('usePat').onclick = () => show($('patBox'), true);
$('patSave').onclick = async () => {
  try { await signInWithPAT($('pat').value.trim()); await boot(); }
  catch (e) { $('authStatus').classList.remove('hide'); $('authStatus').textContent = e.message; }
};
$('signout').onclick = async () => { await signOut(); await boot(); };

// ── type toggle (segmented) ───────────────────────────────────────────────────
function setType(t) {
  type = t;
  $('tRedirect').setAttribute('aria-pressed', String(t === 'redirect'));
  $('tPage').setAttribute('aria-pressed', String(t === 'page'));
  show($('redirectFields'), t === 'redirect');
  show($('pageFields'), t === 'page');
}
$('tRedirect').onclick = () => setType('redirect');
$('tPage').onclick = () => setType('page');

// ── live preview ───────────────────────────────────────────────────────────────
const slugify = (s) => s.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
$('slug').oninput = () => { $('preview').innerHTML = `neves.cloud/tapto/#<b>${slugify($('slug').value) || '…'}</b>`; };

// ── tag list (navigate: edit / delete) ─────────────────────────────────────────
function destLabel(t) { return t.type === 'page' ? `note · ${t.title || 'untitled'}` : (t.url || ''); }
function renderList() {
  const tags = map.tags || {};
  const slugs = Object.keys(tags).sort();
  const ul = $('list');
  if (!slugs.length) { ul.innerHTML = `<li class="empty">No tags yet — add your first below.</li>`; return; }
  ul.innerHTML = '';
  for (const slug of slugs) {
    const li = document.createElement('li'); li.className = 'row';
    li.innerHTML =
      `<button class="open" type="button"><span class="s">#${slug}</span><span class="d"></span></button>
       <button class="del" type="button" title="Delete #${slug}" aria-label="Delete ${slug}">×</button>`;
    li.querySelector('.d').textContent = destLabel(tags[slug]);
    li.querySelector('.open').onclick = () => editTag(slug);
    li.querySelector('.del').onclick = () => delTag(slug);
    ul.appendChild(li);
  }
}

function editTag(slug) {
  const t = map.tags[slug];
  editing = slug;
  $('formTitle').textContent = 'Edit #' + slug;
  $('slug').value = slug; $('slug').oninput();
  setType(t.type === 'page' ? 'page' : 'redirect');
  $('dest').value = t.url || ''; $('title').value = t.title || ''; $('pbody').value = t.body || '';
  show($('newTag'), true); show($('result'), false); setMsg('');
  $('slug').scrollIntoView({ block: 'nearest' });
}

async function delTag(slug) {
  if (!confirm(`Delete #${slug}?`)) return;
  delete map.tags[slug];
  try { gistId = await writeMap(token, gistId, map); renderList(); if (editing === slug) newTag(); }
  catch (e) { setMsg(e.message); }
}

function newTag() {
  editing = null;
  $('formTitle').textContent = 'New tag';
  $('slug').value = ''; $('dest').value = ''; $('title').value = ''; $('pbody').value = '';
  $('slug').oninput(); setType('redirect');
  show($('newTag'), false); show($('result'), false); setMsg('');
}
$('newTag').onclick = newTag;

// ── save ─────────────────────────────────────────────────────────────────────
const setMsg = (t) => { $('msg').textContent = t || ''; };
$('save').onclick = async () => {
  const slug = slugify($('slug').value);
  if (!slug) return setMsg('Enter a slug.');
  const entry = type === 'page'
    ? { type: 'page', title: $('title').value.trim(), body: $('pbody').value }
    : { type: 'redirect', url: $('dest').value.trim() };
  if (type === 'redirect' && !entry.url) return setMsg('Enter a link.');
  if (type === 'page' && !entry.body.trim()) return setMsg('Enter some text.');

  $('save').disabled = true; setMsg('Saving…');
  try {
    map.tags = map.tags || {};
    if (editing && editing !== slug) delete map.tags[editing]; // slug renamed
    map.tags[slug] = entry;
    gistId = await writeMap(token, gistId, map);
    editing = slug; $('formTitle').textContent = 'Edit #' + slug; show($('newTag'), true);
    renderList(); showResult(slug); setMsg('Saved.');
  } catch (e) { setMsg(e.message); }
  finally { $('save').disabled = false; }
};

// ── result (QR + URL + copy) ───────────────────────────────────────────────────
function showResult(slug) {
  const url = tagUrl(slug);
  const qr = qrcode(0, 'M'); qr.addData(url); qr.make();
  $('qr').innerHTML = qr.createSvgTag({ scalable: true, margin: 0 });
  $('url').textContent = url;
  show($('result'), true);
}
$('copy').onclick = () => {
  navigator.clipboard?.writeText($('url').textContent).then(() => {
    $('copy').textContent = 'Copied'; setTimeout(() => ($('copy').textContent = 'Copy'), 1200);
  }).catch(() => {});
};

boot();
