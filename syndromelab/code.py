"""Explicit rotated surface code layout, read off Stim's own circuit so both always agree."""
from __future__ import annotations

from functools import lru_cache

import numpy as np
import stim


def _observable_support(circuit: stim.Circuit, data: list[int]) -> list[int]:
    flat = circuit.flattened()
    final = [op for op in flat if op.name in ("M", "MX")][-1]
    qs = [t.value for t in final.targets_copy()]
    obs = [op for op in flat if op.name == "OBSERVABLE_INCLUDE"][-1]
    return sorted(data.index(qs[t.value]) for t in obs.targets_copy())


@lru_cache(maxsize=None)
def layout(d: int) -> dict:
    """Returns the code as plain Python data.

    data: [(x, y)] of the d*d data qubits (Stim coordinates, odd integers)
    stabs: [{"type": "X"|"Z", "x", "y", "support": [data indices]}]
    logical_z / logical_x: data indices of one representative of each logical operator
    """
    cz = stim.Circuit.generated("surface_code:rotated_memory_z", distance=d, rounds=1)
    cx = stim.Circuit.generated("surface_code:rotated_memory_x", distance=d, rounds=1)
    flat = cz.flattened()
    coords = {q: (int(c[0]), int(c[1])) for q, c in cz.get_final_qubit_coordinates().items()}
    data = sorted([t.value for t in [op for op in flat if op.name == "M"][-1].targets_copy()],
                  key=lambda q: (coords[q][1], coords[q][0]))
    x_anc = {t.value for t in next(op for op in flat if op.name == "H").targets_copy()}
    anc = sorted(set(coords) - set(data), key=lambda q: (coords[q][1], coords[q][0]))
    support = {a: set() for a in anc}
    for op in flat:
        if op.name == "CX":
            ts = [t.value for t in op.targets_copy()]
            for c, t in zip(ts[::2], ts[1::2]):
                a, q = (c, t) if c in support else (t, c)
                support[a].add(data.index(q))
    stabs = [dict(type="X" if a in x_anc else "Z", x=coords[a][0], y=coords[a][1],
                  support=sorted(support[a])) for a in anc]
    return dict(d=d, data=[coords[q] for q in data], stabs=stabs,
                logical_z=_observable_support(cz, data), logical_x=_observable_support(cx, data))


def matrices(d: int):
    """(Hx, Hz, Lx, Lz) as uint8 arrays over the data qubits.

    Hz rows are Z-type stabilizers (they detect X errors); Hx rows detect Z errors.
    """
    lay = layout(d)
    n = d * d

    def rows(kind):
        m = np.zeros((sum(s["type"] == kind for s in lay["stabs"]), n), dtype=np.uint8)
        for i, s in enumerate(s for s in lay["stabs"] if s["type"] == kind):
            m[i, s["support"]] = 1
        return m

    lx, lz = np.zeros(n, np.uint8), np.zeros(n, np.uint8)
    lx[lay["logical_x"]] = 1
    lz[lay["logical_z"]] = 1
    return rows("X"), rows("Z"), lx, lz
