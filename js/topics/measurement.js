/* Topic: Measurement & Area
   Pitched at Grade 4 with a stretch: Level 1 already uses 2-digit sides,
   and the last levels reach into Grade 5–6 ideas (triangles, scaling, square yards).

   Every level has several question "variants". Each variant is a function that
   returns a fresh random question, so a retry never repeats the same numbers.

   Question shape:
     { prompt, fig?, answer:number, unit?, hint, explain }               typed answer
     { prompt, fig?, choices:[...], answer:index, hint, explain }         multiple choice */
(function () {
  const R = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const fmt = n => n.toLocaleString('en-US');
  const F = Draw.figure;

  // rectangle; labels go top, right, bottom, left
  const rect = (w, h, labels, cls) => ({ pts: [[0, 0], [w, 0], [w, h], [0, h]], labels, cls });

  // L-shape: W×H with a nw×nh corner missing. Edge order:
  // 0 top (W-nw), 1 notch down (nh), 2 notch across (nw), 3 right (H-nh), 4 bottom (W), 5 left (H)
  function lShape(W, H, nw, nh) {
    let pts = [[0, 0], [W - nw, 0], [W - nw, nh], [W, nh], [W, H], [0, H]];
    if (Math.random() < 0.5) pts = pts.map(([x, y]) => [W - x, y]);
    if (Math.random() < 0.5) pts = pts.map(([x, y]) => [x, H - y]);
    return pts;
  }
  function randL() {
    const W = R(9, 16), H = R(7, 13);
    return { W, H, nw: R(3, W - 4), nh: R(2, H - 3) };
  }
  // U-shape: W×H with a g×d slot cut from the top, starting a from the left. Edge order:
  // 0 a, 1 d, 2 g, 3 d, 4 W-a-g, 5 H (right), 6 W, 7 H (left)
  function uShape(W, H, a, g, d) {
    return [[0, 0], [a, 0], [a, d], [a + g, d], [a + g, 0], [W, 0], [W, H], [0, H]];
  }

  // Pythagorean triples, so slanted "distractor" sides have exact lengths
  const triples = [[3, 4, 5], [6, 8, 10], [9, 12, 15], [5, 12, 13], [8, 15, 17]];

  const levels = [
    /* 1 */ {
      title: 'Area Warm-Up',
      skill: 'Area of rectangles and squares with 2-digit sides',
      variants: [
        () => {
          const u = pick(['cm', 'm', 'in', 'ft']), w = R(8, 16); let h = R(4, 12); if (h === w) h--;
          return {
            prompt: 'Find the <b>area</b> of this rectangle.',
            fig: F({ shapes: [rect(w, h, [`${w} ${u}`, `${h} ${u}`])], alt: `Rectangle ${w} by ${h} ${u}` }),
            answer: w * h, unit: `sq ${u}`,
            hint: 'Area = length × width.',
            explain: `${w} × ${h} = ${w * h} sq ${u}.`
          };
        },
        () => {
          const u = pick(['cm', 'm', 'in']), s = R(7, 14);
          return {
            prompt: 'This shape is a <b>square</b>. Only one side is labelled. Find its area.',
            fig: F({ shapes: [rect(s, s, [`${s} ${u}`])], alt: `Square with side ${s} ${u}` }),
            answer: s * s, unit: `sq ${u}`,
            hint: 'All 4 sides of a square are the same length.',
            explain: `Every side is ${s} ${u}, so the area is ${s} × ${s} = ${s * s} sq ${u}.`
          };
        },
        () => {
          const w = R(7, 13), h = R(5, 9);
          return {
            prompt: `A bathroom floor is covered with square tiles. The floor is <b>${w} tiles long</b> and <b>${h} tiles wide</b>. How many tiles are there?`,
            answer: w * h, unit: 'tiles',
            hint: 'Each row has the same number of tiles. How many rows are there?',
            explain: `${h} rows of ${w} tiles: ${w} × ${h} = ${w * h} tiles.`
          };
        },
        () => {
          const w = R(11, 19), h = R(10, 14);
          return {
            prompt: `A poster is <b>${w} in</b> long and <b>${h} in</b> wide. What is its area?`,
            fig: F({ shapes: [rect(w, h, [`${w} in`, `${h} in`])], alt: `Poster ${w} by ${h} inches` }),
            answer: w * h, unit: 'sq in',
            hint: `Try splitting it: ${w} × ${h} = ${w} × 10 + ${w} × ${h - 10}.`,
            explain: `${w} × 10 = ${w * 10}, ${w} × ${h - 10} = ${w * (h - 10)}, total ${w * h} sq in.`
          };
        }
      ]
    },

    /* 2 */ {
      title: 'Fence or Floor?',
      skill: 'Choosing between perimeter and area in real situations',
      variants: [
        () => {
          const w = R(12, 30), h = R(6, 20), P = 2 * (w + h);
          return {
            prompt: `Viraj is putting a fence around a rectangular dog run that is <b>${w} ft</b> long and <b>${h} ft</b> wide. How many feet of fence does he need?`,
            fig: F({ shapes: [rect(w, h, [`${w} ft`, `${h} ft`])], alt: 'Dog run' }),
            answer: P, unit: 'ft',
            hint: 'A fence goes all the way around, so add up all four sides.',
            explain: `${w} + ${h} + ${w} + ${h} = ${P} ft. That is the perimeter.`
          };
        },
        () => {
          const w = R(9, 18), h = R(7, 14);
          return {
            prompt: `New carpet will cover a bedroom floor that is <b>${w} ft</b> by <b>${h} ft</b>. How many square feet of carpet are needed?`,
            fig: F({ shapes: [rect(w, h, [`${w} ft`, `${h} ft`])], alt: 'Bedroom floor' }),
            answer: w * h, unit: 'sq ft',
            hint: 'Carpet covers the whole floor. That means area.',
            explain: `${w} × ${h} = ${w * h} sq ft.`
          };
        },
        () => {
          const s = R(13, 29);
          return {
            prompt: `A square playground has sides that are <b>${s} m</b> long. Viraj jogs around it once. How far did he jog?`,
            answer: 4 * s, unit: 'm',
            hint: 'Going around once is the perimeter. A square has 4 equal sides.',
            explain: `4 × ${s} = ${4 * s} m.`
          };
        },
        () => {
          const c = pick([
            ['painting a wall', 0], ['putting a border around a bulletin board', 1],
            ['planting grass seed on a soccer field', 0], ['sewing lace along the edge of a tablecloth', 1],
            ['wrapping a gift box in paper', 0], ['putting lights along the edge of a roof', 1],
            ['tiling a kitchen floor', 0], ['building a frame for a painting', 1]
          ]);
          return {
            prompt: `Do you need <b>area</b> or <b>perimeter</b> for ${c[0]}?`,
            choices: ['Area', 'Perimeter'], answer: c[1],
            hint: 'Covering a surface means area. Going around the edge means perimeter.',
            explain: c[1] === 0 ? `You are covering the surface, so it's area.` : `You are going along the edge, so it's perimeter.`
          };
        },
        () => {
          const w = R(15, 40), h = R(10, 25), P = 2 * (w + h);
          return {
            prompt: `Ribbon goes all around the edge of a photo that is <b>${w} cm</b> by <b>${h} cm</b>. How much ribbon is needed?`,
            fig: F({ shapes: [rect(w, h, [`${w} cm`, `${h} cm`])], alt: 'Photo' }),
            answer: P, unit: 'cm',
            hint: 'Add the length and width, then double it.',
            explain: `(${w} + ${h}) × 2 = ${P} cm.`
          };
        }
      ]
    },

    /* 3 */ {
      title: 'Missing Side',
      skill: 'Work backwards from area or perimeter',
      variants: [
        () => {
          const a = R(6, 12), b = R(7, 15), A = a * b;
          return {
            prompt: `This rectangle has an area of <b>${A} sq cm</b>. Find the missing side.`,
            fig: F({ shapes: [rect(b, a, ['? cm', `${a} cm`])], alt: 'Rectangle with a missing side' }),
            answer: b, unit: 'cm',
            hint: `What number times ${a} makes ${A}?`,
            explain: `${A} ÷ ${a} = ${b} cm, because ${a} × ${b} = ${A}.`
          };
        },
        () => {
          const a = R(5, 18), b = R(6, 22), P = 2 * (a + b);
          return {
            prompt: `This rectangle has a perimeter of <b>${P} m</b>. Find the missing side.`,
            fig: F({ shapes: [rect(b, a, ['? m', `${a} m`])], alt: 'Rectangle with a missing side' }),
            answer: b, unit: 'm',
            hint: `Half of the perimeter is one length + one width.`,
            explain: `${P} ÷ 2 = ${a + b}. Then ${a + b} − ${a} = ${b} m.`
          };
        },
        () => {
          const s = R(5, 13);
          return {
            prompt: `A square has a perimeter of <b>${4 * s} in</b>. What is its <b>area</b>?`,
            answer: s * s, unit: 'sq in',
            hint: 'First find one side: perimeter ÷ 4.',
            explain: `One side is ${4 * s} ÷ 4 = ${s} in. Area = ${s} × ${s} = ${s * s} sq in.`
          };
        },
        () => {
          const s = R(6, 12);
          return {
            prompt: `A square has an area of <b>${s * s} sq ft</b>. What is its <b>perimeter</b>?`,
            answer: 4 * s, unit: 'ft',
            hint: `What number times itself makes ${s * s}?`,
            explain: `${s} × ${s} = ${s * s}, so each side is ${s} ft. Perimeter = 4 × ${s} = ${4 * s} ft.`
          };
        },
        () => {
          const w = R(4, 9), k = pick([2, 3, 4]);
          return {
            prompt: `A rectangle is <b>${k} times as long</b> as it is wide. The width is <b>${w} cm</b>. What is its area?`,
            fig: F({ shapes: [rect(w * k, w, ['? cm', `${w} cm`])], alt: 'Long rectangle' }),
            answer: w * w * k, unit: 'sq cm',
            hint: `The length is ${k} × ${w}.`,
            explain: `Length = ${k} × ${w} = ${k * w} cm. Area = ${k * w} × ${w} = ${k * w * w} sq cm.`
          };
        }
      ]
    },

    /* 4 */ {
      title: 'Unit Switch',
      skill: 'Converting ft, in, yd, m, cm and km',
      variants: [
        () => { const n = R(3, 12); return { prompt: `How many <b>inches</b> are in <b>${n} feet</b>?`, answer: n * 12, unit: 'in', hint: '1 foot = 12 inches.', explain: `${n} × 12 = ${n * 12} in.` }; },
        () => {
          if (Math.random() < 0.5) { const n = R(4, 15); return { prompt: `How many <b>feet</b> are in <b>${n} yards</b>?`, answer: n * 3, unit: 'ft', hint: '1 yard = 3 feet.', explain: `${n} × 3 = ${n * 3} ft.` }; }
          const n = R(2, 6); return { prompt: `How many <b>inches</b> are in <b>${n} yards</b>?`, answer: n * 36, unit: 'in', hint: '1 yard = 3 feet, and 1 foot = 12 inches.', explain: `1 yd = 36 in, so ${n} × 36 = ${n * 36} in.` };
        },
        () => { const m = R(2, 9), c = R(5, 95); return { prompt: `<b>${m} m ${c} cm</b> = how many centimetres?`, answer: m * 100 + c, unit: 'cm', hint: '1 metre = 100 centimetres.', explain: `${m} × 100 = ${m * 100}, plus ${c} = ${m * 100 + c} cm.` }; },
        () => { const f = R(4, 6), i = R(1, 11); return { prompt: `Viraj's dad is <b>${f} ft ${i} in</b> tall. How tall is that in <b>inches</b>?`, answer: f * 12 + i, unit: 'in', hint: 'Change the feet to inches, then add the extra inches.', explain: `${f} × 12 = ${f * 12}, plus ${i} = ${f * 12 + i} in.` }; },
        () => { const k = R(2, 7), m = R(1, 19) * 50; return { prompt: `A bike trail is <b>${k} km ${m} m</b> long. How many <b>metres</b> is that?`, answer: k * 1000 + m, unit: 'm', hint: '1 kilometre = 1,000 metres.', explain: `${k} × 1,000 = ${fmt(k * 1000)}, plus ${m} = ${fmt(k * 1000 + m)} m.` }; },
        () => {
          const wf = R(2, 5), hi = R(10, 22), wi = wf * 12, P = 2 * (wi + hi);
          return {
            prompt: `A shelf is <b>${wf} ft</b> long and <b>${hi} in</b> deep. What is its perimeter in <b>inches</b>?`,
            fig: F({ shapes: [rect(wi, hi, [`${wf} ft`, `${hi} in`])], alt: 'Shelf' }),
            answer: P, unit: 'in',
            hint: 'Change feet to inches first, so both sides use the same unit.',
            explain: `${wf} ft = ${wi} in. Perimeter = (${wi} + ${hi}) × 2 = ${P} in.`
          };
        },
        () => {
          const wf = R(2, 3), hi = R(6, 11), wi = wf * 12;
          return {
            prompt: `A rug is <b>${wf} ft</b> by <b>${hi} in</b>. What is its area in <b>square inches</b>?`,
            fig: F({ shapes: [rect(wi, hi, [`${wf} ft`, `${hi} in`])], alt: 'Rug' }),
            answer: wi * hi, unit: 'sq in',
            hint: 'You can only multiply sides that are in the same unit.',
            explain: `${wf} ft = ${wi} in. Area = ${wi} × ${hi} = ${wi * hi} sq in.`
          };
        }
      ]
    },

    /* 5 */ {
      title: 'L-Shapes',
      skill: 'Area of shapes made from rectangles',
      variants: [
        () => {
          const { W, H, nw, nh } = randL(), A = W * H - nw * nh;
          return {
            prompt: 'Find the <b>area</b> of this shape. All corners are right angles.',
            fig: F({ shapes: [{ pts: lShape(W, H, nw, nh), labels: [`${W - nw} m`, `${nh} m`, `${nw} m`, `${H - nh} m`, `${W} m`, `${H} m`] }], alt: 'L-shaped figure' }),
            answer: A, unit: 'sq m',
            hint: 'Split it into two rectangles. Or find the big rectangle and take away the missing corner.',
            explain: `Big rectangle ${W} × ${H} = ${W * H}. Missing corner ${nw} × ${nh} = ${nw * nh}. ${W * H} − ${nw * nh} = ${A} sq m.`
          };
        },
        () => {
          const { W, H, nw, nh } = randL(), A = W * H - nw * nh;
          return {
            prompt: 'A room has this floor plan. How many square feet of flooring are needed?',
            fig: F({ shapes: [{ pts: lShape(W, H, nw, nh), labels: [`${W - nw} ft`, `${nh} ft`, `${nw} ft`, `${H - nh} ft`, `${W} ft`, `${H} ft`] }], alt: 'L-shaped room' }),
            answer: A, unit: 'sq ft',
            hint: 'Draw a line to cut the room into two rectangles.',
            explain: `One way: ${W - nw} × ${H} = ${(W - nw) * H}, plus ${nw} × ${H - nh} = ${nw * (H - nh)}. Total ${A} sq ft.`
          };
        },
        () => {
          const W = R(12, 18), H = R(7, 12), g = R(3, 5), a = R(3, W - g - 4), d = R(2, H - 3), A = W * H - g * d;
          return {
            prompt: 'A slot was cut out of the top of this rectangle. Find the <b>area</b> of what is left.',
            fig: F({ shapes: [{ pts: uShape(W, H, a, g, d), labels: [`${a} cm`, `${d} cm`, `${g} cm`, null, `${W - a - g} cm`, `${H} cm`, `${W} cm`] }], alt: 'U-shaped figure' }),
            answer: A, unit: 'sq cm',
            hint: 'Find the whole rectangle, then subtract the slot.',
            explain: `${W} × ${H} = ${W * H}. Slot: ${g} × ${d} = ${g * d}. ${W * H} − ${g * d} = ${A} sq cm.`
          };
        }
      ]
    },

    /* 6 */ {
      title: 'Hidden Sides',
      skill: 'Figure out unlabelled sides before you solve',
      variants: [
        () => {
          const { W, H, nw, nh } = randL(), P = 2 * (W + H);
          return {
            prompt: 'Two sides are not labelled. Find the <b>perimeter</b>.',
            fig: F({ shapes: [{ pts: lShape(W, H, nw, nh), labels: [`${W - nw} cm`, null, null, `${H - nh} cm`, `${W} cm`, `${H} cm`] }], alt: 'L-shape with two unlabelled sides' }),
            answer: P, unit: 'cm',
            hint: 'The short top piece plus the hidden side across must equal the long bottom side.',
            explain: `Hidden across: ${W} − ${W - nw} = ${nw}. Hidden down: ${H} − ${H - nh} = ${nh}. Add all six: ${W - nw} + ${nh} + ${nw} + ${H - nh} + ${W} + ${H} = ${P} cm.`
          };
        },
        () => {
          const { W, H, nw, nh } = randL();
          const askAcross = Math.random() < 0.5;
          const labels = [`${W - nw} ft`, `${nh} ft`, askAcross ? '? ft' : `${nw} ft`, askAcross ? `${H - nh} ft` : '? ft', `${W} ft`, `${H} ft`];
          return {
            prompt: 'Find the length of the side marked <b>?</b>',
            fig: F({ shapes: [{ pts: lShape(W, H, nw, nh), labels }], alt: 'L-shape with one missing side' }),
            answer: askAcross ? nw : H - nh, unit: 'ft',
            hint: 'Look for the side on the opposite edge that is made of the same pieces.',
            explain: askAcross ? `${W} − ${W - nw} = ${nw} ft.` : `${H} − ${nh} = ${H - nh} ft.`
          };
        },
        () => {
          const { W, H, nw, nh } = randL(), A = W * H - nw * nh;
          return {
            prompt: 'Two sides are not labelled. Find the <b>area</b>.',
            fig: F({ shapes: [{ pts: lShape(W, H, nw, nh), labels: [`${W - nw} m`, null, null, `${H - nh} m`, `${W} m`, `${H} m`] }], alt: 'L-shape with two unlabelled sides' }),
            answer: A, unit: 'sq m',
            hint: 'First work out the size of the missing corner.',
            explain: `Missing corner is ${W - (W - nw)} × ${H - (H - nh)} = ${nw * nh}. ${W} × ${H} − ${nw * nh} = ${A} sq m.`
          };
        },
        () => {
          const W = R(12, 18), H = R(7, 12), g = R(3, 5), a = R(3, W - g - 4), d = R(2, H - 3), P = 2 * W + 2 * H + 2 * d;
          return {
            prompt: 'Find the <b>perimeter</b> of this shape. Watch out for the sides inside the slot.',
            fig: F({ shapes: [{ pts: uShape(W, H, a, g, d), labels: [`${a} in`, `${d} in`, `${g} in`, null, `${W - a - g} in`, `${H} in`, `${W} in`] }], alt: 'U-shaped figure' }),
            answer: P, unit: 'in',
            hint: 'Both walls of the slot have the same depth. Count every edge you would walk along.',
            explain: `Outside: ${W} + ${H} + ${H} + ${a} + ${W - a - g} = ${W + 2 * H + W - g}. Slot: ${d} + ${g} + ${d} = ${2 * d + g}. Total ${P} in.`
          };
        }
      ]
    },

    /* 7 */ {
      title: 'Shape Detective',
      skill: 'Same perimeter, different area (and the other way round)',
      variants: [
        () => {
          const k = R(5, 10), P = 4 * k;
          return {
            prompt: `A rectangle has a perimeter of <b>${P} m</b> and whole-number sides. What is the <b>greatest area</b> it can have?`,
            answer: k * k, unit: 'sq m',
            hint: 'Try a few: long and skinny, then closer to a square. Which area is biggest?',
            explain: `Length + width must be ${P / 2}. The area is biggest when the sides are equal: ${k} × ${k} = ${k * k} sq m.`
          };
        },
        () => {
          const N = pick([24, 36, 48, 40, 60]);
          const pairs = []; for (let a = 1; a * a <= N; a++) if (N % a === 0) pairs.push([a, N / a]);
          const chosen = pairs.slice(-4);
          const best = chosen.reduce((bi, p, i) => (p[0] + p[1] < chosen[bi][0] + chosen[bi][1] ? i : bi), 0);
          const order = chosen.map((_, i) => i).sort(() => Math.random() - 0.5);
          return {
            prompt: `All of these rectangles have an area of <b>${N} sq cm</b>. Which one has the <b>smallest perimeter</b>?`,
            choices: order.map(i => `${chosen[i][0]} cm × ${chosen[i][1]} cm`), answer: order.indexOf(best),
            hint: 'Work out each perimeter, or think about which one is closest to a square.',
            explain: `${chosen[best][0]} × ${chosen[best][1]} has perimeter ${2 * (chosen[best][0] + chosen[best][1])} cm, the smallest of the four.`
          };
        },
        () => {
          const a = R(7, 12), b = R(a, a + 4), c = R(2, a - 3), other = a + b - c, diff = a * b - c * other;
          return {
            prompt: `Rectangle A is <b>${a} ft × ${b} ft</b>. Rectangle B has the <b>same perimeter</b> but is only <b>${c} ft</b> wide. How much <b>more area</b> does A have?`,
            fig: F({ shapes: [rect(b, a, [`${b} ft`, `${a} ft`]), { pts: [[b + 3, 0], [b + 3 + other, 0], [b + 3 + other, c], [b + 3, c]], labels: ['? ft', `${c} ft`], cls: 'alt' }], alt: 'Two rectangles' }),
            answer: diff, unit: 'sq ft',
            hint: `A's length + width is ${a + b}. B's must be the same.`,
            explain: `B is ${c} by ${other} (since ${c} + ${other} = ${a + b}). A = ${a * b}, B = ${c * other}. ${a * b} − ${c * other} = ${diff} sq ft.`
          };
        },
        () => {
          const s = R(6, 11), off = R(1, s - 3), l = s + off, w = s - off;
          return {
            prompt: `A rectangle is <b>${l} cm × ${w} cm</b>. A square has the <b>same perimeter</b>. What is the area of the square?`,
            answer: s * s, unit: 'sq cm',
            hint: 'Find the perimeter, then divide by 4 to get one side of the square.',
            explain: `Perimeter = (${l} + ${w}) × 2 = ${4 * s}. Square side = ${4 * s} ÷ 4 = ${s}. Area = ${s * s} sq cm.`
          };
        }
      ]
    },

    /* 8 */ {
      title: 'Real-World Missions',
      skill: 'Multi-step problems: cut-outs, tiles and cost',
      variants: [
        () => {
          const W = R(12, 20), H = R(9, 14), s = R(3, Math.min(6, H - 4)), A = W * H - s * s;
          const px = R(2, W - s - 2), py = R(2, H - s - 2);
          return {
            prompt: `A garden is <b>${W} m × ${H} m</b>. In the middle there is a square pond with <b>${s} m</b> sides. How many square metres of <b>grass</b> are there?`,
            fig: F({ shapes: [rect(W, H, [`${W} m`, `${H} m`]), { pts: [[px, py], [px + s, py], [px + s, py + s], [px, py + s]], labels: [`${s} m`], cls: 'cut' }], alt: 'Garden with pond' }),
            answer: A, unit: 'sq m',
            hint: 'Grass = whole garden − pond.',
            explain: `${W} × ${H} = ${W * H}. Pond ${s} × ${s} = ${s * s}. ${W * H} − ${s * s} = ${A} sq m.`
          };
        },
        () => {
          const t = pick([2, 3]), L = t * R(4, 7), Wd = t * R(3, 5), n = (L / t) * (Wd / t);
          return {
            prompt: `A patio is <b>${L} ft × ${Wd} ft</b>. It is covered with square stones that are <b>${t} ft × ${t} ft</b>. How many stones are needed?`,
            fig: F({ shapes: [rect(L, Wd, [`${L} ft`, `${Wd} ft`])], alt: 'Patio' }),
            answer: n, unit: 'stones',
            hint: `How many stones fit along the ${L} ft side? Along the ${Wd} ft side?`,
            explain: `${L} ÷ ${t} = ${L / t} stones long, ${Wd} ÷ ${t} = ${Wd / t} stones wide. ${L / t} × ${Wd / t} = ${n} stones.`
          };
        },
        () => {
          const L = R(8, 14), Wd = R(6, 11), c = R(2, 6), cost = L * Wd * c;
          return {
            prompt: `Carpet costs <b>$${c} per square foot</b>. How much does it cost to carpet a room that is <b>${L} ft × ${Wd} ft</b>?`,
            answer: cost, unit: 'dollars',
            hint: 'Find the area first, then multiply by the price.',
            explain: `Area = ${L} × ${Wd} = ${L * Wd} sq ft. Cost = ${L * Wd} × $${c} = $${fmt(cost)}.`
          };
        },
        () => {
          const W = R(12, 18), H = R(8, 10), w = R(3, 5), h = R(3, 4), A = W * H - w * h;
          return {
            prompt: `Viraj is painting a wall that is <b>${W} ft</b> wide and <b>${H} ft</b> tall. It has a window that is <b>${w} ft × ${h} ft</b>. How many square feet will he paint?`,
            fig: F({ shapes: [rect(W, H, [`${W} ft`, `${H} ft`]), { pts: [[2, 2], [2 + w, 2], [2 + w, 2 + h], [2, 2 + h]], labels: [`${w} ft`, `${h} ft`], cls: 'cut' }], alt: 'Wall with window' }),
            answer: A, unit: 'sq ft',
            hint: "You don't paint the window.",
            explain: `${W} × ${H} = ${W * H}. Window ${w} × ${h} = ${w * h}. ${W * H} − ${w * h} = ${A} sq ft.`
          };
        },
        () => {
          const W = R(10, 20), H = R(6, 12), post = pick([2, 3]);
          const Wr = W - (W % post), Hr = H - (H % post), P = 2 * (Wr + Hr);
          return {
            prompt: `A rectangular pen is <b>${Wr} m × ${Hr} m</b>. A fence post goes at every corner and every <b>${post} m</b> along the sides. How many posts are needed?`,
            fig: F({ shapes: [rect(Wr, Hr, [`${Wr} m`, `${Hr} m`])], alt: 'Pen' }),
            answer: P / post, unit: 'posts',
            hint: 'Find the perimeter. Going all the way around, the number of gaps equals the number of posts.',
            explain: `Perimeter = ${P} m. ${P} ÷ ${post} = ${P / post} gaps, and around a loop that means ${P / post} posts.`
          };
        }
      ]
    },

    /* 9 */ {
      title: 'Triangles & Slants',
      skill: 'Triangles and parallelograms (a Grade 5–6 stretch)',
      variants: [
        () => {
          const [a, b, c] = pick(triples);
          return {
            prompt: 'Find the <b>area</b> of this right triangle.',
            fig: F({ shapes: [{ pts: [[0, 0], [0, b], [a, b]], labels: [`${b} cm`, `${a} cm`, `${c} cm`] }], rights: [[[0, b], [0, 0], [a, b]]], alt: 'Right triangle' }),
            answer: (a * b) / 2, unit: 'sq cm',
            hint: 'A right triangle is half of a rectangle. Use the two sides that meet at the square corner.',
            explain: `${a} × ${b} = ${a * b}, and half of that is ${(a * b) / 2} sq cm. The ${c} cm side is not needed.`
          };
        },
        () => {
          const [x, h, s] = pick(triples.slice(0, 3)), b = x + R(2, 8);
          return {
            prompt: 'Find the <b>area</b> of this triangle. The dashed line is the height.',
            fig: F({ shapes: [{ pts: [[0, h], [b, h], [x, 0]], labels: [`${b} m`, null, `${s} m`] }], segs: [{ a: [x, 0], b: [x, h], label: `${h} m` }], rights: [[[x, h], [x, 0], [b, h]]], alt: 'Triangle with height' }),
            answer: (b * h) / 2, unit: 'sq m',
            hint: 'Area of a triangle = base × height ÷ 2. The slanted side is a trick.',
            explain: `${b} × ${h} ÷ 2 = ${(b * h) / 2} sq m. The ${s} m side is not the height.`
          };
        },
        () => {
          const [x, h, s] = pick(triples.slice(0, 3)), b = x + R(2, 7);
          return {
            prompt: 'Find the <b>area</b> of this parallelogram.',
            fig: F({ shapes: [{ pts: [[x, 0], [x + b, 0], [b, h], [0, h]], labels: [null, null, `${b} in`, `${s} in`] }], segs: [{ a: [x, 0], b: [x, h], label: `${h} in` }], rights: [[[x, h], [x, 0], [b, h]]], alt: 'Parallelogram' }),
            answer: b * h, unit: 'sq in',
            hint: 'Slide the triangle from one end to the other and you get a rectangle. Use base × height.',
            explain: `${b} × ${h} = ${b * h} sq in. The slanted ${s} in side is not the height.`
          };
        },
        () => {
          const w = R(6, 14), h = 2 * R(3, 6);
          return {
            prompt: `A rectangle that is <b>${w} ft × ${h} ft</b> is cut corner to corner into two triangles. What is the area of <b>one</b> triangle?`,
            fig: F({ shapes: [{ pts: [[0, 0], [w, 0], [w, h]], labels: [`${w} ft`, `${h} ft`] }, { pts: [[0, 0], [w, h], [0, h]], labels: [], cls: 'alt' }], alt: 'Rectangle cut into two triangles' }),
            answer: (w * h) / 2, unit: 'sq ft',
            hint: 'The two triangles are exactly the same size.',
            explain: `Rectangle = ${w} × ${h} = ${w * h}. Half is ${(w * h) / 2} sq ft.`
          };
        }
      ]
    },

    /* 10 */ {
      title: 'Boss Level',
      skill: 'Mixed challenges: scaling, square yards, frames',
      variants: [
        () => {
          const a = R(3, 8), b = R(4, 9), k = pick([2, 3]);
          return {
            prompt: `A rectangle is <b>${a} cm × ${b} cm</b>. Both sides are made <b>${k} times longer</b>. What is the new area?`,
            answer: a * b * k * k, unit: 'sq cm',
            hint: `It is not ${k} times the area. Draw the new rectangle with its new sides.`,
            explain: `New sides: ${a * k} and ${b * k}. ${a * k} × ${b * k} = ${a * b * k * k} sq cm. That is ${k * k} times the old area.`
          };
        },
        () => {
          const L = 3 * R(3, 6), W = 3 * R(2, 4), A = (L / 3) * (W / 3);
          return {
            prompt: `A room is <b>${L} ft × ${W} ft</b>. Carpet is sold by the <b>square yard</b>. How many square yards are needed?`,
            fig: F({ shapes: [rect(L, W, [`${L} ft`, `${W} ft`])], alt: 'Room' }),
            answer: A, unit: 'sq yd',
            hint: 'Change each side to yards first (3 ft = 1 yd), then multiply.',
            explain: `${L} ft = ${L / 3} yd, ${W} ft = ${W / 3} yd. ${L / 3} × ${W / 3} = ${A} sq yd. (1 sq yd is 9 sq ft!)`
          };
        },
        () => {
          const a = R(6, 12), b = R(4, 9), k = pick([1, 2]), A = (a + 2 * k) * (b + 2 * k) - a * b;
          return {
            prompt: `A <b>${a} in × ${b} in</b> photo has a frame <b>${k} in</b> wide all the way around it. What is the area of just the <b>frame</b>?`,
            fig: F({ shapes: [rect(a + 2 * k, b + 2 * k, []), { pts: [[k, k], [k + a, k], [k + a, k + b], [k, k + b]], labels: [`${a} in`, `${b} in`], cls: 'cut', inward: true }], alt: 'Photo inside a frame' }),
            answer: A, unit: 'sq in',
            hint: `The outside of the frame is ${k} in bigger on every side, so add ${2 * k} to each side.`,
            explain: `Outside: ${a + 2 * k} × ${b + 2 * k} = ${(a + 2 * k) * (b + 2 * k)}. Photo: ${a} × ${b} = ${a * b}. Frame = ${A} sq in.`
          };
        },
        () => {
          const { W, H, nw, nh } = randL(), A = W * H - nw * nh;
          return {
            prompt: `This shape has an area of <b>${A} sq m</b>. Find the side marked <b>?</b>`,
            fig: F({ shapes: [{ pts: lShape(W, H, nw, nh), labels: [null, `${nh} m`, '? m', null, `${W} m`, `${H} m`] }], alt: 'L-shape with a missing side' }),
            answer: nw, unit: 'm',
            hint: `The whole rectangle would be ${W} × ${H}. How much area is missing?`,
            explain: `${W} × ${H} = ${W * H}. Missing: ${W * H} − ${A} = ${nw * nh}. ${nw * nh} ÷ ${nh} = ${nw} m.`
          };
        },
        () => {
          const s = R(7, 15);
          return {
            prompt: `A square rug covers <b>${s * s} sq ft</b>. Viraj sews trim around its edge. Trim costs <b>$2 per foot</b>. How much does the trim cost?`,
            answer: 4 * s * 2, unit: 'dollars',
            hint: 'Find one side, then the perimeter, then the cost.',
            explain: `Side = ${s} ft (${s} × ${s} = ${s * s}). Perimeter = ${4 * s} ft. Cost = ${4 * s} × $2 = $${8 * s}.`
          };
        }
      ]
    }
  ];

  (window.VQ_TOPICS = window.VQ_TOPICS || []).push({
    id: 'measurement',
    area: 'md',
    name: 'Measurement & Area',
    blurb: 'Area, perimeter, units and tricky shapes.',
    grade: 'Grade 4 → 6',
    icon: 'ruler',
    live: true,
    levels
  });
})();
