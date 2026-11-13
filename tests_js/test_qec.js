// Node tests for the browser decoders: `node tests_js/test_qec.js`
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const QEC = require('../web/js/qec.js');
const data = f => JSON.parse(fs.readFileSync(path.join(__dirname, '../web/data', f)));
const fixtures = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures.json')));
let checks = 0;
const ok = (c, m) => { assert.ok(c, m); checks++; };

for (const d of [3, 5]) {
  const code = QEC.buildCode(data(`layout_d${d}.json`));
  const model = QEC.loadModel(data(`capacity_d${d}.json`));
  const n = d * d;

  // every single-qubit Pauli is corrected by MWPM, and the leftover is a stabilizer
  for (let q = 0; q < n; q++) for (const pauli of [1, 2, 3]) {
    const e = new Uint8Array(n); e[q] = pauli;
    const r = QEC.residual(code, e, QEC.mwpm(code, QEC.syndrome(code, e)).correction);
    ok(r.clean && r.ok, `d=${d} single ${pauli} on ${q}`);
  }
  // a full logical operator is invisible and flips the logical qubit
  const lx = new Uint8Array(n); code.layout.logical_x.forEach(q => { lx[q] = 1; });
  ok(QEC.syndrome(code, lx).every(v => !v), 'logical X has no syndrome');
  ok(QEC.logicalClass(code, lx)[0] === 1 && QEC.logicalClass(code, lx)[1] === 0, 'logical X flips logical Z only');

  // against PyMatching: identical matching weight; against PyTorch: identical logits
  let worst = 0, agree = 0;
  for (const f of fixtures[d]) {
    const m = QEC.mwpm(code, f.syndrome);
    ok(Math.abs(m.weight - f.weight) < 1e-6, `d=${d} matching weight ${m.weight} vs PyMatching ${f.weight}`);
    const corrSynd = QEC.syndrome(code, m.correction);
    ok(corrSynd.every((v, i) => v === f.syndrome[i]), 'correction reproduces the syndrome');
    const logits = QEC.forward(model, QEC.syndromeGrid(code, f.syndrome));
    for (let k = 0; k < 2; k++) worst = Math.max(worst, Math.abs(logits[k] - f.logits[k]));
    const net = QEC.neural(code, model, f.syndrome, m);
    ok(QEC.syndrome(code, net.correction).every((v, i) => v === f.syndrome[i]), 'network correction reproduces the syndrome');
    const cls = QEC.logicalClass(code, net.correction);
    ok(cls[0] === (f.logits[0] > 0 ? 1 : 0) && cls[1] === (f.logits[1] > 0 ? 1 : 0), 'network correction has the predicted class');
    if (cls[0] === f.labels[0] && cls[1] === f.labels[1]) agree++;
  }
  ok(worst < 2e-3, `d=${d} logits differ from PyTorch by ${worst}`);
  console.log(`d=${d}: ${fixtures[d].length} fixtures, max |logit difference| = ${worst.toExponential(2)}, network correct on ${agree}`);

  // deterministic RNG and consistent Monte Carlo bookkeeping
  const rand = QEC.mulberry32(123); let fails = 0;
  for (let i = 0; i < 300; i++) {
    const e = QEC.randomErrors(code, 0.08, rand), s = QEC.syndrome(code, e), b = QEC.mwpm(code, s);
    const r = QEC.residual(code, e, b.correction);
    ok(r.clean, 'residual is always syndrome-free'); fails += r.ok ? 0 : 1;
  }
  ok(fails > 0 && fails < 150, `plausible MWPM failure count ${fails}/300 at p=8%`);
}
console.log(`${checks} checks passed`);
