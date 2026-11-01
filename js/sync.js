/* Progress sync: saves each played level as a small JSON text file in a GitHub repo.

   - Data is anonymised: files hold a player code (e.g. "p1"), never a name.
   - Writing needs a fine-grained GitHub token with Contents read/write on the data repo
     only. It is entered once in the parent page on the child's device and kept in that
     device's storage, never in the site code.
   - Reading needs no token because the data repo is public, so the parent report works
     on any device.
   - Files are only ever created, never edited, so two devices can't conflict. Anything
     that can't be sent yet waits in a queue and is retried later. */
window.VQSync = (function () {
  const DEFAULT_REPO = 'ankityagi/mathquest-progress';
  const DEFAULT_BRANCH = 'main';
  const K_CFG = 'vq.sync', K_QUEUE = 'vq.queue', K_CACHE = 'vq.cache', K_LOG = 'vq.synclog';
  const API = 'https://api.github.com';

  const read = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };

  function config() {
    const c = read(K_CFG, {});
    return { repo: c.repo || DEFAULT_REPO, branch: c.branch || DEFAULT_BRANCH, token: c.token || '' };
  }
  function setConfig(c) { write(K_CFG, { repo: c.repo, branch: c.branch, token: c.token }); }
  const queue = () => read(K_QUEUE, []);
  const logResult = (ok, msg) => write(K_LOG, { at: new Date().toISOString(), ok, msg });
  // GitHub's own error text, e.g. "Resource not accessible by personal access token"
  async function why(r) { try { const j = await r.json(); return j.message ? ` (${j.message})` : ''; } catch (e) { return ''; } }
  async function put(c, path, text, message) {
    return fetch(`${API}/repos/${c.repo}/contents/${path}`, {
      method: 'PUT', headers: Object.assign(headers(c.token), { 'Content-Type': 'application/json' }),
      body: JSON.stringify({ message, content: b64(text), branch: c.branch })
    });
  }

  // UTF-8 safe base64 for the GitHub contents API
  function b64(str) {
    const bytes = new TextEncoder().encode(str); let bin = '';
    bytes.forEach(b => { bin += String.fromCharCode(b); });
    return btoa(bin);
  }
  const headers = token => Object.assign({ Accept: 'application/vnd.github+json' }, token ? { Authorization: 'Bearer ' + token } : {});

  // Check the repo and token. Returns { ok, message }.
  async function test(c) {
    if (!c.repo || !/^[\w.-]+\/[\w.-]+$/.test(c.repo)) return { ok: false, message: 'Repo should look like owner/name.' };
    if (!c.token) return { ok: false, message: 'Paste the access token first.' };
    try {
      const r = await fetch(`${API}/repos/${c.repo}`, { headers: headers(c.token) });
      if (r.status === 401) return { ok: false, message: 'GitHub did not accept that token. Check it was copied in full and has not expired.' };
      if (r.status === 404) return { ok: false, message: `GitHub can't find ${c.repo}, or the token isn't allowed to see it.` };
      if (!r.ok) return { ok: false, message: `GitHub answered ${r.status}. Try again in a minute.` };
      const j = await r.json();
      // prove saving works end to end by writing a tiny check file
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      const w = await put(c, `checks/${stamp}.json`, JSON.stringify({ check: 'connection test', at: stamp }), 'Connection test');
      if (w.status === 403 || w.status === 404) { const m = 'The token can see the repo but not save to it. Edit the token: Repository access must include this repo, and Permissions → Contents must be "Read and write".' + (await why(w)); logResult(false, m); return { ok: false, message: m }; }
      if (w.status === 409 || w.status === 422) { const m = `GitHub refused the test file${await why(w)}. Check the branch name (usually main).`; logResult(false, m); return { ok: false, message: m }; }
      if (!w.ok) { const m = `Saving failed: GitHub answered ${w.status}${await why(w)}.`; logResult(false, m); return { ok: false, message: m }; }
      logResult(true, 'Connection test file saved.');
      return { ok: true, message: `Connected to ${j.full_name} and saved a test file.` };
    } catch (e) {
      return { ok: false, message: "Can't reach GitHub from here. (The claude.ai preview blocks it; use viraj.ankityagi.online.)" };
    }
  }

  function enqueue(path, obj) {
    const q = queue();
    q.push({ path, content: JSON.stringify(obj, null, 1) });
    write(K_QUEUE, q.slice(-500));
    return flush();
  }

  let flushing = null;
  // Send everything waiting. Returns { sent, pending, error }.
  function flush() {
    if (flushing) return flushing;
    flushing = (async () => {
      const c = config();
      let q = queue(), sent = 0, error = '';
      if (!c.token) return { sent, pending: q.length, error: 'not set up' };
      while (q.length) {
        const item = q[0];
        try {
          const r = await put(c, item.path, item.content, `Add ${item.path.split('/').pop()}`);
          // 422 means a file already exists at that path: it was sent before, so drop it
          if (!r.ok && r.status !== 422) { error = `GitHub answered ${r.status}${await why(r)}`; break; }
        } catch (e) { error = 'offline or blocked'; break; }
        q = q.slice(1); write(K_QUEUE, q); sent++;
      }
      if (sent || error) logResult(!error, error ? `Upload failed: ${error}. ${q.length} waiting.` : `Uploaded ${sent} level(s).`);
      return { sent, pending: q.length, error };
    })().finally(() => { flushing = null; });
    return flushing;
  }

  // All session files for a player, newest last. Files are cached because they never change.
  async function sessions(player) {
    const c = config();
    const tr = await fetch(`${API}/repos/${c.repo}/git/trees/${c.branch}?recursive=1`, { headers: headers(c.token) });
    if (tr.status === 404 || tr.status === 409) return []; // repo empty or branch not created yet
    if (!tr.ok) throw new Error(`GitHub answered ${tr.status}`);
    const paths = (await tr.json()).tree.map(n => n.path).filter(p => p.startsWith(`players/${player}/sessions/`) && p.endsWith('.json'));
    const cache = read(K_CACHE, {});
    const missing = paths.filter(p => !cache[p]);
    for (let i = 0; i < missing.length; i += 6) {
      await Promise.all(missing.slice(i, i + 6).map(async p => {
        const r = await fetch(`https://raw.githubusercontent.com/${c.repo}/${c.branch}/${p}`);
        if (r.ok) { try { cache[p] = await r.json(); } catch (e) { /* skip a bad file */ } }
      }));
    }
    if (!write(K_CACHE, cache)) { /* storage full: still return what we have */ }
    return paths.map(p => cache[p]).filter(Boolean);
  }

  return { config, setConfig, test, enqueue, flush, sessions, pending: () => queue().length, lastLog: () => read(K_LOG, null), DEFAULT_REPO };
})();
