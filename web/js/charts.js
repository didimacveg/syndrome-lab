// Minimal SVG line charts with log axes, confidence bands, markers and a hover crosshair. No dependencies.
(function () {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const el = (tag, attrs, parent, text) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (text !== undefined) e.textContent = text; if (parent) parent.appendChild(e); return e; };
  const MARK = {
    circle: (x, y, r) => `M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`,
    square: (x, y, r) => `M${x - r * .9} ${y - r * .9}h${r * 1.8}v${r * 1.8}h${-r * 1.8}Z`,
    diamond: (x, y, r) => `M${x} ${y - r * 1.25}L${x + r * 1.25} ${y}L${x} ${y + r * 1.25}L${x - r * 1.25} ${y}Z`,
    triangle: (x, y, r) => `M${x} ${y - r * 1.2}L${x + r * 1.15} ${y + r * .9}L${x - r * 1.15} ${y + r * .9}Z`,
  };
  const pct = v => v >= 0.1 ? (v * 100).toFixed(1) + '%' : v >= 0.001 ? (v * 100).toFixed(2) + '%' : (v * 100).toPrecision(2) + '%';
  function logTicks(lo, hi) { const t = []; for (let e = Math.floor(Math.log10(lo)); e <= Math.ceil(Math.log10(hi)); e++) for (const m of [1, 2, 5]) { const v = m * 10 ** e; if (v >= lo * .999 && v <= hi * 1.001) t.push(v); } return t; }
  function linTicks(lo, hi, n) { const step = (hi - lo) / n, mag = 10 ** Math.floor(Math.log10(step)), s = [1, 2, 2.5, 5, 10].map(m => m * mag).find(m => m >= step); const t = []; for (let v = Math.ceil(lo / s) * s; v <= hi + 1e-12; v += s) t.push(+v.toPrecision(10)); return t; }

  // o: {series:[{name,color,marker,dash,points:[{x,y,lo,hi,extra}]}], xlog, ylog, xlabel, ylabel, title, refY, refLabel,
  //     vlines:[{x,label}], fmtX, fmtY, height, ymin, ymax}
  function line(container, o) {
    container.classList.add('chart'); container.textContent = '';
    const W = 520, H = o.height || 330, L = 54, R = 14, T = o.title ? 28 : 12, B = 40;
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': o.title || o.ylabel || 'chart' }, container);
    const pts = o.series.flatMap(s => s.points).filter(p => p.y > 0 || !o.ylog);
    const xs = pts.map(p => p.x), ys = pts.flatMap(p => [p.y, p.lo > 0 ? p.lo : p.y, p.hi || p.y]);
    if (o.refY) ys.push(o.refY);
    let x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = o.ymin ?? Math.min(...ys), y1 = o.ymax ?? Math.max(...ys);
    if (o.ylog) { y0 /= 1.25; y1 *= 1.25; } else { const pad = (y1 - y0) * .08 || .1; y0 -= pad; y1 += pad; }
    const fx = o.xlog ? Math.log : v => v, fy = o.ylog ? Math.log : v => v;
    const px = o.xlog ? .06 * (fx(x1) - fx(x0)) : .03 * (x1 - x0);
    const X = v => L + (fx(v) - fx(x0) + px) / (fx(x1) - fx(x0) + 2 * px) * (W - L - R);
    const Y = v => H - B - (fy(v) - fy(y0)) / (fy(y1) - fy(y0)) * (H - T - B);
    const fmtX = o.fmtX || (v => (v * 100).toFixed(1).replace(/\.0$/, '') + '%'), fmtY = o.fmtY || pct;
    if (o.title) el('text', { x: L, y: 15, class: 'title' }, svg, o.title);
    let yt = o.ylog ? logTicks(y0, y1) : linTicks(y0, y1, 5);
    if (o.ylog && yt.length > 8) yt = yt.filter(v => /^1/.test(v.toExponential()));
    yt.forEach(v => { el('line', { x1: L, x2: W - R, y1: Y(v), y2: Y(v), class: 'gridl' }, svg); el('text', { x: L - 7, y: Y(v) + 4, 'text-anchor': 'end' }, svg, fmtY(v)); });
    const xt = o.xticks || (o.xlog ? logTicks(x0, x1) : linTicks(x0, x1, 5));
    xt.forEach(v => { el('line', { x1: X(v), x2: X(v), y1: H - B, y2: H - B + 4, class: 'axis' }, svg); el('text', { x: X(v), y: H - B + 17, 'text-anchor': 'middle' }, svg, fmtX(v)); });
    el('line', { x1: L, x2: W - R, y1: H - B, y2: H - B, class: 'axis' }, svg);
    if (o.xlabel) el('text', { x: (L + W - R) / 2, y: H - 5, 'text-anchor': 'middle' }, svg, o.xlabel);
    if (o.ylabel) el('text', { x: 12, y: (T + H - B) / 2, 'text-anchor': 'middle', transform: `rotate(-90 12 ${(T + H - B) / 2})` }, svg, o.ylabel);
    if (o.refY) { el('line', { x1: L, x2: W - R, y1: Y(o.refY), y2: Y(o.refY), stroke: '#6b7a8d', 'stroke-dasharray': '4 4' }, svg); if (o.refLabel) el('text', { x: W - R - 2, y: Y(o.refY) - 5, 'text-anchor': 'end' }, svg, o.refLabel); }
    (o.vlines || []).forEach((v, vi) => { if (!(v.x >= x0 && v.x <= x1)) return; el('line', { x1: X(v.x), x2: X(v.x), y1: T, y2: H - B, stroke: v.color || '#5ec8ff', 'stroke-dasharray': '2 4', opacity: .8 }, svg); if (v.label) el('text', { x: X(v.x) + 4, y: T + 10 + 13 * vi, fill: '#a3b1c2' }, svg, v.label).setAttribute('style', 'fill:#a3b1c2'); });
    o.series.forEach(s => {
      const p = s.points.filter(q => q.y > 0 || !o.ylog);
      const band = p.filter(q => q.hi !== undefined && q.lo !== undefined);
      if (band.length > 1 && !s.bars) {
        const up = band.map(q => `${X(q.x)} ${Y(q.hi)}`), dn = band.slice().reverse().map(q => `${X(q.x)} ${Y(Math.max(q.lo, o.ylog ? y0 : -1e9))}`);
        el('path', { d: 'M' + up.concat(dn).join('L') + 'Z', fill: s.color, opacity: .13 }, svg);
      }
      if (s.bars) band.forEach(q => el('line', { x1: X(q.x), x2: X(q.x), y1: Y(q.lo), y2: Y(q.hi), stroke: s.color, 'stroke-width': 1.5, opacity: .7 }, svg));
      if (p.length > 1) el('path', { d: 'M' + p.map(q => `${X(q.x)} ${Y(q.y)}`).join('L'), fill: 'none', stroke: s.color, 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-dasharray': s.dash || '' }, svg);
      (s.dots || []).forEach(q => el('circle', { cx: X(q.x), cy: Y(q.y), r: 2, fill: s.color, opacity: .45 }, svg));
      p.forEach(q => el('path', { d: MARK[s.marker || 'circle'](X(q.x), Y(q.y), 4), fill: s.color, stroke: '#0c1118', 'stroke-width': 1.5 }, svg));
      if (s.label && p.length) { const q = p[0]; el('text', { x: X(q.x) + 8, y: Y(q.y) - 8, 'text-anchor': 'start' }, svg, s.label).setAttribute('style', 'fill:#e6edf5;font-weight:600'); }
    });
    // hover layer: crosshair snaps to the nearest x, tooltip lists every series there
    const tip = document.createElement('div'); tip.className = 'tip'; container.appendChild(tip);
    const cross = el('line', { y1: T, y2: H - B, stroke: '#5ec8ff', opacity: 0, 'stroke-width': 1 }, svg);
    const allX = [...new Set(xs)].sort((a, b) => a - b);
    const hit = el('rect', { x: L, y: T, width: W - L - R, height: H - T - B, fill: 'transparent' }, svg);
    const move = ev => {
      const r = svg.getBoundingClientRect(), cx = ((ev.touches ? ev.touches[0].clientX : ev.clientX) - r.left) / r.width * W;
      const x = allX.reduce((a, b) => Math.abs(X(b) - cx) < Math.abs(X(a) - cx) ? b : a);
      cross.setAttribute('x1', X(x)); cross.setAttribute('x2', X(x)); cross.setAttribute('opacity', .5);
      tip.innerHTML = `<div><b>${o.xname || 'p'} = ${fmtX(x)}</b></div>` + o.series.map(s => { const q = s.points.find(k => k.x === x); return q ? `<div><span><i class="dot" style="background:${s.color}"></i>${s.name}</span><b>${fmtY(q.y)}${q.lo !== undefined ? ` <span style="color:#6b7a8d;font-weight:400">[${fmtY(q.lo)}, ${fmtY(q.hi)}]</span>` : ''}</b></div>` : ''; }).join('');
      tip.classList.add('on');
      const left = X(x) / W * r.width; tip.style.left = Math.max(0, Math.min(r.width - tip.offsetWidth, left + (left > r.width / 2 ? -tip.offsetWidth - 12 : 12))) + 'px'; tip.style.top = (T / H * r.height) + 'px';
    };
    const leave = () => { tip.classList.remove('on'); cross.setAttribute('opacity', 0); };
    hit.addEventListener('mousemove', move); hit.addEventListener('mouseleave', leave);
    hit.addEventListener('touchstart', move, { passive: true }); hit.addEventListener('touchmove', move, { passive: true }); hit.addEventListener('touchend', leave);
    return svg;
  }
  window.Charts = { line, pct };
})();
