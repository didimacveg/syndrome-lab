"""Reference results: MWPM and correlated matching, thresholds, validation against literature."""
import argparse
import json
import os
import sys
import time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
from syndromelab import circuits, data, evaluate, mwpm, stats  # noqa: E402


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--scale", type=float, default=1.0)
    ap.add_argument("--out", default=os.path.join(ROOT, "results/baseline.json"))
    args = ap.parse_args()
    cfg = json.load(open(os.path.join(ROOT, "configs/experiment.json")))
    ps, t0 = cfg["p_grid"], time.time()
    out = dict(points=[], crossings=[], capacity=dict(points=[], crossings=[]))
    table = {}
    for noise in ("si1000", "sd"):
        for d in (3, 5, 7):
            shots = max(2000, int(cfg["test_shots"][str(d)] * args.scale))
            for p in ps:
                pt = evaluate.summarize(evaluate.evaluate_point(d, noise, p, shots, cfg["test_seed"]))
                out["points"].append(pt)
                table[noise, d, p] = pt
                print(f"{noise} d={d} p={p}: mwpm {pt['rate']['mwpm']:.5f} corr {pt['rate']['corr']:.5f}", flush=True)
        for dec in ("mwpm", "corr"):
            for a, b in ((3, 5), (5, 7)):
                ka = [table[noise, a, p]["fails"][dec] for p in ps]
                kb = [table[noise, b, p]["fails"][dec] for p in ps]
                na, nb = table[noise, a, ps[0]]["shots"], table[noise, b, ps[0]]["shots"]
                est, lo, hi = stats.crossing_ci(ps, ka, kb, na, nb)
                out["crossings"].append(dict(noise=noise, decoder=dec, pair=[a, b], p=est, lo=lo, hi=hi))
                print(f"crossing {noise} {dec} d={a}-{b}: {est} [{lo}, {hi}]", flush=True)
    # code-capacity validation against the published MWPM threshold of 10.3%
    cps, shots = [0.08, 0.09, 0.10, 0.11, 0.12], max(2000, int(200000 * args.scale))
    k = {}
    for d in (5, 9, 13):
        k[d] = []
        for p in cps:
            c = circuits.code_capacity(d, p)
            det, obs = data.sample(c, shots, cfg["test_seed"] + d)
            f = int((mwpm.decode(mwpm.matching(c), det) != obs).sum())
            k[d].append(f)
            out["capacity"]["points"].append(dict(distance=d, p=p, shots=shots, fails=f, rate=f / shots,
                                                  ci=list(stats.wilson(f, shots))))
    for a, b in ((5, 9), (9, 13)):
        est, lo, hi = stats.crossing_ci(cps, k[a], k[b], shots, shots)
        out["capacity"]["crossings"].append(dict(pair=[a, b], p=est, lo=lo, hi=hi))
        print(f"capacity crossing d={a}-{b}: {est} [{lo}, {hi}] (published: 0.103)", flush=True)
    out["seconds"] = round(time.time() - t0, 1)
    json.dump(out, open(args.out, "w"), indent=1)


if __name__ == "__main__":
    main()
