/* Parent dashboard (admin.html).
   Reads the anonymous progress log (one JSON file per level played) from the public data
   repo via VQSync, merges anything still waiting on this device, and shows practice time,
   accuracy, the quest map, speed vs accuracy by question type, mistake patterns, tries per
   level and every session. Behind the parent PIN set on this device. */
(function () {
  const PLAYER = { id: 'p1', name: 'Viraj' };
  const PASS_PCT = 80;
  const root = document.getElementById('admin');
  const tip = document.getElementById('tip');
  const TOPICS = (window.VQ_TOPICS || []).filter(t => t.live);
  const AREAS = { md: 'Measurement & Data', nbt: 'Numbers & Operations', oa: 'Algebra & Patterns', geo: 'Geometry' };
  const tById = Object.fromEntries(TOPICS.map(t => [t.id, t]));

  /* ---------- small helpers ---------- */
  const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const lsGet = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignore */ } };
  const median = a => { if (!a.length) return 0; const s = a.slice().sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
  const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
  const sum = a => a.reduce((s, v) => s + v, 0);
  const secs = s => (s >= 90 ? `${Math.round(s / 6) / 10} min` : s < 10 ? `${Math.round(s * 10) / 10} s` : `${Math.round(s)} s`);
  const mins = s => (s >= 3600 ? `${Math.floor(s / 3600)} h ${Math.round((s % 3600) / 60)} min` : `${Math.max(1, Math.round(s / 60))} min`);
  const dayKey = iso => { const d = new Date(iso); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const dayLabel = k => new Date(k + 'T12:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const when = iso => new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  const tName = id => (tById[id] || {}).name || id;
  const lvTitle = (id, l) => ((tById[id] || {}).levels || [])[l - 1]?.title || '';

  /* ---------- parent PIN (same hash and storage as the game) ---------- */
  function pinHash(pin) {
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57; const s = 'vq-pin:' + pin;
    for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677); }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
  }
  function gate(onOk) {
    if (sessionStorage.getItem('vq.admin') === '1') return onOk();
    const pins = lsGet('vq.pins', {}), setting = !pins.parent;
    root.innerHTML = `<section class="gate panel">
        <h1>${setting ? 'Set a parent PIN' : 'Parent PIN'}</h1>
        <p class="lede">${setting ? 'This device has no parent PIN yet. Choose 4 to 8 digits; you will use it to open this dashboard here.' : `Enter the parent PIN to see ${PLAYER.name}'s progress.`}</p>
        <label class="sr" for="g1">PIN</label><input id="g1" class="pin" type="password" inputmode="numeric" maxlength="8" autocomplete="off" placeholder="PIN">
        ${setting ? '<label class="sr" for="g2">Type it again</label><input id="g2" class="pin" type="password" inputmode="numeric" maxlength="8" autocomplete="off" placeholder="Type it again">' : ''}
        <p class="pin-err" id="gerr" hidden></p>
        <div class="actions left"><button class="btn primary" type="button" id="gok">${setting ? 'Save PIN and open' : 'Open dashboard'}</button></div>
      </section>`;
    const g1 = document.getElementById('g1'), g2 = document.getElementById('g2'), err = document.getElementById('gerr');
    const fail = m => { err.textContent = m; err.hidden = false; g1.value = ''; if (g2) g2.value = ''; g1.focus(); };
    const ok = () => {
      const a = g1.value.trim();
      if (setting) {
        if (!/^\d{4,8}$/.test(a)) return fail('Use 4 to 8 digits.');
        if (a !== g2.value.trim()) return fail('The two PINs do not match.');
        const p = lsGet('vq.pins', {}); p.parent = pinHash(a); lsSet('vq.pins', p);
      } else if (pinHash(a) !== lsGet('vq.pins', {}).parent) return fail('That PIN is not right.');
      try { sessionStorage.setItem('vq.admin', '1'); } catch (e) { /* ignore */ }
      onOk();
    };
    document.getElementById('gok').addEventListener('click', ok);
    [g1, g2].forEach(i => i && i.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); ok(); } }));
    g1.focus();
  }

  /* ---------- mistake patterns ---------- */
  const num = s => {
    const t = String(s || '').replace(/[,$]/g, '').trim();
    let m = t.match(/^(\d+)\s*[ -]\s*(\d+)\s*\/\s*(\d+)/); if (m) return +m[1] + m[2] / m[3];
    m = t.match(/^(\d+)\s*\/\s*(\d+)/); if (m) return m[1] / m[2];
    m = t.match(/^-?\d+(\.\d+)?/); return m ? +m[0] : NaN;
  };
  const KINDS = {
    joined: { name: 'Wrote the numbers side by side', help: 'Put two numbers from the question next to each other instead of working them out, e.g. 6 min 12 s → 612 instead of 372. Usually a units mix-up.' },
    zeros: { name: 'Lost or added a zero', help: 'Answer is 10 or 100 times too small or big, e.g. 80 × 30 → 240. Practise multiplying with tens.' },
    close: { name: 'Small slip', help: 'Within 5% of a right answer of 20 or more: the method was right, a step of adding or subtracting slipped.' },
    swap: { name: 'Mixed up two ideas', help: 'Picked a wrong option in a multiple-choice question. The pairs he confuses are listed.' },
    other: { name: 'Other wrong answer', help: 'Not one of the patterns above.' }
  };
  function mistakeKind(q) {
    if (q.correct) return null;
    const a = num(q.answer), g = num(q.given);
    if (isNaN(a) || isNaN(g)) return 'swap';
    const ns = (q.prompt || '').replace(/,(?=\d)/g, '').match(/\d+/g) || [];
    for (let i = 0; i < ns.length; i++) for (let j = i + 1; j < ns.length; j++) if (ns[i] + ns[j] === String(g)) return 'joined';
    if (a && g && [10, 100, 0.1, 0.01].some(r => Math.abs(g / a - r) < 1e-9)) return 'zeros';
    if (Math.abs(a) >= 20 && Math.abs(g - a) <= Math.abs(a) * 0.05) return 'close'; // off by one on a small answer is a real miss, not a slip
    return 'other';
  }

  /* ---------- crunch the numbers ---------- */
  function analyse(all, range) {
    const now = Date.now(), cut = range === 'all' ? 0 : now - (range === '7' ? 7 : 30) * 864e5;
    const S = all.filter(s => new Date(s.startedAt).getTime() >= cut).sort((a, b) => (a.startedAt < b.startedAt ? -1 : 1));
    const Q = [];
    S.forEach(s => (s.questions || []).forEach(q => Q.push(Object.assign({ topic: s.topic, level: s.level, at: s.startedAt, sid: s.id }, q, { kind: mistakeKind(q) }))));
    const typical = median(Q.map(q => q.seconds).filter(Boolean)) || 20;

    const days = {};
    S.forEach(s => {
      const k = dayKey(s.startedAt), d = (days[k] = days[k] || { k, secs: 0, n: 0, right: 0, sessions: 0 });
      d.sessions++; (s.questions || []).forEach(q => { d.secs += q.seconds || 0; d.n++; if (q.correct) d.right++; });
    });
    const dayRows = Object.values(days).sort((a, b) => (a.k < b.k ? -1 : 1));

    const lv = {};
    S.forEach((s, idx) => {
      const k = `${s.topic}|${s.level}`;
      const g = (lv[k] = lv[k] || { topic: s.topic, level: s.level, tries: 0, quits: 0, best: 0, last: null, stars: 0, passedOn: 0, times: [] });
      g.tries++;
      if (!s.completed) g.quits++;
      else { g.best = Math.max(g.best, s.correct); g.last = s.correct; if (s.stars > g.stars) g.stars = s.stars; if (s.stars > 0 && !g.passedOn) g.passedOn = g.tries; }
      (s.questions || []).forEach(q => q.seconds && g.times.push(q.seconds));
    });
    const levels = Object.values(lv).map(g => Object.assign(g, { med: median(g.times) }))
      .sort((a, b) => (a.topic === b.topic ? a.level - b.level : TOPICS.findIndex(t => t.id === a.topic) - TOPICS.findIndex(t => t.id === b.topic)));

    const ty = {};
    Q.forEach(q => {
      const k = `${q.topic}|${q.level}|${q.type}`;
      const g = (ty[k] = ty[k] || { topic: q.topic, level: q.level, type: q.type, n: 0, right: 0, times: [], wrong: [] });
      g.n++; if (q.correct) g.right++; else g.wrong.push(q); if (q.seconds) g.times.push(q.seconds);
    });
    const types = Object.values(ty).map(g => Object.assign(g, { acc: pct(g.right, g.n), med: median(g.times) }));
    const needs = g => g.n >= 3 && (g.acc < 75 || g.med > typical * 1.6);
    const workOn = types.filter(needs).sort((a, b) => a.acc - b.acc || b.med - a.med);

    const wrong = Q.filter(q => !q.correct);
    const kinds = Object.keys(KINDS).map(k => ({ k, n: wrong.filter(q => q.kind === k).length, ex: wrong.filter(q => q.kind === k) })).filter(r => r.n);
    const swaps = {};
    wrong.filter(q => q.kind === 'swap').forEach(q => { const k = `${q.answer} → picked ${q.given}`; swaps[k] = (swaps[k] || 0) + 1; });
    const swapRows = Object.entries(swaps).sort((a, b) => b[1] - a[1]);

    return { S, Q, typical, dayRows, levels, types, workOn, kinds, swapRows, wrong };
  }

  function highlights(a) {
    const out = [];
    const passedHard = a.levels.filter(g => g.passedOn >= 3).sort((x, y) => y.passedOn - x.passedOn)[0];
    if (passedHard) out.push(`<b>Stuck with it:</b> passed ${esc(tName(passedHard.topic))} level ${passedHard.level} (${esc(lvTitle(passedHard.topic, passedHard.level))}) on try ${passedHard.passedOn}${passedHard.quits ? `, after quitting ${passedHard.quits} time${passedHard.quits > 1 ? 's' : ''}` : ''}.`);
    const perfect = a.S.filter(s => s.stars === 3);
    if (perfect.length) out.push(`<b>Perfect levels:</b> ${perfect.length} with 10/10 and no hints (${[...new Set(perfect.map(s => `${tName(s.topic)} L${s.level}`))].map(esc).join(', ')}).`);
    const topKind = a.kinds.filter(k => k.k !== 'other' && k.k !== 'swap').sort((x, y) => y.n - x.n)[0];
    if (topKind && topKind.n >= 2) { const e = topKind.ex[0]; out.push(`<b>Most common slip: ${esc(KINDS[topKind.k].name.toLowerCase())}</b> (${topKind.n} times), e.g. “${esc(e.prompt)}” → he wrote <b>${esc(e.given)}</b>, answer ${esc(e.answer)}.`); }
    if (a.swapRows.length && a.swapRows[0][1] >= 2) out.push(`<b>Mix-up to clear up:</b> ${esc(a.swapRows[0][0])} (${a.swapRows[0][1]} times).`);
    const quitty = a.levels.filter(g => g.quits >= 3).sort((x, y) => y.quits - x.quits)[0];
    if (quitty) out.push(`<b>Quit often:</b> ${esc(tName(quitty.topic))} level ${quitty.level}, ${quitty.quits} of ${quitty.tries} tries. Worth sitting with him for one round.`);
    const slow = a.types.filter(g => g.n >= 3).sort((x, y) => y.med - x.med)[0];
    if (slow && slow.med > a.typical * 1.6) out.push(`<b>Slowest question type:</b> “${esc(slow.type)}” takes him about ${secs(slow.med)} (typical is ${secs(a.typical)}).`);
    return out;
  }

  /* ---------- charts (SVG, sized to their container) ---------- */
  const W = el => Math.max(280, Math.floor(el.clientWidth));
  function niceTicks(max, count = 4) {
    const raw = Math.max(max, 1) / count, mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const step = [1, 2, 2.5, 5, 10].map(m => m * mag).find(s => s >= raw);
    const top = Math.ceil(max / step) * step || step;
    const t = []; for (let v = 0; v <= top + 1e-9; v += step) t.push(Math.round(v * 100) / 100);
    return { top, t };
  }
  const roundedTop = (x, y, w, h, r) => { r = Math.min(r, w / 2, h); return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`; };

  function columnChart(el, rows, opt) {
    const w = W(el), h = 210, L = 40, R = 8, T = 10, B = 28, pw = w - L - R, ph = h - T - B;
    const { top, t } = niceTicks(Math.max(...rows.map(r => r.v), 1));
    const y = v => T + ph - (v / top) * ph, band = pw / Math.max(rows.length, 1), bw = Math.min(46, band - 2);
    let s = t.map(v => `<line class="c-grid" x1="${L}" x2="${w - R}" y1="${y(v)}" y2="${y(v)}"/><text class="c-tick" x="${L - 6}" y="${y(v)}" text-anchor="end" dominant-baseline="middle">${v}</text>`).join('');
    const every = Math.ceil(rows.length / Math.floor(pw / 52));
    rows.forEach((r, i) => {
      const cx = L + band * (i + 0.5), bh = (r.v / top) * ph;
      if (bh > 0) s += `<path class="c-bar" d="${roundedTop(cx - bw / 2, y(r.v), bw, bh, 4)}"/>`;
      s += `<rect class="c-hit" x="${L + band * i}" y="${T}" width="${band}" height="${ph}" data-tip="${esc(r.tip)}" tabindex="0"/>`;
      if (i % every === 0) s += `<text class="c-tick" x="${cx}" y="${h - 9}" text-anchor="middle">${esc(r.label)}</text>`;
    });
    s += `<line class="c-axis" x1="${L}" x2="${w - R}" y1="${T + ph}" y2="${T + ph}"/>`;
    el.innerHTML = `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${esc(opt.alt)}">${s}</svg>`;
  }

  function accuracyChart(el, rows) {
    const w = W(el), h = 210, L = 40, R = 14, T = 12, B = 28, pw = w - L - R, ph = h - T - B;
    const y = v => T + ph - (v / 100) * ph, x = i => L + (rows.length === 1 ? pw / 2 : (pw * i) / (rows.length - 1));
    let s = [0, 25, 50, 75, 100].map(v => `<line class="c-grid" x1="${L}" x2="${w - R}" y1="${y(v)}" y2="${y(v)}"/><text class="c-tick" x="${L - 6}" y="${y(v)}" text-anchor="end" dominant-baseline="middle">${v}%</text>`).join('');
    s += `<line class="c-ref" x1="${L}" x2="${w - R}" y1="${y(PASS_PCT)}" y2="${y(PASS_PCT)}"/><text class="c-reflabel" x="${w - R}" y="${y(PASS_PCT) - 6}" text-anchor="end">${PASS_PCT}% clears a level</text>`;
    if (rows.length > 1) s += `<path class="c-line" d="${rows.map((r, i) => `${i ? 'L' : 'M'}${x(i)},${y(r.v)}`).join('')}"/>`;
    const every = Math.ceil(rows.length / Math.floor(pw / 52));
    rows.forEach((r, i) => {
      s += `<circle class="c-dot" cx="${x(i)}" cy="${y(r.v)}" r="5"/><circle class="c-hit" cx="${x(i)}" cy="${y(r.v)}" r="16" data-tip="${esc(r.tip)}" tabindex="0"/>`;
      const anc = rows.length > 1 && i === 0 ? 'start' : rows.length > 1 && i === rows.length - 1 ? 'end' : 'middle';
      if (i % every === 0 || i === rows.length - 1) s += `<text class="c-tick" x="${x(i)}" y="${h - 9}" text-anchor="${anc}">${esc(r.label)}</text>`;
    });
    el.innerHTML = `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="Accuracy per day">${s}</svg>`;
  }

  function scatter(el, a) {
    const pts = a.types.filter(g => g.n >= 2);
    const w = W(el), h = 300, L = 44, R = 16, T = 14, B = 40, pw = w - L - R, ph = h - T - B;
    const xmax = niceTicks(Math.max(30, ...pts.map(p => p.med)) * 1.05, 5);
    const x = v => L + (Math.min(v, xmax.top) / xmax.top) * pw, y = v => T + ph - (v / 100) * ph;
    const slowX = a.typical * 1.6;
    let s = `<rect class="c-zone" x="${L}" y="${y(75)}" width="${pw}" height="${y(0) - y(75)}"/>`;
    if (x(slowX) < w - R) s += `<rect class="c-zone" x="${x(slowX)}" y="${T}" width="${w - R - x(slowX)}" height="${y(75) - T}"/>`;
    s += `<text class="c-reflabel" x="${L + 6}" y="${y(0) - 8}">Under 75% correct</text>`;
    if (x(slowX) < w - R - 60) s += `<text class="c-reflabel" x="${w - R - 4}" y="${T + 12}" text-anchor="end">Slow (over ${secs(slowX)})</text>`;
    s += [0, 25, 50, 75, 100].map(v => `<line class="c-grid" x1="${L}" x2="${w - R}" y1="${y(v)}" y2="${y(v)}"/><text class="c-tick" x="${L - 6}" y="${y(v)}" text-anchor="end" dominant-baseline="middle">${v}%</text>`).join('');
    s += xmax.t.map(v => `<text class="c-tick" x="${x(v)}" y="${T + ph + 16}" text-anchor="middle">${v}s</text>`).join('');
    s += `<text class="c-axislabel" x="${L + pw / 2}" y="${h - 4}" text-anchor="middle">Typical seconds per question →</text>`;
    pts.sort((p, q) => q.n - p.n).forEach(p => {
      const r = Math.min(13, 5 + Math.sqrt(p.n) * 1.6), bad = p.n >= 3 && (p.acc < 75 || p.med > slowX);
      const t = `<b>${esc(tName(p.topic))} · L${p.level}</b><br>${esc(p.type)}<br>${p.acc}% correct (${p.right}/${p.n}) · ${secs(p.med)}`;
      s += `<circle class="c-pt${bad ? ' bad' : ''}" cx="${x(p.med)}" cy="${y(p.acc)}" r="${r}"/><circle class="c-hit" cx="${x(p.med)}" cy="${y(p.acc)}" r="${r + 6}" data-tip="${esc(t)}" tabindex="0"/>`;
    });
    el.innerHTML = `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="Speed and accuracy by question type">${s}</svg>`;
  }

  function hbars(el, rows) {
    const w = W(el), stack = w < 520, rowH = stack ? 46 : 30, L = stack ? 0 : Math.min(240, w * 0.45), R = 36, h = rows.length * rowH + 6, pw = w - L - R;
    const max = Math.max(...rows.map(r => r.v), 1);
    let s = '';
    rows.forEach((r, i) => {
      const y0 = 3 + i * rowH + (stack ? 16 : 0), bw = Math.max(2, (r.v / max) * pw);
      s += stack ? `<text class="c-label" x="0" y="${y0 - 6}">${esc(r.label)}</text>`
        : `<text class="c-label" x="${L - 10}" y="${y0 + 15}" text-anchor="end" dominant-baseline="middle">${esc(r.label)}</text>`;
      const b0 = y0 + 5, b1 = y0 + 25; // 20px bar
      s += `<path class="c-bar${r.cls ? ' ' + r.cls : ''}" d="M${L},${b0}H${L + bw - 4}Q${L + bw},${b0} ${L + bw},${b0 + 4}V${b1 - 4}Q${L + bw},${b1} ${L + bw - 4},${b1}H${L}Z"/>`;
      s += `<text class="c-value" x="${L + bw + 6}" y="${y0 + 15}" dominant-baseline="middle">${r.v}</text>`;
      s += `<rect class="c-hit" x="0" y="${y0 - (stack ? 16 : 0)}" width="${w}" height="${rowH}" data-tip="${esc(r.tip)}" tabindex="0"/>`;
    });
    el.innerHTML = `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="Mistake patterns">${s}</svg>`;
  }

  /* ---------- tooltip ---------- */
  function placeTip(target, ev) {
    tip.innerHTML = target.getAttribute('data-tip'); tip.hidden = false;
    const r = target.getBoundingClientRect(), tw = tip.offsetWidth, th = tip.offsetHeight;
    let px = ev && ev.clientX != null ? ev.clientX : r.left + r.width / 2, py = ev && ev.clientY != null ? ev.clientY : r.top;
    px = Math.min(Math.max(8, px - tw / 2), innerWidth - tw - 8); py = py - th - 14 < 8 ? py + 18 : py - th - 14;
    tip.style.left = px + 'px'; tip.style.top = py + 'px';
  }
  document.addEventListener('pointermove', e => { const t = e.target.closest && e.target.closest('[data-tip]'); if (t) placeTip(t, e); else tip.hidden = true; });
  document.addEventListener('focusin', e => { const t = e.target.closest && e.target.closest('[data-tip]'); if (t) placeTip(t); });
  document.addEventListener('focusout', () => { tip.hidden = true; });
  document.addEventListener('scroll', () => { tip.hidden = true; }, true);

  /* ---------- page ---------- */
  let ALL = [], RANGE = lsGet('vq.admin.range', 'all'), SOURCE = '';

  function render() {
    const a = analyse(ALL, RANGE);
    const rangeBtns = [['7', 'Last 7 days'], ['30', 'Last 30 days'], ['all', 'All time']].map(([k, l]) => `<button class="seg${RANGE === k ? ' on' : ''}" data-range="${k}" aria-pressed="${RANGE === k}">${l}</button>`).join('');
    const totalSecs = sum(a.Q.map(q => q.seconds || 0));
    const cleared = new Set(ALL.filter(s => s.completed && s.stars > 0).map(s => `${s.topic}|${s.level}`)).size;
    const last = ALL.length ? ALL.reduce((m, s) => (s.startedAt > m ? s.startedAt : m), '') : null;
    const hl = highlights(a);

    root.innerHTML = `
      <section class="ahead">
        <div><p class="eyebrow">Parent dashboard</p><h1>${PLAYER.name}'s progress</h1>
        <p class="muted">${last ? `Last played ${esc(when(last))}. ` : ''}${esc(SOURCE)}</p></div>
        <div class="controls"><div class="segs" role="group" aria-label="Date range">${rangeBtns}</div><button class="btn" id="refresh" type="button">Refresh</button></div>
      </section>
      ${!a.S.length ? `<section class="panel"><h2>No practice in this range</h2><p class="muted">Pick a longer range, or check back after ${PLAYER.name} plays.</p></section>` : `
      <section class="kpi-row">
        <div class="kpi"><span>Time practising</span><b>${mins(totalSecs)}</b><small>${a.dayRows.length} day${a.dayRows.length === 1 ? '' : 's'} active</small></div>
        <div class="kpi"><span>Questions answered</span><b>${a.Q.length}</b><small>in ${a.S.length} level plays</small></div>
        <div class="kpi"><span>Correct</span><b>${pct(a.Q.filter(q => q.correct).length, a.Q.length)}%</b><small>${a.Q.filter(q => q.hint).length} with a hint</small></div>
        <div class="kpi"><span>Levels cleared</span><b>${cleared}</b><small>of ${TOPICS.length * 10} (all time)</small></div>
        <div class="kpi"><span>Typical time</span><b>${secs(a.typical)}</b><small>per question</small></div>
      </section>

      ${hl.length ? `<section class="panel"><h2>What stands out</h2><ul class="hl">${hl.map(h => `<li>${h}</li>`).join('')}</ul></section>` : ''}

      <section class="grid2">
        <div class="panel"><h2>Minutes practised per day</h2><div class="chart" id="c-mins"></div></div>
        <div class="panel"><h2>Percent correct per day</h2><div class="chart" id="c-acc"></div></div>
      </section>

      <section class="panel">
        <div class="phead"><h2>Quest map</h2>
          <div class="legend" aria-label="Legend"><span><i class="cell s3"></i>3 stars</span><span><i class="cell s2"></i>2</span><span><i class="cell s1"></i>1 star (cleared)</span><span><i class="cell tried"></i>tried, not cleared</span><span><i class="cell"></i>not tried</span></div></div>
        <div class="qmap">${TOPICS.map(t => `<div class="qrow"><div class="qname"><b>${esc(t.name)}</b><small>${esc(AREAS[t.area] || '')}</small></div><div class="cells">${t.levels.map((L, i) => {
          const g = a.levels.find(x => x.topic === t.id && x.level === i + 1);
          const cls = !g ? '' : g.stars ? 's' + g.stars : 'tried';
          const tipT = `<b>${esc(t.name)} · Level ${i + 1}</b><br>${esc(L.title)}<br>${g ? `${g.tries} tr${g.tries === 1 ? 'y' : 'ies'}${g.quits ? `, ${g.quits} quit` : ''} · best ${g.best}/10${g.passedOn ? ` · cleared on try ${g.passedOn}` : ''}` : 'Not tried yet'}`;
          return `<span class="cell ${cls}" data-tip="${esc(tipT)}" tabindex="0" aria-label="Level ${i + 1}">${i + 1}</span>`;
        }).join('')}</div></div>`).join('')}</div>
      </section>

      <section class="grid2 wide-left">
        <div class="panel"><div class="phead"><h2>Speed and accuracy by question type</h2>
          <div class="legend"><span><i class="dot"></i>question type</span><span><i class="dot bad"></i>needs work</span></div></div>
          <p class="muted small">Each circle is one kind of question (bigger = answered more often). Top-left is good: right and quick. Shaded areas are where to look.</p>
          <div class="chart" id="c-scatter"></div></div>
        <div class="panel"><h2>Work on next</h2>
          ${a.workOn.length ? `<ol class="todo">${a.workOn.slice(0, 7).map(g => { const k = g.wrong.map(q => q.kind).filter(Boolean); const top = k.sort((x, y) => k.filter(v => v === y).length - k.filter(v => v === x).length)[0]; const ex = g.wrong[0];
            return `<li><b>${esc(tName(g.topic))} · L${g.level}</b> <span class="chip ${g.acc < 75 ? 'bad' : 'slow'}">${g.acc < 75 ? `${g.acc}% correct` : 'slow'}</span><br>${esc(g.type)}<br><span class="muted small">${g.right}/${g.n} right · ${secs(g.med)}${top ? ` · ${esc(KINDS[top].name.toLowerCase())}` : ''}${ex ? ` · e.g. wrote ${esc(ex.given)}, answer ${esc(ex.answer)}` : ''}</span></li>`; }).join('')}</ol>`
            : '<p class="muted">Nothing yet. A question type appears here after 3 tries if he is under 75% correct or much slower than usual.</p>'}
        </div>
      </section>

      <section class="grid2">
        <div class="panel"><h2>Mistake patterns</h2><p class="muted small">${a.wrong.length} wrong answers, sorted by what kind of mistake they look like.</p><div class="chart" id="c-kinds"></div>
          <dl class="kinds">${a.kinds.map(k => `<dt>${esc(KINDS[k.k].name)}</dt><dd>${esc(KINDS[k.k].help)}${k.k !== 'swap' && k.ex.length ? `<br><span class="muted small">e.g. ${k.ex.slice(0, 2).map(q => `“${esc(q.prompt.slice(0, 70))}” → ${esc(q.given)} (answer ${esc(q.answer)})`).join('; ')}</span>` : ''}</dd>`).join('')}</dl></div>
        <div class="panel"><h2>Mixed-up pairs</h2>
          ${a.swapRows.length ? `<table class="rep"><tr><th>Right answer → what he picked</th><th class="num">Times</th></tr>${a.swapRows.slice(0, 8).map(([k, n]) => `<tr><td>${esc(k)}</td><td class="num">${n}</td></tr>`).join('')}</table>` : '<p class="muted">No multiple-choice mix-ups yet.</p>'}
        </div>
      </section>

      <section class="panel"><h2>Levels and tries</h2>
        <div class="tablewrap"><table class="rep"><tr><th>Level</th><th class="num">Tries</th><th class="num">Quit</th><th class="num">Best</th><th class="num">Last</th><th>Cleared</th><th class="num">Typical time</th></tr>
        ${a.levels.map(g => `<tr><td><b>${esc(tName(g.topic))} · L${g.level}</b><br><span class="muted small">${esc(lvTitle(g.topic, g.level))}</span></td><td class="num">${g.tries}</td><td class="num">${g.quits || '–'}</td><td class="num">${g.tries > g.quits ? g.best + '/10' : '–'}</td><td class="num">${g.last == null ? '–' : g.last + '/10'}</td><td>${g.passedOn ? `<span class="chip ok">✓ try ${g.passedOn}</span> ${'★'.repeat(g.stars)}` : '<span class="chip">not yet</span>'}</td><td class="num">${secs(g.med)}</td></tr>`).join('')}
        </table></div></section>

      <section class="panel"><h2>Every session</h2><p class="muted small">Tap a session to see each question, his answer and how long it took.</p>
        <div class="sessions">${a.S.slice().reverse().map(s => `<details><summary><span>${esc(when(s.startedAt))}</span><span><b>${esc(tName(s.topic))} · L${s.level}</b> ${esc(s.levelTitle || '')}</span><span class="num">${s.correct}/${(s.questions || []).length}${s.completed ? '' : ' <span class="chip">quit</span>'}${s.stars ? ' ' + '★'.repeat(s.stars) : ''}</span><span class="num">${secs(s.seconds || 0)}</span></summary>
          <div class="tablewrap"><table class="rep q"><tr><th>#</th><th>Question</th><th>Answer</th><th>He wrote</th><th class="num">Time</th></tr>${(s.questions || []).map(q => `<tr class="${q.correct ? '' : 'wrongrow'}"><td>${q.n}</td><td>${esc(q.prompt)}</td><td>${esc(q.answer)}</td><td>${q.correct ? '✓ ' : '✗ '}${esc(q.given)}${q.hint ? ' <span class="chip">hint</span>' : ''}${!q.correct && mistakeKind(q) && mistakeKind(q) !== 'other' && mistakeKind(q) !== 'swap' ? `<br><span class="muted small">${esc(KINDS[mistakeKind(q)].name.toLowerCase())}</span>` : ''}</td><td class="num">${secs(q.seconds || 0)}</td></tr>`).join('')}</table></div></details>`).join('')}</div>
      </section>`}
      <p class="muted small foot">Data: ${esc(VQSync.config().repo)} (anonymous player code ${PLAYER.id}). Speeds compare with his own typical time, ${secs(a.typical)} per question.</p>`;

    root.querySelectorAll('[data-range]').forEach(b => b.addEventListener('click', () => { RANGE = b.dataset.range; lsSet('vq.admin.range', RANGE); render(); }));
    document.getElementById('refresh').addEventListener('click', load);
    if (!a.S.length) return;
    drawCharts(a);
  }

  function drawCharts(a) {
    const days = a.dayRows.map(d => ({ label: dayLabel(d.k), v: Math.round(d.secs / 60), tip: `<b>${dayLabel(d.k)}</b><br>${mins(d.secs)} · ${d.sessions} level play${d.sessions === 1 ? '' : 's'}<br>${d.n} questions, ${pct(d.right, d.n)}% correct` }));
    columnChart(document.getElementById('c-mins'), days, { alt: 'Minutes practised per day' });
    accuracyChart(document.getElementById('c-acc'), a.dayRows.map(d => ({ label: dayLabel(d.k), v: pct(d.right, d.n), tip: `<b>${dayLabel(d.k)}</b><br>${pct(d.right, d.n)}% correct (${d.right}/${d.n})` })));
    scatter(document.getElementById('c-scatter'), a);
    const kRows = a.kinds.map(k => ({ label: KINDS[k.k].name, v: k.n, cls: k.k === 'other' ? 'muted' : '', tip: `<b>${esc(KINDS[k.k].name)}</b><br>${k.n} wrong answer${k.n === 1 ? '' : 's'}` }));
    hbars(document.getElementById('c-kinds'), kRows);
  }
  let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => ALL.length && drawCharts(analyse(ALL, RANGE)), 150); });

  async function load() {
    root.querySelector('#refresh') && (root.querySelector('#refresh').textContent = 'Loading…');
    const local = lsGet('vq.sessions.' + PLAYER.id, []);
    let remote = [];
    try { remote = await VQSync.sessions(PLAYER.id); SOURCE = `Loaded ${remote.length} level plays from the online log.`; }
    catch (e) { SOURCE = "Couldn't reach the online log just now; showing this device only."; }
    const seen = new Set(); ALL = [];
    remote.concat(local).forEach(s => { if (s && s.id && !seen.has(s.id)) { seen.add(s.id); ALL.push(s); } });
    const extra = ALL.length - remote.length; if (extra > 0) SOURCE += ` Plus ${extra} from this device not uploaded yet.`;
    render();
  }

  gate(load);
})();
