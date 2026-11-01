/* Topic: Time & Money (Measurement & Data)
   Grade 4 standard 4.MD.2: elapsed time, converting units of time, money with decimals,
   multi-step word problems. Starts slightly above level, ends with Grade 5 style multi-step. */
(function () {
  const R = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const shuffle = a => a.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(p => p[1]);

  // minutes since midnight -> "3:05 PM"
  function clock(m) {
    m = ((m % 1440) + 1440) % 1440;
    const h = Math.floor(m / 60), mm = m % 60;
    return `${((h + 11) % 12) + 1}:${String(mm).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
  }
  const dur = m => { const h = Math.floor(m / 60), r = m % 60; return h ? `${h} h${r ? ` ${r} min` : ''}` : `${r} min`; };
  const money = c => '$' + (c / 100).toFixed(2);
  // a random time on a 5-minute mark between two hours
  const at = (h0, h1) => R(h0 * 12, h1 * 12) * 5;

  // multiple-choice time question with believable wrong answers
  function timeChoice(correct, prompt, hint, explain) {
    const wrong = new Set();
    [60, -60, 10, -10, 15, -15, 30, -30, 720].forEach(d => wrong.add(clock(correct + d)));
    wrong.delete(clock(correct));
    const opts = shuffle([clock(correct), ...shuffle([...wrong]).slice(0, 3)]);
    return { prompt, choices: opts, answer: opts.indexOf(clock(correct)), hint, explain };
  }

  const levels = [
    /* 1 */ {
      title: 'Clock Math',
      skill: 'Hours, minutes and seconds',
      variants: [
        () => { const h = R(2, 9), m = R(5, 55); return { prompt: `<b>${h} hours ${m} minutes</b> is how many minutes?`, answer: h * 60 + m, unit: 'min', hint: '1 hour = 60 minutes.', explain: `${h} × 60 = ${h * 60}, plus ${m} = ${h * 60 + m} min.` }; },
        () => { const m = R(3, 12), s = R(5, 55); return { prompt: `A song is <b>${m} min ${s} s</b> long. How many seconds is that?`, answer: m * 60 + s, unit: 's', hint: '1 minute = 60 seconds.', explain: `${m} × 60 = ${m * 60}, plus ${s} = ${m * 60 + s} s.` }; },
        () => { const h = R(2, 5), x = R(1, 3) * 15; const t = h * 60 + x; return { prompt: `A movie is <b>${t} minutes</b> long. That is <b>${h} hours</b> and how many minutes?`, answer: x, unit: 'min', hint: `How many 60s fit in ${t}?`, explain: `${t} = ${h} × 60 + ${x}, so it is ${h} h ${x} min. ${x} minutes are left over.` }; },
        () => { const d = R(2, 6); return { prompt: `How many <b>hours</b> are in <b>${d} days</b>?`, answer: d * 24, unit: 'h', hint: '1 day = 24 hours.', explain: `${d} × 24 = ${d * 24} h.` }; }
      ]
    },
    /* 2 */ {
      title: 'How Long?',
      skill: 'Elapsed time in minutes',
      variants: [
        () => { const s = at(8, 14), d = R(7, 19) * 5; return { prompt: `Soccer practice starts at <b>${clock(s)}</b> and ends at <b>${clock(s + d)}</b>. How many minutes long is it?`, answer: d, unit: 'min', hint: 'Count up to the next hour, then count the rest.', explain: `From ${clock(s)} to ${clock(s + d)} is ${dur(d)} = ${d} min.` }; },
        () => { const s = at(13, 17), d = R(10, 30) * 5; return { prompt: `Viraj started reading at <b>${clock(s)}</b> and stopped at <b>${clock(s + d)}</b>. How long did he read, in minutes?`, answer: d, unit: 'min', hint: 'Jump to the next whole hour first.', explain: `That is ${dur(d)}, which is ${d} minutes.` }; },
        () => { const s = at(9, 11), d = R(25, 50) * 5; return { prompt: `A road trip leaves at <b>${clock(s)}</b> and arrives at <b>${clock(s + d)}</b>. How many minutes was the trip?`, answer: d, unit: 'min', hint: 'Count whole hours, then the extra minutes. Then change hours to minutes.', explain: `${dur(d)} = ${d} min.` }; }
      ]
    },
    /* 3 */ {
      title: 'What Time Will It Be?',
      skill: 'Find the end time',
      variants: [
        () => { const s = at(8, 15), d = R(8, 22) * 5; return timeChoice(s + d, `Swim class starts at <b>${clock(s)}</b> and lasts <b>${dur(d)}</b>. When does it end?`, 'Add the hours first, then the minutes.', `${clock(s)} + ${dur(d)} = ${clock(s + d)}.`); },
        () => { const s = at(14, 17), d = R(13, 30) * 5; return timeChoice(s + d, `A game starts at <b>${clock(s)}</b>. It lasts <b>${d} minutes</b>. When does it end?`, `Change ${d} minutes to hours and minutes first.`, `${d} min = ${dur(d)}. ${clock(s)} + ${dur(d)} = ${clock(s + d)}.`); },
        () => { const s = at(10, 11), d = R(16, 30) * 5; return timeChoice(s + d, `A bus leaves at <b>${clock(s)}</b>. The ride takes <b>${dur(d)}</b>. When does it arrive? Watch out for noon.`, 'After 11:59 AM comes 12:00 PM.', `${clock(s)} + ${dur(d)} = ${clock(s + d)}.`); }
      ]
    },
    /* 4 */ {
      title: 'Work Backwards',
      skill: 'Find the start time',
      variants: [
        () => { const e = at(17, 19), d = R(7, 20) * 5; return timeChoice(e - d, `Dinner is ready at <b>${clock(e)}</b>. It takes <b>${dur(d)}</b> to cook. What time should cooking start?`, 'Count backwards: take away the hours, then the minutes.', `${clock(e)} − ${dur(d)} = ${clock(e - d)}.`); },
        () => { const e = at(8, 9), d = R(5, 12) * 5, w = R(3, 6) * 5; return timeChoice(e - d - w, `School starts at <b>${clock(e)}</b>. The walk takes <b>${d} min</b> and Viraj needs <b>${w} min</b> to get ready. When must he start getting ready?`, 'Add the two times together, then count back.', `${d} + ${w} = ${d + w} min. ${clock(e)} − ${d + w} min = ${clock(e - d - w)}.`); },
        () => { const e = at(12, 13), d = R(14, 26) * 5; return timeChoice(e - d, `A hike ended at <b>${clock(e)}</b>. It lasted <b>${dur(d)}</b>. When did it start?`, 'Going back past 12:00 PM takes you into the AM.', `${clock(e)} − ${dur(d)} = ${clock(e - d)}.`); }
      ]
    },
    /* 5 */ {
      title: 'Coin Counter',
      skill: 'Add coins and bills as dollars and cents',
      variants: [
        () => { const q = R(2, 7), d = R(1, 6), n = R(0, 5), p = R(0, 9), c = q * 25 + d * 10 + n * 5 + p; return { prompt: `Viraj has <b>${q} quarters</b>, <b>${d} dimes</b>, <b>${n} nickels</b> and <b>${p} pennies</b>. How much money is that?`, answer: c / 100, unit: 'dollars', hint: 'Quarter = 25¢, dime = 10¢, nickel = 5¢, penny = 1¢. 100¢ = $1.00.', explain: `${q * 25}¢ + ${d * 10}¢ + ${n * 5}¢ + ${p}¢ = ${c}¢ = ${money(c)}.` }; },
        () => { const b5 = R(1, 3), b1 = R(1, 4), q = R(1, 7), d = R(1, 8), c = b5 * 500 + b1 * 100 + q * 25 + d * 10; return { prompt: `In a piggy bank there are <b>${b5} five-dollar bills</b>, <b>${b1} one-dollar bills</b>, <b>${q} quarters</b> and <b>${d} dimes</b>. How much in total?`, answer: c / 100, unit: 'dollars', hint: 'Add the bills, then the coins, then put them together.', explain: `Bills: ${money(b5 * 500 + b1 * 100)}. Coins: ${q * 25 + d * 10}¢. Total ${money(c)}.` }; },
        () => { const a = R(120, 480), b = R(105, 395); return { prompt: `A notebook costs <b>${money(a)}</b> and a pen costs <b>${money(b)}</b>. How much for both?`, answer: (a + b) / 100, unit: 'dollars', hint: 'Line up the decimal points and add.', explain: `${money(a)} + ${money(b)} = ${money(a + b)}.` }; }
      ]
    },
    /* 6 */ {
      title: 'Making Change',
      skill: 'Subtract money to find change',
      variants: [
        () => { const c = R(215, 1795), paid = c < 1000 ? 1000 : 2000; return { prompt: `A snack costs <b>${money(c)}</b>. Viraj pays with a <b>${money(paid)}</b> bill. How much change does he get?`, answer: (paid - c) / 100, unit: 'dollars', hint: 'Count up from the price to the money he paid.', explain: `${money(paid)} − ${money(c)} = ${money(paid - c)}.` }; },
        () => { const a = R(150, 650), b = R(150, 650), paid = 2000; return { prompt: `Viraj buys a book for <b>${money(a)}</b> and a puzzle for <b>${money(b)}</b>. He pays with <b>$20.00</b>. What is his change?`, answer: (paid - a - b) / 100, unit: 'dollars', hint: 'Add the prices first.', explain: `${money(a)} + ${money(b)} = ${money(a + b)}. $20.00 − ${money(a + b)} = ${money(paid - a - b)}.` }; },
        () => { const p = R(3, 9) * 25 + 100, n = R(3, 6), paid = (Math.floor((p * n) / 500) + 1) * 500; return { prompt: `Stickers cost <b>${money(p)}</b> each. Viraj buys <b>${n}</b> and pays with <b>${money(paid)}</b>. What is his change?`, answer: (paid - p * n) / 100, unit: 'dollars', hint: 'Multiply to find the total cost, then subtract.', explain: `${n} × ${money(p)} = ${money(p * n)}. ${money(paid)} − ${money(p * n)} = ${money(paid - p * n)}.` }; }
      ]
    },
    /* 7 */ {
      title: 'Days, Weeks, Years',
      skill: 'Bigger units of time',
      variants: [
        () => { const w = R(3, 9), d = R(1, 6); return { prompt: `Summer camp lasts <b>${w} weeks ${d} days</b>. How many days is that?`, answer: w * 7 + d, unit: 'days', hint: '1 week = 7 days.', explain: `${w} × 7 = ${w * 7}, plus ${d} = ${w * 7 + d} days.` }; },
        () => { const y = R(2, 9), m = R(1, 11); return { prompt: `Viraj's cousin is <b>${y} years ${m} months</b> old. How many months is that?`, answer: y * 12 + m, unit: 'months', hint: '1 year = 12 months.', explain: `${y} × 12 = ${y * 12}, plus ${m} = ${y * 12 + m} months.` }; },
        () => { const h = R(2, 4); return { prompt: `How many <b>seconds</b> are in <b>${h} hours</b>?`, answer: h * 3600, unit: 's', hint: '1 hour = 60 minutes, and each minute is 60 seconds.', explain: `1 h = 60 × 60 = 3,600 s. ${h} × 3,600 = ${(h * 3600).toLocaleString('en-US')} s.` }; },
        () => { const d = R(30, 69); return { prompt: `A plant will bloom in <b>${d} days</b>. How many <b>full weeks</b> is that?`, answer: Math.floor(d / 7), unit: 'weeks', hint: 'How many 7s fit inside?', explain: `${d} ÷ 7 = ${Math.floor(d / 7)} with ${d % 7} left over, so ${Math.floor(d / 7)} full weeks.` }; }
      ]
    },
    /* 8 */ {
      title: 'Busy Schedule',
      skill: 'Multi-step time problems',
      variants: [
        () => { const s = at(17, 18), m = R(18, 26) * 5, dr = R(2, 5) * 5; return timeChoice(s + m + dr, `A movie starts at <b>${clock(s)}</b> and is <b>${dur(m)}</b> long. The drive home takes <b>${dr} min</b>. When do they get home?`, 'Find when the movie ends, then add the drive.', `Movie ends ${clock(s + m)}. Plus ${dr} min = ${clock(s + m + dr)}.`); },
        () => { const a = R(3, 8) * 5, b = R(4, 9) * 5, c = R(2, 6) * 5; return { prompt: `Homework: math takes <b>${a} min</b>, reading <b>${b} min</b>, and spelling <b>${c} min</b>. Viraj takes a <b>10 min</b> break in the middle. How many minutes in all?`, answer: a + b + c + 10, unit: 'min', hint: "Don't forget the break.", explain: `${a} + ${b} + ${c} + 10 = ${a + b + c + 10} min.` }; },
        () => { const n = R(3, 5), each = R(6, 12) * 5; return { prompt: `Viraj practises piano <b>${each} minutes</b> a day for <b>${n} days</b>. How many minutes is that in all?`, answer: n * each, unit: 'min', hint: 'Multiply, then you could also change it to hours.', explain: `${n} × ${each} = ${n * each} min = ${dur(n * each)}.` }; }
      ]
    },
    /* 9 */ {
      title: 'Smart Shopper',
      skill: 'Multiply and compare prices',
      variants: [
        () => { const w = R(3, 9) * 25 + 100, n = R(4, 9); return { prompt: `Viraj saves <b>${money(w)}</b> every week. How much does he have after <b>${n} weeks</b>?`, answer: (w * n) / 100, unit: 'dollars', hint: `Try ${n} × the dollars, then ${n} × the cents.`, explain: `${n} × ${money(w)} = ${money(w * n)}.` }; },
        () => { const u = R(3, 6) * 25, n = pick([4, 6, 8]), packDisc = R(1, 3) * 25, pack = u * n - packDisc; return { prompt: `Granola bars cost <b>${money(u)}</b> each, or <b>${money(pack)}</b> for a pack of <b>${n}</b>. How much do you <b>save</b> by buying the pack?`, answer: packDisc / 100, unit: 'dollars', hint: `What would ${n} single bars cost?`, explain: `${n} × ${money(u)} = ${money(u * n)}. ${money(u * n)} − ${money(pack)} = ${money(packDisc)} saved.` }; },
        () => { const total = R(12, 24) * 100, k = pick([2, 3, 4]); const t = Math.round(total / k / 25) * 25 * k; return { prompt: `<b>${k} friends</b> share a pizza bill of <b>${money(t)}</b> equally. How much does each pay?`, answer: t / k / 100, unit: 'dollars', hint: 'Divide the dollars first, then the cents.', explain: `${money(t)} ÷ ${k} = ${money(t / k)}.` }; }
      ]
    },
    /* 10 */ {
      title: 'Boss Level',
      skill: 'Time and money mixed together',
      variants: [
        () => { const s = at(10, 11), d = R(17, 30) * 5; return { prompt: `The zoo opens at <b>${clock(s)}</b>. Viraj leaves at <b>${clock(s + d)}</b>. How many minutes was he there?`, answer: d, unit: 'min', hint: 'Count to 12:00 PM first, then past it.', explain: `${clock(s)} to ${clock(s + d)} is ${dur(d)} = ${d} min.` }; },
        () => { const rate = R(6, 12) * 50, h = R(2, 4), half = pick([0, 30]); const cost = rate * h + (half ? rate / 2 : 0); return { prompt: `A bike rental costs <b>${money(rate)} per hour</b>. Viraj rides for <b>${h} h${half ? ' 30 min' : ''}</b>. How much does it cost?`, answer: cost / 100, unit: 'dollars', hint: half ? 'Half an hour costs half the hourly price.' : 'Multiply the price by the hours.', explain: `${h} × ${money(rate)} = ${money(rate * h)}${half ? ` plus half of ${money(rate)} = ${money(rate / 2)}` : ''}. Total ${money(cost)}.` }; },
        () => { const h = R(1, 2), m = R(2, 9), s = R(5, 55); const tot = h * 3600 + m * 60 + s; return { prompt: `A race took <b>${h} h ${m} min ${s} s</b>. How many seconds is that?`, answer: tot, unit: 's', hint: '1 h = 3,600 s and 1 min = 60 s.', explain: `${h * 3600} + ${m * 60} + ${s} = ${tot.toLocaleString('en-US')} s.` }; },
        () => { const a = R(110, 140), b = R(40, 90); return { prompt: `Viraj's first run took <b>${dur(a)}</b>. His second took <b>${b} min</b>. How many <b>more minutes</b> was the first run?`, answer: a - b, unit: 'min', hint: 'Change the first time to minutes.', explain: `${dur(a)} = ${a} min. ${a} − ${b} = ${a - b} min.` }; }
      ]
    }
  ];

  (window.VQ_TOPICS = window.VQ_TOPICS || []).push({
    id: 'time-money',
    area: 'md',
    name: 'Time & Money',
    blurb: 'Elapsed time, schedules, coins and change.',
    grade: 'Grade 4 → 5',
    icon: 'clock',
    live: true,
    levels
  });
})();
