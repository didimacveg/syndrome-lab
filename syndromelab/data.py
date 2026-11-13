"""Sampling detection events and mapping them onto the (round, row, col) lattice."""
from __future__ import annotations

import numpy as np
import stim

from . import circuits


class Lattice:
    """Maps the flat detector vector of a memory circuit onto a [T, d+1, d+1] volume.

    Stim places ancillas at even (x, y) coordinates in 0..2d, so (y/2, x/2) indexes a
    (d+1) x (d+1) grid. Detector time coordinate runs 0..rounds, giving T = rounds + 1.
    """

    def __init__(self, distance: int, rounds: int):
        self.d, self.rounds = distance, rounds
        self.T, self.H, self.W = rounds + 1, distance + 1, distance + 1
        c = circuits.noiseless(distance, rounds)
        coords = c.get_detector_coordinates()
        self.num_detectors = c.num_detectors
        idx = np.empty(self.num_detectors, dtype=np.int64)
        for k in range(self.num_detectors):
            x, y, t = coords[k]
            assert x % 2 == 0 and y % 2 == 0
            idx[k] = (int(t) * self.H + int(y) // 2) * self.W + int(x) // 2
        assert len(set(idx.tolist())) == self.num_detectors
        self.flat_index = idx
        # stabilizer sites (row, col) in a fixed order, and whether each is X type
        sites = sorted({(int(y) // 2, int(x) // 2) for x, y, t in coords.values()})
        self.sites = sites
        self.site_flat = np.array([r * self.W + q for r, q in sites], dtype=np.int64)
        mask = np.zeros(self.T * self.H * self.W, dtype=bool)
        mask[idx] = True
        self.mask = mask.reshape(self.T, self.H, self.W)

    def to_volume(self, dets: np.ndarray) -> np.ndarray:
        """bool [N, num_detectors] -> float32 [N, T, H, W]."""
        out = np.zeros((dets.shape[0], self.T * self.H * self.W), dtype=np.float32)
        out[:, self.flat_index] = dets
        return out.reshape(-1, self.T, self.H, self.W)


def sample(circuit: stim.Circuit, shots: int, seed: int):
    """Returns (detection events bool [N, D], observable flips bool [N])."""
    det, obs = circuit.compile_detector_sampler(seed=seed).sample(shots, separate_observables=True)
    return det, obs[:, 0]


class Stream:
    """Endless stream of training batches mixing several physical error rates."""

    def __init__(self, noise: str, distance: int, rounds: int, ps, seed: int, chunk: int = 8192):
        self.lat = Lattice(distance, rounds)
        rng = np.random.default_rng(seed)
        self.samplers = [
            circuits.make(noise, distance, rounds, p).compile_detector_sampler(
                seed=int(rng.integers(2**31)))
            for p in ps]
        self.rng = rng
        self.chunk = chunk
        self._x = self._y = None
        self._pos = 0

    def _refill(self) -> None:
        per = self.chunk // len(self.samplers)
        xs, ys = [], []
        for s in self.samplers:
            det, obs = s.sample(per, separate_observables=True)
            xs.append(det)
            ys.append(obs[:, 0])
        x, y = np.concatenate(xs), np.concatenate(ys)
        perm = self.rng.permutation(len(x))
        self._x, self._y, self._pos = self.lat.to_volume(x[perm]), y[perm].astype(np.float32), 0

    def batch(self, n: int):
        if self._x is None or self._pos + n > len(self._x):
            self._refill()
        a = self._pos
        self._pos += n
        return self._x[a:a + n], self._y[a:a + n]
