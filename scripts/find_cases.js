// Search (with the same decoders the browser runs) for small example errors for the playground presets.
const fs = require('fs');
const path = require('path');
const QEC = require('../web/js/qec.js');
const dir = path.join(__dirname, '../web/data');
const out = [];
for (const d of [3, 5]) {
  const code = QEC.buildCode(JSON.parse(fs.readFileSync(path.join(dir, `layout_d${d}.json`))));
  const model = QEC.loadModel(JSON.parse(fs.readFileSync(path.join(dir, `capacity_d${d}.json`))));
  const mid = (d * d - 1) / 2;
  const single = new Uint8Array(d * d); single[mid] = 1;
  const y = new Uint8Array(d * d); y[mid] = 3;
  out.push({ d, kind: 'single', errors: Array.from(single) }, { d, kind: 'y', errors: Array.from(y) });
  const rand = QEC.mulberry32(2026 + d), best = {};
  for (let i = 0, used = 0; i < 400000 && used < (d === 3 ? 6000 : 2500); i++) {
    const e = QEC.randomErrors(code, d === 3 ? 0.25 : 0.14, rand), w = e.reduce((a, v) => a + (v ? 1 : 0), 0);
    if (w < 2 || w > (d === 3 ? 3 : 5)) continue;
    used++;
    const s = QEC.syndrome(code, e), b = QEC.mwpm(code, s);
    const m = QEC.residual(code, e, b.correction).ok, n = QEC.residual(code, e, QEC.neural(code, model, s, b).correction).ok;
    const kind = !m && n ? 'nnwin' : m && !n ? 'mwpmwin' : !m && !n ? 'both' : null;
    // prefer the lightest example, and among those the one with most Y errors for "network wins"
    const score = w * 10 - (kind === 'nnwin' ? e.reduce((a, v) => a + (v === 3 ? 1 : 0), 0) : 0);
    if (kind && (!best[kind] || score < best[kind].score)) best[kind] = { score, errors: Array.from(e) };
  }
  for (const kind of ['nnwin', 'mwpmwin', 'both']) if (best[kind]) out.push({ d, kind, errors: best[kind].errors });
}
fs.writeFileSync(path.join(dir, 'cases.json'), JSON.stringify(out));
console.log(out.map(c => `d=${c.d} ${c.kind}: ${c.errors.join('')}`).join('\n'));
