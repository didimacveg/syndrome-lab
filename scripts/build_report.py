"""Build the technical report (HTML, then PDF through headless Chromium) from results/summary.json.

Every number in the report is read from the results; only the interpretation in report/discussion.html
is written by hand, and the build refuses to run if that file is missing.
"""
import json
import os
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
R = json.load(open(os.path.join(ROOT, "results/summary.json")))
NAME = dict(mwpm="MWPM", corr="Correlated matching", cnn="CNN", rt="RT")


def pct(v, digits=2):
    return f"{100 * v:.{digits}f}%"


def ratio_cell(r):
    if r is None or r["ratio"] != r["ratio"]:
        return "<td>n/a</td>"
    cls = "win" if r["hi"] < 1 else "lose" if r["lo"] > 1 else ""
    return f'<td class="{cls}">{r["ratio"]:.2f} [{r["lo"]:.2f}, {r["hi"]:.2f}]</td>'


def ratio_table(base):
    ds = sorted(R["main"])
    cols = [(d, k) for d in ds for k in ("cnn", "rt") if f"{k}|{base}" in R["main"][d]["ratio"]]
    head = "".join(f"<th>{NAME[k]}, d={d}</th>" for d, k in cols)
    rows = ""
    for i, p in enumerate(R["main"][ds[0]]["ps"]):
        rows += f"<tr><td>{pct(p, 1)}</td>" + "".join(ratio_cell(R["main"][d]["ratio"][f"{k}|{base}"][i])
                                                      for d, k in cols) + "</tr>"
    return f"<table><thead><tr><th>p</th>{head}</tr></thead><tbody>{rows}</tbody></table>"


def crossing_table():
    rows = ""
    for c in R["crossings"]:
        if c["noise"] != "si1000":
            continue
        val = pct(c["p"]) if c["p"] else "no crossing in range"
        ci = f'{pct(c["lo"])} to {pct(c["hi"])}' if c.get("lo") else "n/a"
        rows += f'<tr><td>{NAME[c["decoder"]]}</td><td>{c["pair"][0]} and {c["pair"][1]}</td><td>{val}</td><td>{ci}</td></tr>'
    return ("<table><thead><tr><th>Decoder</th><th>Distances</th><th>Crossing</th><th>95% interval</th></tr></thead>"
            f"<tbody>{rows}</tbody></table>")


def time_str(s):
    return f"{s * 1e9:.0f} ns" if s < 1e-6 else f"{s * 1e6:.1f} µs" if s < 1e-3 else f"{s * 1e3:.2f} ms"


def latency_table():
    rows = ""
    for d in sorted(R["latency"]):
        base = R["latency"][d]["mwpm"]["per_shot_batched"]
        for k, v in R["latency"][d].items():
            rows += (f"<tr><td>{d}</td><td>{NAME[k.split('_')[0]]}</td><td>{time_str(v['per_shot_single'])}</td>"
                     f"<td>{time_str(v['per_shot_batched'])}</td><td>{v['per_shot_batched'] / base:,.0f}×</td></tr>")
    return ("<table><thead><tr><th>d</th><th>Decoder</th><th>One shot at a time</th><th>Batched</th>"
            f"<th>Relative to MWPM</th></tr></thead><tbody>{rows}</tbody></table>")


def cost_table():
    rows = ""
    groups = {}
    for m in R["models"]:
        groups.setdefault((m["distance"], m["kind"]), []).append(m)
    for (d, k), ms in sorted(groups.items()):
        last = [m["curve"][-1][1] for m in ms]
        rows += (f"<tr><td>{NAME[k]}</td><td>{d}</td><td>{len(ms)}</td><td>{ms[0]['parameters']:,}</td>"
                 f"<td>{ms[0]['samples'] / 1e6:.1f} M</td><td>{sum(m['train_seconds'] for m in ms) / len(ms) / 60:.0f} min</td>"
                 f"<td>{pct(min(last))} to {pct(max(last))}</td><td>{pct(ms[0]['val_mwpm'])}</td></tr>")
    return ("<table><thead><tr><th>Model</th><th>d</th><th>Seeds</th><th>Parameters</th><th>Training shots</th>"
            "<th>CPU time per seed</th><th>Final validation error (p=0.5%)</th><th>MWPM, same shots</th></tr></thead>"
            f"<tbody>{rows}</tbody></table>")


