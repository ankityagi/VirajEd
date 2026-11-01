/* Topic: Angles & Lines (Geometry, plus the angle part of Measurement & Data)
   Grade 4 standards 4.G.1–2 (points, lines, rays, segments, parallel, perpendicular,
   acute/right/obtuse, classifying shapes) and 4.MD.5–7 (degrees, protractors, turns,
   adding angles, missing angles). Starts with "straight" angles and rotated figures so it
   sits above level; the Boss level uses the Grade 7–8 idea that a triangle adds to 180°. */
(function () {
  const R = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const shuffle = a => a.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(p => p[1]);
  const D = Draw;
  const deg = n => `${n}°`;

  function mc(q, correct, options) {
    const choices = shuffle([...new Set([correct, ...options])]);
    return Object.assign(q, { choices, answer: choices.indexOf(correct) });
  }
  const TYPES = ['Acute', 'Right', 'Obtuse', 'Straight'];
  const typeOf = a => (a < 90 ? 'Acute' : a === 90 ? 'Right' : a < 180 ? 'Obtuse' : 'Straight');
  // a single angle, turned to a random direction so the base is not always flat
  const oneAngle = (a, label, rot = pick([0, 0, 20, 45, 90, 160, 200, 250])) => D.angles({ rays: [rot, rot + a], arcs: [{ from: rot, to: rot + a, label }] });

  // triangle from three angles (A at origin, B on the base)
  function triangle(A, B, C, labels) {
    const r = d => (d * Math.PI) / 180, b = Math.sin(r(B)) / Math.sin(r(C));
    const P = [[0, 0], [1, 0], [b * Math.cos(r(A)), -b * Math.sin(r(A))]];
    const rights = [];
    [[A, 0, 1, 2], [B, 1, 2, 0], [C, 2, 0, 1]].forEach(([ang, i, j, k]) => { if (ang === 90) rights.push([P[i], P[j], P[k]]); });
    return D.figure({ shapes: [{ pts: P }], rights, vlabels: labels ? [{ at: P[0], text: labels[0] }, { at: P[1], text: labels[1] }, { at: P[2], text: labels[2] }] : [], alt: 'Triangle' });
  }

  const levels = [
    /* 1 */ {
      title: 'Angle Types',
      skill: 'Acute, right, obtuse and straight',
      variants: [
        () => { const a = pick([R(3, 8) * 5, 90, R(20, 34) * 5, 180]); return mc({ prompt: 'What kind of angle is this?', fig: oneAngle(a), hint: 'Right = square corner (90°). Smaller is acute, bigger is obtuse. A flat line is straight (180°).', explain: `It measures ${deg(a)}, so it is ${typeOf(a).toLowerCase()}.` }, typeOf(a), TYPES); },
        () => { const a = R(19, 34) * 5; return mc({ prompt: `An angle measures <b>${deg(a)}</b>. What kind of angle is it?`, hint: 'Compare it with 90° and 180°.', explain: `${deg(a)} is more than 90° and less than 180°, so it is obtuse.` }, typeOf(a), TYPES); },
        () => { const a = pick([R(2, 17) * 5, R(19, 35) * 5]); return mc({ prompt: `Is <b>${deg(a)}</b> acute or obtuse?`, hint: 'Acute is less than 90°.', explain: `${deg(a)} is ${a < 90 ? 'less' : 'more'} than 90°, so it is ${typeOf(a).toLowerCase()}.` }, typeOf(a), ['Acute', 'Obtuse']); },
        () => { const set = shuffle([R(3, 8) * 5, 90, R(20, 34) * 5]); const want = pick(['acute', 'obtuse']); const idx = set.findIndex(a => typeOf(a).toLowerCase() === want); const names = ['Angle A', 'Angle B', 'Angle C']; return mc({ prompt: `Angle A is ${deg(set[0])}, Angle B is ${deg(set[1])} and Angle C is ${deg(set[2])}. Which one is <b>${want}</b>?`, hint: 'Check each against 90°.', explain: `${names[idx]} is ${deg(set[idx])}, which is ${want}.` }, names[idx], names); }
      ]
    },
    /* 2 */ {
      title: 'Lines, Rays & Segments',
      skill: 'Name them, and spot parallel and perpendicular',
      variants: [
        () => { const k = pick(['segment', 'ray', 'line']); const name = { segment: 'Line segment AB', ray: 'Ray AB', line: 'Line AB' }[k]; return mc({ prompt: 'What is this called?', fig: D.lines(k, pick([0, 15, -20, 35])), hint: 'Arrow = it keeps going. A dot with no arrow = it stops there.', explain: k === 'segment' ? 'It stops at both A and B, so it is a line segment.' : k === 'ray' ? 'It starts at A and keeps going past B, so it is a ray.' : 'It keeps going both ways, so it is a line.' }, name, ['Line segment AB', 'Ray AB', 'Line AB']); },
        () => { const k = pick(['parallel', 'perpendicular', 'intersecting']); const name = { parallel: 'Parallel', perpendicular: 'Perpendicular', intersecting: 'Intersecting (not perpendicular)' }[k]; return mc({ prompt: 'How are these two lines related?', fig: D.lines(k, pick([0, 20, -25, 40])), hint: 'Parallel lines never meet. Perpendicular lines meet at a right angle.', explain: k === 'parallel' ? 'They stay the same distance apart and never meet.' : k === 'perpendicular' ? 'They cross and make square corners (90°).' : 'They cross, but not at a right angle.' }, name, ['Parallel', 'Perpendicular', 'Intersecting (not perpendicular)']); },
        () => { const c = pick([['the two rails of a train track', 'Parallel'], ['the corner where a wall meets the floor', 'Perpendicular'], ['the lines on notebook paper', 'Parallel'], ['the two hands of a clock at 3:00', 'Perpendicular'], ['the letter X', 'Intersecting (not perpendicular)'], ['the edges of a ruler', 'Parallel'], ['a plus sign +', 'Perpendicular']]); return mc({ prompt: `Which word fits <b>${c[0]}</b>?`, hint: 'Do they ever meet? If they do, is it a square corner?', explain: `${c[0][0].toUpperCase() + c[0].slice(1)}: ${c[1].toLowerCase()}.` }, c[1], ['Parallel', 'Perpendicular', 'Intersecting (not perpendicular)']); },
        () => { const L = pick(['H', 'T', 'L', 'E', 'F', 'Z', 'N', 'V']); const map = { H: 1, T: 0, L: 0, E: 3, F: 1, Z: 1, N: 1, V: 0 }; return { prompt: `How many <b>pairs of parallel line segments</b> are in a capital letter <b>${L}</b>?`, answer: map[L], unit: 'pairs', hint: 'Look for segments going the same way that never meet.', explain: `${L} has ${map[L]} pair${map[L] === 1 ? '' : 's'} of parallel segments.` }; }
      ]
    },
    /* 3 */ {
      title: 'Turns & Clocks',
      skill: 'Degrees in turns, angles between clock hands',
      variants: [
        () => { const tn = pick([['a quarter turn', 90], ['a half turn', 180], ['a three-quarter turn', 270], ['a full turn', 360]]); return { prompt: `How many degrees is <b>${tn[0]}</b>?`, answer: tn[1], unit: '°', hint: 'A full turn is 360°.', explain: `${tn[0][0].toUpperCase() + tn[0].slice(1)} is ${deg(tn[1])}.` }; },
        () => { const h = pick([1, 2, 3, 4, 5, 6]); return { prompt: `What is the angle between the clock hands at <b>${h}:00</b>?`, fig: D.clockFace(h, 0), answer: h * 30, unit: '°', hint: 'The 12 numbers split 360° evenly. Each jump between numbers is 30°.', explain: `${h} jumps × 30° = ${deg(h * 30)}.` }; },
        () => { const n = pick([3, 4, 6, 8, 12]); return { prompt: `A pizza is cut into <b>${n}</b> equal slices from the centre. What angle is each slice?`, answer: 360 / n, unit: '°', hint: 'All the slices together make a full turn.', explain: `360° ÷ ${n} = ${deg(360 / n)}.` }; },
        () => { const k = pick([1, 2, 3]), dir = pick(['clockwise', 'counter-clockwise']); return { prompt: `Viraj faces north. He turns <b>${k} quarter turn${k > 1 ? 's' : ''}</b> ${dir}. How many degrees did he turn?`, answer: 90 * k, unit: '°', hint: 'One quarter turn is 90°.', explain: `${k} × 90° = ${deg(90 * k)}.` }; }
      ]
    },
    /* 4 */ {
      title: 'Read the Protractor',
      skill: 'Measure angles to the nearest 5°',
      variants: [
        () => { const a = R(3, 34) * 5; return { prompt: 'Read the protractor. What does the <b>red</b> angle measure?', fig: D.protractor(a), answer: a, unit: '°', hint: 'Start at 0 on the flat side. Follow the numbers up to where the red ray crosses.', explain: `The red ray crosses at ${deg(a)}.` }; },
        () => { const a = R(3, 34) * 5; return mc({ prompt: 'Read the protractor, then name the angle.', fig: D.protractor(a), hint: 'First read the number. Then compare with 90°.', explain: `It measures ${deg(a)}, which is ${typeOf(a).toLowerCase()}.` }, `${deg(a)}, ${typeOf(a).toLowerCase()}`, [`${deg(180 - a)}, ${typeOf(180 - a).toLowerCase()}`, `${deg(a)}, ${typeOf(a) === 'Acute' ? 'obtuse' : 'acute'}`, `${deg(a + 10)}, ${typeOf(a + 10).toLowerCase()}`]); },
        () => { const a = R(3, 16) * 5; return { prompt: `The red angle is <b>${deg(a)}</b>. How many more degrees until it is a <b>right angle</b>?`, fig: D.protractor(a), answer: 90 - a, unit: '°', hint: 'A right angle is 90°.', explain: `90° − ${deg(a)} = ${deg(90 - a)}.` }; }
      ]
    },
    /* 5 */ {
      title: 'Angle Addition',
      skill: 'Put two angles together',
      variants: [
        () => { const a = R(4, 12) * 5, b = R(4, 12) * 5, rot = pick([0, 10, 30]); return { prompt: 'Two angles share a side. What is the <b>whole</b> angle?', fig: D.angles({ rays: [rot, rot + a, rot + a + b], arcs: [{ from: rot, to: rot + a, label: deg(a), noMark: true }, { from: rot + a, to: rot + a + b, label: deg(b), noMark: true }] }), answer: a + b, unit: '°', hint: 'Add the two parts.', explain: `${deg(a)} + ${deg(b)} = ${deg(a + b)}.` }; },
        () => { const a = R(5, 20) * 3, b = R(5, 20) * 3, c = R(3, 10) * 4; return { prompt: `Three angles fit together with no gaps: <b>${deg(a)}</b>, <b>${deg(b)}</b> and <b>${deg(c)}</b>. What is the total?`, answer: a + b + c, unit: '°', hint: 'Add all three.', explain: `${a} + ${b} + ${c} = ${deg(a + b + c)}.` }; },
        () => { const a = R(5, 16) * 5, n = pick([2, 3]); return { prompt: `Viraj puts <b>${n}</b> pattern blocks together at one point. Each has a <b>${deg(a)}</b> corner. What angle do they make together?`, answer: a * n, unit: '°', hint: `${n} equal angles: multiply.`, explain: `${n} × ${deg(a)} = ${deg(a * n)}.` }; }
      ]
    },
    /* 6 */ {
      title: 'Missing Angle',
      skill: 'Use 90° and 180° to find a missing part',
      variants: [
        () => { const a = R(3, 15) * 5, rot = pick([0, 10, 20]); return { prompt: 'This is a <b>right angle</b> split into two parts. Find the missing angle.', fig: D.angles({ rays: [rot, rot + a, rot + 90], arcs: [{ from: rot, to: rot + a, label: deg(a), noMark: true }, { from: rot + a, to: rot + 90, label: '?', noMark: true }] }), answer: 90 - a, unit: '°', hint: 'The two parts add up to 90°.', explain: `90° − ${deg(a)} = ${deg(90 - a)}.` }; },
        () => { const a = R(5, 31) * 5; return { prompt: 'These angles sit on a <b>straight line</b>. Find the missing angle.', fig: D.angles({ rays: [0, a, 180], arcs: [{ from: 0, to: a, label: deg(a), noMark: true }, { from: a, to: 180, label: '?', noMark: true }], cy: 170, len: 130 }), answer: 180 - a, unit: '°', hint: 'A straight line is 180°.', explain: `180° − ${deg(a)} = ${deg(180 - a)}.` }; },
        () => { const total = R(20, 34) * 5, a = R(4, Math.floor(total / 5) - 4) * 5; return { prompt: `An angle of <b>${deg(total)}</b> is split into two parts. One part is <b>${deg(a)}</b>. What is the other part?`, answer: total - a, unit: '°', hint: 'Subtract the part you know from the whole.', explain: `${deg(total)} − ${deg(a)} = ${deg(total - a)}.` }; }
      ]
    },
    /* 7 */ {
      title: 'All the Way Around',
      skill: 'Angles around a point add to 360°',
      variants: [
        () => { const a = R(8, 20) * 5, b = R(8, 20) * 5, c = 360 - a - b; return { prompt: 'Three angles go all the way around a point. Find the missing one.', fig: D.angles({ rays: [0, a, a + b], arcs: [{ from: 0, to: a, label: deg(a), noMark: true }, { from: a, to: a + b, label: deg(b), noMark: true }, { from: a + b, to: 360, label: '?', noMark: true }] }), answer: c, unit: '°', hint: 'All the way around is 360°.', explain: `360° − ${deg(a)} − ${deg(b)} = ${deg(c)}.` }; },
        () => { const n = pick([4, 5, 6, 8, 9, 10]); return { prompt: `<b>${n}</b> equal angles fit all the way around a point. How big is each?`, answer: 360 / n, unit: '°', hint: 'Share 360° equally.', explain: `360° ÷ ${n} = ${deg(360 / n)}.` }; },
        () => { const a = R(6, 12) * 10; return { prompt: `A skateboarder spins <b>${deg(a)}</b>, then spins again the same way to finish a full turn. How many more degrees did they spin?`, answer: 360 - a, unit: '°', hint: 'A full turn is 360°.', explain: `360° − ${deg(a)} = ${deg(360 - a)}.` }; }
      ]
    },
    /* 8 */ {
      title: 'Triangle Detective',
      skill: 'Name triangles by their angles and sides',
      variants: [
        () => { const kind = pick(['Acute', 'Right', 'Obtuse']); let A, B; if (kind === 'Right') { A = 90; B = R(6, 12) * 5; } else if (kind === 'Obtuse') { A = R(20, 26) * 5; B = R(4, 8) * 5; } else { A = R(11, 16) * 5; B = R(11, 16) * 5; if (180 - A - B >= 90) B = 60; } const C = 180 - A - B; const big = Math.max(A, B, C); const rest = shuffle([A, B, C].filter((v, i, arr) => i !== arr.indexOf(big))); const order = [rest[0], rest[1], big]; return mc({ prompt: 'What kind of triangle is this?', fig: triangle(order[0], order[1], order[2], order.map(deg)), hint: 'Look at the biggest angle. Is it less than, equal to, or more than 90°?', explain: `The biggest angle is ${deg(Math.max(A, B, C))}, so it is ${kind.toLowerCase()}.` }, `${kind} triangle`, ['Acute triangle', 'Right triangle', 'Obtuse triangle']); },
        () => { const k = pick([['all three sides the same length', 'Equilateral'], ['exactly two sides the same length', 'Isosceles'], ['no sides the same length', 'Scalene']]); return mc({ prompt: `A triangle has <b>${k[0]}</b>. What is it called?`, hint: 'Equi- means equal (all). Iso- means same (two). Scalene means none.', explain: `${k[0][0].toUpperCase() + k[0].slice(1)}: ${k[1].toLowerCase()}.` }, k[1], ['Equilateral', 'Isosceles', 'Scalene']); },
        () => { return mc({ prompt: 'Can a triangle have <b>two right angles</b>?', hint: 'Try drawing two square corners on the same side. Can the other two sides ever meet?', explain: 'No. Two 90° angles already make 180°, so the sides would be parallel and never meet.' }, 'No', ['Yes', 'No']); }
      ]
    },
    /* 9 */ {
      title: 'Shape Clues',
      skill: 'Parallel sides and right angles in shapes',
      variants: [
        () => { const s = pick([['square', 2, [[0, 0], [6, 0], [6, 6], [0, 6]]], ['rectangle', 2, [[0, 0], [9, 0], [9, 5], [0, 5]]], ['parallelogram', 2, [[2, 0], [10, 0], [8, 5], [0, 5]]], ['trapezoid', 1, [[2, 0], [7, 0], [10, 5], [0, 5]]], ['kite', 0, [[4, 0], [8, 3], [4, 9], [0, 3]]]]); return { prompt: `How many <b>pairs of parallel sides</b> does this shape have?`, fig: D.figure({ shapes: [{ pts: s[2] }], alt: s[0] }), answer: s[1], unit: 'pairs', hint: 'Find sides that go in exactly the same direction.', explain: `It is a ${s[0]}, which has ${s[1]} pair${s[1] === 1 ? '' : 's'} of parallel sides.` }; },
        () => { const s = pick([['square', 4], ['rectangle', 4], ['right triangle', 1], ['regular hexagon', 0], ['parallelogram that is not a rectangle', 0]]); return { prompt: `How many <b>right angles</b> does a <b>${s[0]}</b> have?`, answer: s[1], unit: 'right angles', hint: 'Picture the shape. Count the square corners.', explain: `A ${s[0]} has ${s[1]} right angle${s[1] === 1 ? '' : 's'}.` }; },
        () => { const q = pick([['exactly one pair of parallel sides', 'Trapezoid'], ['four right angles and four equal sides', 'Square'], ['two pairs of parallel sides but no right angles', 'Parallelogram'], ['four right angles but not all sides equal', 'Rectangle']]); return mc({ prompt: `Which shape has <b>${q[0]}</b>?`, hint: 'Check each clue one at a time.', explain: `A ${q[1].toLowerCase()} has ${q[0]}.` }, q[1], ['Trapezoid', 'Square', 'Parallelogram', 'Rectangle']); }
      ]
    },
    /* 10 */ {
      title: 'Boss Level',
      skill: 'Triangles add to 180° and multi-step angles',
      variants: [
        () => { const A = R(6, 16) * 5, B = R(6, 20) * 5; if (A + B >= 175) return levels[9].variants[0](); const C = 180 - A - B; return { prompt: 'The angles in <b>any triangle</b> add to <b>180°</b>. Find the missing angle.', fig: triangle(A, B, C, [deg(A), deg(B), '?']), answer: C, unit: '°', hint: 'Add the two angles you know, then subtract from 180°.', explain: `${deg(A)} + ${deg(B)} = ${deg(A + B)}. 180° − ${deg(A + B)} = ${deg(C)}.` }; },
        () => { const B = R(6, 15) * 5; return { prompt: `A <b>right triangle</b> has one angle of <b>${deg(B)}</b>. What is the third angle?`, fig: triangle(90, B, 90 - B, ['90°', deg(B), '?']), answer: 90 - B, unit: '°', hint: 'The right angle is 90°. All three add to 180°.', explain: `180° − 90° − ${deg(B)} = ${deg(90 - B)}.` }; },
        () => { const h = pick([1, 2, 4, 5]), m = 30; const hr = (h % 12) * 30 + 15, mn = 180; let d = Math.abs(mn - hr); if (d > 180) d = 360 - d; return { prompt: `At <b>${h}:30</b> the hour hand is halfway between ${h} and ${h + 1}. What is the <b>smaller</b> angle between the hands?`, fig: D.clockFace(h, m), answer: d, unit: '°', hint: 'Each number jump is 30°, so half a jump is 15°.', explain: `The minute hand is on 6. The hour hand is halfway between ${h} and ${h + 1}. That is ${deg(d)} apart.` }; },
        () => { const a = R(4, 10) * 5, total = 180, n = pick([2, 3]); const rest = total - a * n; return { prompt: `On a straight line there are <b>${n}</b> angles of <b>${deg(a)}</b> each, and one more angle. How big is the last angle?`, answer: rest, unit: '°', hint: `${n} × ${deg(a)} first, then use 180°.`, explain: `${n} × ${deg(a)} = ${deg(a * n)}. 180° − ${deg(a * n)} = ${deg(rest)}.` }; }
      ]
    }
  ];

  (window.VQ_TOPICS = window.VQ_TOPICS || []).push({
    id: 'angles',
    area: 'geo',
    name: 'Angles & Lines',
    blurb: 'Angle types, protractors, turns, parallel and perpendicular.',
    grade: 'Grade 4 → 5',
    icon: 'angle',
    live: true,
    levels
  });
})();
