/* Topic: Fractions (Numbers & Operations)
   Grade 4 standards 4.NF.1–7: equivalent fractions, comparing, adding and subtracting
   with like denominators, mixed numbers, multiplying a fraction by a whole number,
   tenths and hundredths. Opens with twelfths and "not shaded" so it starts above level;
   the Boss level reaches into Grade 5 (fraction of a set, missing addends). */
(function () {
  const R = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const shuffle = a => a.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(p => p[1]);
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  const D = Draw;

  // stacked fraction in HTML
  const F = (n, d) => `<span class="fr"><span>${n}</span><span>${d}</span></span>`;
  // n/d as a mixed number (not simplified unless asked)
  function M(n, d, simplify) {
    if (simplify) { const g = gcd(n, d); n /= g; d /= g; }
    const w = Math.floor(n / d), r = n % d;
    if (!r) return String(w);
    return (w ? w : '') + F(r, d);
  }
  // typed fraction answer
  const fa = (q, n, d) => Object.assign(q, { answer: n / d, answerText: M(n, d), frac: true });
  // multiple-choice answer from a list of HTML strings where the first is correct
  function mc(q, correct, wrongs) {
    const uniq = [...new Set(wrongs.filter(w => w !== correct))].slice(0, 3);
    const choices = shuffle([correct, ...uniq]);
    return Object.assign(q, { choices, answer: choices.indexOf(correct) });
  }
  const DENS = [3, 4, 5, 6, 8, 10, 12];
  const TYPE = ' Type it like <code>3/8</code>.';

  const levels = [
    /* 1 */ {
      title: 'Fraction Bars',
      skill: 'Name fractions from pictures, up to twelfths',
      variants: [
        () => { const d = pick([6, 8, 10, 12]), n = R(1, d - 1); return fa({ prompt: 'What fraction of the bar is <b>shaded</b>?' + TYPE, fig: D.fracBars({ rows: [{ parts: d, shaded: n }] }), hint: 'Bottom number: how many equal parts in all. Top number: how many are shaded.', explain: `${n} of ${d} equal parts are shaded: ${F(n, d)}.` }, n, d); },
        () => { const d = pick([5, 8, 10, 12]), n = R(1, d - 1); return fa({ prompt: 'What fraction of the bar is <b>not</b> shaded?' + TYPE, fig: D.fracBars({ rows: [{ parts: d, shaded: n }] }), hint: 'Count the white parts.', explain: `${d - n} of ${d} parts are white: ${F(d - n, d)}.` }, d - n, d); },
        () => { const d = pick([3, 4, 5, 6]), n = R(1, d - 1), k = 2; const correct = F(n * k, d * k); return mc({ prompt: 'Both bars are the same size. Which fraction matches the <b>bottom</b> bar?', fig: D.fracBars({ rows: [{ parts: d, shaded: n, label: `${n}/${d}` }, { parts: d * k, shaded: n * k, label: '?' }] }), hint: 'Count the parts in the bottom bar and the shaded ones.', explain: `The bottom bar has ${d * k} parts with ${n * k} shaded: ${correct}. It equals ${F(n, d)}.` }, correct, [F(n, d * k), F(n * k, d), F(n + k, d * k), F(n * k + 1, d * k)]); },
        () => { const d = pick([8, 10, 12]), n = R(2, d - 2); return { prompt: `A pizza is cut into <b>${d}</b> equal slices. Viraj eats ${F(n, d)} of it. How many slices are <b>left</b>?`, answer: d - n, unit: 'slices', hint: `${F(n, d)} means ${n} of the ${d} slices.`, explain: `He ate ${n} slices. ${d} − ${n} = ${d - n} left.` }; }
      ]
    },
    /* 2 */ {
      title: 'Equal Fractions',
      skill: 'Find equivalent fractions',
      variants: [
        () => { const d = pick([2, 3, 4, 5, 6]), n = R(1, d - 1), k = R(2, 6); return { prompt: `Fill in the missing number: ${F(n, d)} = ${F('?', d * k)}`, answer: n * k, unit: '', hint: `${d} × ${k} = ${d * k}. Do the same to the top.`, explain: `Multiply top and bottom by ${k}: ${F(n * k, d * k)}.` }; },
        () => { const d = pick([2, 3, 4, 5]), n = R(1, d - 1), k = R(2, 5); return { prompt: `Fill in the missing number: ${F(n, d)} = ${F(n * k, '?')}`, answer: d * k, unit: '', hint: `What did ${n} get multiplied by to make ${n * k}?`, explain: `${n} × ${k} = ${n * k}, so ${d} × ${k} = ${d * k}.` }; },
        () => { const d = pick([3, 4, 5]), n = R(1, d - 1); const eq = [2, 3, 4].map(k => F(n * k, d * k)); const wrong = F(n + 1, d + 1); return mc({ prompt: `Which fraction is <b>not</b> equal to ${F(n, d)}?`, hint: 'Check if the top and bottom were both multiplied by the same number.', explain: `${wrong} is not equal. Adding 1 to the top and bottom does not keep a fraction the same.` }, wrong, eq); },
        () => { const k = pick([2, 3, 4]), d = pick([3, 4, 5]), n = R(1, d - 1), same = Math.random() < 0.5; const top = same ? n * k : n * k + 1; return mc({ prompt: `Viraj ate ${F(top, d * k)} of a cake. His brother ate ${F(n, d)} of a cake the same size. Did they eat the <b>same amount</b>?`, hint: `Multiply the top and bottom of ${F(n, d)} by ${k}.`, explain: `${F(n, d)} = ${F(n * k, d * k)}. ${same ? 'So yes, the same.' : `That is not ${F(top, d * k)}, so no.`}` }, same ? 'Yes' : 'No', ['Yes', 'No']); }
      ]
    },
    /* 3 */ {
      title: 'Simplest Form',
      skill: 'Divide top and bottom by the same number',
      variants: [
        () => { const d = pick([2, 3, 4, 5]), n = R(1, d - 1), k = R(2, 4); const g = gcd(n, d); const sn = n / g, sd = d / g; const correct = F(sn, sd); return mc({ prompt: `Write ${F(n * k, d * k)} in <b>simplest form</b>.`, hint: 'Find the biggest number that divides both the top and the bottom.', explain: `Divide top and bottom by ${k * g}: ${correct}.` }, correct, [F(n * k / 2 | 0 || 1, d * k / 2 | 0), F(sn, sd + 1), F(sn + 1, sd), F(n * k, d), F(n, d * k)]); },
        () => { const d = pick([3, 4, 5, 6]), n = R(1, d - 1), k = R(2, 4); return { prompt: `Fill in the missing number: ${F(n * k, d * k)} = ${F(n, '?')}`, answer: d, unit: '', hint: `${n * k} ÷ ${k} = ${n}. Divide the bottom by ${k} too.`, explain: `${d * k} ÷ ${k} = ${d}.` }; },
        () => { const d = pick([4, 6, 8, 10, 12]); const n = d / 2; return mc({ prompt: `${F(n, d)} is the same as which fraction?`, hint: `Is ${n} half of ${d}?`, explain: `${n} is half of ${d}, so ${F(n, d)} = ${F(1, 2)}.` }, F(1, 2), [F(1, 3), F(1, 4), F(2, 3), F(n, 2)]); }
      ]
    },
    /* 4 */ {
      title: 'Which Is Bigger?',
      skill: 'Compare fractions with different denominators',
      variants: [
        () => { let a, b, c, d; do { b = pick(DENS); d = pick(DENS); a = R(1, b - 1); c = R(1, d - 1); } while (b === d || a * d === c * b); const big = a * d > c * b ? 0 : 1; return mc({ prompt: `Which is <b>greater</b>?`, hint: 'Make the bottoms the same, or compare each to ½.', explain: `${F(a, b)} = ${F(a * d, b * d)} and ${F(c, d)} = ${F(c * b, b * d)}. ${big === 0 ? F(a, b) : F(c, d)} is greater.` }, big === 0 ? F(a, b) : F(c, d), [big === 0 ? F(c, d) : F(a, b), 'They are equal']); },
        () => { const n = R(2, 5); const f = [[1, n], [1, n + 1], [1, n + 3]]; return mc({ prompt: `Which is the <b>smallest</b>?`, hint: 'With the same top number, more pieces means each piece is smaller.', explain: `${F(1, n + 3)} is cut into the most pieces, so each piece is the smallest.` }, F(1, n + 3), [F(1, n), F(1, n + 1)]); },
        () => { const d1 = pick([5, 6, 8, 10]), d2 = pick([3, 4]); const big = F(Math.floor(d1 / 2) + 1, d1), small = F(1, d2), flip = Math.random() < 0.5; const [x, y] = flip ? [small, big] : [big, small]; return mc({ prompt: `Is ${x} greater than, less than, or equal to ${y}?`, hint: `Compare each one to ${F(1, 2)}.`, explain: `${big} is more than half, and ${small} is less than half. So ${big} is greater.` }, flip ? 'Less than' : 'Greater than', ['Greater than', 'Less than', 'Equal to']); },
        () => { const [n, d] = pick([[1, 2], [2, 3], [3, 4], [2, 5]]), k = R(2, 4), shift = pick([-1, 0, 1]); const dev = n * k + shift; const ans = shift > 0 ? 'Dev' : shift < 0 ? 'Viraj' : 'Same distance'; return mc({ prompt: `Viraj ran ${F(n, d)} mile. Dev ran ${F(dev, d * k)} mile. Who ran farther?`, hint: `Change ${F(n, d)} into ${d * k}ths.`, explain: `${F(n, d)} = ${F(n * k, d * k)}. Dev ran ${F(dev, d * k)}. ${ans === 'Same distance' ? 'They ran the same distance.' : ans + ' ran farther.'}` }, ans, ['Viraj', 'Dev', 'Same distance']); }
      ]
    },
    /* 5 */ {
      title: 'Add & Subtract',
      skill: 'Same denominators',
      variants: [
        () => { const d = pick([5, 6, 8, 10, 12]), a = R(1, d - 2), b = R(1, d - a - 1); return fa({ prompt: `${F(a, d)} + ${F(b, d)} = ?` + TYPE, hint: 'When the bottoms are the same, add the tops. The bottom stays the same.', explain: `${a} + ${b} = ${a + b}, so ${F(a + b, d)}.` }, a + b, d); },
        () => { const d = pick([6, 8, 10, 12]), a = R(4, d - 1), b = R(1, a - 1); return fa({ prompt: `${F(a, d)} − ${F(b, d)} = ?` + TYPE, hint: 'Subtract the tops. Keep the bottom.', explain: `${a} − ${b} = ${a - b}, so ${F(a - b, d)}.` }, a - b, d); },
        () => { const d = pick([8, 10, 12]), a = R(1, 3), b = R(1, 3), c = R(1, 3); return fa({ prompt: `Viraj walked ${F(a, d)} mile to school, ${F(b, d)} mile to the park and ${F(c, d)} mile home. How far did he walk?` + TYPE, unit: 'mile', hint: 'Add all three tops.', explain: `${a} + ${b} + ${c} = ${a + b + c}, so ${F(a + b + c, d)} mile.` }, a + b + c, d); },
        () => { const d = pick([5, 6, 8]), a = R(1, d - 1); return fa({ prompt: `A whole pie is ${F(d, d)}. Viraj eats ${F(a, d)}. How much pie is left?` + TYPE, hint: `1 whole = ${F(d, d)}.`, explain: `${F(d, d)} − ${F(a, d)} = ${F(d - a, d)}.` }, d - a, d); }
      ]
    },
    /* 6 */ {
      title: 'Mixed Numbers',
      skill: 'Switch between mixed numbers and improper fractions',
      variants: [
        () => { const d = pick([3, 4, 5, 6, 8]), w = R(1, 4), r = R(1, d - 1); return { prompt: `${w}${F(r, d)} = ${F('?', d)}`, answer: w * d + r, unit: '', hint: `Each whole is ${F(d, d)}. How many ${d}ths in ${w} wholes?`, explain: `${w} × ${d} = ${w * d}, plus ${r} = ${w * d + r}. So ${F(w * d + r, d)}.` }; },
        () => { const d = pick([3, 4, 5, 6]), w = R(1, 4), r = R(1, d - 1), n = w * d + r; const correct = `${w}${F(r, d)}`; return mc({ prompt: `Write ${F(n, d)} as a <b>mixed number</b>.`, hint: `How many groups of ${d} fit in ${n}? What is left over?`, explain: `${n} ÷ ${d} = ${w} remainder ${r}, so ${correct}.` }, correct, [`${w + 1}${F(r, d)}`, `${w}${F(d - r, d)}`, `${r}${F(w, d)}`, `${w - 1 || w + 2}${F(r, d)}`]); },
        () => { const d = pick([4, 8]), w = R(1, 3), r = R(1, d - 1); const n = w * d + r; return { prompt: `A recipe needs ${F(n, d)} cups of flour. A measuring cup holds 1 cup. How many <b>full</b> cups can Viraj fill?`, answer: w, unit: 'cups', hint: `How many ${F(d, d)} fit inside ${F(n, d)}?`, explain: `${F(n, d)} = ${w}${F(r, d)}, so ${w} full cups.` }; }
      ]
    },
    /* 7 */ {
      title: 'Mixed Number Math',
      skill: 'Add and subtract mixed numbers',
      variants: [
        () => { const d = pick([4, 5, 6, 8]), a = R(1, 3) * d + R(1, d - 1), b = R(1, 2) * d + R(1, d - 1); return fa({ prompt: `${M(a, d)} + ${M(b, d)} = ?` + ' Type like <code>4 3/8</code>.', hint: 'Add the wholes, then the fractions. If the fraction part is more than 1, make a new whole.', explain: `${M(a, d)} + ${M(b, d)} = ${M(a + b, d)}.` }, a + b, d); },
        () => { const d = pick([4, 6, 8]); let a, b; do { a = R(2, 4) * d + R(1, d - 1); b = R(1, 2) * d + R(1, d - 1); } while (a % d >= b % d || a <= b); return fa({ prompt: `${M(a, d)} − ${M(b, d)} = ?` + ' Type like <code>1 3/4</code>.', hint: `The first fraction part is too small to subtract from. Trade 1 whole for ${F(d, d)}.`, explain: `${M(a, d)} = ${Math.floor(a / d) - 1}${F(d + a % d, d)}. Then subtract: ${M(a - b, d)}.` }, a - b, d); },
        () => { const d = 4, a = R(1, 2) * d + R(1, 3), b = R(1, 2) * d + R(1, 3); return fa({ prompt: `Viraj's ribbon is ${M(a, d)} ft. Dev's is ${M(b, d)} ft. They tape them together. How long is the ribbon now?` + ' Type like <code>3 1/4</code>.', unit: 'ft', hint: 'Add wholes and quarters separately.', explain: `${M(a, d)} + ${M(b, d)} = ${M(a + b, d)} ft.` }, a + b, d); }
      ]
    },
    /* 8 */ {
      title: 'Times a Whole',
      skill: 'Multiply a fraction by a whole number',
      variants: [
        () => { const d = pick([3, 4, 5, 6, 8]), n = R(1, d - 1), k = R(2, 6); return fa({ prompt: `${k} × ${F(n, d)} = ?` + ' Type like <code>12/5</code> or <code>2 2/5</code>.', hint: `${k} groups of ${F(n, d)}. Multiply the top by ${k}.`, explain: `${k} × ${n} = ${k * n}, so ${F(k * n, d)} = ${M(k * n, d)}.` }, k * n, d); },
        () => { const d = 8, n = R(2, 5), k = R(3, 6); return fa({ prompt: `${k} friends each eat ${F(n, d)} of a pizza. How much pizza do they eat in all?` + ' Type like <code>1 7/8</code>.', unit: 'pizzas', hint: `Multiply: ${k} × ${F(n, d)}.`, explain: `${k} × ${F(n, d)} = ${F(k * n, d)} = ${M(k * n, d)} pizzas.` }, k * n, d); },
        () => { const d = pick([3, 4]), n = R(1, d - 1); let k = R(3, 8); if ((k * n) % d === 0) k++; const tot = k * n, lo = Math.floor(tot / d); const correct = `${lo} and ${lo + 1}`; return mc({ prompt: `Each lap of the track is ${F(n, d)} mile. Viraj runs <b>${k} laps</b>. His total is between which two whole numbers of miles?`, hint: `Find ${k} × ${F(n, d)}, then turn it into a mixed number.`, explain: `${k} × ${F(n, d)} = ${F(tot, d)} = ${M(tot, d)}, which is between ${lo} and ${lo + 1}.` }, correct, [`${lo + 1} and ${lo + 2}`, `${Math.max(0, lo - 1)} and ${lo}`, `${k} and ${k + 1}`]); }
      ]
    },
    /* 9 */ {
      title: 'Tenths & Hundredths',
      skill: 'Fractions out of 10 and 100, and decimals',
      variants: [
        () => { const n = R(1, 9); return { prompt: `${F(n, 10)} = ${F('?', 100)}`, answer: n * 10, unit: '', hint: '10 × 10 = 100. Multiply the top by 10 as well.', explain: `${F(n, 10)} = ${F(n * 10, 100)}.` }; },
        () => { const a = R(1, 8), b = R(1, 9) + 10 * R(0, 9 - a); return { prompt: `${F(a, 10)} + ${F(b, 100)} = ${F('?', 100)}`, answer: a * 10 + b, unit: '', hint: `Change ${F(a, 10)} into hundredths first.`, explain: `${F(a, 10)} = ${F(a * 10, 100)}. ${a * 10} + ${b} = ${a * 10 + b}, so ${F(a * 10 + b, 100)}.` }; },
        () => { const n = R(11, 99); return { prompt: `Write ${F(n, 100)} as a <b>decimal</b>.`, answer: n / 100, answerText: (n / 100).toFixed(2), unit: '', hint: 'Hundredths use two places after the decimal point.', explain: `${F(n, 100)} = ${(n / 100).toFixed(2)}.` }; },
        () => { const t = R(1, 9), h = R(1, 9); const a = `0.${t}`, b = `0.0${h}`, c = `0.${h}${t}`; const vals = { [a]: t / 10, [b]: h / 100, [c]: (h * 10 + t) / 100 }; const best = Object.keys(vals).sort((x, y) => vals[y] - vals[x])[0]; return mc({ prompt: `Which decimal is the <b>greatest</b>?`, hint: 'Compare the tenths place first.', explain: `As hundredths: ${a} = ${t * 10}, ${b} = ${h}, ${c} = ${h * 10 + t}. ${best} is greatest.` }, best, Object.keys(vals)); },
        () => { const c = R(5, 95); return mc({ prompt: `Viraj has <b>${c}¢</b>. What fraction of a dollar is that?`, hint: '1 dollar = 100 cents.', explain: `${c} cents out of 100 = ${F(c, 100)} = $${(c / 100).toFixed(2)}.` }, F(c, 100), [F(c, 10), F(c, 1000), F(100 - c, 100)]); }
      ]
    },
    /* 10 */ {
      title: 'Boss Level',
      skill: 'Multi-step fraction problems',
      variants: [
        () => { const d = pick([3, 4, 6, 8]), n = R(1, d - 1), k = R(2, 6), tot = d * k; return { prompt: `There are <b>${tot}</b> marbles. ${F(n, d)} of them are blue. How many marbles are blue?`, answer: n * k, unit: 'marbles', hint: `First find ${F(1, d)} of ${tot} by dividing by ${d}.`, explain: `${tot} ÷ ${d} = ${k}. ${n} × ${k} = ${n * k} blue marbles.` }; },
        () => { const d = 8, a = R(3, 7), tot = R(1, 2) * d + R(1, 7); const need = tot - a; return fa({ prompt: `${F(a, d)} + ? = ${M(tot, d)}` + ' Type like <code>1 3/8</code>.', hint: 'Subtract to find the missing part.', explain: `${M(tot, d)} − ${F(a, d)} = ${M(need, d)}.` }, need, d); },
        () => { const d = pick([3, 4]), n = R(1, d - 1), k = pick([2, 3]), cups = d * R(1, 2) + n; return fa({ prompt: `A recipe needs ${M(cups, d)} cups of rice. Viraj makes it <b>${k} times</b>. How many cups of rice does he need?` + ' Type like <code>4 1/2</code>.', unit: 'cups', hint: `Change ${M(cups, d)} into ${d}ths, then multiply by ${k}.`, explain: `${M(cups, d)} = ${F(cups, d)}. ${k} × ${F(cups, d)} = ${F(k * cups, d)} = ${M(k * cups, d)} cups.` }, k * cups, d); },
        () => { const a = R(2, 4), b = a + R(1, 3); const ate = [[a, 8], [b, 12]]; const big = a * 12 > b * 8 ? 0 : a * 12 < b * 8 ? 1 : 2; const opts = ['Viraj', 'Dev', 'Same amount']; return mc({ prompt: `Viraj ate ${F(a, 8)} of his pizza. Dev ate ${F(b, 12)} of a pizza the <b>same size</b>. Who ate more?`, hint: `Change both to 24ths.`, explain: `${F(a, 8)} = ${F(a * 3, 24)} and ${F(b, 12)} = ${F(b * 2, 24)}. ${big === 2 ? 'They ate the same.' : opts[big] + ' ate more.'}` }, opts[big], opts); }
      ]
    }
  ];

  (window.VQ_TOPICS = window.VQ_TOPICS || []).push({
    id: 'fractions',
    area: 'nbt',
    name: 'Fractions',
    blurb: 'Equal fractions, comparing, adding and mixed numbers.',
    grade: 'Grade 4 → 5',
    icon: 'pie',
    live: true,
    levels
  });
})();
