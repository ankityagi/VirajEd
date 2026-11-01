/* Tiny SVG helper for drawing labelled math figures.
   Shapes use "unit" coordinates (y grows downward); the figure is scaled to fit. */
window.Draw = (function () {
  const VW = 340, VH = 230, PAD = 46;

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function inside(pt, poly) {
    let c = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i], [xj, yj] = poly[j];
      if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) c = !c;
    }
    return c;
  }

  // Labels are collected as objects first so overlapping ones can be nudged apart.
  function text(x, y, t, anchor, nx = 0, ny = 0) { return { x, y, t: String(t), anchor, nx, ny }; }
  function box(l) {
    const w = l.t.length * 8.6 + 4, h = 18;
    const x0 = l.anchor === 'start' ? l.x : l.anchor === 'end' ? l.x - w : l.x - w / 2;
    return [x0, l.y - h / 2, x0 + w, l.y + h / 2];
  }
  const hit = (a, b) => a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];
  function settle(list) {
    for (let pass = 0; pass < 6; pass++) {
      let moved = false;
      for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
        if (!hit(box(list[i]), box(list[j]))) continue;
        const m = list[j].nx || list[j].ny ? list[j] : list[i];
        m.x += (m.nx || 0) * 8; m.y += (m.ny || 1) * 8; moved = true;
      }
      if (!moved) break;
    }
    return list.map(l => {
      const q = l.t.includes('?');
      return `<text class="lbl${q ? ' q' : ''}" x="${l.x.toFixed(1)}" y="${l.y.toFixed(1)}" text-anchor="${l.anchor}" dominant-baseline="middle">${esc(l.t)}</text>`;
    }).join('');
  }

  function edgeLabel(a, b, t, P, inward) {
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
    let nx = -dy / L, ny = dx / L;
    if (inside([mx + nx * 3, my + ny * 3], P) !== !!inward) { nx = -nx; ny = -ny; }
    if (Math.abs(nx) > 0.85) return text(mx + nx * 8, my, t, nx > 0 ? 'start' : 'end', nx, ny);
    if (Math.abs(ny) > 0.85) return text(mx, my + ny * 14, t, 'middle', nx, ny);
    return text(mx + nx * 10, my + ny * 10, t, nx > 0.3 ? 'start' : nx < -0.3 ? 'end' : 'middle', nx, ny);
  }

  /* spec = {
       shapes: [{ pts: [[x,y],...], labels: [edge0, edge1, ...], cls, inward }],  inward: labels inside
       segs:   [{ a:[x,y], b:[x,y], label }]        dashed helper lines (heights)
       rights: [[corner, p1, p2]]                    right-angle marks
       alt:    'description for screen readers'
     } */
  function figure(spec) {
    const shapes = spec.shapes || [], segs = spec.segs || [], rights = spec.rights || [];
    const all = shapes.flatMap(s => s.pts).concat(segs.flatMap(s => [s.a, s.b]));
    const xs = all.map(p => p[0]), ys = all.map(p => p[1]);
    const minx = Math.min(...xs), maxx = Math.max(...xs), miny = Math.min(...ys), maxy = Math.max(...ys);
    const sc = Math.min((VW - 2 * PAD) / Math.max(maxx - minx, 1e-6), (VH - 2 * PAD) / Math.max(maxy - miny, 1e-6));
    const ox = (VW - (maxx - minx) * sc) / 2, oy = (VH - (maxy - miny) * sc) / 2;
    const T = p => [ox + (p[0] - minx) * sc, oy + (p[1] - miny) * sc];

    let body = '';
    const labels = [];
    shapes.forEach(s => {
      const P = s.pts.map(T);
      body += `<polygon class="sh ${s.cls || ''}" points="${P.map(p => p.map(n => n.toFixed(1)).join(',')).join(' ')}"/>`;
      (s.labels || []).forEach((t, i) => {
        if (t == null || t === '') return;
        labels.push(edgeLabel(P[i], P[(i + 1) % P.length], t, P, s.inward));
      });
    });
    segs.forEach(s => {
      const a = T(s.a), b = T(s.b);
      body += `<line class="seg" x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}"/>`;
      if (s.label) labels.push(text((a[0] + b[0]) / 2 + 7, (a[1] + b[1]) / 2, s.label, 'start', 1, 0));
    });
    rights.forEach(([c, p1, p2]) => {
      const C = T(c), A = T(p1), B = T(p2);
      const u = (P, Q) => { const d = Math.hypot(Q[0] - P[0], Q[1] - P[1]) || 1; return [(Q[0] - P[0]) / d * 10, (Q[1] - P[1]) / d * 10]; };
      const u1 = u(C, A), u2 = u(C, B);
      body += `<path class="ra" d="M${C[0] + u1[0]},${C[1] + u1[1]} L${C[0] + u1[0] + u2[0]},${C[1] + u1[1] + u2[1]} L${C[0] + u2[0]},${C[1] + u2[1]}"/>`;
    });
    let vl = '';
    if (spec.vlabels && shapes[0]) {
      const P = shapes[0].pts.map(T), cx = P.reduce((a, p) => a + p[0], 0) / P.length, cy = P.reduce((a, p) => a + p[1], 0) / P.length;
      spec.vlabels.forEach(({ at, text: s2 }) => {
        // push the label along the corner's bisector; thin corners need more room
        const i = shapes[0].pts.findIndex(p => p[0] === at[0] && p[1] === at[1]);
        const [x, y] = T(at), A = P[(i + P.length - 1) % P.length], B = P[(i + 1) % P.length];
        const u = q => { const d = Math.hypot(q[0] - x, q[1] - y) || 1; return [(q[0] - x) / d, (q[1] - y) / d]; };
        const ua = u(A), ub = u(B);
        let bx = ua[0] + ub[0], by = ua[1] + ub[1]; const bl = Math.hypot(bx, by) || 1; bx /= bl; by /= bl;
        const half = Math.acos(Math.max(-1, Math.min(1, ua[0] * ub[0] + ua[1] * ub[1]))) / 2;
        let dist = Math.min(80, 24 + 13 / Math.max(Math.sin(half), 0.05));
        if (half > (50 * Math.PI) / 180) dist = -20; // very wide corner: label just outside
        vl += `<text class="lbl ang" x="${(x + bx * dist).toFixed(1)}" y="${(y + by * dist).toFixed(1)}" text-anchor="middle" dominant-baseline="middle">${esc(s2)}</text>`;
      });
    }
    return `<svg viewBox="0 0 ${VW} ${VH}" role="img" aria-label="${esc(spec.alt || 'Figure')}">${body}${settle(labels)}${vl}</svg>`;
  }

  /* ---------- data displays ---------- */
  const W = 340;
  const svg = (h, body, alt) => `<svg viewBox="0 0 ${W} ${h}" role="img" aria-label="${esc(alt || 'Graph')}">${body}</svg>`;
  const t = (x, y, s, cls, anchor = 'middle') => `<text class="${cls}" x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="${anchor}" dominant-baseline="middle">${esc(s)}</text>`;

  // Bar graph. vals[i] === null draws a dashed "?" bar.
  function bars({ cats, vals, step, max, title, alt }) {
    const H = 250, L = 46, Rm = 10, T = title ? 30 : 14, B = 32, pw = W - L - Rm, ph = H - T - B;
    const y = v => T + ph - (v / max) * ph;
    let b = title ? t(W / 2, 12, title, 'ttl') : '';
    for (let v = 0; v <= max; v += step) {
      b += `<line class="gl" x1="${L}" x2="${W - Rm}" y1="${y(v)}" y2="${y(v)}"/>` + t(L - 7, y(v), v, 'tk', 'end');
    }
    const n = cats.length, bw = (pw / n) * 0.58;
    cats.forEach((c, i) => {
      const cx = L + (pw * (i + 0.5)) / n;
      if (vals[i] == null) {
        const hh = ph * 0.35;
        b += `<rect class="bar miss" x="${cx - bw / 2}" y="${T + ph - hh}" width="${bw}" height="${hh}"/>` + t(cx, T + ph - hh / 2, '?', 'qm');
      } else {
        b += `<rect class="bar" x="${(cx - bw / 2).toFixed(1)}" y="${y(vals[i]).toFixed(1)}" width="${bw.toFixed(1)}" height="${(T + ph - y(vals[i])).toFixed(1)}"/>`;
      }
      b += t(cx, H - B + 17, c, 'tk');
    });
    b += `<line class="ax" x1="${L}" x2="${W - Rm}" y1="${T + ph}" y2="${T + ph}"/><line class="ax" x1="${L}" x2="${L}" y1="${T}" y2="${T + ph}"/>`;
    return svg(H, b, alt || title);
  }

  // Line plot: X marks stacked above each tick.
  function linePlot({ labels, counts, title, alt }) {
    const top = Math.max(...counts, 3), H = 70 + top * 19 + (title ? 18 : 0), base = H - 34, L = 26, Rm = 26;
    const x = i => L + ((W - L - Rm) * i) / (labels.length - 1);
    let b = title ? t(W / 2, 12, title, 'ttl') : '';
    b += `<line class="ax" x1="${L - 14}" x2="${W - Rm + 14}" y1="${base}" y2="${base}"/>`;
    labels.forEach((lab, i) => {
      b += `<line class="ax" x1="${x(i)}" x2="${x(i)}" y1="${base - 6}" y2="${base + 6}"/>` + t(x(i), base + 21, lab, 'tkf');
      for (let k = 0; k < counts[i]; k++) b += t(x(i), base - 17 - k * 19, '×', 'xm');
    });
    return svg(H, b, alt || title);
  }

  // Picture graph: rows of icons, n may end in .5 (half icon).
  function picto({ rows, key, title, alt }) {
    const rowH = 36, T = title ? 34 : 14, H = T + rows.length * rowH + 34, L = 84, r = 11, gap = 27;
    let b = title ? t(W / 2, 12, title, 'ttl') : '';
    rows.forEach((row, i) => {
      const cy = T + i * rowH + rowH / 2;
      b += t(L - 10, cy, row.label, 'tk', 'end');
      b += `<line class="gl" x1="${L}" x2="${W - 8}" y1="${cy + rowH / 2}" y2="${cy + rowH / 2}"/>`;
      const full = Math.floor(row.n);
      for (let k = 0; k < full; k++) b += `<circle class="ico" cx="${L + r + 4 + k * gap}" cy="${cy}" r="${r}"/>`;
      if (row.n - full >= 0.5) {
        const cx = L + r + 4 + full * gap;
        b += `<path class="ico" d="M${cx},${cy - r} A${r},${r} 0 0 0 ${cx},${cy + r} Z"/>`;
      }
    });
    const ky = H - 16;
    b += `<circle class="ico" cx="${L + r + 4}" cy="${ky}" r="${r - 2}"/>` + t(L + r + 20, ky, `= ${key}`, 'tk key', 'start');
    return svg(H, b, alt || title);
  }

  // Fraction bars: rows of equal parts, first `shaded` parts filled.
  function fracBars({ rows, alt }) {
    const L = rows.some(r => r.label) ? 64 : 14, Rm = 14, rowH = 40, gap = 14, H = 16 + rows.length * (rowH + gap);
    let b = '';
    rows.forEach((r, i) => {
      const y = 12 + i * (rowH + gap), w = (W - L - Rm) / r.parts;
      if (r.label) b += t(L - 10, y + rowH / 2, r.label, 'tkf', 'end');
      for (let k = 0; k < r.parts; k++) {
        b += `<rect class="fb${k < r.shaded ? ' on' : ''}" x="${(L + k * w).toFixed(1)}" y="${y}" width="${w.toFixed(1)}" height="${rowH}"/>`;
      }
    });
    return svg(H, b, alt || 'Fraction bars');
  }

  /* ---------- angles ---------- */
  const rad = d => (d * Math.PI) / 180;
  const at = (cx, cy, r, d) => [cx + r * Math.cos(rad(d)), cy - r * Math.sin(rad(d))];
  const n1 = v => v.toFixed(1);
  const ARROW = '<defs><marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="ahd" d="M0,0 L10,5 L0,10 z"/></marker></defs>';
  function seg(a, b, cls, arrowEnd, arrowStart) {
    return `<line class="${cls}" x1="${n1(a[0])}" y1="${n1(a[1])}" x2="${n1(b[0])}" y2="${n1(b[1])}"${arrowEnd ? ' marker-end="url(#ah)"' : ''}${arrowStart ? ' marker-start="url(#ah)"' : ''}/>`;
  }
  function arcPath(cx, cy, r, a1, a2, cls = 'arc') {
    const [x1, y1] = at(cx, cy, r, a1), [x2, y2] = at(cx, cy, r, a2);
    return `<path class="${cls}" d="M${n1(x1)},${n1(y1)} A${r},${r} 0 ${a2 - a1 > 180 ? 1 : 0} 0 ${n1(x2)},${n1(y2)}"/>`;
  }
  function rightMark(cx, cy, a, s = 14) {
    const p1 = at(cx, cy, s, a), p2 = at(cx, cy, s, a + 90), c = [p1[0] + p2[0] - cx, p1[1] + p2[1] - cy];
    return `<path class="arcmk" d="M${n1(p1[0])},${n1(p1[1])} L${n1(c[0])},${n1(c[1])} L${n1(p2[0])},${n1(p2[1])}"/>`;
  }

  /* rays: directions in degrees (counter-clockwise from east).
     arcs: [{ from, to, label }] drawn between two directions (from < to). */
  function angles({ rays, arcs = [], cx = 170, cy = 125, len = 100, alt }) {
    let b = ARROW;
    rays.forEach(d => { b += seg([cx, cy], at(cx, cy, len, d), 'ray', true); });
    arcs.forEach((a, i) => {
      const r = 30 + (i % 2) * 14, span = a.to - a.from;
      b += Math.abs(span - 90) < 0.01 && !a.noMark ? rightMark(cx, cy, a.from) : arcPath(cx, cy, r, a.from, a.to);
      if (a.label) { const [x, y] = at(cx, cy, r + (span < 40 ? 34 : 22), (a.from + a.to) / 2); b += t(x, y, a.label, 'angl'); }
    });
    b += `<circle class="vtx" cx="${cx}" cy="${cy}" r="4"/>`;
    return svg(250, b, alt || 'Angle');
  }

  // Protractor with a 0° baseline ray and one ray at `deg`.
  function protractor(deg) {
    const cx = 170, cy = 200, R = 150;
    let b = ARROW + `<path class="prot" d="M${cx - R},${cy} A${R},${R} 0 0 1 ${cx + R},${cy} Z"/>`;
    for (let d = 0; d <= 180; d += 5) {
      const inner = d % 10 ? R - 7 : R - 12;
      b += seg(at(cx, cy, R, d), at(cx, cy, inner, d), 'tick');
      if (d % 10 === 0) { const [x, y] = at(cx, cy, R - 24, d); b += t(x, y, d, 'ptk'); }
    }
    b += seg([cx, cy], at(cx, cy, R + 14, 0), 'ray', true) + seg([cx, cy], at(cx, cy, R + 14, deg), 'ray hl', true);
    b += `<circle class="vtx" cx="${cx}" cy="${cy}" r="4"/>`;
    return svg(230, b, 'Protractor');
  }

  function clockFace(h, m) {
    const cx = 170, cy = 120, R = 100;
    let b = `<circle class="clk" cx="${cx}" cy="${cy}" r="${R}"/>`;
    for (let k = 1; k <= 12; k++) { const [x, y] = at(cx, cy, R - 18, 90 - k * 30); b += t(x, y, k, 'tkf'); }
    for (let k = 0; k < 60; k++) b += seg(at(cx, cy, R, 90 - k * 6), at(cx, cy, k % 5 ? R - 4 : R - 8, 90 - k * 6), 'tick');
    const ha = 90 - (h % 12) * 30 - m * 0.5, ma = 90 - m * 6;
    b += seg([cx, cy], at(cx, cy, 52, ha), 'hand hr') + seg([cx, cy], at(cx, cy, 80, ma), 'hand');
    b += `<circle class="vtx" cx="${cx}" cy="${cy}" r="5"/>`;
    return svg(240, b, `Clock showing ${h}:${String(m).padStart(2, '0')}`);
  }

  // kind: segment | ray | line | parallel | perpendicular | intersecting
  function lines(kind, rot = 0) {
    const cx = 170, cy = 115;
    const P = (d, r) => at(cx, cy, r, d);
    let b = ARROW;
    const dot = (p, lab, off) => `<circle class="vtx" cx="${n1(p[0])}" cy="${n1(p[1])}" r="4.5"/>` + (lab ? t(p[0] + off[0], p[1] + off[1], lab, 'tkf') : '');
    if (kind === 'segment' || kind === 'ray' || kind === 'line') {
      const a = P(rot + 180, 120), z = P(rot, 120), A = P(rot + 180, 80), B = P(rot, 80);
      if (kind === 'segment') b += seg(A, B, 'ray') + dot(A, 'A', [0, -16]) + dot(B, 'B', [0, -16]);
      if (kind === 'ray') b += seg(A, z, 'ray', true) + dot(A, 'A', [0, -16]) + dot(B, 'B', [0, -16]);
      if (kind === 'line') b += seg(a, z, 'ray', true, true) + dot(A, 'A', [0, -16]) + dot(B, 'B', [0, -16]);
    } else if (kind === 'parallel') {
      const off = at(0, 0, 34, rot + 90);
      [-1, 1].forEach(sg => { const dx = off[0] * sg, dy = off[1] * sg; b += seg([P(rot + 180, 120)[0] + dx, P(rot + 180, 120)[1] + dy], [P(rot, 120)[0] + dx, P(rot, 120)[1] + dy], 'ray', true, true); });
    } else {
      const second = kind === 'perpendicular' ? rot + 90 : rot + pick2([40, 55, 125, 140]);
      b += seg(P(rot + 180, 120), P(rot, 120), 'ray', true, true) + seg(P(second + 180, 95), P(second, 95), 'ray', true, true);
      if (kind === 'perpendicular') b += rightMark(cx, cy, rot);
    }
    return svg(230, b, 'Lines');
  }
  const pick2 = a => a[Math.floor(Math.random() * a.length)];

  return { figure, bars, linePlot, picto, fracBars, angles, protractor, clockFace, lines };
})();
