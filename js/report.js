/* Parent progress report, built from session records (one record per level played).
   Session: { id, player, topic, level, levelTitle, startedAt, completed, correct, total,
              stars, hints, seconds, questions: [{ type, correct, seconds, hint, given, answer }] } */
window.VQReport = (function () {
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const median = a => { if (!a.length) return 0; const s = a.slice().sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
  const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
  const secs = s => (s >= 90 ? `${Math.round(s / 6) / 10} min` : s < 10 ? `${Math.round(s * 10) / 10} s` : `${Math.round(s)} s`);
  const when = iso => { const d = new Date(iso); return isNaN(d) ? '' : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }); };

  function compute(sessions, topics, areas) {
    const tById = Object.fromEntries(topics.map(t => [t.id, t]));
    const qs = [];
    sessions.forEach(s => (s.questions || []).forEach(q => qs.push(Object.assign({ topic: s.topic, level: s.level }, q))));
    const typical = median(qs.map(q => q.seconds).filter(Boolean)) || 20;

    // question types (same wording with the numbers taken out)
    const types = {};
    qs.forEach(q => {
      const k = `${q.topic}|${q.level}|${q.type}`;
      const g = (types[k] = types[k] || { topic: q.topic, level: q.level, type: q.type, n: 0, right: 0, times: [], hints: 0 });
      g.n++; if (q.correct) g.right++; if (q.hint) g.hints++; if (q.seconds) g.times.push(q.seconds);
    });
    const typeRows = Object.values(types).map(g => Object.assign(g, { acc: pct(g.right, g.n), med: median(g.times) }));
    const workOn = typeRows.filter(g => g.n >= 3 && (g.acc < 75 || g.med > typical * 1.6))
      .sort((a, b) => a.acc - b.acc || b.med - a.med).slice(0, 8);
    const strong = typeRows.filter(g => g.n >= 3 && g.acc >= 90 && g.med <= typical).sort((a, b) => a.med - b.med).slice(0, 6);

    // levels: tries, best and last score
    const lv = {};
    sessions.forEach(s => {
      const k = `${s.topic}|${s.level}`;
      const g = (lv[k] = lv[k] || { topic: s.topic, level: s.level, title: s.levelTitle, tries: 0, finished: 0, best: 0, last: null, passed: false, times: [] });
      g.tries++;
      if (s.completed) { g.finished++; g.best = Math.max(g.best, s.correct); g.last = s.correct; if (s.stars > 0) g.passed = true; }
      (s.questions || []).forEach(q => q.seconds && g.times.push(q.seconds));
    });
    const levelRows = Object.values(lv).map(g => Object.assign(g, { med: median(g.times) }))
      .sort((a, b) => (a.topic === b.topic ? a.level - b.level : topics.findIndex(t => t.id === a.topic) - topics.findIndex(t => t.id === b.topic)));
    const stuck = levelRows.filter(g => !g.passed && g.tries >= 2);

    // areas from the school report
    const areaRows = areas.map(a => {
      const aq = qs.filter(q => (tById[q.topic] || {}).area === a.id);
      return { name: a.name, n: aq.length, acc: pct(aq.filter(q => q.correct).length, aq.length), med: median(aq.map(q => q.seconds).filter(Boolean)) };
    }).filter(a => a.n);

    const recent = sessions.slice().sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1)).slice(0, 12);
    return {
      tById, typical, workOn, strong, levelRows, stuck, areaRows, recent,
      total: { sessions: sessions.length, questions: qs.length, acc: pct(qs.filter(q => q.correct).length, qs.length), hints: qs.filter(q => q.hint).length, last: recent[0] && recent[0].startedAt }
    };
  }

  function render(el, sessions, topics, areas, note) {
    if (!sessions.length) {
      el.innerHTML = `<div class="empty"><h2>No levels played yet</h2><p class="lede">Each level Viraj finishes (or quits after answering) shows up here: his score, how many tries each level took, and how long each question took.</p>${note || ''}</div>`;
      return;
    }
    const r = compute(sessions, topics, areas);
    const tName = id => (r.tById[id] || {}).name || id;
    const speed = s => (s > r.typical * 1.6 ? '<span class="chip slow">slow</span>' : s < r.typical * 0.7 ? '<span class="chip fast">fast</span>' : '');
    const typeRow = g => `<tr><td><b>${esc(tName(g.topic))} · L${g.level}</b><br><span class="muted">${esc(g.type)}</span></td><td class="num">${g.acc}%<br><span class="muted">${g.right}/${g.n}</span></td><td class="num">${secs(g.med)} ${speed(g.med)}</td></tr>`;
    el.innerHTML = `
      <div class="kpis">
        <div><b>${r.total.sessions}</b><span>levels played</span></div>
        <div><b>${r.total.questions}</b><span>questions</span></div>
        <div><b>${r.total.acc}%</b><span>correct</span></div>
        <div><b>${secs(r.typical)}</b><span>typical time per question</span></div>
      </div>
      <p class="muted small">Last played ${esc(when(r.total.last))}. Hints used on ${r.total.hints} questions. "Slow" means more than 1.6× his typical time; "fast" means under 0.7×.</p>

      <h2 class="rep-h">Work on next</h2>
      ${r.workOn.length || r.stuck.length ? `
        ${r.stuck.length ? `<p class="callout">Stuck: ${r.stuck.map(g => `<b>${esc(tName(g.topic))} level ${g.level}</b> (${g.tries} tries, best ${g.best}/10)`).join(', ')}.</p>` : ''}
        ${r.workOn.length ? `<div class="tablewrap"><table class="rep"><tr><th>Question type</th><th>Correct</th><th>Time</th></tr>${r.workOn.map(typeRow).join('')}</table></div>` : ''}`
        : '<p class="muted">Nothing stands out yet. A question type shows up here once he has answered it 3 times and is below 75% correct or slow.</p>'}

      ${r.strong.length ? `<h2 class="rep-h">Strong and quick</h2><div class="tablewrap"><table class="rep"><tr><th>Question type</th><th>Correct</th><th>Time</th></tr>${r.strong.map(typeRow).join('')}</table></div>` : ''}

      ${r.areaRows.length ? `<h2 class="rep-h">By area</h2><div class="tablewrap"><table class="rep"><tr><th>Area</th><th>Correct</th><th>Typical time</th></tr>${r.areaRows.map(a => `<tr><td>${esc(a.name)}<br><span class="muted">${a.n} questions</span></td><td class="num">${a.acc}%</td><td class="num">${secs(a.med)} ${speed(a.med)}</td></tr>`).join('')}</table></div>` : ''}

      <h2 class="rep-h">Levels and tries</h2>
      <div class="tablewrap"><table class="rep"><tr><th>Level</th><th>Tries</th><th>Best</th><th>Last</th><th>Time</th></tr>
        ${r.levelRows.map(g => `<tr><td><b>${esc(tName(g.topic))} · L${g.level}</b><br><span class="muted">${esc(g.title || '')}</span></td><td class="num">${g.tries}${g.tries > g.finished ? `<br><span class="muted">${g.tries - g.finished} quit</span>` : ''}</td><td class="num">${g.finished ? g.best + '/10' : '–'} ${g.passed ? '<span class="chip ok">passed</span>' : ''}</td><td class="num">${g.last == null ? '–' : g.last + '/10'}</td><td class="num">${secs(g.med)}</td></tr>`).join('')}
      </table></div>

      <h2 class="rep-h">Recent sessions</h2>
      <div class="tablewrap"><table class="rep"><tr><th>When</th><th>Level</th><th>Score</th><th>Time</th></tr>
        ${r.recent.map(s => `<tr><td>${esc(when(s.startedAt))}</td><td>${esc(tName(s.topic))} · L${s.level}</td><td class="num">${s.correct}/${s.completed ? s.total : (s.questions || []).length}${s.completed ? '' : ' <span class="chip">quit</span>'}${s.stars ? ' ' + '★'.repeat(s.stars) : ''}</td><td class="num">${secs(s.seconds || 0)}</td></tr>`).join('')}
      </table></div>
      ${note || ''}`;
  }

  return { compute, render };
})();
