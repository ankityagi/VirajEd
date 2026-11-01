/* Viraj's Math Quest: game engine.
   Topics register themselves on window.VQ_TOPICS (see js/topics/). */
(function () {
  const QUESTIONS = 10;           // questions per level
  const PASS = 8;                 // correct answers needed to clear a level (80%)
  const SILVER = 9;               // 2 stars from here; 3 stars = all right with no hints
  const STORE = 'virajQuest.v1';

  /* The four areas match the i-Ready / district score report. `focus` marks the area
     to practise most (Measurement & Data was the lowest sub-score in Fall 2026). */
  const AREAS = [
    { id: 'md', name: 'Measurement & Data', focus: true },
    { id: 'nbt', name: 'Numbers & Operations' },
    { id: 'oa', name: 'Algebra & Patterns' },
    { id: 'geo', name: 'Geometry' }
  ];
  const COMING = [
    { id: 'fractions', area: 'nbt', name: 'Fractions', blurb: 'Equivalent fractions, comparing, adding.', icon: 'pie' },
    { id: 'multiply', area: 'nbt', name: 'Big Multiplication', blurb: 'Multi-digit times and long division.', icon: 'times' },
    { id: 'decimals', area: 'nbt', name: 'Decimals', blurb: 'Tenths, hundredths and money.', icon: 'dot' },
    { id: 'patterns', area: 'oa', name: 'Patterns & Rules', blurb: 'Number patterns and input/output tables.', icon: 'pattern' },
    { id: 'factors', area: 'oa', name: 'Factors & Multiples', blurb: 'Primes, factor pairs and multi-step word problems.', icon: 'times' },
    { id: 'angles', area: 'geo', name: 'Angles & Lines', blurb: 'Measure angles, parallel and perpendicular.', icon: 'angle' },
    { id: 'symmetry', area: 'geo', name: 'Shapes & Symmetry', blurb: 'Classify shapes and find lines of symmetry.', icon: 'pattern' }
  ];
  const TOPICS = (window.VQ_TOPICS || []).concat(COMING.filter(c => !(window.VQ_TOPICS || []).some(t => t.id === c.id)));

  const ICONS = {
    ruler: '<rect x="4" y="14" width="40" height="18" rx="2"/><path d="M10 14v7M16 14v4M22 14v7M28 14v4M34 14v7M40 14v4"/>',
    pie: '<circle cx="24" cy="24" r="17"/><path d="M24 24V7M24 24l14.7 8.5"/>',
    times: '<path d="M12 12l24 24M36 12L12 36"/>',
    angle: '<path d="M8 40h32M8 40L34 12"/><path d="M20 40a12 12 0 0 0-3.5-8.5"/>',
    dot: '<rect x="6" y="12" width="14" height="24" rx="3"/><rect x="28" y="12" width="14" height="24" rx="3"/><circle cx="24" cy="34" r="1.8"/>',
    clock: '<circle cx="24" cy="24" r="17"/><path d="M24 13v11l7 5"/>',
    bars: '<path d="M8 40h32"/><rect x="11" y="24" width="6" height="16"/><rect x="21" y="14" width="6" height="26"/><rect x="31" y="20" width="6" height="20"/>',
    pattern: '<circle cx="10" cy="30" r="4"/><circle cx="24" cy="22" r="4"/><circle cx="38" cy="14" r="4"/>'
  };
  const icon = n => `<svg class="ic" viewBox="0 0 48 48" aria-hidden="true">${ICONS[n] || ''}</svg>`;

  /* ---------- players and saved progress ----------
     Each player has a short code. Only the code goes into the synced progress files,
     so the data is anonymous; the name is shown on this site only. */
  const PLAYERS = [{ id: 'p1', name: 'Viraj' }];
  const K_CURRENT = 'vq.current', K_PINS = 'vq.pins';
  const lsGet = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignore */ } };
  const stateKey = id => (id === 'p1' ? STORE : 'vq.state.' + id); // p1 keeps the original key so old progress carries over
  const pins = () => lsGet(K_PINS, {});
  const setPin = (key, hash) => { const p = pins(); p[key] = hash; lsSet(K_PINS, p); };
  let player = null;
  function load(id) {
    const s = lsGet(stateKey(id), null);
    const st = s && s.topics ? s : { xp: 0, topics: {} };
    if (st.pinHash) { if (!pins().parent) setPin('parent', st.pinHash); delete st.pinHash; } // parent PIN used to live here
    return st;
  }
  let state = { xp: 0, topics: {} };
  function save() { if (player) lsSet(stateKey(player.id), state); }
  const prog = id => (state.topics[id] = state.topics[id] || { stars: {} });
  const starsFor = (t, i) => prog(t.id).stars[i] || 0;
  // Parent mode unlocks every level. It is guarded by a parent PIN and lasts only until the
  // page is reloaded. Older saves kept it switched on in storage; drop that so it starts off.
  let parentMode = false;
  const unlocked = (t, i) => parentMode || i === 0 || starsFor(t, i - 1) > 0;

  /* ---------- parent PIN ----------
     Kid-proof, not real security: the site is public static code, so the PIN is chosen on the
     device the first time and only a hash of it is stored there (with the progress). */
  function pinHash(pin) {
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57; const s = 'vq-pin:' + pin;
    for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677); }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
  }
  // mode 'set' asks for a new PIN twice; 'enter' checks it. onOk runs after success.
  // opts.key picks whose PIN ('parent' or a player code); opts.title/text/forgot customise it.
  function pinDialog(mode, onOk, opts = {}) {
    const setting = mode === 'set', key = opts.key || 'parent';
    const wrap = document.createElement('div');
    wrap.className = 'modal';
    wrap.innerHTML = `<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="pin-h">
        <h2 id="pin-h">${opts.title || (setting ? 'Set a parent PIN' : 'Parent PIN')}</h2>
        <p class="lede">${opts.text || (setting ? 'Choose 4 to 8 digits. You will need it for Parent mode and the progress report on this device.' : 'Enter the parent PIN.')}</p>
        <label class="sr" for="pin1">PIN</label>
        <input id="pin1" class="pin" type="password" inputmode="numeric" autocomplete="off" maxlength="8" placeholder="PIN">
        ${setting ? '<label class="sr" for="pin2">Type it again</label><input id="pin2" class="pin" type="password" inputmode="numeric" autocomplete="off" maxlength="8" placeholder="Type it again">' : ''}
        <p class="pin-err" id="pin-err" hidden></p>
        ${opts.forgot ? '<button class="link small" type="button" id="pin-forgot">Forgot your PIN? Ask a parent</button>' : ''}
        <div class="actions"><button class="btn" type="button" id="pin-cancel">Cancel</button><button class="btn primary" type="button" id="pin-ok">${setting ? 'Save PIN' : 'Unlock'}</button></div>
      </div>`;
    document.body.appendChild(wrap);
    const $ = sel => wrap.querySelector(sel), err = $('#pin-err');
    const close = () => wrap.remove();
    const fail = msg => { err.textContent = msg; err.hidden = false; $('#pin1').value = ''; if ($('#pin2')) $('#pin2').value = ''; $('#pin1').focus(); };
    const ok = () => {
      const a = $('#pin1').value.trim();
      if (setting) {
        if (!/^\d{4,8}$/.test(a)) return fail('Use 4 to 8 digits.');
        if (a !== $('#pin2').value.trim()) return fail('The two PINs do not match.');
        setPin(key, pinHash(a)); close(); onOk();
      } else {
        if (pinHash(a) !== pins()[key]) return fail('That PIN is not right.');
        close(); onOk();
      }
    };
    $('#pin-ok').addEventListener('click', ok);
    $('#pin-cancel').addEventListener('click', close);
    if (opts.forgot) $('#pin-forgot').addEventListener('click', () => { close(); opts.forgot(); });
    wrap.addEventListener('click', e => { if (e.target === wrap) close(); });
    wrap.querySelectorAll('.pin').forEach(i => i.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); ok(); } if (e.key === 'Escape') close(); }));
    $('#pin1').focus();
  }
  const cleared = t => t.levels.filter((_, i) => starsFor(t, i) > 0).length;
  const totalStars = t => t.levels.reduce((s, _, i) => s + starsFor(t, i), 0);

  const app = document.getElementById('app');
  const xpEl = document.getElementById('xp');
  const starRow = (n, max = 3) => `<span class="stars" aria-label="${n} of ${max} stars">${'★'.repeat(n)}<span class="off">${'★'.repeat(max - n)}</span></span>`;
  function showXP() {
    xpEl.textContent = `${state.xp} XP`;
    xpEl.hidden = !player;
    const who = document.getElementById('who');
    who.innerHTML = player ? `${player.name} · <button class="link" id="logout">Log out</button>` : '';
    if (player) document.getElementById('logout').addEventListener('click', logout);
  }

  function go(html, focusSel) {
    app.innerHTML = html;
    window.scrollTo(0, 0);
    const f = focusSel && app.querySelector(focusSel);
    if (f) f.focus();
  }

  /* ---------- home ---------- */
  function home() {
    if (!player) return login();
    if (location.hash) history.replaceState(null, '', location.pathname + location.search);
    const tile = t => {
      if (!t.live) {
        return `<div class="tile soon">${icon(t.icon)}<h2>${t.name}</h2><p>${t.blurb}</p><span class="tag">Coming soon</span></div>`;
      }
      const c = cleared(t), n = t.levels.length;
      return `<button class="tile live" data-topic="${t.id}">
          ${icon(t.icon)}
          <h2>${t.name}</h2>
          <p>${t.blurb}</p>
          <div class="tile-foot">
            <div class="meter" aria-hidden="true"><i style="width:${(c / n) * 100}%"></i></div>
            <span>${c}/${n} levels · ${starRow(Math.min(3, Math.round(totalStars(t) / n)), 3)}</span>
          </div>
          <span class="tag go">${c === 0 ? 'Start' : c === n ? 'Replay' : 'Continue'}</span>
        </button>`;
    };
    const sections = AREAS.map(a => {
      const ts = TOPICS.filter(t => (t.area || 'md') === a.id);
      if (!ts.length) return '';
      return `<section class="area${a.focus ? ' focus' : ''}">
          <h2 class="area-h">${a.name}${a.focus ? ' <span class="pill">Focus area</span>' : ''}</h2>
          <div class="tiles">${ts.map(tile).join('')}</div>
        </section>`;
    }).join('');
    go(`<section class="hello">
          <p class="eyebrow">Pick a quest</p>
          <h1>Hey ${player.name}, ready to level up?</h1>
          <p class="lede">Every quest has 10 levels, and every level has ${QUESTIONS} questions. Get ${PASS} of ${QUESTIONS} right to unlock the next level. Each level is harder than the last.</p>
        </section>
        ${sections}`);
    app.querySelectorAll('[data-topic]').forEach(b => b.addEventListener('click', () => map(TOPICS.find(t => t.id === b.dataset.topic))));
  }

  /* ---------- level map ---------- */
  function map(t) {
    if (location.hash !== '#' + t.id) history.replaceState(null, '', '#' + t.id);
    const c = cleared(t);
    const nextIdx = t.levels.findIndex((_, i) => unlocked(t, i) && starsFor(t, i) === 0);
    const cards = t.levels.map((L, i) => {
      const open = unlocked(t, i), s = starsFor(t, i), next = i === nextIdx;
      return `<button class="lvl${open ? '' : ' locked'}${next ? ' next' : ''}${s ? ' done' : ''}" data-i="${i}" ${open ? '' : 'disabled'}>
          <span class="lvl-n">${i + 1}</span>
          <span class="lvl-body"><b>${L.title}</b><small>${open ? L.skill : 'Clear level ' + i + ' to unlock'}</small><span class="qcount">${QUESTIONS} questions${open ? (s ? ' · play again' : next ? ' · tap to start' : '') : ''}</span></span>
          <span class="lvl-s">${open ? starRow(s) : '<span class="lock" aria-label="Locked">🔒</span>'}</span>
        </button>`;
    }).join('');
    const ticks = t.levels.map((_, i) => `<span class="${starsFor(t, i) ? 'on' : ''}"><em>${i + 1}</em></span>`).join('');
    go(`<nav class="crumbs"><button class="link" id="back">← All quests</button></nav>
        <section class="maphead">
          <p class="eyebrow">${t.grade}</p>
          <h1>${t.name}</h1>
          <p class="lede">${t.levels.length} levels × ${QUESTIONS} questions each. Tap a level to start its ${QUESTIONS} questions.<br>${c} of ${t.levels.length} levels cleared · ${totalStars(t)} of ${t.levels.length * 3} stars</p>
          <div class="ruler" aria-hidden="true">${ticks}</div>
        </section>
        <div class="levels">${cards}</div>
        <p class="parent">${parentMode
          ? `<b>Parent mode is on.</b> Every level is unlocked until you turn it off or reload the page. <button class="link" id="pm-off">Turn off</button> · <button class="link" id="pm-change">Change PIN</button>`
          : `<button class="link" id="pm-on">🔒 Parent mode</button> unlocks every level (needs the parent PIN).`}</p>`,
      '.lvl.next');
    app.querySelector('#back').addEventListener('click', home);
    const on = app.querySelector('#pm-on'), off = app.querySelector('#pm-off'), change = app.querySelector('#pm-change');
    if (on) on.addEventListener('click', () => parentGate(() => { parentMode = true; map(t); }));
    if (off) off.addEventListener('click', () => { parentMode = false; map(t); });
    if (change) change.addEventListener('click', () => pinDialog('set', () => map(t)));
    app.querySelectorAll('.lvl:not(.locked)').forEach(b => b.addEventListener('click', () => play(t, +b.dataset.i)));
  }

  /* ---------- playing a level ---------- */
  function makeQuestions(L) {
    // Cycle through the level's question types so they mix evenly, and re-roll
    // any question that repeats one already in this set (same text and picture).
    const key = q => q.prompt + (q.fig || '') + (q.choices ? q.choices.slice().sort().join('|') : '');
    const out = [], seen = new Set(); let pool = [];
    while (out.length < QUESTIONS) {
      if (!pool.length) pool = L.variants.slice().sort(() => Math.random() - 0.5);
      const v = pool.pop();
      let q, tries = 0;
      do { q = v(); tries++; } while (seen.has(key(q)) && tries < 25);
      if (seen.has(key(q))) {
        // this type has run out of new versions; try the other types before allowing a repeat
        for (const w of L.variants) { const r = w(); if (!seen.has(key(r))) { q = r; break; } }
      }
      seen.add(key(q));
      out.push(q);
    }
    return out;
  }

  function play(t, li) {
    const L = t.levels[li];
    const run = { qs: makeQuestions(L), i: 0, right: 0, hints: 0, log: [], qlog: [], started: new Date().toISOString() };
    question();

    function dots() {
      return run.qs.map((_, k) => {
        const r = run.log[k];
        return `<i class="${r === true ? 'ok' : r === false ? 'no' : k === run.i ? 'cur' : ''}"></i>`;
      }).join('');
    }

    function question() {
      const q = run.qs[run.i];
      const answerUI = q.choices
        ? `<div class="choices">${q.choices.map((c, k) => `<button class="choice" data-k="${k}">${c}</button>`).join('')}</div>`
        : `<div class="answer" id="f">
             <label for="ans" class="sr">Your answer</label>
             <span class="field">${q.unit === 'dollars' ? '<span class="pre">$</span>' : ''}<input id="ans" ${q.frac ? 'inputmode="text"' : 'inputmode="decimal"'} placeholder="${q.frac ? 'e.g. 1 3/4' : '?'}" autocomplete="off" enterkeyhint="done">${q.unit && q.unit !== 'dollars' ? `<span class="unit">${q.unit}</span>` : ''}</span>
             <button class="btn primary" type="button" id="check">Check</button>
           </div>`;
      go(`<div class="playtop">
            <button class="link" id="quit">✕ Quit</button>
            <span class="where">Level ${li + 1} · ${L.title}</span>
            <span class="dots" aria-label="Question ${run.i + 1} of ${QUESTIONS}">${dots()}</span>
          </div>
          <article class="qcard">
            <p class="qnum">Question ${run.i + 1} of ${QUESTIONS}${run.i === 0 ? ' · answer, tap Check, then Next for question 2' : ''}</p>
            <div class="prompt">${q.prompt}</div>
            ${q.fig ? `<figure class="fig">${q.fig}</figure>` : ''}
            ${answerUI}
            <div class="hintrow"><button class="link" id="hint">💡 Need a hint?</button><p class="hinttext" id="hinttext" hidden>${q.hint}</p></div>
            <div class="feedback" id="fb" hidden></div>
          </article>`, '#ans, .choice');
      q.t0 = performance.now();
      app.querySelector('#quit').addEventListener('click', () => { if (run.qlog.length) record(t, li, run, false, 0); map(t); });
      app.querySelector('#hint').addEventListener('click', e => {
        const ht = app.querySelector('#hinttext');
        if (ht.hidden) { ht.hidden = false; q.usedHint = true; e.target.hidden = true; }
      });
      if (q.choices) {
        app.querySelectorAll('.choice').forEach(b => b.addEventListener('click', () => check(+b.dataset.k, b)));
      } else {
        // No <form>: the artifact viewer's sandbox blocks form submission,
        // so the Check button and the Enter key are wired up directly.
        const ans = app.querySelector('#ans');
        const submit = () => {
          if (ans.disabled) return;
          const v = parseAnswer(ans.value);
          if (isNaN(v)) { ans.focus(); return; }
          check(v);
        };
        app.querySelector('#check').addEventListener('click', submit);
        ans.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); submit(); } });
      }
    }

    function check(v, btn) {
      const q = run.qs[run.i];
      const ok = q.choices ? v === q.answer : Math.abs(v - q.answer) < 1e-6;
      run.log[run.i] = ok;
      if (ok) { run.right++; state.xp += q.usedHint ? 5 : 10; save(); showXP(); }
      if (q.usedHint) run.hints++;
      // lock inputs
      app.querySelectorAll('.choice, #ans, .answer button').forEach(el => (el.disabled = true));
      app.querySelector('#hint').hidden = true;
      if (q.choices) {
        app.querySelectorAll('.choice').forEach((b, k) => { if (k === q.answer) b.classList.add('right'); });
        if (!ok && btn) btn.classList.add('wrong');
      } else {
        app.querySelector('.field').classList.add(ok ? 'right' : 'wrong');
      }
      const correct = q.choices ? q.choices[q.answer] : q.answerText ? `${q.answerText} ${q.unit || ''}` : (q.unit === 'dollars' ? '$' + q.answer.toFixed(Number.isInteger(q.answer) ? 0 : 2) : `${q.answer.toLocaleString('en-US')} ${q.unit || ''}`);
      run.qlog.push({
        n: run.i + 1, type: qType(q.prompt), prompt: plain(q.prompt).slice(0, 220),
        answer: plain(correct).trim(), given: q.choices ? plain(q.choices[v]) : String(app.querySelector('#ans').value).trim().slice(0, 40),
        correct: ok, hint: !!q.usedHint, seconds: Math.min(600, Math.round((performance.now() - q.t0) / 100) / 10)
      });
      const fb = app.querySelector('#fb');
      fb.className = 'feedback ' + (ok ? 'good' : 'bad');
      fb.innerHTML = `<p class="verdict">${ok ? pick(['Nailed it!', 'Correct!', 'Nice work!', 'Exactly right!']) + ` <span class="plus">+${q.usedHint ? 5 : 10} XP</span>` : `Not quite. The answer is <b>${correct}</b>.`}</p>
        <p class="why">${q.explain}</p>
        <button class="btn primary" id="next">${run.i + 1 < QUESTIONS ? 'Next question →' : 'See results'}</button>`;
      fb.hidden = false;
      app.querySelector('.dots').innerHTML = dots();
      const nb = app.querySelector('#next');
      nb.addEventListener('click', () => { run.i++; run.i < QUESTIONS ? question() : results(); });
      nb.focus();
    }

    function results() {
      const stars = run.right === QUESTIONS && run.hints === 0 ? 3 : run.right >= SILVER ? 2 : run.right >= PASS ? 1 : 0;
      const passed = stars > 0;
      const p = prog(t.id);
      const best = Math.max(p.stars[li] || 0, stars);
      p.stars[li] = best; save();
      const saving = record(t, li, run, true, stars);
      const hasNext = li + 1 < t.levels.length;
      const title = !passed ? 'So close!' : li + 1 === t.levels.length ? 'Quest complete!' : stars === 3 ? 'Perfect level!' : 'Level cleared!';
      const msg = !passed
        ? `You got ${run.right} of ${QUESTIONS}. You need ${PASS} to unlock level ${li + 2}. The questions change every time, so try again.`
        : stars === 3 ? 'Every answer right with no hints. That is the full 3 stars.'
        : stars === 2 ? `You got ${run.right} of ${QUESTIONS}. Get all ${QUESTIONS} right with no hints for 3 stars.`
        : `You got ${run.right} of ${QUESTIONS}. Get ${SILVER} or more for 2 stars.`;
      go(`<section class="result ${passed ? 'win' : 'lose'}">
            <p class="eyebrow">Level ${li + 1} · ${L.title}</p>
            <h1>${title}</h1>
            <div class="bigstars">${starRow(stars)}</div>
            <p class="lede">${msg}</p>
            <div class="actions">
              ${passed && hasNext ? `<button class="btn primary" id="nextlvl">Level ${li + 2}: ${t.levels[li + 1].title} →</button>` : ''}
              <button class="btn ${passed && hasNext ? '' : 'primary'}" id="again">${passed ? 'Play again' : 'Try again'}</button>
              <button class="btn" id="tomap">Level map</button>
            </div>
            <p class="sync-note" id="sync-note">Saving your progress…</p>
          </section>`, '.actions .primary');
      saving.then(r => {
        const n = document.getElementById('sync-note'); if (!n) return;
        n.textContent = r.error === 'not set up' ? 'Progress saved on this device.' : r.error ? 'Progress saved on this device. It will upload next time.' : 'Progress saved.';
      });
      if (passed) confetti();
      const nl = app.querySelector('#nextlvl'); if (nl) nl.addEventListener('click', () => play(t, li + 1));
      app.querySelector('#again').addEventListener('click', () => play(t, li));
      app.querySelector('#tomap').addEventListener('click', () => map(t));
    }
  }

  const pick = a => a[Math.floor(Math.random() * a.length)];

  // Accepts 42, 1,250, $4.85, 3/4, 1 3/4, 1-3/4
  function parseAnswer(str) {
    const s = str.trim().replace(/[,$]/g, '').replace(/\s*(sq|in|ft|cm|m|min|s|h)\b.*$/i, '');
    let m = s.match(/^(\d+)\s*[ -]\s*(\d+)\s*\/\s*(\d+)$/);
    if (m) return +m[1] + m[2] / m[3];
    m = s.match(/^(\d+)\s*\/\s*(\d+)$/);
    if (m) return m[1] / m[2];
    return parseFloat(s.replace(/\s/g, ''));
  }

  /* ---------- progress records ---------- */
  const plain = html => {
    const d = document.createElement('div');
    d.innerHTML = String(html).replace(/<span class="fr"><span>([^<]*)<\/span><span>([^<]*)<\/span><\/span>/g, ' $1/$2 ').replace(/<br\s*\/?>|<\/tr>|<\/p>/g, ' ');
    return d.textContent.replace(/\s+/g, ' ').trim();
  };
  // question "type": the wording with numbers taken out, so the same kind of question groups together
  const qType = html => plain(html).replace(/\$?\d[\d,]*(\.\d+)?(\s*\/\s*\d+)?|[½¼¾⅛⅜⅝⅞]/g, '#').replace(/(#\s*){2,}/g, '# ').slice(0, 90);
  const sessionsKey = () => 'vq.sessions.' + player.id;
  function record(t, li, run, completed, stars) {
    const now = new Date(), id = now.toISOString().replace(/[:.]/g, '-') + '-' + Math.random().toString(36).slice(2, 6);
    const s = {
      v: 1, id, player: player.id, topic: t.id, level: li + 1, levelTitle: t.levels[li].title,
      startedAt: run.started, endedAt: now.toISOString(), completed, correct: run.right, total: QUESTIONS,
      stars, hints: run.hints, seconds: Math.round(run.qlog.reduce((a, q) => a + q.seconds, 0)), questions: run.qlog
    };
    const local = lsGet(sessionsKey(), []); local.push(s); lsSet(sessionsKey(), local.slice(-400));
    const path = `players/${player.id}/sessions/${id.slice(0, 4)}/${id.slice(5, 7)}/${id}-${t.id}-L${li + 1}${completed ? '' : '-quit'}.json`;
    return window.VQSync ? VQSync.enqueue(path, s) : Promise.resolve({ error: 'not set up' });
  }
  // sessions on this device plus any already uploaded (e.g. played on another device)
  async function allSessions() {
    const local = lsGet(sessionsKey(), []);
    let remote = [], note = '';
    try { remote = await VQSync.sessions(player.id); }
    catch (e) { note = "Couldn't load the online log just now, so this shows this device only."; }
    if (!remote.length && !note) note = '';
    const seen = new Set(), out = [];
    remote.concat(local).forEach(s => { if (s && !seen.has(s.id)) { seen.add(s.id); out.push(s); } });
    return { sessions: out, note };
  }
  // bring stars and XP over from levels played on other devices
  async function restore() {
    try {
      const remote = await VQSync.sessions(player.id);
      let changed = false, xp = 0;
      remote.forEach(s => {
        (s.questions || []).forEach(q => { if (q.correct) xp += q.hint ? 5 : 10; });
        if (!s.completed || !s.stars) return;
        const pr = prog(s.topic), i = s.level - 1;
        if ((pr.stars[i] || 0) < s.stars) { pr.stars[i] = s.stars; changed = true; }
      });
      if (xp > state.xp) { state.xp = xp; changed = true; }
      if (changed) { save(); showXP(); }
    } catch (e) { /* offline: keep local progress */ }
  }

  /* ---------- login ---------- */
  function login() {
    player = null; showXP();
    if (location.hash) history.replaceState(null, '', location.pathname + location.search);
    go(`<section class="hello">
          <p class="eyebrow">Math Quest</p>
          <h1>Who's playing?</h1>
          <p class="lede">Log in with your PIN so your stars and progress are saved.</p>
        </section>
        <div class="tiles players">${PLAYERS.map(p => `<button class="tile live player" data-p="${p.id}"><span class="avatar">${p.name[0]}</span><h2>${p.name}</h2><span class="tag go">${pins()[p.id] ? 'Log in' : 'Start'}</span></button>`).join('')}</div>`, '.player');
    app.querySelectorAll('[data-p]').forEach(b => b.addEventListener('click', () => {
      const p = PLAYERS.find(x => x.id === b.dataset.p);
      const reset = () => parentGate(() => pinDialog('set', () => startAs(p), { key: p.id, title: `New PIN for ${p.name}`, text: 'Choose 4 to 8 digits for him to log in with.' }));
      if (pins()[p.id]) pinDialog('enter', () => startAs(p), { key: p.id, title: `Hi ${p.name}!`, text: 'Type your PIN.', forgot: reset });
      else pinDialog('set', () => startAs(p), { key: p.id, title: `Hi ${p.name}! Make a PIN`, text: 'Pick 4 to 8 digits you can remember. You will use it to log in.' });
    }));
  }
  function startAs(p, topic) {
    player = p; state = load(p.id); lsSet(K_CURRENT, p.id); parentMode = false; showXP();
    topic ? map(topic) : home();
    if (window.VQSync) { VQSync.flush(); restore(); }
  }
  function logout() { lsSet(K_CURRENT, null); parentMode = false; login(); }

  /* ---------- parent area: report and settings ---------- */
  function parentGate(onOk) { pinDialog(pins().parent ? 'enter' : 'set', onOk); }
  function parentPage(tab = 'report') {
    if (location.hash) history.replaceState(null, '', location.pathname + location.search);
    const who = player || PLAYERS[0], c = VQSync.config();
    go(`<nav class="crumbs"><button class="link" id="back">← Back to the game</button></nav>
        <section class="maphead"><p class="eyebrow">Parent</p><h1>${who.name}'s progress</h1></section>
        <div class="tabs" role="tablist"><button class="tab${tab === 'report' ? ' on' : ''}" data-tab="report">Report</button><button class="tab${tab === 'settings' ? ' on' : ''}" data-tab="settings">Settings</button></div>
        ${tab === 'report' ? '<div id="report"><p class="muted">Loading the progress log…</p></div>' : `
        <section class="panel">
          <h2>Save progress to GitHub</h2>
          <p class="muted small">Each level is saved as a small text file in <b>${c.repo}</b> under the code <b>${who.id}</b> (no names). Reading the report needs nothing; saving needs an access token, entered here once on ${who.name}'s device.</p>
          <label for="s-repo">Data repo</label><input id="s-repo" class="txt" value="${c.repo}" autocomplete="off">
          <label for="s-branch">Branch</label><input id="s-branch" class="txt" value="${c.branch}" autocomplete="off">
          <label for="s-token">Access token</label><input id="s-token" class="txt" type="password" value="${c.token}" autocomplete="off" placeholder="github_pat_…">
          <div class="actions left"><button class="btn primary" type="button" id="s-save">Save and test</button><button class="btn" type="button" id="s-flush">Upload now</button></div>
          <p class="pin-msg" id="s-msg">${VQSync.pending() ? `${VQSync.pending()} level(s) waiting to upload.` : ''}</p>
        </section>
        <section class="panel">
          <h2>PINs</h2>
          <div class="actions left"><button class="btn" type="button" id="p-parent">Change parent PIN</button><button class="btn" type="button" id="p-kid">Reset ${who.name}'s PIN</button></div>
        </section>`}`);
    app.querySelector('#back').addEventListener('click', () => (player ? home() : login()));
    app.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => parentPage(b.dataset.tab)));
    if (tab === 'report') {
      const prev = player; player = who;
      allSessions().then(({ sessions, note }) => {
        player = prev;
        const el = document.getElementById('report'); if (!el) return;
        const pend = VQSync.pending();
        VQReport.render(el, sessions, TOPICS.filter(t => t.live), AREAS,
          `<p class="muted small">${note ? note + ' ' : ''}${pend ? `${pend} level(s) on this device are still waiting to upload.` : ''}</p>`);
      });
    } else {
      const msg = app.querySelector('#s-msg');
      app.querySelector('#s-save').addEventListener('click', async () => {
        const cfg = { repo: app.querySelector('#s-repo').value.trim(), branch: app.querySelector('#s-branch').value.trim() || 'main', token: app.querySelector('#s-token').value.trim() };
        msg.textContent = 'Checking…';
        const r = await VQSync.test(cfg);
        if (r.ok) VQSync.setConfig(cfg);
        msg.textContent = r.ok ? r.message + ' Saved.' : r.message;
        msg.className = 'pin-msg ' + (r.ok ? 'good' : 'bad');
        if (r.ok) { const f = await VQSync.flush(); if (f.sent) msg.textContent += ` Uploaded ${f.sent} level(s).`; }
      });
      app.querySelector('#s-flush').addEventListener('click', async () => {
        msg.textContent = 'Uploading…';
        const f = await VQSync.flush();
        msg.textContent = f.error === 'not set up' ? 'Add a token first.' : f.error ? `Couldn't upload (${f.error}). ${f.pending} waiting.` : `Uploaded ${f.sent}. Nothing waiting.`;
      });
      app.querySelector('#p-parent').addEventListener('click', () => pinDialog('set', () => { msg.textContent = 'Parent PIN changed.'; }));
      app.querySelector('#p-kid').addEventListener('click', () => pinDialog('set', () => { msg.textContent = `${who.name}'s PIN changed.`; }, { key: who.id, title: `New PIN for ${who.name}` }));
    }
  }

  /* ---------- confetti ---------- */
  function confetti() {
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const c = document.createElement('canvas'); c.className = 'confetti'; document.body.appendChild(c);
    const ctx = c.getContext('2d'), dpr = window.devicePixelRatio || 1;
    c.width = innerWidth * dpr; c.height = innerHeight * dpr; ctx.scale(dpr, dpr);
    const css = getComputedStyle(document.documentElement);
    const cols = ['--pencil', '--ink-blue', '--good', '--coral'].map(v => css.getPropertyValue(v).trim() || '#fb0');
    const P = Array.from({ length: 110 }, () => ({ x: innerWidth / 2 + (Math.random() - 0.5) * 120, y: innerHeight * 0.35, vx: (Math.random() - 0.5) * 11, vy: -Math.random() * 11 - 4, r: Math.random() * 6.28, s: 5 + Math.random() * 6, c: pick(cols) }));
    const t0 = performance.now();
    (function frame(now) {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      P.forEach(p => { p.vy += 0.32; p.x += p.vx; p.y += p.vy; p.r += 0.12; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); ctx.restore(); });
      if (now - t0 < 1800) requestAnimationFrame(frame); else c.remove();
    })(t0);
  }

  /* ---------- boot ---------- */
  document.getElementById('home').addEventListener('click', home);
  document.getElementById('parent-link').addEventListener('click', () => parentGate(() => parentPage('report')));
  const start = TOPICS.find(t => t.live && '#' + t.id === location.hash);
  const current = PLAYERS.find(p => p.id === lsGet(K_CURRENT, null));
  current ? startAs(current, start) : login();
})();
