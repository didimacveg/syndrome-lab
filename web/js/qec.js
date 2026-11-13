// Syndrome Lab: surface code, MWPM and neural decoder in plain JavaScript (no dependencies).
// The same file runs in the browser and in Node (tests_js/), so what you play with is what is tested.
(function (root) {
  'use strict';

  // ---- code ---------------------------------------------------------------
  // layout: {d, data:[[x,y]], stabs:[{type,x,y,support}], logical_x, logical_z}
  function buildCode(layout) {
    const n = layout.data.length;
    const code = { d: layout.d, n, layout, graphs: {} };
    // 'Z' stabilizers detect X errors; 'X' stabilizers detect Z errors.
    for (const type of ['Z', 'X']) {
      const stabs = [];
      layout.stabs.forEach((s, i) => { if (s.type === type) stabs.push(i); });
      const B = stabs.length; // boundary node index
      const local = new Map(stabs.map((s, k) => [s, k]));
      const qubitNodes = Array.from({ length: n }, () => []);
      stabs.forEach((s, k) => layout.stabs[s].support.forEach(q => qubitNodes[q].push(k)));
      const adj = Array.from({ length: B + 1 }, () => []);
      for (let q = 0; q < n; q++) {
        const a = qubitNodes[q][0], b = qubitNodes[q].length > 1 ? qubitNodes[q][1] : B;
        adj[a].push([b, q]); adj[b].push([a, q]);
      }
      // all-pairs shortest paths by BFS (every edge has weight 1), remembering the qubits crossed
      const dist = [], prev = [];
      for (let s = 0; s <= B; s++) {
        const d = new Array(B + 1).fill(Infinity), p = new Array(B + 1).fill(null);
        d[s] = 0; const queue = [s];
        for (let h = 0; h < queue.length; h++) {
          const u = queue[h];
          if (u === B && s !== B) continue; // paths may end at the boundary, not pass through it
          for (const [v, q] of adj[u]) if (d[v] === Infinity) { d[v] = d[u] + 1; p[v] = [u, q]; queue.push(v); }
        }
        dist.push(d); prev.push(p);
      }
      code.graphs[type] = { stabs, local, B, dist, prev };
    }
    return code;
  }

  // errors: Uint8Array per qubit, bit 1 = X component, bit 2 = Z component (3 = Y)
  function syndrome(code, errors) {
    return code.layout.stabs.map(s => {
      const bit = s.type === 'Z' ? 1 : 2;
      let par = 0;
      for (const q of s.support) if (errors[q] & bit) par ^= 1;
      return par;
    });
  }

  function path(graph, a, b) { // qubits on a shortest path from node a to node b
    const out = []; let v = b;
    while (v !== a) { const [u, q] = graph.prev[a][v]; out.push(q); v = u; }
    return out;
  }

  // ---- MWPM: exact minimum-weight perfect matching with a boundary, by bitmask DP ------------
  // Returns {pairs:[[stabIndex, stabIndex|null]], qubits:[...], weight}
  function matchType(code, synd, type) {
    const g = code.graphs[type];
    const defects = [];
    g.stabs.forEach((s, k) => { if (synd[s]) defects.push(k); });
    const m = defects.length;
    if (m > 20) throw new Error('too many defects for exact matching');
    const full = (1 << m) - 1;
    const cost = new Float64Array(full + 1), choice = new Int8Array(full + 1);
    for (let mask = 1; mask <= full; mask++) {
      let i = 0; while (!((mask >> i) & 1)) i++;
      const rest = mask & ~(1 << i);
      let best = g.dist[defects[i]][g.B] + cost[rest], pick = -1; // match i to the boundary
      for (let j = i + 1; j < m; j++) if ((rest >> j) & 1) {
        const c = g.dist[defects[i]][defects[j]] + cost[rest & ~(1 << j)];
        if (c < best) { best = c; pick = j; }
      }
      cost[mask] = best; choice[mask] = pick;
    }
    const pairs = [], chains = [], flips = new Uint8Array(code.n);
    let mask = full;
    while (mask) {
      let i = 0; while (!((mask >> i) & 1)) i++;
      const j = choice[mask];
      const a = defects[i], b = j < 0 ? g.B : defects[j];
      const qs = path(g, a, b).reverse(); // ordered from a towards b
      for (const q of qs) flips[q] ^= 1;
      pairs.push([g.stabs[a], j < 0 ? null : g.stabs[b]]);
      chains.push({ from: g.stabs[a], to: j < 0 ? null : g.stabs[b], qubits: qs });
      mask &= ~(1 << i); if (j >= 0) mask &= ~(1 << j);
    }
    const qubits = []; flips.forEach((f, q) => { if (f) qubits.push(q); });
    return { pairs, chains, qubits, weight: cost[full] };
  }

  // Full MWPM decode. correction uses the same bit convention as errors.
  function mwpm(code, synd) {
    const x = matchType(code, synd, 'Z'), z = matchType(code, synd, 'X');
    const correction = new Uint8Array(code.n);
    x.qubits.forEach(q => { correction[q] |= 1; });
    z.qubits.forEach(q => { correction[q] |= 2; });
    return { correction, pairs: { Z: x.pairs, X: z.pairs }, chains: { Z: x.chains, X: z.chains }, weight: x.weight + z.weight };
  }

  function parity(vec, support, bit) { let p = 0; for (const q of support) if (vec[q] & bit) p ^= 1; return p; }

  // What a correction (or an error) does to the logical qubit: [flips logical Z, flips logical X]
  function logicalClass(code, pauli) {
    return [parity(pauli, code.layout.logical_z, 1), parity(pauli, code.layout.logical_x, 2)];
  }

  // error * correction: must have trivial syndrome; logical tells whether decoding failed
  function residual(code, errors, correction) {
    const res = new Uint8Array(code.n);
    for (let q = 0; q < code.n; q++) res[q] = errors[q] ^ correction[q];
    const cls = logicalClass(code, res);
    return { residual: res, logical: cls, ok: !cls[0] && !cls[1], clean: syndrome(code, res).every(v => !v) };
  }

  // ---- neural network (2D CNN, exactly syndromelab.models.CNN with dims=2) -------------------
  function decodeF32(b64) {
    const bin = typeof atob === 'function' ? atob(b64) : Buffer.from(b64, 'base64').toString('binary');
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new Float32Array(bytes.buffer);
  }

  function loadModel(json) {
    const t = {};
    for (const [k, v] of Object.entries(json.tensors)) t[k] = { shape: v.shape, data: decodeF32(v.data) };
    return { config: json.config, t, meta: json.meta };
  }

  function erf(x) { // Abramowitz & Stegun 7.1.26, |error| < 1.5e-7
    const s = x < 0 ? -1 : 1; x = Math.abs(x);
    const k = 1 / (1 + 0.3275911 * x);
    const y = 1 - (((((1.061405429 * k - 1.453152027) * k) + 1.421413741) * k - 0.284496736) * k + 0.254829592) * k * Math.exp(-x * x);
    return s * y;
  }
  function gelu(a) { const o = new Float32Array(a.length); for (let i = 0; i < a.length; i++) o[i] = 0.5 * a[i] * (1 + erf(a[i] * Math.SQRT1_2)); return o; }

  function conv(x, cin, H, W, w, b) { // 'same' convolution, kernel k x k
    const cout = w.shape[0], k = w.shape[2], pad = (k - 1) >> 1, wd = w.data, bd = b.data;
    const out = new Float32Array(cout * H * W);
    for (let o = 0; o < cout; o++) {
      const ob = o * H * W;
      for (let i = 0; i < H * W; i++) out[ob + i] = bd[o];
      for (let c = 0; c < cin; c++) for (let ky = 0; ky < k; ky++) for (let kx = 0; kx < k; kx++) {
        const wv = wd[((o * cin + c) * k + ky) * k + kx];
        if (wv === 0) continue;
        const y0 = Math.max(0, pad - ky), y1 = Math.min(H, H + pad - ky);
        const x0 = Math.max(0, pad - kx), x1 = Math.min(W, W + pad - kx);
        for (let y = y0; y < y1; y++) {
          const src = (c * H + y + ky - pad) * W + kx - pad, dst = ob + y * W;
          for (let xx = x0; xx < x1; xx++) out[dst + xx] += wv * x[src + xx];
        }
      }
    }
    return out;
  }

  function linear(x, w, b) {
    const [o, n] = w.shape, out = new Float32Array(o);
    for (let i = 0; i < o; i++) { let s = b.data[i]; const r = i * n; for (let j = 0; j < n; j++) s += w.data[r + j] * x[j]; out[i] = s; }
    return out;
  }

  // grid: Float32Array (H*W) of syndrome bits. Returns logits [flip logical Z, flip logical X].
  function forward(model, grid) {
    const { t, config } = model, [H, W] = config.shape, C = config.channels;
    let x = conv(grid, 1, H, W, t['stem.weight'], t['stem.bias']);
    const pos = t['pos'].data; for (let i = 0; i < x.length; i++) x[i] += pos[i];
    for (let b = 0; b < config.blocks; b++) {
      const h = conv(gelu(conv(gelu(x), C, H, W, t[`blocks.${b}.a.weight`], t[`blocks.${b}.a.bias`])), C, H, W,
        t[`blocks.${b}.b.weight`], t[`blocks.${b}.b.bias`]);
      for (let i = 0; i < x.length; i++) x[i] += h[i];
    }
    x = gelu(conv(gelu(x), C, H, W, t['neck.weight'], t['neck.bias']));
    return linear(gelu(linear(x, t['head.0.weight'], t['head.0.bias'])), t['head.2.weight'], t['head.2.bias']);
  }

  function syndromeGrid(code, synd) {
    const W = code.d + 1, g = new Float32Array(W * W);
    code.layout.stabs.forEach((s, i) => { g[(s.y / 2) * W + s.x / 2] = synd[i]; });
    return g;
  }

  // Neural decode: the network picks the logical class; the physical correction is the MWPM one,
  // multiplied by a logical operator wherever the network disagrees with MWPM's class.
  function neural(code, model, synd, base) {
    base = base || mwpm(code, synd);
    const logits = forward(model, syndromeGrid(code, synd));
    const prob = Array.from(logits, v => 1 / (1 + Math.exp(-v)));
    const want = [prob[0] > 0.5 ? 1 : 0, prob[1] > 0.5 ? 1 : 0];
    const have = logicalClass(code, base.correction);
    const correction = Uint8Array.from(base.correction);
    const applied = [want[0] !== have[0], want[1] !== have[1]];
    if (applied[0]) code.layout.logical_x.forEach(q => { correction[q] ^= 1; }); // X string flips logical Z
    if (applied[1]) code.layout.logical_z.forEach(q => { correction[q] ^= 2; }); // Z string flips logical X
    return { correction, prob, want, disagrees: applied };
  }

  function randomErrors(code, p, rand) {
    const e = new Uint8Array(code.n);
    for (let q = 0; q < code.n; q++) { const r = rand(); if (r < p) e[q] = r < p / 3 ? 1 : r < 2 * p / 3 ? 3 : 2; }
    return e;
  }

  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  const api = { buildCode, syndrome, mwpm, matchType, logicalClass, residual, loadModel, forward, syndromeGrid, neural, randomErrors, mulberry32 };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.QEC = api;
})(typeof self !== 'undefined' ? self : this);
