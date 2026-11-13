"""Code-capacity depolarizing noise (the setting of the web playground).

Each data qubit suffers X, Y or Z with probability p/3 each; syndromes are measured perfectly
once. The network sees both syndrome types on a (d+1) x (d+1) grid and predicts two bits:
whether logical Z and logical X were flipped. MWPM decodes X and Z errors independently.
"""
from __future__ import annotations

import time

import numpy as np
import pymatching
import torch
from torch import nn

from . import code, models

P_TRAIN = (0.04, 0.08, 0.12, 0.16)
P_TEST = (0.02, 0.04, 0.06, 0.08, 0.10, 0.12, 0.14, 0.16, 0.18)


class Capacity:
    def __init__(self, d: int):
        self.d = d
        self.lay = code.layout(d)
        self.hx, self.hz, self.lx, self.lz = code.matrices(d)
        stabs = self.lay["stabs"]
        self.grid_x = np.array([(s["y"] // 2) * (d + 1) + s["x"] // 2 for s in stabs if s["type"] == "X"])
        self.grid_z = np.array([(s["y"] // 2) * (d + 1) + s["x"] // 2 for s in stabs if s["type"] == "Z"])
        self.mx = pymatching.Matching(self.hx)  # corrects Z errors
        self.mz = pymatching.Matching(self.hz)  # corrects X errors

    def sample(self, p: float, n: int, rng: np.random.Generator):
        """Returns (grid float32 [N, d+1, d+1], labels bool [N, 2] = (flip of Lz, flip of Lx), sz, sx)."""
        r = rng.random((n, self.d * self.d))
        ex = (r < 2 * p / 3).astype(np.uint8)                    # X or Y
        ez = ((r >= p / 3) & (r < p)).astype(np.uint8)           # Y or Z
        sz = ex @ self.hz.T % 2
        sx = ez @ self.hx.T % 2
        grid = np.zeros((n, (self.d + 1) ** 2), dtype=np.float32)
        grid[:, self.grid_z] = sz
        grid[:, self.grid_x] = sx
        labels = np.stack([ex @ self.lz % 2, ez @ self.lx % 2], 1).astype(bool)
        return grid.reshape(n, self.d + 1, self.d + 1), labels, sz, sx

    def mwpm(self, sz, sx):
        """MWPM prediction of the two labels, bool [N, 2]."""
        cx = self.mz.decode_batch(sz)
        cz = self.mx.decode_batch(sx)
        return np.stack([cx @ self.lz % 2, cz @ self.lx % 2], 1).astype(bool)


def train(d: int, seed: int, steps: int, batch: int = 512, lr: float = 2e-3, channels: int = 32,
          blocks: int = 2, out=None):
    torch.manual_seed(seed)
    cap = Capacity(d)
    rng = np.random.default_rng(5000 + seed)
    model = models.CNN((d + 1, d + 1), channels=channels, blocks=blocks, outputs=2)
    opt = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=1e-4)
    sched = torch.optim.lr_scheduler.OneCycleLR(opt, lr, total_steps=steps, pct_start=0.05)
    loss_fn = nn.BCEWithLogitsLoss()
    t0 = time.time()
    per = batch // len(P_TRAIN)
    for step in range(1, steps + 1):
        parts = [cap.sample(p, per, rng)[:2] for p in P_TRAIN]
        x = torch.from_numpy(np.concatenate([a for a, _ in parts]))
        y = torch.from_numpy(np.concatenate([b for _, b in parts]).astype(np.float32))
        loss = loss_fn(model(x), y)
        opt.zero_grad(set_to_none=True)
        loss.backward()
        opt.step()
        sched.step()
        if step % 2000 == 0 or step == steps:
            print(f"[capacity d={d} s={seed}] step {step}/{steps} loss {loss.item():.4f} {time.time() - t0:.0f}s",
                  flush=True)
    model.eval()
    meta = dict(kind="capacity-cnn", distance=d, seed=seed, steps=steps, batch=batch, lr=lr,
                samples=steps * per * len(P_TRAIN), p_train=list(P_TRAIN),
                parameters=models.count_parameters(model), train_seconds=round(time.time() - t0, 1))
    if out:
        models.save(model, out, **meta)
    return model, meta
