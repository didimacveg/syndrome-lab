// Results page: every number shown here is read from data/results.json, nothing is typed by hand.
(function () {
  'use strict';
  I18N.add({
    'r.tag': ['MEASURED · CPU ONLY · ALL SEEDS SHOWN', 'MEDIDO · SOLO CPU · TODAS LAS SEMILLAS'],
    'r.h1': ['Does the network beat <em>matching</em>?', '¿Gana la red al <em>emparejamiento</em>?'],
    'r.lead': ['Rotated surface code, memory experiment, circuit-level SI1000 noise. Every decoder sees exactly the same test shots. The answer depends on the size of the code.', 'Código de superficie rotado, experimento de memoria, ruido de circuito SI1000. Todos los decodificadores ven exactamente los mismos disparos de test. La respuesta depende del tamaño del código.'],
    'hero.honest2': ['This reproduces, at small scale, a pattern already known from the literature (AlphaQubit and others). It is not a new result. Networks here are thousands of times smaller than the published ones and were trained for at most a couple of CPU-hours each.', 'Esto reproduce, a pequeña escala, un patrón ya conocido en la literatura (AlphaQubit y otros). No es un resultado nuevo. Las redes son miles de veces más pequeñas que las publicadas y se entrenaron como mucho un par de horas de CPU cada una.'],
    'r.head.h': ['The short version', 'La versión corta'],
    'r.head.p': ['Logical errors of the best network divided by those of MWPM, at a physical error rate of {p}. Below 1 the network wins. Above 1 it loses.', 'Errores lógicos de la mejor red divididos entre los de MWPM, con una tasa de error físico de {p}. Por debajo de 1 gana la red. Por encima, pierde.'],
    'r.head.note': ['Brackets: 95% paired bootstrap interval, failures pooled over training seeds.', 'Entre corchetes: intervalo bootstrap emparejado al 95 %, fallos agregados sobre las semillas de entrenamiento.'],
    'r.tile': ['distance {d} · {net} vs MWPM', 'distancia {d} · {net} frente a MWPM'], 'r.win': ['network wins', 'gana la red'], 'r.lose': ['network loses', 'pierde la red'], 'r.tie': ['no significant difference', 'sin diferencia significativa'],
    'r.main.h': ['Logical error rate against physical error rate', 'Tasa de error lógico frente a tasa de error físico'],
    'r.main.p': ['Lower is better. Shaded bands are 95% Wilson intervals. Faint dots are individual training seeds. Hover or tap for values.', 'Más bajo es mejor. Las bandas son intervalos de Wilson al 95 %. Los puntos tenues son semillas individuales. Pasa el cursor o toca para ver los valores.'],
    'r.corr': ['Correlated matching', 'Emparej. correlacionado'], 'r.vs': ['against', 'frente a'],
    'r.ratio.h': ['Head to head, on the same shots', 'Cara a cara, con los mismos disparos'],
    'r.ratio.p': ['The ratio removes most of the sampling noise, because both decoders are scored on identical shots.', 'El cociente elimina casi todo el ruido de muestreo, porque ambos decodificadores se puntúan con disparos idénticos.'],
    'r.ratio.read': ['How to read it', 'Cómo leerlo'], 'r.ratio.how': ['Each point is p_L(network) / p_L(baseline). The dashed line at 1 is a tie. If the vertical bar does not touch 1, the difference is statistically significant at that noise level.', 'Cada punto es p_L(red) / p_L(referencia). La línea discontinua en 1 es un empate. Si la barra vertical no toca el 1, la diferencia es estadísticamente significativa a ese nivel de ruido.'],
    'r.th.h': ['Threshold', 'Umbral'],
    'r.th.p': ['Below the threshold, a bigger code is a better code. Above it, a bigger code is worse. The threshold is where the curves of different distances cross.', 'Por debajo del umbral, un código más grande es mejor. Por encima, es peor. El umbral es donde se cruzan las curvas de distintas distancias.'],
    'r.th.t': ['Crossing points (SI1000)', 'Puntos de cruce (SI1000)'],
    'r.th.note': ['With distances this small the crossings are biased and move with the pair of distances chosen. They are estimates of a finite-size crossing, not of the asymptotic threshold. Published SI1000 thresholds with matching sit around 0.45 to 0.5%. A network whose large-distance curve is still under-trained shows an artificially low crossing: that is a statement about training budget, not about the code.', 'Con distancias tan pequeñas los cruces están sesgados y cambian según el par de distancias. Son estimaciones de un cruce a tamaño finito, no del umbral asintótico. Los umbrales publicados para SI1000 con emparejamiento rondan el 0,45–0,5 %. Una red cuya curva de distancia grande está poco entrenada muestra un cruce artificialmente bajo: eso habla del presupuesto de entrenamiento, no del código.'],
    'r.gen.h': ['Noise the networks never saw', 'Ruido que las redes nunca vieron'],
    'r.gen.p': ['Networks were trained on SI1000 only. Here the chip suffers uniform depolarizing noise instead. MWPM appears twice: told the new noise (informed), and still using the old SI1000 weights (uninformed), which is the fair comparison for an untouched network.', 'Las redes se entrenaron solo con SI1000. Aquí el chip sufre ruido despolarizante uniforme. MWPM aparece dos veces: informado del ruido nuevo, y usando todavía los pesos de SI1000 (no informado), que es la comparación justa para una red sin reentrenar.'],
    'r.uninf': ['MWPM, uninformed', 'MWPM no informado'],
    'r.rounds.h': ['More rounds than in training (recurrent model only)', 'Más rondas que en el entrenamiento (solo el modelo recurrente)'],
    'r.rounds.p': ['The recurrent model reuses the same weights every round, so it can be run for longer than it was trained. Trained with d rounds, tested with d, 2d and 4d rounds at p = 0.3%.', 'El modelo recurrente reutiliza los mismos pesos en cada ronda, así que puede ejecutarse más tiempo del entrenado. Entrenado con d rondas, probado con d, 2d y 4d rondas a p = 0,3 %.'],
    'r.lat.h': ['Latency on one CPU core', 'Latencia en un núcleo de CPU'],
    'r.lat.p': ['Time to decode one shot. A superconducting chip produces a syndrome round roughly every microsecond, so this is the networks’ weak point.', 'Tiempo para decodificar un disparo. Un chip superconductor produce una ronda de síndrome aproximadamente cada microsegundo, así que este es el punto débil de las redes.'],
    'r.lat.note': ['PyMatching is optimized C++. The networks run in unoptimized PyTorch on CPU, with no quantization, pruning or dedicated hardware. Published real-time neural decoders use FPGAs or GPUs. Read these numbers as “what you get for free”, not as a limit.', 'PyMatching es C++ optimizado. Las redes corren en PyTorch sin optimizar, en CPU, sin cuantización, poda ni hardware dedicado. Los decodificadores neuronales en tiempo real publicados usan FPGA o GPU. Lee estos números como «lo que sale gratis», no como un límite.'],
    'r.cap.h': ['The playground decoder', 'El decodificador del simulador'],
    'r.cap.p': ['The network on the Play page was trained for the simpler noise used there (errors on data qubits only, perfect measurement). Same protocol: same shots, three seeds.', 'La red de la página Jugar se entrenó para el ruido más simple que se usa allí (errores solo en los qubits de datos, medida perfecta). Mismo protocolo: mismos disparos, tres semillas.'],
    'r.cost.h': ['What it cost', 'Lo que costó'],
    'r.cost.p': ['Every model, including the ones that lose. Training used one CPU core per model.', 'Todos los modelos, incluidos los que pierden. Cada modelo se entrenó con un núcleo de CPU.'],
    'r.table.h': ['Full table of logical error rates', 'Tabla completa de tasas de error lógico'],
    'c.model': ['model', 'modelo'], 'c.params': ['parameters', 'parámetros'], 'c.samples': ['training shots', 'disparos de entrenamiento'], 'c.time': ['CPU time', 'tiempo de CPU'], 'c.val': ['final / MWPM at p=0.5%', 'final / MWPM a p=0,5 %'],
    'c.decoder': ['decoder', 'decodificador'], 'c.single': ['one shot at a time', 'disparo a disparo'], 'c.batch': ['batched', 'en lote'], 'c.slow': ['× MWPM', '× MWPM'],
    'c.pair': ['distances', 'distancias'], 'c.cross': ['crossing', 'cruce'], 'c.ci': ['95% interval', 'intervalo 95 %'], 'c.none': ['no crossing in range', 'sin cruce en el rango'],
    'c.rounds': ['rounds', 'rondas'], 'c.ratio': ['ratio', 'cociente'], 'c.d': ['distance', 'distancia'], 'c.sig': ['significant?', '¿significativo?'], 'c.yes': ['yes', 'sí'], 'c.no': ['no', 'no'],
    'ax.p': ['physical error rate p', 'tasa de error físico p'], 'ax.pl': ['logical error rate', 'tasa de error lógico'], 'ax.ratio': ['network / baseline', 'red / referencia'], 'ax.tie': ['tie', 'empate'],
    'ax.pq': ['error probability per qubit', 'probabilidad de error por qubit'],
    'r.pending': ['Not evaluated yet.', 'Aún sin evaluar.'],
  });
  const COL = { mwpm: '#c98500', corr: '#d55181', cnn: '#3d8bff', rt: '#199e70', mwpm_uninformed: '#c98500', corr_uninformed: '#d55181' };
  const MK = { mwpm: 'square', corr: 'diamond', cnn: 'circle', rt: 'triangle' };
  const DCOL = { 3: '#a8d4ff', 5: '#5ea3ff', 7: '#2f6fd6' };
  const NAME = () => ({ mwpm: 'MWPM', corr: I18N.t('r.corr'), cnn: 'CNN', rt: 'RT', mwpm_uninformed: I18N.t('r.uninf') });
  const $ = s => document.querySelector(s);
  const sel = { net: 'cnn', base: 'mwpm', th: 'mwpm' };
  let R = null;
  const f3 = v => v.toFixed(v < 10 ? 2 : 1), pctx = v => (v * 100).toFixed(1).replace(/\.0$/, '') + '%';
  const sci = v => v === 0 ? '0' : v >= 0.001 ? (v * 100).toFixed(v >= 0.01 ? 2 : 3) + '%' : v.toExponential(1);
  const time = s => s < 1e-6 ? (s * 1e9).toFixed(0) + ' ns' : s < 1e-3 ? (s * 1e6).toFixed(s < 1e-5 ? 1 : 0) + ' µs' : (s * 1e3).toFixed(2) + ' ms';
  const legend = (id, items) => { $(id).innerHTML = items.map(([c, n, dash]) => `<span><i style="background:${dash ? `repeating-linear-gradient(90deg,${c} 0 4px,transparent 4px 7px)` : c}"></i>${n}</span>`).join(''); };
  const series = (blk, key, extra) => { const s = blk.decoders[key]; return Object.assign({ name: NAME()[key] || key, color: COL[key], marker: MK[key.split('_')[0]], points: blk.ps.map((p, i) => ({ x: p, y: s.rate[i], lo: s.lo[i], hi: s.hi[i] })), dots: (s.seed_rates || []).flatMap(r => blk.ps.map((p, i) => ({ x: p, y: r[i] }))).filter(q => q.y > 0) }, extra || {}); };
  const table = (id, head, rows) => { $(id).innerHTML = '<thead><tr>' + head.map(h => `<th>${h}</th>`).join('') + '</tr></thead><tbody>' + rows.map(r => '<tr>' + r.map(c => Array.isArray(c) ? `<td class="${c[1]}">${c[0]}</td>` : `<td>${c}</td>`).join('') + '</tr>').join('') + '</tbody>'; };
  const verdict = r => r.hi < 1 ? 'win' : r.lo > 1 ? 'lose' : '';

  function render() {
    if (!R) return;
    const ds = Object.keys(R.main), N = NAME();
    // headline tiles: best network per distance at p = 0.003
    const P0 = 0.003;
    document.querySelector('[data-i18n="r.head.p"]').innerHTML = I18N.t('r.head.p', { p: pctx(P0) });
    $('#tiles').innerHTML = ds.length ? ds.map(d => {
      const blk = R.main[d], i = blk.ps.indexOf(P0);
      const cands = ['cnn', 'rt'].filter(k => blk.ratio[k + '|mwpm']).map(k => [k, blk.ratio[k + '|mwpm'][i]]).sort((a, b) => a[1].ratio - b[1].ratio);
      if (!cands.length) return '';
      const [k, r] = cands[0], v = verdict(r);
      return `<div class="card"><h3>${I18N.t('r.tile', { d, net: N[k] })}</h3><div class="stat">${f3(r.ratio)}× <small>[${f3(r.lo)}, ${f3(r.hi)}]</small></div><div class="verdict ${v === 'win' ? 'ok' : v === 'lose' ? 'bad' : ''}" style="margin-top:10px"><b>${v === 'win' ? '✓' : v === 'lose' ? '✗' : '≈'}</b>${I18N.t(v === 'win' ? 'r.win' : v === 'lose' ? 'r.lose' : 'r.tie')}</div></div>`;
    }).join('') : `<p>${I18N.t('r.pending')}</p>`;
    // main small multiples
    legend('#leg-main', ['mwpm', 'corr', 'cnn', 'rt'].map(k => [COL[k], N[k]]));
    $('#main-charts').innerHTML = '';
    ds.forEach(d => { const c = document.createElement('div'); c.className = 'card'; $('#main-charts').appendChild(c);
      Charts.line(c, { title: `d = ${d}`, xlog: true, ylog: true, xlabel: I18N.t('ax.p'), ylabel: I18N.t('ax.pl'), xticks: [0.001, 0.002, 0.005, 0.01], fmtX: pctx,
        series: ['mwpm', 'corr', 'cnn', 'rt'].filter(k => R.main[d].decoders[k]).map(k => series(R.main[d], k)) }); });
    // ratio
    const key = sel.net + '|' + sel.base;
    const have = ds.filter(d => R.main[d].ratio[key]);
    legend('#leg-ratio', have.map(d => [DCOL[d], 'd = ' + d]));
    if (have.length) Charts.line($('#ratio-chart'), { xlog: true, ylog: true, refY: 1, refLabel: I18N.t('ax.tie'), xlabel: I18N.t('ax.p'), ylabel: I18N.t('ax.ratio'), xticks: [0.001, 0.002, 0.005, 0.01], fmtX: pctx, fmtY: v => f3(v) + '×',
      series: have.map((d, j) => ({ name: 'd = ' + d, color: DCOL[d], marker: ['circle', 'square', 'triangle'][j], bars: true, label: 'd=' + d, points: R.main[d].ps.map((p, i) => { const r = R.main[d].ratio[key][i]; return { x: p, y: r.ratio, lo: r.lo, hi: r.hi }; }).filter(q => isFinite(q.y) && q.y > 0 && q.lo > 0) })) });
    table('#ratio-table', ['p', ...have.map(d => 'd = ' + d)], (have.length ? R.main[have[0]].ps : []).map((p, i) => [pctx(p), ...have.map(d => { const r = R.main[d].ratio[key][i]; return [isFinite(r.ratio) ? `${f3(r.ratio)}× [${f3(r.lo)}, ${f3(r.hi)}]` : '–', verdict(r)]; })]));
    // threshold
    const src = d => (R.main[d] && R.main[d].decoders[sel.th]) ? R.main[d] : (R.baseline.si1000 && R.baseline.si1000[d] && R.baseline.si1000[d].decoders[sel.th] ? R.baseline.si1000[d] : null);
    const tds = ['3', '5', '7'].filter(d => src(d));
    legend('#leg-th', tds.map(d => [DCOL[d], 'd = ' + d]));
    const cr = R.crossings.filter(c => c.noise === 'si1000' && c.decoder === sel.th);
    if (tds.length) Charts.line($('#th-chart'), { xlog: true, ylog: true, xlabel: I18N.t('ax.p'), ylabel: I18N.t('ax.pl'), xticks: [0.001, 0.002, 0.005, 0.01], fmtX: pctx,
      vlines: cr.filter(c => c.p).map(c => ({ x: c.p, label: c.pair.join('–') })),
      series: tds.map((d, j) => Object.assign(series(src(d), sel.th), { name: 'd = ' + d, color: DCOL[d], marker: ['circle', 'square', 'triangle'][j], label: 'd=' + d, dots: [] })) });
    table('#th-table', [I18N.t('c.decoder'), I18N.t('c.pair'), I18N.t('c.cross'), I18N.t('c.ci')], R.crossings.filter(c => c.noise === 'si1000').map(c => [N[c.decoder], c.pair.join(' – '), c.p ? (c.p * 100).toFixed(2) + '%' : I18N.t('c.none'), c.lo ? `${(c.lo * 100).toFixed(2)}% – ${(c.hi * 100).toFixed(2)}%` : '–']));
    // generalization
    legend('#leg-gen', [[COL.mwpm, N.mwpm], [COL.mwpm, N.mwpm_uninformed, true], [COL.cnn, 'CNN'], [COL.rt, 'RT']]);
    $('#gen-charts').innerHTML = '';
    Object.keys(R.generalization).forEach(d => { const c = document.createElement('div'); c.className = 'card'; $('#gen-charts').appendChild(c); const g = R.generalization[d];
      Charts.line(c, { title: `d = ${d}`, xlog: true, ylog: true, xlabel: I18N.t('ax.p'), ylabel: I18N.t('ax.pl'), xticks: [0.002, 0.004, 0.008], fmtX: pctx,
        series: [series(g, 'mwpm'), series(g, 'mwpm_uninformed', { dash: '5 4' }), ...['cnn', 'rt'].filter(k => g.decoders[k]).map(k => series(g, k))] }); });
    const rr = []; Object.keys(R.rounds).forEach(d => R.rounds[d].forEach(pt => { const rt = Object.keys(pt.rate).filter(k => k.startsWith('rt')); const m = rt.reduce((a, k) => a + pt.rate[k], 0) / rt.length; rr.push([d, pt.rounds, sci(pt.rate.mwpm), sci(m), [f3(m / pt.rate.mwpm) + '×', m < pt.rate.mwpm ? 'win' : 'lose']]); }));
    table('#rounds-table', [I18N.t('c.d'), I18N.t('c.rounds'), 'MWPM', 'RT', 'RT / MWPM'], rr);
    // latency
    const lr = []; Object.keys(R.latency).forEach(d => Object.entries(R.latency[d]).forEach(([k, v]) => lr.push(['d = ' + d, N[k.split('_')[0]], time(v.per_shot_single), time(v.per_shot_batched), Math.round(v.per_shot_batched / R.latency[d].mwpm.per_shot_batched).toLocaleString() + '×'])));
    table('#lat-table', ['', I18N.t('c.decoder'), I18N.t('c.single'), I18N.t('c.batch'), I18N.t('c.slow')], lr);
    // capacity
    $('#cap-charts').innerHTML = '';
    Object.keys(R.capacity).forEach(d => { const c = document.createElement('div'); c.className = 'card'; $('#cap-charts').appendChild(c);
      Charts.line(c, { title: `d = ${d}`, ylog: true, xlabel: I18N.t('ax.pq'), ylabel: I18N.t('ax.pl'), fmtX: v => (v * 100).toFixed(0) + '%', xname: 'p',
        series: [series(R.capacity[d], 'mwpm'), Object.assign(series(R.capacity[d], 'cnn'), { name: 'CNN' })] });
      const i = R.capacity[d].ps.indexOf(0.08), r = R.capacity[d].ratio['cnn|mwpm'][i]; const p = document.createElement('p'); p.className = 'small'; p.style.margin = '8px 0 0'; p.textContent = `p = 8%: CNN / MWPM = ${f3(r.ratio)}× [${f3(r.lo)}, ${f3(r.hi)}]`; c.appendChild(p); });
    // cost
    table('#cost-table', [I18N.t('c.model'), I18N.t('c.params'), I18N.t('c.samples'), I18N.t('c.time'), I18N.t('c.val')], R.models.map(m => { const last = m.curve.length ? m.curve[m.curve.length - 1][1] : NaN; return [`${N[m.kind]} · d=${m.distance} · s${m.seed}`, m.parameters.toLocaleString(), (m.samples / 1e6).toFixed(1) + ' M', (m.train_seconds / 60).toFixed(0) + ' min' + (m.resumed_at.length ? ' *' : ''), [`${sci(last)} / ${sci(m.val_mwpm)}`, last < m.val_mwpm ? 'win' : 'lose']]; }));
    const rows = []; ds.forEach(d => R.main[d].ps.forEach((p, i) => rows.push(['d = ' + d, pctx(p), ...['mwpm', 'corr', 'cnn', 'rt'].map(k => { const s = R.main[d].decoders[k]; return s ? `${sci(s.rate[i])} [${sci(s.lo[i])}, ${sci(s.hi[i])}]` : '–'; })])));
    table('#full-table', ['', 'p', 'MWPM', N.corr, 'CNN', 'RT'], rows);
    document.querySelectorAll('.seg[id^=sel-] button').forEach(b => b.setAttribute('aria-pressed', sel[b.parentNode.id.slice(4)] === b.dataset.v));
  }

  document.addEventListener('DOMContentLoaded', async () => {
    document.querySelectorAll('.seg[id^=sel-] button').forEach(b => b.addEventListener('click', () => { sel[b.parentNode.id.slice(4)] = b.dataset.v; render(); }));
    I18N.listeners.push(render);
    R = await fetch('data/results.json').then(r => r.json());
    window.SLR = { R, sel, render };
    render(); document.body.dataset.ready = '1';
  });
})();
