"""Evaluate all trained decoders of one distance against MWPM on shared test shots.

Writes results/eval_d{d}.json with four blocks:
  main            SI1000 (the training noise), full p sweep
  generalization  SD noise (never seen in training); MWPM both informed and uninformed
  rounds          more syndrome rounds than in training (recurrent model only)
  latency         single-core decoding time per shot
"""
import argparse
import glob
import json
import os
import sys
import time

import torch

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
from syndromelab import evaluate, models  # noqa: E402


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--d", type=int, required=True)
    ap.add_argument("--scale", type=float, default=1.0)
    ap.add_argument("--threads", type=int, default=4)
    ap.add_argument("--models", default=os.path.join(ROOT, "models"))
    ap.add_argument("--out", default=None)
    ap.add_argument("--skip-latency", action="store_true")
    ap.add_argument("--latency-only", action="store_true", help="re-measure latency (idle machine) and update the file")
    args = ap.parse_args()
    cfg = json.load(open(os.path.join(ROOT, "configs/experiment.json")))
    d, t0 = args.d, time.time()
    torch.set_num_threads(args.threads)
    nets, metas = {}, {}
    for path in sorted(glob.glob(os.path.join(args.models, f"*_d{d}_s*.pt"))):
        name = os.path.basename(path)[:-3]
        if name.startswith("capacity"):
            continue
        kind, _, seed = name.split("_")
        nets[f"{kind}_{seed}"], metas[f"{kind}_{seed}"] = models.load(path)
    print("decoders:", list(nets), flush=True)
    target = args.out or os.path.join(ROOT, f"results/eval_d{d}.json")
    if args.latency_only:
        out = json.load(open(target))
        out["latency"] = evaluate.measure_latency(d, "si1000", 0.003, {k: v for k, v in nets.items() if k.endswith("s0")})
        print("latency", out["latency"], flush=True)
        json.dump(out, open(target, "w"), indent=1)
        return
    shots = max(2000, int(cfg["test_shots"][str(d)] * args.scale))
    seed = cfg["test_seed"]
    out = dict(distance=d, models={k: {a: b for a, b in m.items() if a != "log"} | {"log": m.get("log", [])}
                                   for k, m in metas.items()}, main=[], generalization=[], rounds=[])
    for p in cfg["p_grid"]:
        pt = evaluate.summarize(evaluate.evaluate_point(d, "si1000", p, shots, seed, nets))
        out["main"].append(pt)
        print(f"main p={p}", {k: round(v, 5) for k, v in pt["rate"].items()}, f"{time.time() - t0:.0f}s", flush=True)
    gshots = max(2000, shots // 2)
    for p in (0.002, 0.004, 0.006, 0.008):
        pt = evaluate.summarize(evaluate.evaluate_point(d, "sd", p, gshots, seed + 1, nets))
        blind = evaluate.evaluate_point(d, "sd", p, gshots, seed + 1, weights_from=("si1000", p))
        pt["uninformed"] = dict(fails=blind["fails"], rate={k: v / gshots for k, v in blind["fails"].items()})
        out["generalization"].append(pt)
        print(f"sd p={p}", {k: round(v, 5) for k, v in pt["rate"].items()}, "uninformed", pt["uninformed"]["rate"],
              flush=True)
    rt = {k: v for k, v in nets.items() if k.startswith("rt")}
    if rt:
        for mult in (1, 2, 4):
            pt = evaluate.summarize(evaluate.evaluate_point(d, "si1000", 0.003, max(2000, shots // 4), seed + 2, rt,
                                                            rounds=mult * d))
            out["rounds"].append(pt)
            print(f"rounds={mult * d}", {k: round(v, 5) for k, v in pt["rate"].items()}, flush=True)
    if not args.skip_latency:
        one = {k: v for k, v in nets.items() if k.endswith("s0")}
        out["latency"] = evaluate.measure_latency(d, "si1000", 0.003, one)
        print("latency", out["latency"], flush=True)
    out["seconds"] = round(time.time() - t0, 1)
    json.dump(out, open(target, "w"), indent=1)


if __name__ == "__main__":
    main()
