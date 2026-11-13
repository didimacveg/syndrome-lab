"""Paired evaluation: every decoder sees exactly the same test shots."""
from __future__ import annotations

import time

import numpy as np
import torch

from . import circuits, data, models, mwpm, stats

BASELINES = ("mwpm", "corr")


def evaluate_point(distance: int, noise: str, p: float, shots: int, seed: int, nets: dict | None = None,
                   rounds: int | None = None, weights_from: tuple[str, float] | None = None,
                   chunk: int = 50000) -> dict:
    """Decode `shots` test shots with MWPM, correlated matching and each network in `nets`.

    weights_from=(noise, p): build the matching graphs from a *different* noise model than the
    one generating the data (a mismatched, uninformed MWPM). Default: the true noise.
    Returns failure counts plus, for each network/baseline pair, the paired counts
    (both fail, only network fails, only baseline fails).
    """
    rounds = rounds or distance
    nets = nets or {}
    circuit = circuits.make(noise, distance, rounds, p)
    wc = circuit if weights_from is None else circuits.make(weights_from[0], distance, rounds, weights_from[1])
    m_plain, m_corr = mwpm.matching(wc), mwpm.matching(wc, correlated=True)
    lat = data.Lattice(distance, rounds)
    sampler = circuit.compile_detector_sampler(seed=seed)
    fails = {k: 0 for k in (*BASELINES, *nets)}
    paired = {f"{k}|{b}": [0, 0, 0] for k in nets for b in BASELINES}
    done = 0
    while done < shots:
        n = min(chunk, shots - done)
        det, obs = sampler.sample(n, separate_observables=True)
        obs = obs[:, 0]
        wrong = {"mwpm": mwpm.decode(m_plain, det) != obs,
                 "corr": mwpm.decode(m_corr, det, correlated=True) != obs}
        if nets:
            vol = lat.to_volume(det)
            for k, net in nets.items():
                wrong[k] = models.predict(net, vol) != obs
        for k, w in wrong.items():
            fails[k] += int(w.sum())
        for k in nets:
            for b in BASELINES:
                c = paired[f"{k}|{b}"]
                c[0] += int((wrong[k] & wrong[b]).sum())
                c[1] += int((wrong[k] & ~wrong[b]).sum())
                c[2] += int((~wrong[k] & wrong[b]).sum())
        done += n
    return dict(distance=distance, rounds=rounds, noise=noise, p=p, shots=shots, seed=seed,
                weights_from=list(weights_from) if weights_from else None, fails=fails, paired=paired)


def summarize(point: dict) -> dict:
    """Adds rates, Wilson intervals and paired statistics to a result of evaluate_point."""
    n = point["shots"]
    out = dict(point)
    out["rate"] = {k: v / n for k, v in point["fails"].items()}
    out["ci"] = {k: list(stats.wilson(v, n)) for k, v in point["fails"].items()}
    out["ratio"] = {}
    for key, (both, only_net, only_base) in point["paired"].items():
        r, lo, hi = stats.paired_ratio(both, only_net, only_base, n)
        out["ratio"][key] = dict(ratio=r, lo=lo, hi=hi, mcnemar_p=stats.mcnemar(only_net, only_base))
    return out


def latency(decode_one, decode_batch, shots_one: int = 300, repeats: int = 5) -> dict:
    """Median wall time per shot (seconds), one shot at a time and in a batch. Single thread."""
    one, batch = [], []
    for _ in range(repeats):
        t = time.perf_counter()
        n = decode_one(shots_one)
        one.append((time.perf_counter() - t) / n)
        t = time.perf_counter()
        n = decode_batch()
        batch.append((time.perf_counter() - t) / n)
    return dict(per_shot_single=float(np.median(one)), per_shot_batched=float(np.median(batch)))


def measure_latency(distance: int, noise: str, p: float, nets: dict, shots: int = 4096, seed: int = 9) -> dict:
    torch.set_num_threads(1)
    circuit = circuits.make(noise, distance, distance, p)
    det, _ = data.sample(circuit, shots, seed)
    lat = data.Lattice(distance, distance)
    vol = torch.from_numpy(lat.to_volume(det))
    out = {}
    for name, corr in (("mwpm", False), ("corr", True)):
        m = mwpm.matching(circuit, corr)
        kw = dict(enable_correlations=True) if corr else {}

        def one(k, m=m, kw=kw):
            for i in range(k):
                m.decode(det[i], **kw)
            return k

        out[name] = latency(one, lambda m=m, kw=kw: len(m.decode_batch(det, **kw)))
    for name, net in nets.items():
        def one(k, net=net):
            with torch.no_grad():
                for i in range(k):
                    net(vol[i:i + 1])
            return k

        def batch(net=net):
            with torch.no_grad():
                for i in range(0, shots, 1024):
                    net(vol[i:i + 1024])
            return shots

        out[name] = latency(one, batch)
    return out
