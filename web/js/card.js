// 1080x1350 cards and scripted scenes for images and videos. Everything is drawn from the published data.
(function () {
  'use strict';
  const q = new URLSearchParams(location.search), kind = q.get('c') || 'title';
  const root = document.getElementById('card');
  const pctx = v => (v * 100).toFixed(1).replace(/\.0$/, '') + '%', f2 = v => v.toFixed(2);
  const COL = { mwpm: '#c98500', corr: '#d55181', cnn: '#3d8bff', rt: '#199e70' }, DCOL = { 3: '#a8d4ff', 5: '#5ea3ff', 7: '#2f6fd6' };
  const frame = (n, head, sub, body, foot) => {
    root.innerHTML = `<div class="cb"><span class="brand"><i></i>SYNDROME LAB</span><span class="n">${n}</span></div>
      <div class="ch">${head}</div>${sub ? `<p class="cs">${sub}</p>` : ''}<div class="cv">${body}</div>
      <div class="cf"><span>${foot || 'Open reproduction, not new research. Built with AI assistance.'}</span><b>github.com/didimacveg/qec-lab</b></div>`;
  };
  const svg = id => `<svg class="lattice static" id="${id}"></svg>`;
  const load = async d => { const [lay, mod] = await Promise.all([fetch(`data/layout_d${d}.json`).then(r => r.json()), fetch(`data/capacity_d${d}.json`).then(r => r.json())]); return { code: QEC.buildCode(lay), model: QEC.loadModel(mod) }; };
  const decodeAll = (code, model, errors) => { const synd = QEC.syndrome(code, errors), base = QEC.mwpm(code, synd), net = QEC.neural(code, model, synd, base); return { synd, base, net, rm: QEC.residual(code, errors, base.correction), rn: QEC.residual(code, errors, net.correction) }; };
  const verdict = ok => `<div class="verdict ${ok ? 'ok' : 'bad'}"><b>${ok ? '✓' : '✗'}</b>${ok ? 'Corrected' : 'Logical error'}</div>`;
  const best = (R, d, i) => ['cnn', 'rt'].filter(k => R.main[d].ratio[k + '|mwpm']).map(k => [k, R.main[d].ratio[k + '|mwpm'][i]]).sort((a, b) => a[1].ratio - b[1].ratio)[0];
  const series = (blk, key, o) => { const s = blk.decoders[key]; return Object.assign({ name: key, color: COL[key], points: blk.ps.map((p, i) => ({ x: p, y: s.rate[i], lo: s.lo[i], hi: s.hi[i] })) }, o || {}); };

  const scenes = {
    async title() {
      const { code } = await load(5), cases = await fetch('data/cases.json').then(r => r.json());
      const e = Uint8Array.from(cases.find(c => c.d === 5 && c.kind === 'nnwin').errors);
      frame('01', 'Break a quantum chip.<br><em>Watch it heal.</em>', 'An open lab for quantum error correction: a classical decoder and a small neural network face the same errors.', svg('a'));
      Lattice.draw(document.getElementById('a'), code, { errors: e, synd: QEC.syndrome(code, e) });
    },
    async syndrome() {
      const { code } = await load(5); const e = new Uint8Array(25); e[7] = 1; e[12] = 1; e[16] = 2;
      frame('02', 'You cannot look at a qubit.<br><em>You can ask its neighbours.</em>', 'Parity checks light up at the <strong>ends</strong> of an error chain. That pattern, the syndrome, is all a decoder ever sees.', svg('a'));
      Lattice.draw(document.getElementById('a'), code, { errors: e, synd: QEC.syndrome(code, e) });
    },
    async duel() {
      const { code, model } = await load(5), cases = await fetch('data/cases.json').then(r => r.json());
      const e = Uint8Array.from(cases.find(c => c.d === 5 && c.kind === 'nnwin').errors), r = decodeAll(code, model, e);
      frame('03', 'Same errors.<br><em>Two decoders.</em>', 'Three Y errors. Matching treats each as an unrelated X and Z, and picks the wrong chain. The network learned they come together.',
        `<div class="pair"><div class="card"><h3><span class="dot" style="background:${COL.mwpm}"></span>MWPM</h3>${svg('a')}${verdict(r.rm.ok)}</div><div class="card"><h3><span class="dot" style="background:${COL.cnn}"></span>NEURAL NET</h3>${svg('b')}${verdict(r.rn.ok)}</div></div>`,
        'One hand-picked example proves nothing. The statistics are on the next card.');
      Lattice.draw(document.getElementById('a'), code, { errors: e, synd: r.synd, correction: r.base.correction, logical: r.rm.logical });
      Lattice.draw(document.getElementById('b'), code, { errors: e, synd: r.synd, correction: r.net.correction, logical: r.rn.logical });
    },
    async headline() {
      const R = await fetch('data/results.json').then(r => r.json()), i = R.main['3'].ps.indexOf(0.003);
      const tiles = Object.keys(R.main).map(d => { const [k, r] = best(R, d, i), v = r.hi < 1 ? 'ok' : r.lo > 1 ? 'bad' : ''; return `<div class="card tile"><h3>distance ${d} · ${k.toUpperCase()}</h3><div class="big">${f2(r.ratio)}×<small>[${f2(r.lo)}, ${f2(r.hi)}]</small></div><div class="verdict ${v}"><b>${v === 'ok' ? '✓' : v === 'bad' ? '✗' : '≈'}</b>${v === 'ok' ? 'network wins' : v === 'bad' ? 'network loses' : 'no clear winner'}</div></div>`; }).join('');
      frame('04', 'Does the network beat matching?<br><em>It depends on the size.</em>', `Logical errors of the best network divided by those of MWPM, at ${pctx(0.003)} physical error rate. Below 1 the network wins.`, `<div class="col"><div class="pair">${tiles}</div></div>`, 'Same test shots for both. 95% paired bootstrap intervals. CPU-only training.');
    },
    async curves() {
      const R = await fetch('data/results.json').then(r => r.json()), d = q.get('d') || '3';
      frame('05', `Distance ${d}, circuit-level noise`, 'Logical error rate against physical error rate. Lower is better. Bands are 95% intervals.', `<div class="col"><div class="legend">${['mwpm', 'corr', 'cnn', 'rt'].map(k => `<span><i style="background:${COL[k]}"></i>${{ mwpm: 'MWPM', corr: 'Correlated matching', cnn: 'CNN', rt: 'Recurrent transformer' }[k]}</span>`).join('')}</div><div id="ch" style="width:100%"></div></div>`);
      Charts.line(document.getElementById('ch'), { xlog: true, ylog: true, height: 420, xlabel: 'physical error rate p', ylabel: 'logical error rate', xticks: [0.001, 0.002, 0.005, 0.01], fmtX: pctx, series: ['mwpm', 'corr', 'cnn', 'rt'].filter(k => R.main[d].decoders[k]).map(k => series(R.main[d], k, { marker: { mwpm: 'square', corr: 'diamond', cnn: 'circle', rt: 'triangle' }[k] })) });
    },
    async threshold() {
      const R = await fetch('data/results.json').then(r => r.json()), upto = q.get('n') ? +q.get('n') : 99, cross = q.get('x') !== '0';
      const cr = R.crossings.filter(c => c.noise === 'si1000' && c.decoder === 'mwpm' && c.p);
      frame('06', 'The threshold:<br><em>where bigger stops helping.</em>', 'Below the crossing a larger code makes fewer logical errors. Above it, more. MWPM, SI1000 noise.', `<div class="col"><div class="legend">${['3', '5', '7'].map(d => `<span><i style="background:${DCOL[d]}"></i>distance ${d}</span>`).join('')}</div><div id="ch" style="width:100%"></div></div>`,
        `Finite-size crossings: ${cr.map(c => c.pair.join('–') + ' at ' + (c.p * 100).toFixed(2) + '%').join(', ')}. Not the asymptotic threshold.`);
      const full = ['3', '5', '7'].flatMap(d => series(R.baseline.si1000[d], 'mwpm').points);
      Charts.line(document.getElementById('ch'), { xlog: true, ylog: true, height: 420, xlabel: 'physical error rate p', ylabel: 'logical error rate', xticks: [0.001, 0.002, 0.005, 0.01], fmtX: pctx, ymin: Math.min(...full.map(p => p.lo)), ymax: Math.max(...full.map(p => p.hi)),
        vlines: cross ? cr.map(c => ({ x: c.p, label: c.pair.join('–') })) : [],
        series: [{ name: 'frame', color: 'transparent', points: [{ x: 0.001, y: full[0].y }, { x: 0.01, y: full[0].y }] }, ...['3', '5', '7'].map((d, j) => { const s = series(R.baseline.si1000[d], 'mwpm', { name: 'd=' + d, color: DCOL[d], marker: ['circle', 'square', 'triangle'][j] }); s.points = s.points.slice(0, upto); return s; })].filter(s => s.points.length) });
    },
    async latency() {
      const R = await fetch('data/results.json').then(r => r.json()), d = Object.keys(R.latency).sort().pop(), L = R.latency[d];
      const t = s => s < 1e-6 ? (s * 1e9).toFixed(0) + ' ns' : s < 1e-3 ? (s * 1e6).toFixed(s < 1e-5 ? 1 : 0) + ' µs' : (s * 1e3).toFixed(1) + ' ms';
      const rows = Object.entries(L).map(([k, v]) => `<div class="lat"><span><span class="dot" style="background:${COL[k.split('_')[0]]};width:16px;height:16px"></span>${{ mwpm: 'MWPM', corr: 'Correlated matching', cnn: 'CNN', rt: 'Recurrent transformer' }[k.split('_')[0]]}</span><b>${t(v.per_shot_batched)}</b></div>`).join('');
      const slow = Math.round(Math.min(...Object.entries(L).filter(([k]) => !['mwpm', 'corr'].includes(k)).map(([, v]) => v.per_shot_batched)) / L.mwpm.per_shot_batched);
      frame('07', 'The catch:<br><em>speed.</em>', `Time to decode one shot at distance ${d}, on one CPU core. A superconducting chip needs an answer about every microsecond per round.`, `<div class="col">${rows}<p class="cs" style="margin-top:20px">The fastest network here is about <strong>${slow.toLocaleString()}× slower</strong> than matching. Real-time neural decoders exist, but they run on FPGAs or GPUs, not on a laptop.</p></div>`, 'Unoptimized PyTorch on CPU versus optimized C++. Read as “what you get for free”.');
    },
    async honest() {
      frame('08', 'What this is.<br><em>What it is not.</em>', '', `<div class="col list"><div class="y"><b>✓</b><span>A reproduction of a known result, small enough to rerun on a laptop.</span></div><div class="y"><b>✓</b><span>Same noise, same test shots, several seeds, confidence intervals.</span></div><div class="y"><b>✓</b><span>Losses published next to wins.</span></div><div><b>✗</b><span>Not new research.</span></div><div><b>✗</b><span>Not real hardware: simulated noise only.</span></div><div><b>✗</b><span>Not evidence about large codes: distances 3 to 7.</span></div></div>`, 'Built by a 17-year-old student with AI assistance. Code, data and weights are open.');
    },
    // --- scripted scenes for the videos: Playwright calls window.cardStep(n) between frames -----------------
    async v_inject() {
      const { code, model } = await load(5), cases = await fetch('data/cases.json').then(r => r.json());
      const target = cases.find(c => c.d === 5 && c.kind === 'nnwin').errors, order = target.map((v, i) => [v, i]).filter(x => x[0]);
      const CAP = ['A clean chip: 25 data qubits protect one logical qubit.', 'Errors strike.', 'Errors strike.', 'Errors strike.', 'Only the parity checks can be read. This is the syndrome.', 'Each decoder proposes a correction from the syndrome alone.', 'Matching flipped the logical qubit. The network did not.'];
      frame('', 'Inject errors.<br><em>Watch two decoders.</em>', '<span id="cap"></span>', `<div class="col"><div style="flex:1;min-height:0;display:flex;justify-content:center">${svg('a')}</div><div class="pair" style="height:330px"><div class="card" style="display:flex;gap:14px;align-items:center"><div style="flex:1;height:100%">${svg('b')}</div><div style="flex:1"><h3><span class="dot" style="background:${COL.mwpm}"></span>MWPM</h3><div id="vb"></div></div></div><div class="card" style="display:flex;gap:14px;align-items:center"><div style="flex:1;height:100%">${svg('c')}</div><div style="flex:1"><h3><span class="dot" style="background:${COL.cnn}"></span>NEURAL NET</h3><div id="vc"></div></div></div></div></div>`, 'Simplest noise model: errors on data qubits, perfect checks.');
      window.cardSteps = CAP.length;
      window.cardStep = n => {
        const e = new Uint8Array(25); order.slice(0, Math.min(n, order.length)).forEach(([v, i]) => { e[i] = v; });
        const r = decodeAll(code, model, e), s = n >= 4, c = n >= 5, v = n >= 6;
        document.getElementById('cap').textContent = CAP[n];
        Lattice.draw(document.getElementById('a'), code, { errors: e, synd: s ? r.synd : null });
        Lattice.draw(document.getElementById('b'), code, { errors: v ? e : null, synd: s ? r.synd : null, correction: c ? r.base.correction : null, chains: c && !v ? r.base.chains : null, logical: v ? r.rm.logical : null });
        Lattice.draw(document.getElementById('c'), code, { errors: v ? e : null, synd: s ? r.synd : null, correction: c ? r.net.correction : null, logical: v ? r.rn.logical : null });
        document.getElementById('vb').innerHTML = v ? verdict(r.rm.ok) : ''; document.getElementById('vc').innerHTML = v ? verdict(r.rn.ok) : '';
      };
      window.cardStep(0);
    },
    async v_race() {
      const { code, model } = await load(3), rand = QEC.mulberry32(20261124), p = 0.1, N = 3000, per = 60;
      frame('', 'MWPM vs neural net:<br><em>3,000 random chips.</em>', `Distance 3, each qubit hit with probability ${pctx(p)}. Both decoders see exactly the same errors.`, `<div class="col"><div style="height:430px;display:flex;justify-content:center">${svg('a')}</div><div class="lat"><span><span class="dot" style="background:${COL.mwpm};width:16px;height:16px"></span>MWPM failures</span><b id="fm">0</b></div><div class="meter"><i id="bm" style="background:${COL.mwpm};width:0"></i></div><div class="lat"><span><span class="dot" style="background:${COL.cnn};width:16px;height:16px"></span>Neural net failures</span><b id="fn">0</b></div><div class="meter"><i id="bn" style="background:${COL.cnn};width:0"></i></div><p class="cs" id="cnt" style="margin:14px 0 0"></p></div>`, 'Runs live in the browser. Simplest noise model: errors on data qubits, perfect checks.');
      let i = 0, fm = 0, fn = 0;
      window.cardSteps = N / per + 1;
      window.cardStep = () => {
        let e = new Uint8Array(9), s = QEC.syndrome(code, e);
        for (let k = 0; k < per && i < N; k++, i++) { e = QEC.randomErrors(code, p, rand); s = QEC.syndrome(code, e); const b = QEC.mwpm(code, s); fm += !QEC.residual(code, e, b.correction).ok; fn += !QEC.residual(code, e, QEC.neural(code, model, s, b).correction).ok; }
        Lattice.draw(document.getElementById('a'), code, { errors: e, synd: s });
        document.getElementById('fm').textContent = fm; document.getElementById('fn').textContent = fn;
        document.getElementById('bm').style.width = (fm / (N * 0.12) * 100) + '%'; document.getElementById('bn').style.width = (fn / (N * 0.12) * 100) + '%';
        document.getElementById('cnt').innerHTML = `${i.toLocaleString()} chips decoded${i >= N ? `. Network / MWPM = <strong>${f2(fn / fm)}×</strong>` : ''}`;
      };
      window.cardStep();
    },
  };
  (scenes[kind] || scenes.title)().then(() => { document.body.dataset.ready = '1'; });
})();
