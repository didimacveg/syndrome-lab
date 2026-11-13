// Draws a surface-code lattice into an SVG element. Shared by the playground and the content cards.
(function () {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const el = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };
  const LETTER = ['', 'X', 'Z', 'Y'];

  function plaquettePath(code, s) {
    if (s.support.length === 4) return `M${s.x - 1} ${s.y - 1}h2v2h-2Z`;
    const [a, b] = s.support.map(q => code.layout.data[q]);
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
    const cross = (b[0] - a[0]) * (s.y - my) - (b[1] - a[1]) * (s.x - mx);
    return `M${a[0]} ${a[1]}A1 1 0 0 ${cross < 0 ? 1 : 0} ${b[0]} ${b[1]}Z`;
  }

  // Draws one lattice. o: {errors, synd, correction, chains, logical:[bool,bool], interactive}
  function draw(svg, code, o) {
    const d = code.d, m = 1.25;
    svg.setAttribute('viewBox', `${-m} ${-m} ${2 * d + 2 * m} ${2 * d + 2 * m}`);
    svg.textContent = '';
    code.layout.stabs.forEach((s, i) => {
      const lit = o.synd && o.synd[i];
      el('path', { d: plaquettePath(code, s), class: `plaq ${s.type}${lit ? ' lit' : ''}` }, svg);
      if (s.support.length === 4) el('text', { x: s.x, y: s.y, class: 'plabel' }, svg).textContent = s.type;
    });
    if (o.logical) { // leftover logical operator: draw the representative string across the chip
      const lay = code.layout;
      [[o.logical[0], lay.logical_x], [o.logical[1], lay.logical_z]].forEach(([on, sup]) => {
        if (!on) return;
        const a = lay.data[sup[0]], b = lay.data[sup[sup.length - 1]];
        const ext = (p, q) => [p[0] + (p[0] - q[0]) / (2 * d - 2) * 0.9, p[1] + (p[1] - q[1]) / (2 * d - 2) * 0.9];
        const A = ext(a, b), B = ext(b, a);
        el('path', { d: `M${A[0]} ${A[1]}L${B[0]} ${B[1]}`, class: 'logical' }, svg);
      });
    }
    if (o.chains) for (const type of ['Z', 'X']) for (const c of o.chains[type]) {
      const pts = [[code.layout.stabs[c.from].x, code.layout.stabs[c.from].y], ...c.qubits.map(q => code.layout.data[q])];
      if (c.to !== null) pts.push([code.layout.stabs[c.to].x, code.layout.stabs[c.to].y]);
      else { const n = pts.length, a = pts[n - 1], b = pts[n - 2]; pts.push([a[0] + (a[0] - b[0]) * 0.8, a[1] + (a[1] - b[1]) * 0.8]); }
      el('path', { d: 'M' + pts.map(p => p.join(' ')).join('L'), class: `chain ${type}` }, svg);
    }
    code.layout.data.forEach(([x, y], q) => {
      const e = o.errors ? o.errors[q] : 0;
      const g = el('g', { class: `qubit${e ? ' e' + e : ''}`, 'data-q': q }, svg);
      if (o.interactive) { g.setAttribute('tabindex', '0'); g.setAttribute('role', 'button'); g.setAttribute('aria-label', `qubit ${q}${e ? ', ' + LETTER[e] + ' error' : ''}`); }
      el('circle', { cx: x, cy: y, r: o.interactive ? .62 : .5, fill: 'transparent' }, g); // generous hit target
      el('circle', { cx: x, cy: y, r: .36, class: 'body' }, g);
      if (e) el('text', { x, y: y + .02 }, g).textContent = LETTER[e];
      const c = o.correction ? o.correction[q] : 0;
      if (c) el('circle', { cx: x, cy: y, r: .52, class: `ring c${c}` }, g);
    });
  }

  window.Lattice = { draw, plaquettePath };
})();
