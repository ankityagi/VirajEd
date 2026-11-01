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
    return `<svg viewBox="0 0 ${VW} ${VH}" role="img" aria-label="${esc(spec.alt || 'Figure')}">${body}${settle(labels)}</svg>`;
  }

  return { figure };
})();
