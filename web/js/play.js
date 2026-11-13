// Playground: click data qubits to inject Pauli errors, watch both decoders respond.
(function () {
  'use strict';
  I18N.add({
    'hero.tag': ['OPEN LAB · QUANTUM ERROR CORRECTION', 'LABORATORIO ABIERTO · CORRECCIÓN DE ERRORES CUÁNTICOS'],
    'hero.h1': ['Break a quantum chip. <em>Watch it heal.</em>', 'Rompe un chip cuántico. <em>Míralo curarse.</em>'],
    'hero.lead': ['Quantum computers make mistakes all the time. The surface code spreads one fragile qubit over many, and a classical program, the <strong>decoder</strong>, works out what went wrong. Here two decoders face the same errors: the standard algorithm (MWPM) and a small neural network.',
      'Los ordenadores cuánticos se equivocan constantemente. El código de superficie reparte un qubit frágil entre muchos, y un programa clásico, el <strong>decodificador</strong>, deduce qué ha fallado. Aquí dos decodificadores se enfrentan a los mismos errores: el algoritmo estándar (MWPM) y una red neuronal pequeña.'],
    'hero.honest': ['<strong>What this is:</strong> a rigorous, open, small-scale reproduction of known results, trained on a laptop-class CPU. <strong>What it is not:</strong> new research. Where the network loses, the numbers are published anyway.',
      '<strong>Qué es esto:</strong> una reproducción rigurosa y abierta, a pequeña escala, de resultados conocidos, entrenada en CPU. <strong>Qué no es:</strong> investigación nueva. Donde la red pierde, los números se publican igual.'],
    'play.h': ['Play with a quantum chip', 'Juega con un chip cuántico'],
    'play.sub': ['Tap the round data qubits to inject errors. The squares are parity checks: they light up when something nearby went wrong.', 'Toca los qubits de datos (círculos) para inyectar errores. Los cuadrados son comprobaciones de paridad: se encienden cuando algo ha fallado cerca.'],
    'play.random': ['Random error', 'Error aleatorio'], 'play.clear': ['Clear', 'Limpiar'], 'play.presets': ['Try:', 'Prueba:'],
    'play.replay': ['▶ Replay step by step', '▶ Repetir paso a paso'], 'play.net': ['Neural net', 'Red neuronal'],
    'leg.x': ['X error (bit flip)', 'error X (inversión de bit)'], 'leg.z': ['Z error (phase flip)', 'error Z (inversión de fase)'], 'leg.y': ['Y error (both)', 'error Y (ambos)'], 'leg.s': ['syndrome: check that fired', 'síndrome: comprobación activada'],
    'step.1': ['Errors', 'Errores'], 'step.2': ['Syndrome', 'Síndrome'], 'step.3': ['Decode', 'Decodificar'], 'step.4': ['Verdict', 'Veredicto'],
    'ex.1': ['<strong>Errors happen.</strong> {n} of the {N} data qubits got hit. On a real chip nobody can see this picture: looking at a data qubit directly would destroy the information it carries.', '<strong>Ocurren errores.</strong> {n} de los {N} qubits de datos han sufrido uno. En un chip real nadie puede ver esta imagen: mirar un qubit de datos directamente destruiría la información que guarda.'],
    'ex.2': ['<strong>Only the syndrome is visible.</strong> Each square measures the parity of its neighbours without reading them. {k} checks fired. Dark squares catch Z errors, lighter squares catch X errors. Many different errors produce this same pattern.', '<strong>Solo se ve el síndrome.</strong> Cada cuadrado mide la paridad de sus vecinos sin leerlos. Se han activado {k} comprobaciones. Muchos errores distintos producen este mismo patrón.'],
    'ex.3': ['<strong>Each decoder proposes a correction</strong> (dashed rings) from the syndrome alone. MWPM pairs up fired checks with the shortest possible chains. The network outputs how likely it is that the logical qubit was flipped.', '<strong>Cada decodificador propone una corrección</strong> (anillos discontinuos) usando solo el síndrome. MWPM empareja las comprobaciones activadas con las cadenas más cortas posibles. La red da la probabilidad de que el qubit lógico se haya invertido.'],
    'ex.4': ['<strong>Verdict.</strong> The correction does not need to equal the error. It only needs to differ from it by something harmless. If what is left over stretches across the whole chip, the logical qubit has been flipped: a logical error.', '<strong>Veredicto.</strong> La corrección no tiene que ser igual al error: basta con que difiera de él en algo inofensivo. Si lo que queda cruza el chip de lado a lado, el qubit lógico se ha invertido: un error lógico.'],
    'ex.0': ['The chip is clean. Tap a qubit, or press “Random error”.', 'El chip está limpio. Toca un qubit o pulsa «Error aleatorio».'],
    'v.ok': ['<b>✓</b> Corrected', '<b>✓</b> Corregido'], 'v.bad': ['<b>✗</b> Logical error', '<b>✗</b> Error lógico'], 'v.wait': ['waiting for step 4', 'esperando al paso 4'],
    'i.mwpm': ['{w} qubit(s) flipped, the minimum that explains the syndrome.', '{w} qubit(s) corregidos, el mínimo que explica el síndrome.'],
    'i.agree': ['Agrees with the matching.', 'Coincide con el emparejamiento.'],
    'i.over': ['Overrides the matching: it adds a logical {op} string, betting the likelier error was the longer one.', 'Corrige al emparejamiento: añade una cadena lógica {op}, apostando a que el error más probable era el largo.'],
    'p.z': ['P(logical flip by X errors)', 'P(inversión lógica por errores X)'], 'p.x': ['P(logical flip by Z errors)', 'P(inversión lógica por errores Z)'],
    'mc.h': ['Run the experiment yourself', 'Haz tú el experimento'],
    'mc.sub': ['One example proves nothing. Decoders are compared over thousands of random errors. This runs both decoders in your browser, on the same errors.', 'Un ejemplo no demuestra nada. Los decodificadores se comparan con miles de errores aleatorios. Esto ejecuta ambos en tu navegador, con los mismos errores.'],
    'mc.p': ['Error probability per qubit', 'Probabilidad de error por qubit'], 'mc.run': ['Run {n} random chips', 'Probar {n} chips aleatorios'],
    'mc.disagree': ['Where they differ', 'Dónde difieren'],
    'mc.fail': ['fail', 'fallan'], 'mc.ci': ['95% interval: {lo}% to {hi}%', 'intervalo 95 %: {lo} % a {hi} %'],
    'mc.dtext': ['Only MWPM failed: <strong>{a}</strong><br>Only the network failed: <strong>{b}</strong><br>Both failed: <strong>{c}</strong>', 'Solo falló MWPM: <strong>{a}</strong><br>Solo falló la red: <strong>{b}</strong><br>Fallaron ambos: <strong>{c}</strong>'],
    'mc.note': ['Noise here is the simplest kind: each data qubit suffers X, Y or Z with equal probability and the checks are measured perfectly. The network was trained for exactly this noise. The realistic case, with faulty gates and faulty measurements, is on the <a href="results.html">results page</a>.', 'El ruido aquí es el más sencillo: cada qubit de datos sufre X, Y o Z con igual probabilidad y las comprobaciones se miden sin fallos. La red se entrenó para este ruido exacto. El caso realista, con puertas y medidas defectuosas, está en la <a href="results.html">página de resultados</a>.'],
    'mc.count': ['{n} chips, distance {d}', '{n} chips, distancia {d}'],
    'what.h': ['What am I looking at?', '¿Qué estoy viendo?'],
    'what.1h': ['The chip', 'El chip'], 'what.1': ['A distance-d surface code: d×d data qubits hold <strong>one</strong> logical qubit. The squares are stabilizers, checks that compare neighbouring qubits without reading them.', 'Un código de superficie de distancia d: d×d qubits de datos guardan <strong>un</strong> qubit lógico. Los cuadrados son estabilizadores, comprobaciones que comparan qubits vecinos sin leerlos.'],
    'what.2h': ['MWPM', 'MWPM'], 'what.2': ['Minimum-weight perfect matching. It assumes errors are rare, so it explains the syndrome with as few errors as possible. Fast, robust, and the standard reference since 2002.', 'Emparejamiento perfecto de peso mínimo. Supone que los errores son raros y explica el síndrome con los menos errores posibles. Rápido, robusto y la referencia estándar desde 2002.'],
    'what.3h': ['The neural net', 'La red neuronal'], 'what.3': ['A small convolutional network trained on millions of simulated errors. It can learn what MWPM ignores: a Y error is one event, not an X and a Z that happen to coincide.', 'Una red convolucional pequeña entrenada con millones de errores simulados. Puede aprender lo que MWPM ignora: un error Y es un solo suceso, no un X y un Z que coinciden por casualidad.'],
    'what.more': ['Does the network actually win? It depends on the size of the code and on how much you can afford to train. See the <a href="results.html">measured results</a> and the <a href="method.html">method</a>.', '¿Gana de verdad la red? Depende del tamaño del código y de cuánto puedas entrenar. Mira los <a href="results.html">resultados medidos</a> y el <a href="method.html">método</a>.'],
    'case.single': ['one X error', 'un error X'], 'case.y': ['a Y error', 'un error Y'], 'case.nnwin': ['network wins', 'gana la red'], 'case.mwpmwin': ['MWPM wins', 'gana MWPM'], 'case.both': ['both fail', 'fallan los dos'],
  });

  const NS = 'http://www.w3.org/2000/svg';
  const el = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };
  const $ = s => document.querySelector(s);
  const LETTER = ['', 'X', 'Z', 'Y'];
  const cache = {};
  const S = { d: 3, brush: 1, step: 4, errors: null, code: null, model: null, timer: null, cases: [] };

  async function load(d) {
    if (!cache[d]) {
      const [lay, mod] = await Promise.all([fetch(`data/layout_d${d}.json`).then(r => r.json()), fetch(`data/capacity_d${d}.json`).then(r => r.json())]);
      cache[d] = { code: QEC.buildCode(lay), model: QEC.loadModel(mod) };
    }
    return cache[d];
  }

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

  function render() {
    const { code, model, errors, step } = S;
    if (!code) return;
    const synd = QEC.syndrome(code, errors);
    const n = errors.reduce((a, e) => a + (e ? 1 : 0), 0), k = synd.reduce((a, b) => a + b, 0);
    draw($('#main'), code, { errors, synd: step >= 2 ? synd : null, interactive: true });
    const base = QEC.mwpm(code, synd), net = QEC.neural(code, model, synd, base);
    const rm = QEC.residual(code, errors, base.correction), rn = QEC.residual(code, errors, net.correction);
    const panel = (id, corr, chains, res) => {
      const root = $(id);
      draw(root.querySelector('svg'), code, {
        errors: step >= 4 ? errors : null, synd: step >= 2 ? synd : null, correction: step >= 3 ? corr : null,
        chains: step === 3 ? chains : null, logical: step >= 4 ? res.logical : null });
      const v = root.querySelector('.verdict');
      v.className = 'verdict' + (step >= 4 ? (res.ok ? ' ok' : ' bad') : '');
      v.innerHTML = step >= 4 ? I18N.t(res.ok ? 'v.ok' : 'v.bad') : I18N.t('v.wait');
    };
    panel('#p-mwpm', base.correction, base.chains, rm);
    panel('#p-nn', net.correction, null, rn);
    const w = base.correction.reduce((a, c) => a + (c ? 1 : 0), 0);
    $('#p-mwpm [data-info]').innerHTML = step >= 3 ? I18N.t('i.mwpm', { w }) : '';
    const over = net.disagrees[0] || net.disagrees[1];
    $('#p-nn [data-info]').innerHTML = step >= 3 ? (over ? I18N.t('i.over', { op: [net.disagrees[0] ? 'X' : '', net.disagrees[1] ? 'Z' : ''].filter(Boolean).join('+') }) : I18N.t('i.agree')) : '';
    $('#probs').innerHTML = step >= 3 ? [['p.z', net.prob[0]], ['p.x', net.prob[1]]].map(([key, p]) =>
      `<span>${I18N.t(key)}</span><span class="bar"><i style="width:${(p * 100).toFixed(1)}%"></i></span><b>${(p * 100).toFixed(p < .1 ? 1 : 0)}%</b>`).join('') : '';
    document.querySelectorAll('#steps button').forEach(b => { const s = +b.dataset.s; b.className = s === step ? 'on' : s < step ? 'done' : ''; b.setAttribute('aria-pressed', s === step); });
    $('#explain').innerHTML = n === 0 ? I18N.t('ex.0') : I18N.t('ex.' + step, { n, N: code.n, k });
    document.querySelectorAll('#dist button').forEach(b => b.setAttribute('aria-pressed', +b.dataset.d === S.d));
    document.querySelectorAll('#brush button').forEach(b => b.setAttribute('aria-pressed', +b.dataset.b === S.brush));
    const N = S.d === 3 ? 3000 : 1000;
    $('#mcrun').textContent = I18N.t('mc.run', { n: N.toLocaleString() });
    renderPresets();
  }

  function renderPresets() {
    const box = $('#presets');
    box.querySelectorAll('button').forEach(b => b.remove());
    S.cases.filter(c => c.d === S.d).forEach(c => {
      const b = document.createElement('button'); b.className = 'btn'; b.type = 'button'; b.textContent = I18N.t('case.' + c.kind);
      b.addEventListener('click', () => { S.errors = Uint8Array.from(c.errors); replay(); });
      box.appendChild(b);
    });
  }

  function stop() { if (S.timer) { clearTimeout(S.timer); S.timer = null; } }
  function replay() {
    stop(); S.step = 1; render();
    const tick = () => { if (S.step < 4) { S.step++; render(); S.timer = setTimeout(tick, 1700); } else S.timer = null; };
    S.timer = setTimeout(tick, 1500);
  }

  async function setDistance(d, errors) {
    stop();
    const c = await load(d);
    S.d = d; S.code = c.code; S.model = c.model;
    S.errors = errors && errors.length === c.code.n ? Uint8Array.from(errors) : new Uint8Array(c.code.n);
    render();
  }

  function hit(target) {
    const g = target.closest && target.closest('.qubit');
    if (!g || !S.code) return;
    stop();
    S.errors[+g.dataset.q] ^= S.brush;
    if (S.step < 2) S.step = 4;
    render();
    const again = $(`#main .qubit[data-q="${g.dataset.q}"]`); if (again && document.activeElement === document.body) again.focus({ preventScroll: true });
  }

  function wilson(k, n) { const z = 1.959964, p = k / n, den = 1 + z * z / n, c = (p + z * z / (2 * n)) / den, h = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / den; return [Math.max(0, c - h), Math.min(1, c + h)]; }

  function monteCarlo() {
    const code = S.code, model = S.model, p = +$('#mcp').value / 100, N = S.d === 3 ? 3000 : 1000;
    const rand = QEC.mulberry32((Math.random() * 2 ** 31) | 0);
    let i = 0, fm = 0, fn = 0, om = 0, on = 0, both = 0;
    $('#mcrun').disabled = true;
    const show = () => {
      const pct = v => (100 * v).toFixed(2);
      const [ml, mh] = wilson(fm, i), [nl, nh] = wilson(fn, i);
      $('#mc-m').innerHTML = `${pct(fm / i)}% <small>${I18N.t('mc.fail')}</small>`; $('#mc-n').innerHTML = `${pct(fn / i)}% <small>${I18N.t('mc.fail')}</small>`;
      $('#mc-mci').textContent = I18N.t('mc.ci', { lo: pct(ml), hi: pct(mh) }); $('#mc-nci').textContent = I18N.t('mc.ci', { lo: pct(nl), hi: pct(nh) });
      $('#mc-d').innerHTML = I18N.t('mc.dtext', { a: om, b: on, c: both });
      $('#mcn').textContent = I18N.t('mc.count', { n: i.toLocaleString(), d: code.d });
    };
    const chunk = () => {
      const t0 = performance.now();
      while (i < N && performance.now() - t0 < 30) {
        const e = QEC.randomErrors(code, p, rand), s = QEC.syndrome(code, e), b = QEC.mwpm(code, s);
        const a = !QEC.residual(code, e, b.correction).ok, c = !QEC.residual(code, e, QEC.neural(code, model, s, b).correction).ok;
        fm += a; fn += c; if (a && c) both++; else if (a) om++; else if (c) on++;
        i++;
      }
      show();
      if (i < N && code === S.code) setTimeout(chunk, 0); else $('#mcrun').disabled = false;
    };
    chunk();
  }

  document.addEventListener('DOMContentLoaded', async () => {
    $('#main').addEventListener('click', e => hit(e.target));
    $('#main').addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); hit(e.target); } });
    document.querySelectorAll('#dist button').forEach(b => b.addEventListener('click', () => setDistance(+b.dataset.d)));
    document.querySelectorAll('#brush button').forEach(b => b.addEventListener('click', () => { S.brush = +b.dataset.b; render(); }));
    document.querySelectorAll('#steps button').forEach(b => b.addEventListener('click', () => { stop(); S.step = +b.dataset.s; render(); }));
    $('#clear').addEventListener('click', () => { stop(); S.errors.fill(0); S.step = 4; render(); });
    $('#random').addEventListener('click', () => { S.errors = QEC.randomErrors(S.code, S.d === 3 ? 0.2 : 0.12, Math.random); if (!S.errors.some(Boolean)) S.errors[(Math.random() * S.code.n) | 0] = 1; replay(); });
    $('#replay').addEventListener('click', replay);
    $('#mcp').addEventListener('input', e => { $('#mcpv').textContent = e.target.value + '%'; });
    $('#mcrun').addEventListener('click', monteCarlo);
    I18N.listeners.push(render);
    try { S.cases = await fetch('data/cases.json').then(r => r.json()); } catch (e) { S.cases = []; }
    const q = new URLSearchParams(location.search);
    const d = q.get('d') === '5' ? 5 : 3, e = (q.get('e') || '').split('').map(Number);
    if (q.get('step')) S.step = Math.min(4, Math.max(1, +q.get('step')));
    const first = S.cases.find(c => c.d === d && c.kind === 'nnwin');
    await setDistance(d, e.length ? e : first ? first.errors : null);
    window.SL = { S, render, replay, setDistance, monteCarlo };
    document.body.dataset.ready = '1';
  });
})();
