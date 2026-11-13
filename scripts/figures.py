"""Static figures (PNG + SVG) for the report and the README, from results/summary.json."""
import json
import os
import sys

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
sys.path.insert(0, os.path.join(ROOT, "scripts"))
import web_results  # noqa: E402

COL = dict(mwpm="#b87400", corr="#c2356b", cnn="#1f6fe0", rt="#0f8a5f")
NAME = dict(mwpm="MWPM", corr="Correlated matching", cnn="CNN (ours)", rt="RT (ours)")
MK = dict(mwpm="s", corr="D", cnn="o", rt="^")
DCOL = {"3": "#7fb2f0", "5": "#2f6fd6", "7": "#143a80"}


def style():
    plt.rcParams.update({"font.family": "DejaVu Sans", "font.size": 8.5, "axes.spines.top": False,
                         "axes.spines.right": False, "axes.grid": True, "grid.alpha": .25, "grid.linewidth": .5,
                         "legend.frameon": False, "savefig.dpi": 200, "figure.dpi": 200, "axes.titlesize": 9})


def save(fig, name):
    out = os.path.join(ROOT, "report/figures")
    os.makedirs(out, exist_ok=True)
    fig.savefig(os.path.join(out, name + ".png"), bbox_inches="tight")
    fig.savefig(os.path.join(out, name + ".svg"), bbox_inches="tight")
    plt.close(fig)


def curve(ax, blk, key, **kw):
    s = blk["decoders"][key]
    x = [p * 100 for p in blk["ps"]]
    ax.fill_between(x, s["lo"], s["hi"], color=kw.get("color", COL.get(key)), alpha=.15, lw=0)
    ax.plot(x, s["rate"], marker=kw.pop("marker", MK.get(key, "o")), ms=3.5, lw=1.3,
            color=kw.pop("color", COL.get(key)), label=kw.pop("label", NAME.get(key, key)), **kw)


def loglog(ax, xl="physical error rate p (%)", yl="logical error rate per shot"):
    ax.set_xscale("log"), ax.set_yscale("log")
    ax.set_xticks([0.1, 0.2, 0.5, 1.0], ["0.1", "0.2", "0.5", "1"])
    ax.set_xlabel(xl)
    if yl:
        ax.set_ylabel(yl)


def main():
    style()
    R = web_results.build(ROOT)
    ds = sorted(R["main"])
    if ds:
        fig, axes = plt.subplots(1, len(ds), figsize=(2.6 * len(ds), 2.7), sharey=True, squeeze=False)
        for ax, d in zip(axes[0], ds):
            for k in ("mwpm", "corr", "cnn", "rt"):
                if k in R["main"][d]["decoders"]:
                    curve(ax, R["main"][d], k)
            loglog(ax, yl="logical error rate per shot" if d == ds[0] else None)
            ax.set_title(f"d = {d}")
        axes[0][0].legend(fontsize=7, loc="lower right")
        save(fig, "main")

        fig, axes = plt.subplots(1, 2, figsize=(6.6, 2.7), sharey=True)
        for ax, base in zip(axes, ("mwpm", "corr")):
            for kind, ls in (("cnn", "-"), ("rt", "--")):
                for d in ds:
                    rows = R["main"][d]["ratio"].get(f"{kind}|{base}")
                    if not rows:
                        continue
                    x = [p * 100 for p in R["main"][d]["ps"]]
                    y = [r["ratio"] for r in rows]
                    err = [[r["ratio"] - r["lo"] for r in rows], [r["hi"] - r["ratio"] for r in rows]]
                    ax.errorbar(x, y, yerr=err, color=DCOL[d], ls=ls, marker="o" if kind == "cnn" else "^", ms=3,
                                lw=1.1, elinewidth=.7, capsize=1.5, label=f"{kind.upper()} d={d}")
            ax.axhline(1, color="k", lw=.7, ls=":")
            loglog(ax, yl="network / baseline" if base == "mwpm" else None)
            ax.set_title(f"vs {NAME[base]}")
        axes[0].legend(fontsize=6.5, ncol=2)
        save(fig, "ratio")

        fig, axes = plt.subplots(1, 4, figsize=(9.2, 2.6), sharey=True)
        for ax, dec in zip(axes, ("mwpm", "corr", "cnn", "rt")):
            for d in ("3", "5", "7"):
                blk = R["main"].get(d) if dec in ("cnn", "rt") else R["baseline"].get("si1000", {}).get(d)
                if blk and dec in blk["decoders"]:
                    curve(ax, blk, dec, color=DCOL[d], label=f"d = {d}", marker="o")
            for c in R["crossings"]:
                if c["noise"] == "si1000" and c["decoder"] == dec and c["p"]:
                    ax.axvline(c["p"] * 100, color="#888", lw=.7, ls="--")
            loglog(ax, yl="logical error rate per shot" if dec == "mwpm" else None)
            ax.set_title(NAME[dec])
        axes[0].legend(fontsize=7)
        save(fig, "threshold")

    gs = sorted(R["generalization"])
    if gs:
        fig, axes = plt.subplots(1, len(gs), figsize=(2.6 * len(gs), 2.7), sharey=True, squeeze=False)
        for ax, d in zip(axes[0], gs):
            g = R["generalization"][d]
            curve(ax, g, "mwpm", label="MWPM, informed")
            curve(ax, g, "mwpm_uninformed", color=COL["mwpm"], ls="--", marker="s", label="MWPM, SI1000 weights")
            for k in ("cnn", "rt"):
                if k in g["decoders"]:
                    curve(ax, g, k)
            loglog(ax, yl="logical error rate per shot" if d == gs[0] else None)
            ax.set_xticks([0.2, 0.4, 0.8], ["0.2", "0.4", "0.8"])
            ax.set_title(f"d = {d}, uniform depolarizing")
        axes[0][0].legend(fontsize=6.5)
        save(fig, "generalization")

    if R["capacity"]:
        cs = sorted(R["capacity"])
        fig, axes = plt.subplots(1, len(cs), figsize=(3.1 * len(cs), 2.6), squeeze=False)
        for ax, d in zip(axes[0], cs):
            curve(ax, R["capacity"][d], "mwpm")
            curve(ax, R["capacity"][d], "cnn", label="CNN (ours)")
            ax.set_yscale("log"), ax.set_xlabel("depolarizing probability per data qubit (%)")
            ax.set_ylabel("logical error rate"), ax.set_title(f"d = {d}, code capacity")
        axes[0][0].legend(fontsize=7)
        save(fig, "capacity")

    models = [m for m in R["models"] if m["curve"]]
    if models:
        fig, axes = plt.subplots(1, len(ds), figsize=(2.6 * len(ds), 2.5), squeeze=False)
        for ax, d in zip(axes[0], ds):
            for m in models:
                if str(m["distance"]) == d:
                    ax.plot([s * 256 / 1e6 for s, _ in m["curve"]], [v for _, v in m["curve"]], color=COL[m["kind"]],
                            lw=1, label=NAME[m["kind"]] if m["seed"] == 0 else None)
                    ax.axhline(m["val_mwpm"], color=COL["mwpm"], lw=.8, ls="--")
            ax.set_yscale("log"), ax.set_xlabel("training shots (millions)"), ax.set_title(f"d = {d}")
            if d == ds[0]:
                ax.set_ylabel("validation error at p = 0.5%")
        axes[0][0].legend(fontsize=7)
        save(fig, "training")
    print("figures written to report/figures")


if __name__ == "__main__":
    main()