def rounds_table():
    rows = ""
    for d in sorted(R["rounds"]):
        for pt in R["rounds"][d]:
            rt = [v for k, v in pt["rate"].items() if k.startswith("rt")]
            m = sum(rt) / len(rt)
            rows += (f"<tr><td>{d}</td><td>{pt['rounds']}</td><td>{pct(pt['rate']['mwpm'])}</td><td>{pct(m)}</td>"
                     f"<td>{m / pt['rate']['mwpm']:.2f}</td></tr>")
    return ("<table><thead><tr><th>d</th><th>Rounds</th><th>MWPM</th><th>RT (mean over seeds)</th><th>RT / MWPM</th>"
            f"</tr></thead><tbody>{rows}</tbody></table>")


def gen_table():
    rows = ""
    for d in sorted(R["generalization"]):
        g = R["generalization"][d]
        for i, p in enumerate(g["ps"]):
            cells = "".join(f"<td>{pct(g['decoders'][k]['rate'][i], 3)}</td>" if k in g["decoders"] else "<td>n/a</td>"
                            for k in ("mwpm", "mwpm_uninformed", "corr", "cnn", "rt"))
            rows += f"<tr><td>{d}</td><td>{pct(p, 1)}</td>{cells}</tr>"
    return ("<table><thead><tr><th>d</th><th>p</th><th>MWPM informed</th><th>MWPM, SI1000 weights</th>"
            f"<th>Corr. matching informed</th><th>CNN</th><th>RT</th></tr></thead><tbody>{rows}</tbody></table>")


def cap_sentence():
    out = []
    for d in sorted(R["capacity"]):
        c = R["capacity"][d]
        i = c["ps"].index(0.08)
        r = c["ratio"]["cnn|mwpm"][i]
        out.append(f"at d = {d} the ratio at 8% is {r['ratio']:.2f} [{r['lo']:.2f}, {r['hi']:.2f}]")
    return "; ".join(out)


def main():
    disc_path = os.path.join(ROOT, "report/discussion.html")
    if not os.path.exists(disc_path):
        sys.exit("report/discussion.html is missing: write the interpretation after looking at the results")
    tpl = open(os.path.join(ROOT, "report/template.html")).read()
    capv = R.get("capacity_validation", {}).get("crossings", [])
    shots = {d: R["main"][d]["shots"] for d in R["main"]}
    fill = dict(
        DATE=R["generated"], RATIO_MWPM=ratio_table("mwpm"), RATIO_CORR=ratio_table("corr"),
        CROSSINGS=crossing_table(), LATENCY=latency_table(), COST=cost_table(), ROUNDS=rounds_table(),
        GEN=gen_table(), CAPACITY=cap_sentence(), DISCUSSION=open(disc_path).read(),
        CAPV=" and ".join(f"{pct(c['p'], 1)} (d = {c['pair'][0]}, {c['pair'][1]})" for c in capv),
        SHOTS=", ".join(f"{n:,} at d = {d}" for d, n in sorted(shots.items())))
    for k, v in fill.items():
        tpl = tpl.replace("{{" + k + "}}", v)
    if "{{" in tpl:
        sys.exit("unfilled placeholder in report: " + tpl[tpl.index("{{"):][:40])
    out = os.path.join(ROOT, "report/report.html")
    open(out, "w").write(tpl)
    subprocess.check_call(["node", os.path.join(ROOT, "scripts/pdf.js"), out,
                           os.path.join(ROOT, "report/syndrome-lab-report.pdf")])


if __name__ == "__main__":
    main()
