"""Merge results/*.json into one compact file for the site, the figures and the report."""
import datetime
import glob
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
from syndromelab import stats  # noqa: E402

KINDS = ("cnn", "rt")
BASES = ("mwpm", "corr")


def _series(points, key, n):
    k = [pt["fails"][key] for pt in points]
    ci = [stats.wilson(v, n) for v in k]
    return dict(k=k, n=n, rate=[v / n for v in k], lo=[c[0] for c in ci], hi=[c[1] for c in ci])


def _block(points):
    """points: summarized evaluate_point results of one distance and noise, sorted by p."""
    n = points[0]["shots"]
    out = dict(ps=[pt["p"] for pt in points], shots=n, decoders={}, ratio={})
    for b in BASES:
        out["decoders"][b] = _series(points, b, n)
    for kind in KINDS:
        seeds = sorted(k for k in points[0]["fails"] if k.startswith(kind + "_"))
        if not seeds:
            continue
        pooled = [sum(pt["fails"][s] for s in seeds) for pt in points]
        m = n * len(seeds)
        ci = [stats.wilson(v, m) for v in pooled]
        out["decoders"][kind] = dict(k=pooled, n=m, rate=[v / m for v in pooled], lo=[c[0] for c in ci],
                                     hi=[c[1] for c in ci], seeds=seeds,
                                     seed_rates=[[pt["fails"][s] / n for pt in points] for s in seeds])
        for b in BASES:
            rows = []
            for pt in points:
                both, a, c = (sum(pt["paired"][f"{s}|{b}"][i] for s in seeds) for i in range(3))
                r, lo, hi = stats.paired_ratio(both, a, c, m)
                rows.append(dict(ratio=r, lo=lo, hi=hi, mcnemar_p=stats.mcnemar(a, c),
                                 per_seed=[pt["ratio"][f"{s}|{b}"]["ratio"] for s in seeds]))
            out["ratio"][f"{kind}|{b}"] = rows
    return out


def build(root=ROOT, out_dir=None):
    out_dir = out_dir or os.path.join(root, "web/data")
    res = dict(generated=datetime.date.today().isoformat(), main={}, generalization={}, rounds={}, latency={},
               models=[], crossings=[], capacity={}, baseline={})
    path = os.path.join(root, "results/baseline.json")
    if os.path.exists(path):
        base = json.load(open(path))
        for noise in ("si1000", "sd"):
            res["baseline"][noise] = {}
            for d in (3, 5, 7):
                pts = [p for p in base["points"] if p["noise"] == noise and p["distance"] == d]
                if pts:
                    res["baseline"][noise][str(d)] = dict(ps=[p["p"] for p in pts], shots=pts[0]["shots"],
                                                          decoders={b: _series(pts, b, pts[0]["shots"]) for b in BASES})
        res["crossings"] = base["crossings"]
        res["capacity_validation"] = base["capacity"]
    for path in sorted(glob.glob(os.path.join(root, "results/eval_d*.json"))):
        ev = json.load(open(path))
        d = str(ev["distance"])
        res["main"][d] = _block(ev["main"])
        if ev.get("generalization"):
            g = _block(ev["generalization"])
            n = ev["generalization"][0]["shots"]
            for b in BASES:
                k = [pt["uninformed"]["fails"][b] for pt in ev["generalization"]]
                ci = [stats.wilson(v, n) for v in k]
                g["decoders"][b + "_uninformed"] = dict(k=k, n=n, rate=[v / n for v in k], lo=[c[0] for c in ci],
                                                        hi=[c[1] for c in ci])
            res["generalization"][d] = g
        if ev.get("rounds"):
            res["rounds"][d] = [dict(rounds=pt["rounds"], shots=pt["shots"], rate=pt["rate"], ci=pt["ci"])
                                for pt in ev["rounds"]]
        if ev.get("latency"):
            res["latency"][d] = ev["latency"]
        for name, m in ev["models"].items():
            res["models"].append(dict(name=name, distance=ev["distance"], kind=m["kind"], seed=m["seed"],
                                      parameters=m["parameters"], samples=m["samples"], steps=m["steps"],
                                      train_seconds=m["train_seconds"], resumed_at=m.get("resumed_at", []),
                                      curve=[[e["step"], e["val_fail"]] for e in m.get("log", [])],
                                      val_mwpm=m.get("val_mwpm")))
    # threshold crossings of the networks (failures pooled over seeds), same method as the baselines
    for kind in KINDS:
        for a, b in ((3, 5), (5, 7)):
            da, db = res["main"].get(str(a)), res["main"].get(str(b))
            if da and db and kind in da["decoders"] and kind in db["decoders"]:
                sa, sb = da["decoders"][kind], db["decoders"][kind]
                est, lo, hi = stats.crossing_ci(da["ps"], sa["k"], sb["k"], sa["n"], sb["n"])
                res["crossings"].append(dict(noise="si1000", decoder=kind, pair=[a, b], p=est, lo=lo, hi=hi))
    path = os.path.join(root, "results/capacity.json")
    if os.path.exists(path):
        cap = json.load(open(path))
        for d in sorted({p["distance"] for p in cap["points"]}):
            pts = [p for p in cap["points"] if p["distance"] == d]
            n = pts[0]["shots"]
            seeds = sorted(k for k in pts[0]["fails"] if k != "mwpm")
            pooled = [sum(p["fails"][s] for s in seeds) for p in pts]
            m = n * len(seeds)
            ci = [stats.wilson(v, m) for v in pooled]
            ratio = []
            for p in pts:
                both, a, c = (sum(p["paired"][s][i] for s in seeds) for i in range(3))
                r, lo, hi = stats.paired_ratio(both, a, c, m)
                ratio.append(dict(ratio=r, lo=lo, hi=hi, mcnemar_p=stats.mcnemar(a, c),
                                  per_seed=[p["ratio"][s]["ratio"] for s in seeds]))
            res["capacity"][str(d)] = dict(
                ps=[p["p"] for p in pts], shots=n,
                decoders=dict(mwpm=_series(pts, "mwpm", n),
                              cnn=dict(k=pooled, n=m, rate=[v / m for v in pooled], lo=[c[0] for c in ci],
                                       hi=[c[1] for c in ci], seeds=seeds)),
                ratio={"cnn|mwpm": ratio})
        res["capacity_models"] = cap["models"]
    os.makedirs(out_dir, exist_ok=True)
    json.dump(res, open(os.path.join(out_dir, "results.json"), "w"), separators=(",", ":"))
    json.dump(res, open(os.path.join(root, "results/summary.json"), "w"), indent=1)
    return res


if __name__ == "__main__":
    build()
