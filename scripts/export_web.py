"""Export everything the static site needs into web/data/ (layouts, weights, fixtures, results)."""
import argparse
import base64
import json
import os
import sys

import numpy as np
import torch

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
from syndromelab import capacity, code, models  # noqa: E402


def export_model(path):
    net, meta = models.load(path)
    tensors = {k: dict(shape=list(v.shape), data=base64.b64encode(v.numpy().astype("<f4").tobytes()).decode())
               for k, v in net.state_dict().items()}
    return net, dict(config=net.config, meta=meta, tensors=tensors)


def fixtures(d, net, n=300, seed=7):
    """Random syndromes with PyMatching weights and PyTorch logits, for the JavaScript tests."""
    cap, rng = capacity.Capacity(d), np.random.default_rng(seed)
    lay = cap.lay
    order_z = [i for i, s in enumerate(lay["stabs"]) if s["type"] == "Z"]
    order_x = [i for i, s in enumerate(lay["stabs"]) if s["type"] == "X"]
    rows = []
    for p in (0.03, 0.08, 0.15, 0.3):
        grid, labels, sz, sx = cap.sample(p, n // 4, rng)
        with torch.no_grad():
            logits = net(torch.from_numpy(grid)).numpy()
        _, wz = cap.mz.decode_batch(sz, return_weights=True)
        _, wx = cap.mx.decode_batch(sx, return_weights=True)
        for i in range(len(grid)):
            synd = [0] * len(lay["stabs"])
            for k, s in enumerate(order_z):
                synd[s] = int(sz[i, k])
            for k, s in enumerate(order_x):
                synd[s] = int(sx[i, k])
            rows.append(dict(syndrome=synd, weight=float(wz[i] + wx[i]), logits=[float(v) for v in logits[i]],
                             labels=[int(v) for v in labels[i]]))
    return rows


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--models", default=os.path.join(ROOT, "models"))
    ap.add_argument("--out", default=os.path.join(ROOT, "web/data"))
    args = ap.parse_args()
    os.makedirs(args.out, exist_ok=True)
    fx = {}
    for d in (3, 5):
        json.dump(code.layout(d), open(os.path.join(args.out, f"layout_d{d}.json"), "w"))
        net, blob = export_model(os.path.join(args.models, f"capacity_d{d}_s0.pt"))
        json.dump(blob, open(os.path.join(args.out, f"capacity_d{d}.json"), "w"))
        torch.onnx.export(net, torch.zeros(1, d + 1, d + 1), os.path.join(args.models, f"capacity_d{d}_s0.onnx"),
                          input_names=["syndrome"], output_names=["logits"],
                          dynamic_axes={"syndrome": {0: "batch"}, "logits": {0: "batch"}}, dynamo=False)
        fx[str(d)] = fixtures(d, net)
    os.makedirs(os.path.join(ROOT, "tests_js"), exist_ok=True)
    json.dump(fx, open(os.path.join(ROOT, "tests_js/fixtures.json"), "w"))
    try:
        from scripts import web_results
    except ImportError:
        sys.path.insert(0, os.path.join(ROOT, "scripts"))
        import web_results
    web_results.build(ROOT, args.out)


if __name__ == "__main__":
    main()
