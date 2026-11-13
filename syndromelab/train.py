"""Training loop for the circuit-noise decoders.

Deterministic given (config, seed, threads) when it runs uninterrupted. If a run is interrupted it
resumes from its last checkpoint with a fresh data stream; the step of each resume is recorded in
the model metadata ("resumed_at"), so interrupted runs are identifiable.
"""
from __future__ import annotations

import json
import os
import time

import numpy as np
import torch
from torch import nn

from . import P_GRID, circuits, data, models, mwpm


def make_model(kind: str, lat: data.Lattice, **kw) -> nn.Module:
    if kind == "cnn":
        return models.CNN((lat.T, lat.H, lat.W), **kw)
    if kind == "rt":
        return models.RT(lat.site_flat, **kw)
    raise ValueError(kind)


def train(kind: str, distance: int, seed: int, steps: int, batch: int = 256, lr: float = 2e-3,
          noise: str = "si1000", ps=P_GRID, model_kw=None, log_every: int = 500, out=None,
          val_shots: int = 20000):
    torch.manual_seed(seed)
    rounds = distance
    lat = data.Lattice(distance, rounds)
    model = make_model(kind, lat, **(model_kw or {}))
    opt = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=1e-4)
    warm = max(1, steps // 50)

    def schedule(s):  # s = number of optimizer steps already taken
        return lr * min(1.0, (s + 1) / warm) * 0.5 * (1 + np.cos(np.pi * min(s, steps) / steps))

    ckpt = str(out) + ".ckpt" if out else None
    start, log, run, elapsed, resumed = 0, [], 0.0, 0.0, []
    if ckpt and os.path.exists(ckpt):
        blob = torch.load(ckpt, map_location="cpu", weights_only=False)
        model.load_state_dict(blob["model"])
        opt.load_state_dict(blob["opt"])
        start, log, run, elapsed = blob["step"], blob["log"], blob["run"], blob["elapsed"]
        resumed = blob["resumed"] + [start]
        print(f"resuming from step {start}", flush=True)
    stream = data.Stream(noise, distance, rounds, ps, seed=1000 + seed + 7919 * start)
    loss_fn = nn.BCEWithLogitsLoss()
    # small validation set at the middle of the sweep, with its MWPM score for context
    vc = circuits.make(noise, distance, rounds, 0.005)
    vdet, vobs = data.sample(vc, val_shots, seed=777)
    vx = lat.to_volume(vdet)
    v_mwpm = float((mwpm.decode(mwpm.matching(vc), vdet) != vobs).mean())
    t0 = time.time() - elapsed
    model.train()
    for step in range(start + 1, steps + 1):
        for group in opt.param_groups:
            group["lr"] = schedule(step - 1)
        x, y = stream.batch(batch)
        loss = loss_fn(model(torch.from_numpy(x))[:, 0], torch.from_numpy(y))
        opt.zero_grad(set_to_none=True)
        loss.backward()
        nn.utils.clip_grad_norm_(model.parameters(), 1.0)
        opt.step()
        run = loss.item() if step == 1 else 0.98 * run + 0.02 * loss.item()
        if step % log_every == 0 or step == steps:
            model.eval()
            v = float((models.predict(model, vx) != vobs).mean())
            model.train()
            log.append(dict(step=step, loss=round(run, 5), val_fail=v, seconds=round(time.time() - t0, 1)))
            print(f"[{kind} d={distance} s={seed}] step {step}/{steps} loss {run:.4f} "
                  f"val {v:.4f} (mwpm {v_mwpm:.4f}) {time.time() - t0:.0f}s", flush=True)
            if ckpt and step < steps:
                torch.save(dict(model=model.state_dict(), opt=opt.state_dict(), step=step, log=log, run=run,
                                elapsed=time.time() - t0, resumed=resumed), ckpt + ".tmp")
                os.replace(ckpt + ".tmp", ckpt)
    model.eval()
    meta = dict(kind=kind, distance=distance, rounds=rounds, seed=seed, steps=steps, batch=batch, lr=lr,
                noise=noise, ps=list(ps), samples=steps * batch, parameters=models.count_parameters(model),
                train_seconds=round(time.time() - t0, 1), val_mwpm=v_mwpm, log=log, resumed_at=resumed,
                torch=str(torch.__version__), threads=torch.get_num_threads())
    if out:
        models.save(model, out, **meta)
        with open(str(out).replace(".pt", ".json"), "w") as f:
            json.dump(meta, f, indent=1)
        if os.path.exists(ckpt):
            os.remove(ckpt)
    return model, meta
