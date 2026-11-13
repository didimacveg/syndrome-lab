"""Neural decoders. All predict logits for logical observable flips from detection events."""
from __future__ import annotations

import json
import math

import torch
from torch import nn


class _Res(nn.Module):
    def __init__(self, conv, ch: int):
        super().__init__()
        self.a, self.b = conv(ch, ch, 3, padding=1), conv(ch, ch, 3, padding=1)
        self.act = nn.GELU()

    def forward(self, x):
        return x + self.b(self.act(self.a(self.act(x))))


class CNN(nn.Module):
    """Convolutional decoder over the detection-event volume.

    dims=3: input [N, T, H, W], 3D convolutions over (round, row, col)  (circuit noise).
    dims=2: input [N, H, W], 2D convolutions (code-capacity noise, one perfect round).
    A learned positional bias tells the network where boundaries and stabilizer types are.
    """

    def __init__(self, shape, channels: int = 32, blocks: int = 2, neck: int = 8,
                 hidden: int = 128, outputs: int = 1):
        super().__init__()
        self.shape = tuple(shape)
        self.dims = len(self.shape)
        conv = nn.Conv3d if self.dims == 3 else nn.Conv2d
        self.stem = conv(1, channels, 3, padding=1)
        self.pos = nn.Parameter(torch.zeros(1, channels, *self.shape))
        self.blocks = nn.Sequential(*[_Res(conv, channels) for _ in range(blocks)])
        self.neck = conv(channels, neck, 1)
        self.act = nn.GELU()
        self.head = nn.Sequential(nn.Linear(neck * math.prod(self.shape), hidden), nn.GELU(),
                                  nn.Linear(hidden, outputs))
        self.config = dict(kind="cnn", shape=list(self.shape), channels=channels, blocks=blocks,
                           neck=neck, hidden=hidden, outputs=outputs)

    def forward(self, x):
        x = self.stem(x.unsqueeze(1)) + self.pos
        x = self.act(self.neck(self.act(self.blocks(x))))
        return self.head(x.flatten(1))


class _Block(nn.Module):
    def __init__(self, dim: int, heads: int):
        super().__init__()
        self.n1, self.n2 = nn.LayerNorm(dim), nn.LayerNorm(dim)
        self.attn = nn.MultiheadAttention(dim, heads, batch_first=True)
        self.mlp = nn.Sequential(nn.Linear(dim, 2 * dim), nn.GELU(), nn.Linear(2 * dim, dim))

    def forward(self, x):
        h = self.n1(x)
        x = x + self.attn(h, h, h, need_weights=False)[0]
        return x + self.mlp(self.n2(x))


class RT(nn.Module):
    """Recurrent transformer, a ~1000x smaller cousin of the AlphaQubit idea.

    One state vector per stabilizer. Each round the new detection events are embedded and
    mixed into the state, then one attention block lets stabilizers exchange information.
    The same weights are reused every round, so any number of rounds can be decoded.
    Input [N, T, H, W]; `site_flat` picks the stabilizer positions out of each H*W slice.
    """

    def __init__(self, site_flat, dim: int = 64, heads: int = 4, layers: int = 1, outputs: int = 1):
        super().__init__()
        self.register_buffer("site_flat", torch.as_tensor(site_flat, dtype=torch.long))
        s = len(site_flat)
        self.event = nn.Embedding(2, dim)
        self.pos = nn.Parameter(torch.randn(1, s, dim) * 0.02)
        self.first = nn.Parameter(torch.zeros(1, 1, dim))
        self.last = nn.Parameter(torch.zeros(1, 1, dim))
        self.blocks = nn.ModuleList([_Block(dim, heads) for _ in range(layers)])
        self.norm = nn.LayerNorm(dim)
        self.head = nn.Sequential(nn.Linear(dim, dim), nn.GELU(), nn.Linear(dim, outputs))
        self.config = dict(kind="rt", site_flat=[int(i) for i in site_flat], dim=dim, heads=heads,
                           layers=layers, outputs=outputs)

    def forward(self, x):
        n, t = x.shape[:2]
        ev = x.flatten(2)[:, :, self.site_flat].long()  # [N, T, S]
        state = torch.zeros(n, ev.shape[2], self.pos.shape[2], device=x.device)
        for r in range(t):
            emb = self.event(ev[:, r]) + self.pos
            if r == 0:
                emb = emb + self.first
            if r == t - 1:
                emb = emb + self.last
            state = (state + emb) * 0.7071067811865476
            for blk in self.blocks:
                state = blk(state)
        return self.head(self.norm(state).mean(1))


def build(config: dict) -> nn.Module:
    cfg = dict(config)
    kind = cfg.pop("kind")
    if kind == "cnn":
        return CNN(cfg.pop("shape"), **cfg)
    if kind == "rt":
        return RT(cfg.pop("site_flat"), **cfg)
    raise ValueError(kind)


def count_parameters(model: nn.Module) -> int:
    return sum(p.numel() for p in model.parameters())


def save(model: nn.Module, path, **meta) -> None:
    meta = json.loads(json.dumps(meta, default=str))  # plain types only, so files load with weights_only
    torch.save({"config": model.config, "state": model.state_dict(), "meta": meta}, path)


def load(path) -> tuple[nn.Module, dict]:
    blob = torch.load(path, map_location="cpu", weights_only=True)
    model = build(blob["config"])
    model.load_state_dict(blob["state"])
    model.eval()
    return model, blob.get("meta", {})


@torch.no_grad()
def predict(model: nn.Module, volume, batch: int = 4096):
    """Hard decisions, bool numpy array [N] (or [N, outputs] if outputs > 1)."""
    outs = []
    for i in range(0, len(volume), batch):
        outs.append(model(torch.as_tensor(volume[i:i + batch])) > 0)
    out = torch.cat(outs).numpy()
    return out[:, 0] if out.shape[1] == 1 else out
