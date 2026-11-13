"""Statistics: confidence intervals, paired comparisons, threshold crossings."""
from __future__ import annotations

import math

import numpy as np
from scipy import stats as _st


def wilson(k: int, n: int, z: float = 1.959964) -> tuple[float, float]:
    """Wilson score interval for a binomial proportion (95% by default)."""
    if n == 0:
        return (0.0, 1.0)
    ph = k / n
    den = 1 + z * z / n
    centre = (ph + z * z / (2 * n)) / den
    half = z * math.sqrt(ph * (1 - ph) / n + z * z / (4 * n * n)) / den
    return (max(0.0, centre - half), min(1.0, centre + half))


def mcnemar(only_a: int, only_b: int) -> float:
    """Exact two-sided McNemar p-value from the discordant counts."""
    n = only_a + only_b
    if n == 0:
        return 1.0
    return float(min(1.0, 2 * _st.binom.cdf(min(only_a, only_b), n, 0.5)))


def paired_ratio(both: int, only_a: int, only_b: int, n: int, boot: int = 4000, seed: int = 0):
    """Ratio of failure rates a/b on the same shots, with a paired bootstrap 95% interval.

    both: shots where a and b both fail; only_a / only_b: shots where only one fails.
    """
    fa, fb = both + only_a, both + only_b
    ratio = fa / fb if fb else float("nan")
    rng = np.random.default_rng(seed)
    probs = np.array([both, only_a, only_b, n - both - only_a - only_b], dtype=float) / n
    draws = rng.multinomial(n, probs, size=boot)
    a, b = draws[:, 0] + draws[:, 1], draws[:, 0] + draws[:, 2]
    ok = b > 0
    r = a[ok] / b[ok]
    if len(r) == 0:
        return ratio, float("nan"), float("nan")
    lo, hi = np.percentile(r, [2.5, 97.5])
    return ratio, float(lo), float(hi)


def crossing(ps, k1, k2, n1, n2):
    """p at which two logical-error curves cross (log-log linear interpolation).

    k1/k2: failure counts of the smaller/larger distance at each p. Returns None if no crossing.
    Below threshold the larger distance has the lower error; above, the higher.
    """
    ps = np.asarray(ps, float)
    r1 = np.asarray(k1, float) / np.asarray(n1, float)
    r2 = np.asarray(k2, float) / np.asarray(n2, float)
    ok = (r1 > 0) & (r2 > 0)
    ps, r1, r2 = ps[ok], r1[ok], r2[ok]
    diff = np.log(r2) - np.log(r1)
    for i in range(len(ps) - 1):
        if diff[i] < 0 <= diff[i + 1]:
            x0, x1 = math.log(ps[i]), math.log(ps[i + 1])
            t = -diff[i] / (diff[i + 1] - diff[i])
            return math.exp(x0 + t * (x1 - x0))
    return None


def crossing_ci(ps, k1, k2, n1, n2, boot: int = 2000, seed: int = 0):
    """Crossing estimate with a parametric (binomial) bootstrap 95% interval."""
    est = crossing(ps, k1, k2, n1, n2)
    rng = np.random.default_rng(seed)
    n1 = np.broadcast_to(np.asarray(n1), np.shape(k1))
    n2 = np.broadcast_to(np.asarray(n2), np.shape(k2))
    vals = []
    for _ in range(boot):
        c = crossing(ps, rng.binomial(n1, np.asarray(k1) / n1), rng.binomial(n2, np.asarray(k2) / n2), n1, n2)
        if c is not None:
            vals.append(c)
    if est is None or len(vals) < boot // 2:
        return est, None, None
    lo, hi = np.percentile(vals, [2.5, 97.5])
    return est, float(lo), float(hi)


def per_round(p_shot: float, rounds: int) -> float:
    """Logical error per round from the per-shot rate: 1-2p = (1-2e)^rounds."""
    if p_shot >= 0.5:
        return 0.5
    return 0.5 * (1 - (1 - 2 * p_shot) ** (1 / rounds))
