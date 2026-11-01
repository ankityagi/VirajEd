/* Topic: Graphs & Line Plots (Measurement & Data)
   Grade 4: 4.MD.4 line plots with fractions (½, ¼, ⅛), plus reading bar graphs,
   picture graphs and tables with scales. Starts above Grade 3 (scales of 2, 5, 10),
   finishes with fair shares and missing data (Grade 5 stretch). */
(function () {
  const R = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const shuffle = a => a.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(p => p[1]);
  const D = Draw;

  /* ---------- fractions ---------- */
  const GLYPH = { '1/2': '½', '1/4': '¼', '3/4': '¾', '1/8': '⅛', '3/8': '⅜', '5/8': '⅝', '7/8': '⅞' };
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  // n parts of size 1/den -> "1¾", "¾", "2"
  function fr(n, den) {
    const w = Math.floor(n / den), r = n % den;
    if (!r) return String(w);
    const g = gcd(r, den), f = GLYPH[`${r / g}/${den / g}`] || `${r / g}/${den / g}`;
    return (w ? w : '') + f;
  }

  /* ---------- data sets ---------- */
  const SETS = [
    { title: 'Favourite sport', cats: ['Soccer', 'Tennis', 'Swim', 'Hockey', 'Cricket'], what: 'students chose', noun: 'students' },
    { title: 'Favourite fruit', cats: ['Apple', 'Mango', 'Grape', 'Banana', 'Kiwi'], what: 'students picked', noun: 'students' },
    { title: 'Books read', cats: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], what: 'books were read on', noun: 'books' },
    { title: 'Class pets vote', cats: ['Dog', 'Cat', 'Fish', 'Bird', 'Rabbit'], what: 'votes went to', noun: 'votes' }
  ];

  // n distinct bar values that are multiples of `unit`, up to max
  function barVals(n, unit, max) {
    const pool = shuffle(Array.from({ length: Math.floor(max / unit) - 1 }, (_, i) => (i + 1) * unit));
    return pool.slice(0, n);
  }
  function barGraph(opts = {}) {
    const step = opts.step || pick([2, 5, 10]);
    const half = !!opts.half; // values can sit halfway between grid lines
    const max = step * (opts.lines || R(6, 8));
    const set = pick(SETS), n = opts.n || pick([4, 5]);
    const cats = set.cats.slice(0, n);
    const vals = barVals(n, half ? step / 2 : step, max);
    const title = opts.title || set.title;
    return { set, cats, vals, step, max, fig: v => D.bars({ cats, vals: v || vals, step, max, title }) };
  }

  // line plot data: labels + counts
  function plotWhole() {
    const start = R(0, 3), n = 6;
    const labels = Array.from({ length: n }, (_, i) => String(start + i));
    let counts = labels.map(() => R(0, 5));
    counts[R(0, n - 1)] = 6; // one clear most-common value
    counts = counts.map((c, i) => (c === 6 && counts.indexOf(6) !== i ? 5 : c));
    return { start, labels, counts, vals: labels.map(Number) };
  }
  function plotFrac(den = 4) {
    const w = R(0, 2), n = den + 1; // from w to w+1
    const units = Array.from({ length: n }, (_, i) => w * den + i);
    let counts = units.map(() => R(0, 4));
    if (counts[0] === 0) counts[0] = 1;
    if (counts[n - 1] === 0) counts[n - 1] = 1;
    const top = R(0, n - 1); counts[top] = 5;
    return { den, units, counts, labels: units.map(u => fr(u, den)), top };
  }
  const sum = a => a.reduce((s, v) => s + v, 0);
  const FRAC_THINGS = [
    { title: 'Ribbon lengths (inches)', noun: 'ribbons', unit: 'in', each: 'ribbon' },
    { title: 'Plant heights (inches)', noun: 'plants', unit: 'in', each: 'plant' },
    { title: 'Snail trails (feet)', noun: 'snails', unit: 'ft', each: 'snail' },
    { title: 'Water in bottles (litres)', noun: 'bottles', unit: 'L', each: 'bottle' }
  ];
  const fracQ = (q, n, den) => Object.assign(q, { answer: n / den, answerText: fr(n, den), frac: true });

  const levels = [
    /* 1 */ {
      title: 'Read the Bars',
      skill: 'Bar graphs with scales of 2, 5 and 10',
      variants: [
        () => { const g = barGraph(), i = R(0, g.cats.length - 1); return { prompt: `How many ${g.set.noun} for <b>${g.cats[i]}</b>?`, fig: g.fig(), answer: g.vals[i], unit: g.set.noun, hint: `Each grid line goes up by ${g.step}. Follow the top of the bar across to the numbers.`, explain: `The ${g.cats[i]} bar stops at ${g.vals[i]}.` }; },
        () => { const g = barGraph(), best = g.vals.indexOf(Math.max(...g.vals)); return { prompt: 'Which bar is the <b>tallest</b>?', fig: g.fig(), choices: g.cats, answer: best, hint: 'Look for the bar that reaches highest.', explain: `${g.cats[best]} has ${g.vals[best]}, more than any other.` }; },
        () => { const g = barGraph(), [i, j] = shuffle([0, 1, 2, 3]).slice(0, 2); return { prompt: `How many ${g.set.noun} for <b>${g.cats[i]}</b> and <b>${g.cats[j]}</b> together?`, fig: g.fig(), answer: g.vals[i] + g.vals[j], unit: g.set.noun, hint: 'Read each bar, then add.', explain: `${g.vals[i]} + ${g.vals[j]} = ${g.vals[i] + g.vals[j]}.` }; }
      ]
    },
    /* 2 */ {
      title: 'Compare Bars',
      skill: 'How many more, how many fewer, totals',
      variants: [
        () => { const g = barGraph(); const s = g.vals.map((v, i) => i).sort((a, b) => g.vals[b] - g.vals[a]); const [i, j] = [s[0], s[s.length - 1]]; return { prompt: `How many <b>more</b> ${g.set.noun} for <b>${g.cats[i]}</b> than for <b>${g.cats[j]}</b>?`, fig: g.fig(), answer: g.vals[i] - g.vals[j], unit: g.set.noun, hint: 'Read both bars, then subtract the smaller from the bigger.', explain: `${g.vals[i]} − ${g.vals[j]} = ${g.vals[i] - g.vals[j]}.` }; },
        () => { const g = barGraph(); return { prompt: `How many ${g.set.noun} are shown <b>in all</b>?`, fig: g.fig(), answer: sum(g.vals), unit: g.set.noun, hint: 'Add every bar.', explain: `${g.vals.join(' + ')} = ${sum(g.vals)}.` }; },
        () => { const g = barGraph(); const lo = g.vals.indexOf(Math.min(...g.vals)), hi = g.vals.indexOf(Math.max(...g.vals)); return { prompt: `How many more would <b>${g.cats[lo]}</b> need to <b>tie</b> with <b>${g.cats[hi]}</b>?`, fig: g.fig(), answer: g.vals[hi] - g.vals[lo], unit: g.set.noun, hint: 'Tie means the same amount. Find the difference.', explain: `${g.vals[hi]} − ${g.vals[lo]} = ${g.vals[hi] - g.vals[lo]}.` }; }
      ]
    },
    /* 3 */ {
      title: 'Picture Graphs',
      skill: 'Use the key, including half pictures',
      variants: [
        () => { const k = pick([2, 4, 6, 10]), set = pick(SETS), rows = set.cats.slice(0, 4).map(c => ({ label: c, n: R(3, 15) / 2 })), i = R(0, 3); const fig = D.picto({ rows, key: `${k} ${set.noun}`, title: set.title }); return { prompt: `Each circle stands for <b>${k}</b> ${set.noun}. How many for <b>${rows[i].label}</b>?`, fig, answer: rows[i].n * k, unit: set.noun, hint: `A half circle is half of ${k}, which is ${k / 2}.`, explain: `${rows[i].n} circles × ${k} = ${rows[i].n * k}.` }; },
        () => { const k = pick([4, 6, 8, 10]), set = pick(SETS); const rows = set.cats.slice(0, 4).map(c => ({ label: c, n: R(2, 15) / 2 })); const [i, j] = [0, 1, 2, 3].sort((a, b) => rows[b].n - rows[a].n); if (rows[i].n === rows[j].n) rows[i].n += 1; const fig = D.picto({ rows, key: `${k} ${set.noun}`, title: set.title }); return { prompt: `How many more ${set.noun} for <b>${rows[i].label}</b> than <b>${rows[j].label}</b>?`, fig, answer: (rows[i].n - rows[j].n) * k, unit: set.noun, hint: 'Count how many more circles, then use the key.', explain: `${rows[i].n} − ${rows[j].n} = ${rows[i].n - rows[j].n} circles. × ${k} = ${(rows[i].n - rows[j].n) * k}.` }; },
        () => { const k = pick([2, 4, 10]), set = pick(SETS); const rows = set.cats.slice(0, 4).map(c => ({ label: c, n: R(2, 12) / 2 })); const tot = sum(rows.map(r => r.n)); const fig = D.picto({ rows, key: `${k} ${set.noun}`, title: set.title }); return { prompt: `How many ${set.noun} in <b>all</b>?`, fig, answer: tot * k, unit: set.noun, hint: 'Count all the circles (halves too), then multiply by the key.', explain: `${tot} circles × ${k} = ${tot * k}.` }; },
        () => { const k = pick([3, 4, 5]), n = R(3, 9); return { prompt: `In a picture graph each star stands for <b>${k}</b> books. Viraj read <b>${n * k}</b> books. How many stars should be drawn?`, answer: n, unit: 'stars', hint: `How many groups of ${k} make ${n * k}?`, explain: `${n * k} ÷ ${k} = ${n} stars.` }; }
      ]
    },
    /* 4 */ {
      title: 'Data Tables',
      skill: 'Bigger numbers in a table',
      variants: [
        () => { const cls = ['4A', '4B', '4C', '4D']; const v = cls.map(() => R(105, 260)); return { prompt: `Books read this term:<table class="dtable"><tr><th>Class</th><th>Books</th></tr>${cls.map((c, i) => `<tr><td>${c}</td><td>${v[i]}</td></tr>`).join('')}</table>How many books did all four classes read?`, answer: sum(v), unit: 'books', hint: 'Add two at a time.', explain: `${v.join(' + ')} = ${sum(v)}.` }; },
        () => { const cls = ['4A', '4B', '4C', '4D']; const base = R(140, 190), v = shuffle([base, base + R(30, 60), base - R(10, 40), base + R(3, 25)]); const hi = v.indexOf(Math.max(...v)), lo = v.indexOf(Math.min(...v)); return { prompt: `Cans collected for the food drive:<table class="dtable"><tr><th>Class</th><th>Cans</th></tr>${cls.map((c, i) => `<tr><td>${c}</td><td>${v[i]}</td></tr>`).join('')}</table>How many more cans did the <b>top</b> class collect than the <b>bottom</b> class?`, answer: v[hi] - v[lo], unit: 'cans', hint: 'Find the greatest and the least first.', explain: `${v[hi]} − ${v[lo]} = ${v[hi] - v[lo]}.` }; },
        () => { const names = ['Asha', 'Ben', 'Chen', 'Dev']; const a = R(1, 9), b = R(1, 9), c = R(1, 9); let v = shuffle([`${a}${b}${c}`, `${a}${c}${b}`, `${b}${a}${c}`, `${c}${b}${a}`].map(Number)); v = [...new Set(v)]; while (v.length < 4) v.push(R(100, 999)); const hi = v.indexOf(Math.max(...v)); return { prompt: `Points scored in a game:<table class="dtable"><tr><th>Player</th><th>Points</th></tr>${names.map((c, i) => `<tr><td>${c}</td><td>${v[i]}</td></tr>`).join('')}</table>Who scored the <b>most</b>?`, choices: names, answer: hi, hint: 'Compare hundreds first, then tens, then ones.', explain: `${names[hi]} scored ${v[hi]}, the greatest.` }; }
      ]
    },
    /* 5 */ {
      title: 'Line Plots',
      skill: 'Read X marks on a number line',
      variants: [
        () => { const p = plotWhole(), i = R(0, 5); return { prompt: `Each X is one student. How many students read exactly <b>${p.labels[i]}</b> book${p.labels[i] === '1' ? '' : 's'}?`, fig: D.linePlot({ labels: p.labels, counts: p.counts, title: 'Books read in a month' }), answer: p.counts[i] || 0, unit: 'students', hint: 'Count the Xs stacked above that number.', explain: `There are ${p.counts[i]} Xs above ${p.labels[i]}.` }; },
        () => { const p = plotWhole(); return { prompt: 'How many students are shown on the line plot?', fig: D.linePlot({ labels: p.labels, counts: p.counts, title: 'Books read in a month' }), answer: sum(p.counts), unit: 'students', hint: 'Count every X.', explain: `${p.counts.join(' + ')} = ${sum(p.counts)} students.` }; },
        () => { const p = plotWhole(), k = R(1, 3); const more = sum(p.counts.slice(k + 1)); return { prompt: `How many students read <b>more than ${p.labels[k]}</b> book${p.labels[k] === '1' ? '' : 's'}?`, fig: D.linePlot({ labels: p.labels, counts: p.counts, title: 'Books read in a month' }), answer: more, unit: 'students', hint: `Only count Xs to the right of ${p.labels[k]}. Not ${p.labels[k]} itself.`, explain: `${p.counts.slice(k + 1).join(' + ')} = ${more}.` }; },
        () => { const p = plotWhole(); const tot = sum(p.counts.map((c, i) => c * p.vals[i])); return { prompt: 'How many books did these students read <b>altogether</b>?', fig: D.linePlot({ labels: p.labels, counts: p.counts, title: 'Books read in a month' }), answer: tot, unit: 'books', hint: 'Each X above 3 means 3 books. Multiply each count by its number, then add.', explain: p.counts.map((c, i) => c ? `${c}×${p.vals[i]}` : null).filter(Boolean).join(' + ') + ` = ${tot} books.` }; }
      ]
    },
    /* 6 */ {
      title: 'Fraction Line Plots',
      skill: 'Line plots marked in ½ and ¼',
      variants: [
        () => { const th = pick(FRAC_THINGS), p = plotFrac(4); const i = p.top; return { prompt: `Which length is the <b>most common</b>?`, fig: D.linePlot({ labels: p.labels, counts: p.counts, title: th.title }), choices: p.labels.map(l => `${l} ${th.unit}`), answer: i, hint: 'Find the tallest stack of Xs.', explain: `${p.labels[i]} ${th.unit} has ${p.counts[i]} Xs, the most.` }; },
        () => { const th = pick(FRAC_THINGS), p = plotFrac(4); return { prompt: `How many ${th.noun} were measured?`, fig: D.linePlot({ labels: p.labels, counts: p.counts, title: th.title }), answer: sum(p.counts), unit: th.noun, hint: 'Each X is one. Count them all.', explain: `${p.counts.join(' + ')} = ${sum(p.counts)}.` }; },
        () => { const th = pick(FRAC_THINGS), p = plotFrac(4); const lo = p.units[p.counts.findIndex(c => c > 0)], hi = p.units[p.counts.length - 1 - [...p.counts].reverse().findIndex(c => c > 0)]; return fracQ({ prompt: `What is the difference between the <b>longest</b> and the <b>shortest</b>? Type a fraction like <code>3/4</code>.`, fig: D.linePlot({ labels: p.labels, counts: p.counts, title: th.title }), unit: th.unit, hint: 'Count the quarter-steps between the first X and the last X.', explain: `${fr(hi, 4)} − ${fr(lo, 4)} = ${fr(hi - lo, 4)} ${th.unit}.` }, hi - lo, 4); },
        () => { const th = pick(FRAC_THINGS), p = plotFrac(2 * 2); const half = p.units.findIndex(u => u % 4 === 2); return { prompt: `How many ${th.noun} measured exactly <b>${p.labels[half]} ${th.unit}</b>?`, fig: D.linePlot({ labels: p.labels, counts: p.counts, title: th.title }), answer: p.counts[half], unit: th.noun, hint: `${p.labels[half]} is halfway between the whole numbers.`, explain: `There are ${p.counts[half]} Xs above ${p.labels[half]}.` }; }
      ]
    },
    /* 7 */ {
      title: 'Add Up the Xs',
      skill: 'Add and subtract fractions from a line plot',
      variants: [
        () => { const th = pick(FRAC_THINGS), p = plotFrac(4); const i = pick([1, 2, 3]); if (p.counts[i] < 2) p.counts[i] = R(2, 4); const n = p.counts[i] * p.units[i]; return fracQ({ prompt: `All the ${th.noun} that measure <b>${p.labels[i]} ${th.unit}</b> are put end to end. How long is that? Type like <code>2 1/4</code>.`, fig: D.linePlot({ labels: p.labels, counts: p.counts, title: th.title }), unit: th.unit, hint: `There are ${p.counts[i]} of them. Add ${p.labels[i]} that many times.`, explain: `${p.counts[i]} × ${p.labels[i]} = ${fr(n, 4)} ${th.unit}.` }, n, 4); },
        () => { const th = pick(FRAC_THINGS), p = plotFrac(4); const lo = p.units[p.counts.findIndex(c => c > 0)], hi = p.units[p.counts.length - 1 - [...p.counts].reverse().findIndex(c => c > 0)]; return fracQ({ prompt: `Add the <b>longest</b> and the <b>shortest</b> together. What is the total? Type like <code>2 1/2</code>.`, fig: D.linePlot({ labels: p.labels, counts: p.counts, title: th.title }), unit: th.unit, hint: 'Add the whole numbers, then add the fractions. Four quarters make 1.', explain: `${fr(hi, 4)} + ${fr(lo, 4)} = ${fr(hi + lo, 4)} ${th.unit}.` }, hi + lo, 4); },
        () => { const th = pick(FRAC_THINGS), p = plotFrac(8); const i = R(1, 7); if (!p.counts[i]) p.counts[i] = 2; const n = p.counts[i] * p.units[i]; return fracQ({ prompt: `This line plot is marked in <b>eighths</b>. What is the total of all the ${th.noun} at <b>${p.labels[i]} ${th.unit}</b>? Type like <code>1 3/8</code>.`, fig: D.linePlot({ labels: p.labels, counts: p.counts, title: th.title }), unit: th.unit, hint: `Count the Xs at ${p.labels[i]}, then add ${p.labels[i]} that many times.`, explain: `${p.counts[i]} × ${p.labels[i]} = ${fr(n, 8)} ${th.unit}.` }, n, 8); }
      ]
    },
    /* 8 */ {
      title: 'Between the Lines',
      skill: 'Bars that stop between grid lines',
      variants: [
        () => { const g = barGraph({ step: pick([10, 20, 50]), half: true }), odd = g.vals.findIndex(v => v % g.step); const i = odd >= 0 ? odd : 0; return { prompt: `How many ${g.set.noun} for <b>${g.cats[i]}</b>? Some bars stop <b>halfway</b> between lines.`, fig: g.fig(), answer: g.vals[i], unit: g.set.noun, hint: `Halfway between two lines is half of ${g.step}, which is ${g.step / 2}.`, explain: `The ${g.cats[i]} bar is at ${g.vals[i]}.` }; },
        () => { const g = barGraph({ step: pick([10, 20]), half: true }); const s = g.vals.map((v, i) => i).sort((a, b) => g.vals[b] - g.vals[a]); return { prompt: `How many more for <b>${g.cats[s[0]]}</b> than <b>${g.cats[s[2]]}</b>?`, fig: g.fig(), answer: g.vals[s[0]] - g.vals[s[2]], unit: g.set.noun, hint: 'Read each bar carefully, including halfway marks.', explain: `${g.vals[s[0]]} − ${g.vals[s[2]]} = ${g.vals[s[0]] - g.vals[s[2]]}.` }; },
        () => { const g = barGraph({ step: pick([10, 20]), half: true, n: 4 }); return { prompt: `What is the <b>total</b> for all four bars?`, fig: g.fig(), answer: sum(g.vals), unit: g.set.noun, hint: 'Write down each value first, then add.', explain: `${g.vals.join(' + ')} = ${sum(g.vals)}.` }; }
      ]
    },
    /* 9 */ {
      title: 'Times As Many',
      skill: 'Compare with multiplication and share equally',
      variants: [
        () => { const step = pick([2, 5]), m = pick([2, 3, 4]), b = step * R(1, 2), set = pick(SETS); const cats = set.cats.slice(0, 4); let vals = barVals(4, step, step * 8); vals[0] = b * m; vals[1] = b; if (new Set(vals).size < 4) vals = [b * m, b, b * m + step, b + step].map(v => Math.min(v, step * 8)); const max = step * Math.max(8, Math.ceil(Math.max(...vals) / step) + 1); return { prompt: `<b>${cats[0]}</b> has how many <b>times as many</b> as <b>${cats[1]}</b>?`, fig: D.bars({ cats, vals, step, max, title: set.title }), answer: m, unit: 'times', hint: `What number times ${b} makes ${b * m}?`, explain: `${b} × ${m} = ${b * m}, so ${m} times as many.` }; },
        () => { const n = 4, share = R(4, 12); let v = Array.from({ length: n }, () => share + R(-3, 3)); v[n - 1] = share * n - sum(v.slice(0, n - 1)); if (v[n - 1] < 1) v = Array(n).fill(share); const set = SETS[2]; const cats = set.cats.slice(0, n); const step = 2, max = step * Math.ceil((Math.max(...v) + 2) / step); return { prompt: `If the books were <b>shared out evenly</b> over the ${n} days, how many would be read each day?`, fig: D.bars({ cats, vals: v, step, max, title: 'Books read' }), answer: share, unit: 'books', hint: 'Find the total, then divide by the number of days.', explain: `Total ${v.join(' + ')} = ${share * n}. ${share * n} ÷ ${n} = ${share}.` }; },
        () => { const p = plotWhole(), tot = sum(p.counts.map((c, i) => c * p.vals[i])), kids = sum(p.counts); return { prompt: `The students put all their books in one pile: <b>${tot} books</b>. Then <b>${kids} students</b> each take the same number. Is there any left over? Type how many are <b>left over</b>.`, fig: D.linePlot({ labels: p.labels, counts: p.counts, title: 'Books read in a month' }), answer: tot % kids, unit: 'books', hint: `Divide ${tot} by ${kids}. What is the remainder?`, explain: `${tot} ÷ ${kids} = ${Math.floor(tot / kids)} remainder ${tot % kids}.` }; }
      ]
    },
    /* 10 */ {
      title: 'Boss Level',
      skill: 'Missing data and multi-step questions',
      variants: [
        () => { const g = barGraph({ step: pick([5, 10]) }); const i = R(0, g.cats.length - 1), tot = sum(g.vals); const shown = g.vals.map((v, k) => (k === i ? null : v)); return { prompt: `The total is <b>${tot}</b> ${g.set.noun}. One bar is missing. What should the <b>${g.cats[i]}</b> bar show?`, fig: g.fig(shown), answer: g.vals[i], unit: g.set.noun, hint: 'Add the bars you can see, then subtract from the total.', explain: `Known bars add to ${tot - g.vals[i]}. ${tot} − ${tot - g.vals[i]} = ${g.vals[i]}.` }; },
        () => { const th = pick(FRAC_THINGS), p = plotFrac(4); const n = sum(p.counts.map((c, i) => c * p.units[i])); return fracQ({ prompt: `What is the <b>total</b> of all the ${th.noun} on the line plot? Type like <code>12 3/4</code>.`, fig: D.linePlot({ labels: p.labels, counts: p.counts, title: th.title }), unit: th.unit, hint: 'Multiply each length by its number of Xs, then add. Change every 4 quarters into 1 whole.', explain: p.counts.map((c, i) => c ? `${c}×${p.labels[i]}` : null).filter(Boolean).join(' + ') + ` = ${fr(n, 4)} ${th.unit}.` }, n, 4); },
        () => { const k = pick([20, 50]), set = pick(SETS); const rows = set.cats.slice(0, 4).map(c => ({ label: c, n: R(2, 11) / 2 })); const fig = D.picto({ rows, key: `${k} ${set.noun}`, title: set.title }); const i = R(0, 3), target = (Math.ceil(rows[i].n) + R(1, 3)) * k; return { prompt: `<b>${rows[i].label}</b> wants to reach <b>${target}</b> ${set.noun}. How many more ${set.noun} does it need?`, fig, answer: target - rows[i].n * k, unit: set.noun, hint: `First find what ${rows[i].label} has now. A half circle is ${k / 2}.`, explain: `${rows[i].n} × ${k} = ${rows[i].n * k}. ${target} − ${rows[i].n * k} = ${target - rows[i].n * k}.` }; },
        () => { const g = barGraph({ step: 25, lines: 8, title: 'Tickets sold' }); const s = g.vals.map((v, i) => i).sort((a, b) => g.vals[b] - g.vals[a]); const price = pick([2, 3, 4]); return { prompt: `Tickets cost <b>$${price}</b> each. These bars show tickets sold. How much more money came from <b>${g.cats[s[0]]}</b> than from <b>${g.cats[s[1]]}</b>?`, fig: g.fig(), answer: (g.vals[s[0]] - g.vals[s[1]]) * price, unit: 'dollars', hint: 'Find how many more tickets, then multiply by the price.', explain: `${g.vals[s[0]]} − ${g.vals[s[1]]} = ${g.vals[s[0]] - g.vals[s[1]]} tickets. × $${price} = $${(g.vals[s[0]] - g.vals[s[1]]) * price}.` }; }
      ]
    }
  ];

  (window.VQ_TOPICS = window.VQ_TOPICS || []).push({
    id: 'graphs',
    area: 'md',
    name: 'Graphs & Line Plots',
    blurb: 'Bar graphs, picture graphs, tables and fraction line plots.',
    grade: 'Grade 4 → 5',
    icon: 'bars',
    live: true,
    levels
  });
})();
