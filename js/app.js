/* Viraj's Math Quest: game engine.
   Topics register themselves on window.VQ_TOPICS (see js/topics/). */
(function () {
  const QUESTIONS = 5;            // questions per level
  const PASS = 4;                 // correct answers needed to clear a level
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
    { id: 'graphs', area: 'md', name: 'Graphs & Line Plots', blurb: 'Read bar graphs, line plots and tables.', icon: 'bars' },
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

  /* ---------- saved progress ---------- */
  function load() {
    try { const s = JSON.parse(localStorage.getItem(STORE)); if (s && s.topics) return s; } catch (e) { /* ignore */ }
    return { xp: 0, topics: {}, unlockAll: false };
  }
  let state = load();
  function save() { try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (e) { /* ignore */ } }
  const prog = id => (state.topics[id] = state.topics[id] || { stars: {} });
  const starsFor = (t, i) => prog(t.id).stars[i] || 0;
  const unlocked = (t, i) => state.unlockAll || i === 0 || starsFor(t, i - 1) > 0;
  const cleared = t => t.levels.filter((_, i) => starsFor(t, i) > 0).length;
  const totalStars = t => t.levels.reduce((s, _, i) => s + starsFor(t, i), 0);

  const app = document.getElementById('app');
  const xpEl = document.getElementById('xp');
  const starRow = (n, max = 3) => `<span class="stars" aria-label="${n} of ${max} stars">${'★'.repeat(n)}<span class="off">${'★'.repeat(max - n)}</span></span>`;
  function showXP() { xpEl.textContent = `${state.xp} XP`; }

  function go(html, focusSel) {
    app.innerHTML = html;
    window.scrollTo(0, 0);
    const f = focusSel && app.querySelector(focusSel);
    if (f) f.focus();
  }

  /* ---------- home ---------- */
  function home() {
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
          <h1>Hey Viraj, ready to level up?</h1>
          <p class="lede">Every quest has 10 levels. Get ${PASS} of ${QUESTIONS} right to unlock the next one. Each level is harder than the last.</p>
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
          <span class="lvl-body"><b>${L.title}</b><small>${open ? L.skill : 'Clear level ' + i + ' to unlock'}</small></span>
          <span class="lvl-s">${open ? starRow(s) : '<span class="lock" aria-label="Locked">🔒</span>'}</span>
        </button>`;
    }).join('');
    const ticks = t.levels.map((_, i) => `<span class="${starsFor(t, i) ? 'on' : ''}"><em>${i + 1}</em></span>`).join('');
    go(`<nav class="crumbs"><button class="link" id="back">← All quests</button></nav>
        <section class="maphead">
          <p class="eyebrow">${t.grade}</p>
          <h1>${t.name}</h1>
          <p class="lede">${c} of ${t.levels.length} levels cleared · ${totalStars(t)} of ${t.levels.length * 3} stars</p>
          <div class="ruler" aria-hidden="true">${ticks}</div>
        </section>
        <div class="levels">${cards}</div>
        <p class="parent"><label><input type="checkbox" id="unlockall" ${state.unlockAll ? 'checked' : ''}> Parent mode: unlock every level</label></p>`,
      '.lvl.next');
    app.querySelector('#back').addEventListener('click', home);
    app.querySelector('#unlockall').addEventListener('change', e => { state.unlockAll = e.target.checked; save(); map(t); });
    app.querySelectorAll('.lvl:not(.locked)').forEach(b => b.addEventListener('click', () => play(t, +b.dataset.i)));
  }

  /* ---------- playing a level ---------- */
  function makeQuestions(L) {
    const out = []; let pool = [];
    while (out.length < QUESTIONS) {
      if (!pool.length) pool = L.variants.slice().sort(() => Math.random() - 0.5);
      out.push(pool.pop()());
    }
    return out;
  }

  function play(t, li) {
    const L = t.levels[li];
    const run = { qs: makeQuestions(L), i: 0, right: 0, hints: 0, log: [] };
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
        : `<form class="answer" id="f" autocomplete="off">
             <label for="ans" class="sr">Your answer</label>
             <span class="field">${q.unit === 'dollars' ? '<span class="pre">$</span>' : ''}<input id="ans" inputmode="decimal" placeholder="?" required>${q.unit && q.unit !== 'dollars' ? `<span class="unit">${q.unit}</span>` : ''}</span>
             <button class="btn primary" type="submit">Check</button>
           </form>`;
      go(`<div class="playtop">
            <button class="link" id="quit">✕ Quit</button>
            <span class="where">Level ${li + 1} · ${L.title}</span>
            <span class="dots" aria-label="Question ${run.i + 1} of ${QUESTIONS}">${dots()}</span>
          </div>
          <article class="qcard">
            <p class="qnum">Question ${run.i + 1} of ${QUESTIONS}</p>
            <div class="prompt">${q.prompt}</div>
            ${q.fig ? `<figure class="fig">${q.fig}</figure>` : ''}
            ${answerUI}
            <div class="hintrow"><button class="link" id="hint">💡 Need a hint?</button><p class="hinttext" id="hinttext" hidden>${q.hint}</p></div>
            <div class="feedback" id="fb" hidden></div>
          </article>`, '#ans, .choice');
      app.querySelector('#quit').addEventListener('click', () => map(t));
      app.querySelector('#hint').addEventListener('click', e => {
        const ht = app.querySelector('#hinttext');
        if (ht.hidden) { ht.hidden = false; q.usedHint = true; e.target.hidden = true; }
      });
      if (q.choices) {
        app.querySelectorAll('.choice').forEach(b => b.addEventListener('click', () => check(+b.dataset.k, b)));
      } else {
        app.querySelector('#f').addEventListener('submit', e => {
          e.preventDefault();
          const raw = app.querySelector('#ans').value.replace(/[,$\s]/g, '');
          const v = parseFloat(raw);
          if (isNaN(v)) { app.querySelector('#ans').focus(); return; }
          check(v);
        });
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
      const correct = q.choices ? q.choices[q.answer] : (q.unit === 'dollars' ? '$' + q.answer.toFixed(Number.isInteger(q.answer) ? 0 : 2) : `${q.answer.toLocaleString('en-US')} ${q.unit || ''}`);
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
      const stars = run.right === QUESTIONS ? (run.hints === 0 ? 3 : 2) : run.right >= PASS ? 1 : 0;
      const passed = stars > 0;
      const p = prog(t.id);
      const best = Math.max(p.stars[li] || 0, stars);
      p.stars[li] = best; save();
      const hasNext = li + 1 < t.levels.length;
      const title = !passed ? 'So close!' : li + 1 === t.levels.length ? 'Quest complete!' : stars === 3 ? 'Perfect level!' : 'Level cleared!';
      const msg = !passed
        ? `You got ${run.right} of ${QUESTIONS}. You need ${PASS} to unlock level ${li + 2}. The questions change every time, so try again.`
        : stars === 3 ? 'Every answer right with no hints. That is the full 3 stars.'
        : stars === 2 ? 'All 5 right. Try it again without hints for 3 stars.'
        : `You got ${run.right} of ${QUESTIONS}. Get all 5 for more stars.`;
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
          </section>`, '.actions .primary');
      if (passed) confetti();
      const nl = app.querySelector('#nextlvl'); if (nl) nl.addEventListener('click', () => play(t, li + 1));
      app.querySelector('#again').addEventListener('click', () => play(t, li));
      app.querySelector('#tomap').addEventListener('click', () => map(t));
    }
  }

  const pick = a => a[Math.floor(Math.random() * a.length)];

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
  showXP();
  const start = TOPICS.find(t => t.live && '#' + t.id === location.hash);
  start ? map(start) : home();
})();
