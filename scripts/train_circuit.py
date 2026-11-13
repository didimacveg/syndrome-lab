"""Train every circuit-noise decoder listed in configs/experiment.json.

Runs `--workers` single-threaded jobs in parallel. Jobs whose model file already exists are
skipped, so the script can be interrupted and resumed. Use --only to select, e.g. --only cnn_d3.
"""
import argparse
import json
import os
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)


def run_one(args):
    import torch
    torch.set_num_threads(1)
    from syndromelab import train
    cfg = json.load(open(os.path.join(ROOT, "configs/experiment.json")))
    job = next(j for j in cfg["jobs"] if j["kind"] == args.kind and j["d"] == args.d)
    steps = max(50, int(job["steps"] * args.scale))
    train.train(args.kind, args.d, args.seed, steps, batch=cfg["batch"], lr=cfg["lr"], noise=cfg["noise"],
                ps=cfg["p_grid"], model_kw=job["model"], out=args.out,
                log_every=max(1, steps // 20))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--workers", type=int, default=4)
    ap.add_argument("--only", default="")
    ap.add_argument("--scale", type=float, default=1.0, help="multiply all step counts (smoke tests)")
    ap.add_argument("--models", default=os.path.join(ROOT, "models"))
    ap.add_argument("--kind"), ap.add_argument("--d", type=int), ap.add_argument("--seed", type=int)
    ap.add_argument("--out")
    args = ap.parse_args()
    if args.kind:
        return run_one(args)
    cfg = json.load(open(os.path.join(ROOT, "configs/experiment.json")))
    os.makedirs(args.models, exist_ok=True)
    os.makedirs(os.path.join(ROOT, "results/logs"), exist_ok=True)
    todo = []
    for job in cfg["jobs"]:
        for seed in job["seeds"]:
            name = f"{job['kind']}_d{job['d']}_s{seed}"
            out = os.path.join(args.models, name + ".pt")
            if args.only in name and not os.path.exists(out):
                todo.append((name, job, seed, out))

    def launch(item):
        name, job, seed, out = item
        with open(os.path.join(ROOT, "results/logs", name + ".log"), "w") as log:
            code = subprocess.call([sys.executable, __file__, "--kind", job["kind"], "--d", str(job["d"]),
                                    "--seed", str(seed), "--out", out, "--scale", str(args.scale)],
                                   stdout=log, stderr=subprocess.STDOUT)
        print(name, "done" if code == 0 else f"FAILED ({code})", flush=True)

    print(f"{len(todo)} jobs, {args.workers} workers", flush=True)
    with ThreadPoolExecutor(args.workers) as pool:
        list(pool.map(launch, todo))


if __name__ == "__main__":
    main()
