import math

import numpy as np
import pytest

from syndromelab import stats


def test_wilson_known_values():
    lo, hi = stats.wilson(50, 100)
    assert lo == pytest.approx(0.4038, abs=5e-4) and hi == pytest.approx(0.5962, abs=5e-4)
    lo, hi = stats.wilson(0, 100)
    assert lo == 0.0 and hi == pytest.approx(0.0370, abs=5e-4)
    assert stats.wilson(0, 0) == (0.0, 1.0)


def test_wilson_coverage_is_about_95_percent():
    rng = np.random.default_rng(0)
    p, n = 0.01, 5000
    ks = rng.binomial(n, p, size=4000)
    covered = np.mean([lo <= p <= hi for lo, hi in (stats.wilson(int(k), n) for k in ks)])
    assert 0.93 < covered < 0.97


def test_wilson_narrows_with_more_shots():
    w = lambda n: np.diff(stats.wilson(n // 100, n))[0]
    assert w(1000) > w(10000) > w(100000)


def test_mcnemar():
    assert stats.mcnemar(0, 0) == 1.0
    assert stats.mcnemar(10, 10) == 1.0
    assert stats.mcnemar(0, 10) == pytest.approx(2 / 1024)
    assert stats.mcnemar(5, 40) < 1e-6
    assert stats.mcnemar(3, 9) == stats.mcnemar(9, 3)


def test_paired_ratio_point_estimate_and_interval():
    r, lo, hi = stats.paired_ratio(both=800, only_a=100, only_b=200, n=100000)
    assert r == pytest.approx(0.9) and lo < 0.9 < hi and hi < 1.0  # significantly better
    r, lo, hi = stats.paired_ratio(both=500, only_a=150, only_b=150, n=100000)
    assert r == 1.0 and lo < 1.0 < hi


def test_paired_interval_is_tighter_than_unpaired():
    # same marginal rates; heavy overlap of failures must give a narrower interval
    _, lo1, hi1 = stats.paired_ratio(both=950, only_a=50, only_b=50, n=100000)
    _, lo2, hi2 = stats.paired_ratio(both=10, only_a=990, only_b=990, n=100000)
    assert hi1 - lo1 < 0.5 * (hi2 - lo2)


def test_crossing_recovers_known_threshold():
    ps = np.array([0.002, 0.004, 0.006, 0.008, 0.010])
    n, pth = 10**7, 0.0055
    curve = lambda d: 0.05 * (ps / pth) ** ((d + 1) / 2)
    k3, k5 = np.round(curve(3) * n), np.round(curve(5) * n)
    assert stats.crossing(ps, k3, k5, n, n) == pytest.approx(pth, rel=0.02)
    est, lo, hi = stats.crossing_ci(ps, k3, k5, n, n, boot=300)
    assert lo <= est <= hi and hi - lo < 0.0005


def test_crossing_none_when_curves_do_not_cross():
    ps = [0.001, 0.002, 0.003]
    assert stats.crossing(ps, [100, 200, 300], [10, 20, 30], 10**5, 10**5) is None


def test_per_round_inverts_composition():
    e, r = 0.01, 7
    p_shot = 0.5 * (1 - (1 - 2 * e) ** r)
    assert stats.per_round(p_shot, r) == pytest.approx(e)
    assert stats.per_round(0.6, 3) == 0.5
    assert math.isclose(stats.per_round(0.02, 1), 0.02)
