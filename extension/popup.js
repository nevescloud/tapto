import { CONFIG, getToken, getUser, signOut, connectDevice, signInWithPAT,
         readMap, writeMap, tagUrl } from './store.js';

const $ = (id) => document.getElementById(id);
const show = (el, on) => el.classList.toggle('hide', !on);
const msg = (t) => { $('msg').textContent = t || ''; };

let token = null, gistId = null, map = { version: 1, tags: {} };

async function boot() {
  token = await getToken();
  show($('auth'), !token);
  show($('editor'), !!token);
  if (token) {
    $('who').textContent = '@' + (await getUser());
    try { ({ id: gistId, map } = await readMap(token)); }
    catch (e) { msg(e.message); }
  }
}

// ── auth wiring ──────────────────────────────────────────────────────────────
$('signin').onclick = async () => {
  $('signin').disabled = true;
  try {
    await connectDevice(({ user_code, verification_uri }) => {
      $('signin').textContent = `Enter ${user_code} at ${verification_uri}`;
    });
    await boot();
  } catch (e) { $('signin').textContent = 'Sign in with GitHub'; alert(e.message); }
  finally { $('signin').disabled = false; }
};
$('usePat').onclick = () => show($('patBox'), true);
$('patSave').onclick = async () => {
  try { await signInWithPAT($('pat').value.trim()); await boot(); }
  catch (e) { $('msg2').textContent = e.message; }
};
$('signout').onclick = async () => { await signOut(); token = null; await boot();
  $('signin').textContent = 'Sign in with GitHub'; };

// ── editor wiring ────────────────────────────────────────────────────────────
$('type').onchange = () => {
  show($('redirectFields'), $('type').value === 'redirect');
  show($('pageFields'), $('type').value === 'page');
};

function renderQR(slug) {
  const url = tagUrl(slug);
  const qr = qrcode(0, 'M'); qr.addData(url); qr.make();
  $('qr').innerHTML = qr.createSvgTag({ scalable: true, margin: 1 });
  $('qr').style.display = 'block';
  $('url').textContent = url;
}

$('save').onclick = async () => {
  const slug = $('slug').value.trim().toLowerCase().replace(/\s+/g, '-');
  if (!slug) return msg('Enter a slug.');
  const entry = $('type').value === 'page'
    ? { type: 'page', title: $('title').value.trim(), body: $('pbody').value }
    : { type: 'redirect', url: $('dest').value.trim() };
  if (entry.type === 'redirect' && !entry.url) return msg('Enter a destination URL.');

  $('save').disabled = true; msg('Saving…');
  try {
    map.tags = map.tags || {};
    map.tags[slug] = entry;
    gistId = await writeMap(token, gistId, map);
    msg(`Saved “${slug}”. Write this URL / QR to your tag:`);
    renderQR(slug);
  } catch (e) { msg(e.message); }
  finally { $('save').disabled = false; }
};

boot();
