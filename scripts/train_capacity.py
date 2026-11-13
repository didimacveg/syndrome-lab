"""Train and evaluate the code-capacity decoders used by the web playground."""
import argparse
import json
import os
import sys

import numpy as np
import torch

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
from syndromelab import capacity, models, stats  # noqa: E402

JOBS = {3: dict(steps=8000, channels=32, blocks=2, seeds=(0, 1, 2)),
        5: dict(steps=30000, channels=32, blocks=2, seeds=(0, 1, 2))}


def evaluate(d, nets, shots, seed):
    cap, rng, rows = capacity.Capacity(d), np.random.default_rng(seed), []
    for p in capacity.P_TEST:
        grid, labels, sz, sx = cap.sample(p, shots, rng)
        wm = (cap.mwpm(sz, sx) != labels).any(1)
        row = dict(distance=d, p=p, shots=shots, fails=dict(mwpm=int(wm.sum())), paired={})
        for name, net in nets.items():
            wn = (models.predict(net, grid) != labels).any(1)
            row["fails"][name] = int(wn.sum())
            row["paired"][name] = [int((wn & wm).sum()), int((wn & ~wm).sum()), int((~wn & wm).sum())]
        row["rate"] = {k: v / shots for k, v in row["fails"].items()}
        row["ci"] = {k: list(stats.wilson(v, shots)) for k, v in row["fails"].items()}
        row["ratio"] = {}
        for name, (both, a, b) in row["paired"].items():
            r, lo, hi = stats.paired_ratio(both, a, b, shots)
            row["ratio"][name] = dict(ratio=r, lo=lo, hi=hi, mcnemar_p=stats.mcnemar(a, b))
        rows.append(row)
        print(d, p, {k: round(v, 5) for k, v in row["rate"].items()}, flush=True)
    return rows


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--scale", type=float, default=1.0)
    ap.add_argument("--models", default=os.path.join(ROOT, "models"))
    ap.add_argument("--out", default=os.path.join(ROOT, "results/capacity.json"))
    args = ap.parse_args()
    torch.set_num_threads(1)
    os.makedirs(args.models, exist_ok=True)
    out = dict(points=[], models=[])
    for d, job in JOBS.items():
        nets = {}
        for seed in job["seeds"]:
            path = os.path.join(args.models, f"capacity_d{d}_s{seed}.pt")
            if not os.path.exists(path):
                capacity.train(d, seed, max(50, int(job["steps"] * args.scale)), channels=job["channels"],
                               blocks=job["blocks"], out=path)
            nets[f"cnn_s{seed}"], meta = models.load(path)
            out["models"].append(meta)
        out["points"] += evaluate(d, nets, max(2000, int(200000 * args.scale)), seed=424242 + d)
    json.dump(out, open(args.out, "w"), indent=1)


if __name__ == "__main__":
    main()
