/* Topic: Big Multiplication (Numbers & Operations)
   Grade 4 standards 4.NBT.5 (up to 4-digit × 1-digit, 2-digit × 2-digit),
   4.NBT.6 (up to 4-digit ÷ 1-digit with remainders) and 4.OA.3 (what a remainder means).
   Starts with multiplying by tens (above Grade 3 facts); the Boss level reaches Grade 5
   (3-digit × 2-digit and dividing by a 2-digit number). */
(function () {
  const R = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const shuffle = a => a.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(p => p[1]);
  const f = n => n.toLocaleString('en-US');
  // a 2-digit number that is not a multiple of 10
  const two = (lo = 12, hi = 98) => { let n; do { n = R(lo, hi); } while (n % 10 === 0); return n; };

  function mc(q, correct, wrongs) {
    const uniq = [...new Set(wrongs.filter(w => w !== correct))].slice(0, 3);
    const choices = shuffle([correct, ...uniq]);
    return Object.assign(q, { choices, answer: choices.indexOf(correct) });
  }

  // area-model table: rows split a, columns split b. hide = [r, c] cell to show as "?"
  function areaModel(a, b, hide) {
    const ap = [Math.floor(a / 10) * 10, a % 10], bp = [Math.floor(b / 10) * 10, b % 10];
    let h = `<table class="dtable area"><tr><th>×</th>${bp.map(x => `<th>${x}</th>`).join('')}</tr>`;
    ap.forEach((x, r) => {
      h += `<tr><th>${x}</th>${bp.map((y, c) => `<td>${hide && hide[0] === r && hide[1] === c ? '<b class="qcell">?</b>' : f(x * y)}</td>`).join('')}</tr>`;
    });
    return { html: h + '</table>', ap, bp };
  }

  const levels = [
    /* 1 */ {
      title: 'Times Tens',
      skill: 'Multiply with zeros: 40 × 7, 30 × 60, 800 × 6',
      variants: [
        () => { const a = R(3, 9), b = R(3, 9) * 10; return { prompt: `${a} × ${b} = ?`, answer: a * b, hint: `Work out ${a} × ${b / 10}, then put one zero on the end.`, explain: `${a} × ${b / 10} = ${a * b / 10}, so ${a} × ${b} = ${f(a * b)}.` }; },
        () => { const a = R(2, 9) * 10, b = R(2, 9) * 10; return { prompt: `${a} × ${b} = ?`, answer: a * b, hint: 'Multiply the front digits, then count the zeros: there are two.', explain: `${a / 10} × ${b / 10} = ${a * b / 100}, add two zeros: ${f(a * b)}.` }; },
        () => { const a = R(2, 9) * 100, b = R(3, 9); return { prompt: `${a} × ${b} = ?`, answer: a * b, hint: `${a / 100} × ${b}, then two zeros.`, explain: `${a / 100} × ${b} = ${a * b / 100}, so ${f(a * b)}.` }; },
        () => { const k = R(3, 9) * 10, n = R(4, 9); return { prompt: `A box holds <b>${k}</b> crayons. How many crayons are in <b>${n}</b> boxes?`, answer: k * n, unit: 'crayons', hint: `${n} × ${k / 10} tens.`, explain: `${n} × ${k} = ${f(k * n)} crayons.` }; }
      ]
    },
    /* 2 */ {
      title: '2-Digit × 1-Digit',
      skill: 'Multiply tens and ones, then add',
      variants: [
        () => { const a = two(23, 98), b = R(3, 9); return { prompt: `${a} × ${b} = ?`, answer: a * b, hint: `Split ${a} into ${a - a % 10} + ${a % 10}. Multiply each by ${b}.`, explain: `${a - a % 10} × ${b} = ${(a - a % 10) * b}, ${a % 10} × ${b} = ${(a % 10) * b}. Total ${f(a * b)}.` }; },
        () => { const a = two(24, 75), b = R(4, 9); return { prompt: `A book has <b>${a}</b> pages. Viraj reads <b>${b}</b> books like it. How many pages is that?`, answer: a * b, unit: 'pages', hint: 'Multiply the tens, then the ones, then add.', explain: `${a} × ${b} = ${f(a * b)} pages.` }; },
        () => { const a = two(31, 89), b = R(6, 9); const c = a * b; return mc({ prompt: `Which is equal to ${a} × ${b}?`, hint: 'Break the bigger number into tens and ones.', explain: `${a} × ${b} = (${a - a % 10} × ${b}) + (${a % 10} × ${b}) = ${f(c)}.` }, `(${a - a % 10} × ${b}) + (${a % 10} × ${b})`, [`(${a - a % 10} × ${b}) + ${a % 10}`, `(${a - a % 10} + ${a % 10}) + ${b}`, `${a - a % 10} × ${a % 10} × ${b}`]); }
      ]
    },
    /* 3 */ {
      title: 'Area Model',
      skill: 'Break 2-digit × 2-digit into four parts',
      variants: [
        () => { const a = two(12, 49), b = two(12, 49); const r = R(0, 1), c = R(0, 1); const m = areaModel(a, b, [r, c]); return { prompt: `This area model shows <b>${a} × ${b}</b>. What number goes in the <b>?</b> box?${m.html}`, answer: m.ap[r] * m.bp[c], hint: `Multiply the number at the start of that row by the number at the top of that column.`, explain: `${m.ap[r]} × ${m.bp[c]} = ${f(m.ap[r] * m.bp[c])}.` }; },
        () => { const a = two(12, 49), b = two(12, 49); const m = areaModel(a, b); return { prompt: `Use the area model to find <b>${a} × ${b}</b>.${m.html}`, answer: a * b, hint: 'Add all four boxes.', explain: `${[m.ap[0] * m.bp[0], m.ap[0] * m.bp[1], m.ap[1] * m.bp[0], m.ap[1] * m.bp[1]].map(f).join(' + ')} = ${f(a * b)}.` }; },
        () => { const a = two(13, 39), b = two(13, 39); const m = areaModel(a, b); const parts = [m.ap[0] * m.bp[0], m.ap[0] * m.bp[1], m.ap[1] * m.bp[0], m.ap[1] * m.bp[1]]; return mc({ prompt: `Which list shows the <b>four parts</b> of ${a} × ${b}?`, hint: `Split: ${a} = ${m.ap[0]} + ${m.ap[1]} and ${b} = ${m.bp[0]} + ${m.bp[1]}.`, explain: `${m.ap[0]}×${m.bp[0]}, ${m.ap[0]}×${m.bp[1]}, ${m.ap[1]}×${m.bp[0]}, ${m.ap[1]}×${m.bp[1]} = ${parts.map(f).join(', ')}.` }, parts.map(f).join(', '), [[m.ap[0] * m.bp[0], m.ap[1] * m.bp[1]].map(f).join(', '), [m.ap[0] * m.bp[0], m.ap[0] + m.bp[1], m.ap[1] + m.bp[0], m.ap[1] * m.bp[1]].map(f).join(', '), [m.ap[0] * m.bp[0] / 10, m.ap[0] * m.bp[1], m.ap[1] * m.bp[0], m.ap[1] * m.bp[1]].map(f).join(', ')]); }
      ]
    },
    /* 4 */ {
      title: 'Big × Small',
      skill: '3- and 4-digit numbers × 1-digit',
      variants: [
        () => { const a = R(213, 989), b = R(3, 9); return { prompt: `${f(a)} × ${b} = ?`, answer: a * b, hint: 'Multiply hundreds, tens and ones separately, then add.', explain: `${a - a % 100} × ${b} = ${f((a - a % 100) * b)}, ${a % 100 - a % 10} × ${b} = ${(a % 100 - a % 10) * b}, ${a % 10} × ${b} = ${(a % 10) * b}. Total ${f(a * b)}.` }; },
        () => { const a = R(1203, 4876), b = R(3, 8); return { prompt: `${f(a)} × ${b} = ?`, answer: a * b, hint: 'Line it up and carry carefully, or split into thousands, hundreds, tens and ones.', explain: `${f(a)} × ${b} = ${f(a * b)}.` }; },
        () => { const p = R(125, 495), n = R(4, 9); return { prompt: `A plane flies <b>${p} miles</b> each trip. How far does it fly in <b>${n} trips</b>?`, answer: p * n, unit: 'miles', hint: 'Multiply hundreds, tens and ones.', explain: `${p} × ${n} = ${f(p * n)} miles.` }; }
      ]
    },
    /* 5 */ {
      title: '2-Digit × 2-Digit',
      skill: 'Multiply two 2-digit numbers',
      variants: [
        () => { const a = two(23, 89), b = two(13, 79); return { prompt: `${a} × ${b} = ?`, answer: a * b, hint: `Try ${a} × ${b - b % 10} plus ${a} × ${b % 10}.`, explain: `${a} × ${b - b % 10} = ${f(a * (b - b % 10))}, ${a} × ${b % 10} = ${a * (b % 10)}. Total ${f(a * b)}.` }; },
        () => { const r = two(14, 32), s = two(16, 45); return { prompt: `A theatre has <b>${r} rows</b> with <b>${s} seats</b> in each row. How many seats?`, answer: r * s, unit: 'seats', hint: 'Use an area model or split one number into tens and ones.', explain: `${r} × ${s} = ${f(r * s)} seats.` }; },
        () => { const w = two(21, 59), h = two(12, 39); return { prompt: `A rectangular field is <b>${w} m</b> long and <b>${h} m</b> wide. What is its area?`, answer: w * h, unit: 'sq m', hint: 'Area = length × width.', explain: `${w} × ${h} = ${f(w * h)} sq m.` }; }
      ]
    },
    /* 6 */ {
      title: 'Divide It',
      skill: '3- and 4-digit ÷ 1-digit, no remainder',
      variants: [
        () => { const d = R(3, 9), q = R(24, 199); return { prompt: `${f(d * q)} ÷ ${d} = ?`, answer: q, hint: `How many ${d}s fit into the hundreds? Then the tens, then the ones.`, explain: `${d} × ${q} = ${f(d * q)}, so ${f(d * q)} ÷ ${d} = ${q}.` }; },
        () => { const d = R(4, 9), q = R(120, 899); return { prompt: `${f(d * q)} ÷ ${d} = ?`, answer: q, hint: 'Divide one place at a time, starting on the left.', explain: `${d} × ${q} = ${f(d * q)}.` }; },
        () => { const d = R(3, 8), q = R(32, 145); return { prompt: `<b>${f(d * q)}</b> stickers are shared equally among <b>${d}</b> friends. How many does each get?`, answer: q, unit: 'stickers', hint: 'Sharing equally means divide.', explain: `${f(d * q)} ÷ ${d} = ${q} stickers each.` }; },
        () => { const d = R(3, 9), q = R(40, 300); return { prompt: `? × ${d} = ${f(d * q)}`, answer: q, hint: 'A missing factor is found by dividing.', explain: `${f(d * q)} ÷ ${d} = ${q}.` }; }
      ]
    },
    /* 7 */ {
      title: 'Remainders',
      skill: 'Division that does not come out even',
      variants: [
        () => { const d = R(3, 9), q = R(21, 189), r = R(1, d - 1), n = d * q + r; return { prompt: `${f(n)} ÷ ${d} = ? R ?<br>What is the <b>remainder</b>?`, answer: r, hint: `Find the biggest multiple of ${d} that is not more than ${f(n)}.`, explain: `${d} × ${q} = ${f(d * q)}. ${f(n)} − ${f(d * q)} = ${r}. So ${q} R ${r}.` }; },
        () => { const d = R(3, 9), q = R(105, 899), r = R(1, d - 1), n = d * q + r; return { prompt: `${f(n)} ÷ ${d} = ? R ${r}<br>What is the <b>quotient</b> (the whole-number part)?`, answer: q, hint: 'Divide one place at a time. The remainder is what is left at the end.', explain: `${d} × ${q} = ${f(d * q)}, and ${f(d * q)} + ${r} = ${f(n)}. Quotient is ${q}.` }; },
        () => { const d = R(4, 9), q = R(12, 60), r = R(1, d - 1); return mc({ prompt: `Which division has a remainder of <b>${r}</b>?`, hint: 'Check each one: divide and see what is left over.', explain: `${d * q + r} ÷ ${d} = ${q} R ${r}.` }, `${d * q + r} ÷ ${d}`, [`${d * q} ÷ ${d}`, `${d * q + r + 1 === d * (q + 1) ? d * q + r - 1 || d * q + 1 : d * q + r + 1} ÷ ${d}`, `${d * (q + 1)} ÷ ${d}`]); }
      ]
    },
    /* 8 */ {
      title: 'Leftovers',
      skill: 'Decide what the remainder means',
      variants: [
        () => { const seats = pick([24, 36, 40, 48]), buses = R(3, 8), extra = R(1, seats - 1), kids = seats * buses + extra; return { prompt: `<b>${f(kids)}</b> students go on a trip. Each bus holds <b>${seats}</b>. How many buses are needed so everyone goes?`, answer: buses + 1, unit: 'buses', hint: 'The leftover students still need a bus.', explain: `${f(kids)} ÷ ${seats} = ${buses} R ${extra}. The ${extra} extra students need one more bus: ${buses + 1}.` }; },
        () => { const box = R(6, 9), full = R(25, 120), extra = R(1, box - 1), n = box * full + extra; return { prompt: `A bakery makes <b>${f(n)}</b> muffins. A box holds <b>${box}</b>. How many boxes can be <b>completely filled</b>?`, answer: full, unit: 'boxes', hint: 'Only full boxes count. Ignore the leftovers.', explain: `${f(n)} ÷ ${box} = ${full} R ${extra}. ${full} full boxes.` }; },
        () => { const k = R(4, 8), each = R(15, 60), extra = R(1, k - 1), n = k * each + extra; return { prompt: `<b>${f(n)}</b> cards are shared equally among <b>${k}</b> players. How many cards are <b>left over</b>?`, answer: extra, unit: 'cards', hint: 'The answer is the remainder.', explain: `${f(n)} ÷ ${k} = ${each} R ${extra}. ${extra} left over.` }; },
        () => { const len = pick([6, 7, 8, 9]), pieces = R(12, 40), extra = R(1, len - 1), rope = len * pieces + extra; return mc({ prompt: `A rope is <b>${rope} ft</b> long. Viraj cuts it into <b>${len} ft</b> pieces. What should he do with the remainder?`, hint: 'Can a piece shorter than the rest still count as a full piece?', explain: `${rope} ÷ ${len} = ${pieces} R ${extra}. He gets ${pieces} full pieces and ${extra} ft is left over.` }, `${pieces} pieces, ${extra} ft left over`, [`${pieces + 1} pieces`, `${pieces} pieces, ${len - extra} ft left over`, `${extra} piece${extra === 1 ? '' : 's'}`]); }
      ]
    },
    /* 9 */ {
      title: 'Estimate & Check',
      skill: 'Round to check if an answer makes sense',
      variants: [
        () => { const a = R(312, 889), b = R(4, 9), est = Math.round(a / 100) * 100 * b; return mc({ prompt: `Which is the <b>best estimate</b> for ${a} × ${b}?`, hint: `Round ${a} to the nearest hundred first.`, explain: `${a} rounds to ${Math.round(a / 100) * 100}. ${Math.round(a / 100) * 100} × ${b} = ${f(est)}.` }, f(est), [f(est * 10), f(est / 10), f(Math.round(a / 100) * 100 + b)]); },
        () => { const d = R(4, 9), q = R(310, 790), n = d * q; const ref = Math.round(q / 100) * 100; const ans = q > ref ? 'More than ' + ref : q < ref ? 'Less than ' + ref : 'Exactly ' + ref; return mc({ prompt: `Is ${f(n)} ÷ ${d} more or less than <b>${ref}</b>?`, hint: `Work out ${ref} × ${d} and compare it with ${f(n)}.`, explain: `${ref} × ${d} = ${f(ref * d)}. ${f(n)} is ${n > ref * d ? 'more' : n < ref * d ? 'less' : 'the same'}, so the answer is ${ans.toLowerCase()}. (It is ${q}.)` }, ans, ['More than ' + ref, 'Less than ' + ref, 'Exactly ' + ref]); },
        () => { const a = two(31, 89), b = two(21, 69), right = a * b; const wrong = pick([right + 10 * R(1, 9) * (Math.random() < 0.5 ? 1 : -1), a * (b - b % 10) + b % 10, right * 10]); const shown = Math.random() < 0.5 ? right : wrong; return mc({ prompt: `Dev says <b>${a} × ${b} = ${f(shown)}</b>. Is he right?`, hint: `Estimate: ${Math.round(a / 10) * 10} × ${Math.round(b / 10) * 10} = ${f(Math.round(a / 10) * 10 * Math.round(b / 10) * 10)}. Then check the ones digit too.`, explain: `${a} × ${b} = ${f(right)}. ${shown === right ? 'Dev is right.' : 'Dev is wrong.'}` }, shown === right ? 'Yes' : 'No', ['Yes', 'No']); }
      ]
    },
    /* 10 */ {
      title: 'Boss Level',
      skill: 'Grade 5 stretch: bigger numbers, multi-step',
      variants: [
        () => { const a = R(123, 489), b = two(12, 39); return { prompt: `${a} × ${b} = ?`, answer: a * b, hint: `Do ${a} × ${b - b % 10} and ${a} × ${b % 10}, then add.`, explain: `${a} × ${b - b % 10} = ${f(a * (b - b % 10))}, ${a} × ${b % 10} = ${f(a * (b % 10))}. Total ${f(a * b)}.` }; },
        () => { const d = pick([12, 15, 20, 24, 25]), q = R(13, 48); return { prompt: `${f(d * q)} ÷ ${d} = ?`, answer: q, hint: `Try multiples of ${d}: ${d} × 10 = ${d * 10}, ${d} × 20 = ${d * 20}…`, explain: `${d} × ${q} = ${f(d * q)}.` }; },
        () => { const n = two(14, 29), price = R(12, 19), pay = Math.ceil((n * price) / 100) * 100 + 100; return { prompt: `Viraj's class buys <b>${n} tickets</b> at <b>$${price}</b> each. They pay with <b>$${f(pay)}</b>. How much change do they get?`, answer: pay - n * price, unit: 'dollars', hint: 'Multiply first, then subtract.', explain: `${n} × $${price} = $${f(n * price)}. $${f(pay)} − $${f(n * price)} = $${f(pay - n * price)}.` }; },
        () => { const packs = R(6, 9), per = R(24, 48), kids = R(4, 8); const tot = packs * per, each = Math.floor(tot / kids), left = tot % kids; return { prompt: `There are <b>${packs}</b> packs with <b>${per}</b> stickers in each. They are shared equally among <b>${kids}</b> kids. How many does each kid get?`, answer: each, unit: 'stickers', hint: 'Find the total first, then divide.', explain: `${packs} × ${per} = ${tot}. ${tot} ÷ ${kids} = ${each}${left ? ` R ${left}` : ''}. Each kid gets ${each}.` }; }
      ]
    }
  ];

  (window.VQ_TOPICS = window.VQ_TOPICS || []).push({
    id: 'multiply',
    area: 'nbt',
    name: 'Big Multiplication',
    blurb: 'Multi-digit times, long division and remainders.',
    grade: 'Grade 4 → 5',
    icon: 'times',
    live: true,
    levels
  });
})();
