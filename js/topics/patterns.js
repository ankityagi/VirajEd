/* Topic: Patterns & Rules (Algebra & Patterns)
   Grade 4 standards 4.OA.1–3 (times as many, multi-step problems with a letter for the
   unknown) and 4.OA.5 (number and shape patterns that follow a rule). Starts with
   3-digit sequences and ×2/×3 growth so it sits above level; the Boss level reaches
   Grade 5 (parentheses, the nth term, two patterns side by side). */
(function () {
  const R = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const shuffle = a => a.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(p => p[1]);
  const f = n => n.toLocaleString('en-US');

  function mc(q, correct, options) {
    const wrong = shuffle([...new Set(options.filter(o => o !== correct))]).slice(0, 3);
    const choices = shuffle([correct, ...wrong]);
    return Object.assign(q, { choices, answer: choices.indexOf(correct) });
  }
  const seq = (start, n, next) => { const s = [start]; while (s.length < n) s.push(next(s[s.length - 1])); return s; };
  const show = (s, hide) => s.map((v, i) => (i === hide ? '<b class="qcell">?</b>' : f(v))).join(', ');
  function table(ins, outs, hideIdx, inName = 'In', outName = 'Out') {
    return `<table class="dtable io"><tr><th>${inName}</th>${ins.map(v => `<td>${v === null ? '<b class="qcell">?</b>' : f(v)}</td>`).join('')}</tr><tr><th>${outName}</th>${outs.map((v, i) => `<td>${i === hideIdx || v === null ? '<b class="qcell">?</b>' : f(v)}</td>`).join('')}</tr></table>`;
  }

  const levels = [
    /* 1 */ {
      title: 'What Comes Next?',
      skill: 'Add or subtract patterns with bigger numbers',
      variants: [
        () => { const a = R(12, 95), d = R(6, 25), s = seq(a, 5, x => x + d); return { prompt: `What number comes next?<br><b>${show(s.slice(0, 4))}, ?</b>`, answer: s[4], hint: 'How much does it go up each time?', explain: `It goes up by ${d} each time. ${f(s[3])} + ${d} = ${f(s[4])}.` }; },
        () => { const d = R(7, 40), a = R(6, 12) * d + R(5, 90), s = seq(a, 5, x => x - d); return { prompt: `What number comes next?<br><b>${show(s.slice(0, 4))}, ?</b>`, answer: s[4], hint: 'Is it getting bigger or smaller? By how much?', explain: `It goes down by ${d} each time. ${f(s[3])} − ${d} = ${f(s[4])}.` }; },
        () => { const a = R(105, 690), d = pick([25, 50, 75, 100, 125, 150]), s = seq(a, 5, x => x + d); return { prompt: `What number comes next?<br><b>${show(s.slice(0, 4))}, ?</b>`, answer: s[4], hint: 'Look at the hundreds and tens. What is being added?', explain: `+${d} each time. ${f(s[3])} + ${d} = ${f(s[4])}.` }; }
      ]
    },
    /* 2 */ {
      title: 'Missing Number',
      skill: 'Fill a gap, and patterns that multiply',
      variants: [
        () => { const a = R(10, 80), d = R(5, 30), s = seq(a, 6, x => x + d), h = R(1, 4); return { prompt: `Find the missing number.<br><b>${show(s, h)}</b>`, answer: s[h], hint: 'Find the jump between two numbers next to each other.', explain: `The jump is ${d}. The missing number is ${f(s[h])}.` }; },
        () => { const a = R(2, 7), m = pick([2, 3]), s = seq(a, 5, x => x * m); return { prompt: `What number comes next?<br><b>${show(s.slice(0, 4))}, ?</b>`, answer: s[4], hint: 'The jumps keep getting bigger. Try multiplying.', explain: `Each number is ${m} times the one before. ${f(s[3])} × ${m} = ${f(s[4])}.` }; },
        () => { const a = R(3, 9), m = 2, s = seq(a, 6, x => x * m), h = R(2, 4); return { prompt: `Find the missing number.<br><b>${show(s, h)}</b>`, answer: s[h], hint: 'Each number doubles.', explain: `${f(s[h - 1])} × 2 = ${f(s[h])}.` }; },
        () => { const d = R(15, 45), s = seq(R(400, 900), 6, x => x - d), h = R(1, 4); return { prompt: `Find the missing number.<br><b>${show(s, h)}</b>`, answer: s[h], hint: 'The numbers are going down. By how much?', explain: `They go down by ${d}. The missing number is ${f(s[h])}.` }; }
      ]
    },
    /* 3 */ {
      title: 'Rule Detective',
      skill: 'Name the rule of a pattern',
      variants: [
        () => { const d = R(3, 12), a = R(1, 20), s = seq(a, 5, x => x + d); return mc({ prompt: `What is the rule?<br><b>${show(s)}</b>`, hint: 'Subtract two numbers next to each other.', explain: `Each number is ${d} more than the one before.` }, `Add ${d}`, [`Add ${d + 1}`, `Multiply by ${d}`, `Add ${d - 1}`, `Subtract ${d}`]); },
        () => { const m = pick([2, 3, 4]), a = R(1, 5), s = seq(a, 5, x => x * m); return mc({ prompt: `What is the rule?<br><b>${show(s)}</b>`, hint: 'Do the jumps stay the same, or grow?', explain: `Each number is ${m} times the one before.` }, `Multiply by ${m}`, [`Add ${s[1] - s[0]}`, `Multiply by ${m + 1}`, `Add ${m}`]); },
        () => { const d = R(4, 15), s = seq(R(90, 150), 5, x => x - d); return mc({ prompt: `What is the rule?<br><b>${show(s)}</b>`, hint: 'The numbers get smaller.', explain: `Each number is ${d} less than the one before.` }, `Subtract ${d}`, [`Add ${d}`, `Subtract ${d + 2}`, `Divide by ${d}`]); },
        () => { const d = pick([3, 4, 5, 6, 7, 8, 9]), a = R(1, 9) * 2, s = seq(a, 6, x => x + d), odd = d % 2 === 1; return mc({ prompt: `The rule is <b>start at ${a}, add ${d}</b>. What do you notice about the numbers?<br>${show(s)}, …`, hint: 'Look at odd and even. Even + odd = odd. Even + even = even.', explain: odd ? 'Adding an odd number switches between even and odd, so they go even, odd, even, odd…' : 'Starting even and adding an even number keeps every number even.' }, odd ? 'They switch: even, odd, even, odd…' : 'They are all even', ['They switch: even, odd, even, odd…', 'They are all even', 'They are all odd', 'They all end in the same digit']); }
      ]
    },
    /* 4 */ {
      title: 'In & Out Tables',
      skill: 'Use a one-step rule',
      variants: [
        () => { const m = R(3, 9), ins = shuffle([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]).slice(0, 4), outs = ins.map(x => x * m); return { prompt: `Find the rule, then fill in the <b>?</b>${table(ins, outs, 3)}`, answer: outs[3], hint: 'What do you do to each In number to get its Out number?', explain: `The rule is × ${m}. ${ins[3]} × ${m} = ${outs[3]}.` }; },
        () => { const d = R(11, 48), ins = shuffle([5, 8, 12, 15, 20, 23, 30, 41]).slice(0, 4), outs = ins.map(x => x + d); return { prompt: `Find the rule, then fill in the <b>?</b>${table(ins, outs, 3)}`, answer: outs[3], hint: 'Subtract In from Out for one column.', explain: `The rule is + ${d}. ${ins[3]} + ${d} = ${outs[3]}.` }; },
        () => { const m = R(4, 9), outs = shuffle([2, 3, 5, 6, 7, 8, 9, 11, 12]).slice(0, 4), ins = outs.map(x => x * m); return { prompt: `Find the rule, then fill in the <b>?</b>${table(ins, outs, 3)}`, answer: outs[3], hint: 'The Out numbers are smaller. Try dividing.', explain: `The rule is ÷ ${m}. ${ins[3]} ÷ ${m} = ${outs[3]}.` }; },
        () => { const m = R(3, 8), ins = [2, 4, 6, null], outs = [2 * m, 4 * m, 6 * m, R(8, 12) * m]; return { prompt: `The rule is <b>× ${m}</b>. What <b>In</b> number gives the last Out?${table(ins, outs, -1)}`, answer: outs[3] / m, hint: 'Work backwards: divide.', explain: `${outs[3]} ÷ ${m} = ${outs[3] / m}.` }; }
      ]
    },
    /* 5 */ {
      title: 'Two-Step Rules',
      skill: 'Multiply then add (or subtract)',
      variants: [
        () => { const m = R(2, 5), a = R(1, 9), ins = [1, 2, 3, R(6, 12)], outs = ins.map(x => x * m + a); return { prompt: `Rule: <b>× ${m}, then + ${a}</b>. Fill in the <b>?</b>${table(ins, outs, 3)}`, answer: outs[3], hint: 'Do the multiplying first, then the adding.', explain: `${ins[3]} × ${m} = ${ins[3] * m}, + ${a} = ${outs[3]}.` }; },
        () => { const m = R(2, 4), a = R(1, 6), ins = [2, 3, 4, 5], outs = ins.map(x => x * m + a), last = R(9, 15); return { prompt: `Find the rule from the table, then work out Out for In = <b>${last}</b>.${table(ins, outs, -1)}`, answer: last * m + a, hint: `Out goes up by ${m} each time In goes up by 1. So start with × ${m}. What do you add?`, explain: `Rule: × ${m}, then + ${a}. ${last} × ${m} + ${a} = ${last * m + a}.` }; },
        () => { const m = R(3, 6), s = R(1, m - 1), x = R(5, 12); return { prompt: `Rule: <b>× ${m}, then − ${s}</b>. The Out number is <b>${x * m - s}</b>. What was In?`, answer: x, hint: 'Undo the steps in reverse order: add first, then divide.', explain: `${x * m - s} + ${s} = ${x * m}. ${x * m} ÷ ${m} = ${x}.` }; }
      ]
    },
    /* 6 */ {
      title: 'Times As Many',
      skill: 'Comparing with multiplication',
      variants: [
        () => { const a = R(4, 12), k = R(3, 8); return { prompt: `Viraj has <b>${a}</b> trading cards. Dev has <b>${k} times as many</b>. How many cards does Dev have?`, answer: a * k, unit: 'cards', hint: '"Times as many" means multiply.', explain: `${a} × ${k} = ${a * k} cards.` }; },
        () => { const a = R(5, 15), k = R(3, 9); return { prompt: `A tree is <b>${a * k} ft</b> tall. A bush is <b>${a} ft</b> tall. The tree is how many <b>times as tall</b> as the bush?`, answer: k, unit: 'times', hint: 'Divide the bigger by the smaller.', explain: `${a * k} ÷ ${a} = ${k}.` }; },
        () => { const a = R(6, 20), k = R(3, 6), mult = Math.random() < 0.5; return { prompt: mult ? `A red ribbon is <b>${a} cm</b>. A blue ribbon is <b>${k} times as long</b>. How long is the blue ribbon?` : `A red ribbon is <b>${a} cm</b>. A blue ribbon is <b>${k} cm longer</b>. How long is the blue ribbon?`, answer: mult ? a * k : a + k, unit: 'cm', hint: '"Times as long" means multiply. "Longer by" means add. Read carefully!', explain: mult ? `${a} × ${k} = ${a * k} cm.` : `${a} + ${k} = ${a + k} cm.` }; },
        () => { const b = R(6, 15), k = R(3, 7); return { prompt: `Viraj read <b>${b * k}</b> pages. That is <b>${k} times as many</b> as his brother. How many pages did his brother read?`, answer: b, unit: 'pages', hint: 'Viraj read more. To find the smaller amount, divide.', explain: `${b * k} ÷ ${k} = ${b} pages.` }; }
      ]
    },
    /* 7 */ {
      title: 'Find the Letter',
      skill: 'Solve for the unknown',
      variants: [
        () => { const a = R(3, 9), n = R(6, 15); return { prompt: `<b>${a} × n = ${a * n}</b><br>What is <b>n</b>?`, answer: n, hint: 'Which number times ' + a + ' makes ' + a * n + '?', explain: `${a * n} ÷ ${a} = ${n}.` }; },
        () => { const n = R(120, 680), b = R(105, 395); return { prompt: `<b>n − ${b} = ${n - b}</b><br>What is <b>n</b>?`, answer: n, hint: 'Undo subtracting by adding.', explain: `${n - b} + ${b} = ${n}.` }; },
        () => { const n = R(3, 9), q = R(4, 12); return { prompt: `<b>${n * q} ÷ n = ${q}</b><br>What is <b>n</b>?`, answer: n, hint: `${q} times what makes ${n * q}?`, explain: `${n * q} ÷ ${n} = ${q}, so n = ${n}.` }; },
        () => { const a = R(2, 6), n = R(4, 12), b = R(2, 15); return { prompt: `<b>${a} × n + ${b} = ${a * n + b}</b><br>What is <b>n</b>?`, answer: n, hint: `First take away ${b}, then divide by ${a}.`, explain: `${a * n + b} − ${b} = ${a * n}. ${a * n} ÷ ${a} = ${n}.` }; }
      ]
    },
    /* 8 */ {
      title: 'Growing Patterns',
      skill: 'Shape patterns and the 10th term',
      variants: [
        () => { const d = R(3, 6), a = R(1, 5); const k = pick([10, 12, 15, 20]); return { prompt: `Figure 1 has <b>${a + d}</b> toothpicks, Figure 2 has <b>${a + 2 * d}</b>, Figure 3 has <b>${a + 3 * d}</b>. How many toothpicks are in <b>Figure ${k}</b>?`, answer: a + k * d, unit: 'toothpicks', hint: `Each figure adds ${d}. Figure ${k} is ${k} × ${d}, plus ${a}.`, explain: `Rule: figure × ${d} + ${a}. ${k} × ${d} + ${a} = ${a + k * d}.` }; },
        () => { const a = R(2, 20), d = R(3, 9), k = pick([10, 15, 20]); const s = seq(a, 4, x => x + d); return { prompt: `The pattern is <b>${show(s)}, …</b> What is the <b>${k}th</b> number?`, answer: a + (k - 1) * d, hint: `From the 1st to the ${k}th number there are ${k - 1} jumps.`, explain: `${a} + ${k - 1} × ${d} = ${a + (k - 1) * d}.` }; },
        () => { const k = R(5, 9); return { prompt: `Square patterns: Figure 1 is 1 tile, Figure 2 is a 2-by-2 square (4 tiles), Figure 3 is 3-by-3 (9 tiles). How many tiles in <b>Figure ${k}</b>?`, answer: k * k, unit: 'tiles', hint: `Figure ${k} is ${k} by ${k}.`, explain: `${k} × ${k} = ${k * k} tiles.` }; },
        () => { const d = pick([4, 6, 8]), a = R(1, 4) * 2; return mc({ prompt: `A pattern starts at <b>${a}</b> and adds <b>${d}</b> each time. Will <b>${a + 5 * d + 1}</b> ever be in the pattern?`, hint: 'Start even and add an even number. Can you ever get an odd number?', explain: `All the numbers stay even, and ${a + 5 * d + 1} is odd, so no.` }, 'No', ['Yes', 'No']); }
      ]
    },
    /* 9 */ {
      title: 'Word Problem Workshop',
      skill: 'Two-step problems and choosing the equation',
      variants: [
        () => { const p = R(4, 9), n = R(5, 12), extra = R(6, 25); return { prompt: `Viraj buys <b>${n}</b> packs of stickers with <b>${p}</b> in each. His friend gives him <b>${extra}</b> more. How many stickers does he have?`, answer: n * p + extra, unit: 'stickers', hint: 'Multiply first, then add.', explain: `${n} × ${p} = ${n * p}. ${n * p} + ${extra} = ${n * p + extra}.` }; },
        () => { const tot = R(15, 30) * 10, spent = R(3, 9) * 10, k = pick([2, 4, 5]); const left = tot - spent; if (left % k) return levels[8].variants[1](); return { prompt: `A class has <b>$${tot}</b>. They spend <b>$${spent}</b> on paint, then share the rest equally among <b>${k}</b> groups. How much does each group get?`, answer: left / k, unit: 'dollars', hint: 'Subtract first, then divide.', explain: `$${tot} − $${spent} = $${left}. $${left} ÷ ${k} = $${left / k}.` }; },
        () => { const b = R(6, 9), c = R(12, 30), g = R(3, 6); return mc({ prompt: `There are <b>${g}</b> boxes with <b>${c}</b> crayons each. <b>${b}</b> crayons are broken. Which equation finds <b>c</b>, the crayons that are <b>not</b> broken?`, hint: 'First find all the crayons, then take away the broken ones.', explain: `All crayons: ${g} × ${c}. Then subtract ${b}: c = ${g} × ${c} − ${b} = ${g * c - b}.` }, `c = ${g} × ${c} − ${b}`, [`c = ${g} + ${c} − ${b}`, `c = ${g} × ${c} + ${b}`, `c = ${g} × (${c} + ${b})`]); },
        () => { const a = R(120, 340), b = R(85, 210), c = R(40, 150); return { prompt: `A library had <b>${a}</b> books. It got <b>${b}</b> new ones and lent out <b>${c}</b>. How many books are on the shelves now?`, answer: a + b - c, unit: 'books', hint: 'Add the new books, then subtract the ones lent out.', explain: `${a} + ${b} = ${a + b}. ${a + b} − ${c} = ${a + b - c}.` }; }
      ]
    },
    /* 10 */ {
      title: 'Boss Level',
      skill: 'Parentheses, two patterns, and reverse rules',
      variants: [
        () => { const a = R(3, 12), b = R(2, 9), c = R(2, 6); const paren = Math.random() < 0.5; return { prompt: paren ? `<b>(${a} + ${b}) × ${c} = ?</b>` : `<b>${a} + ${b} × ${c} = ?</b>`, answer: paren ? (a + b) * c : a + b * c, hint: paren ? 'Do what is inside the parentheses first.' : 'With no parentheses, multiply before you add.', explain: paren ? `${a} + ${b} = ${a + b}. ${a + b} × ${c} = ${(a + b) * c}.` : `${b} × ${c} = ${b * c}. ${a} + ${b * c} = ${a + b * c}.` }; },
        () => { const d = R(2, 5), m = pick([2, 3]); const k = R(4, 7); return { prompt: `Pattern A starts at 0 and adds <b>${d}</b>. Pattern B starts at 0 and adds <b>${d * m}</b>. When Pattern A is at <b>${d * k}</b>, what is Pattern B at (same step)?`, answer: d * m * k, hint: `Each B number is ${m} times the A number at the same step.`, explain: `A is at step ${k}. B at step ${k} = ${k} × ${d * m} = ${d * m * k}.` }; },
        () => { const m = R(3, 6), a = R(2, 9), x = R(7, 15), y = x * m + a; return { prompt: `Viraj thinks of a number. He multiplies it by <b>${m}</b> and adds <b>${a}</b>. He gets <b>${y}</b>. What was his number?`, answer: x, hint: 'Work backwards: subtract, then divide.', explain: `${y} − ${a} = ${y - a}. ${y - a} ÷ ${m} = ${x}.` }; },
        () => { const d = R(5, 12), a = R(3, 30), target = a + R(20, 40) * d; return { prompt: `A pattern starts at <b>${a}</b> and adds <b>${d}</b> each time. Which step is the number <b>${target}</b>? (Step 1 is ${a}.)`, answer: (target - a) / d + 1, hint: `How many jumps of ${d} from ${a} to ${target}? Then add 1.`, explain: `${target} − ${a} = ${target - a}. ${target - a} ÷ ${d} = ${(target - a) / d} jumps, so it is step ${(target - a) / d + 1}.` }; }
      ]
    }
  ];

  (window.VQ_TOPICS = window.VQ_TOPICS || []).push({
    id: 'patterns',
    area: 'oa',
    name: 'Patterns & Rules',
    blurb: 'Number patterns, in/out tables, times as many, and finding n.',
    grade: 'Grade 4 → 5',
    icon: 'pattern',
    live: true,
    levels
  });
})();
