"""Validation of the whole pipeline against published results."""
import numpy as np
import pytest
import sinter

from syndromelab import circuits, data, mwpm, stats


def _fails(circuit, shots, seed, correlated=False):
    det, obs = data.sample(circuit, shots, seed)
    return int((mwpm.decode(mwpm.matching(circuit, correlated), det, correlated) != obs).sum())


@pytest.mark.parametrize("noise", ["si1000", "sd"])
@pytest.mark.parametrize("d", [3, 5])
def test_mwpm_corrects_every_single_fault(noise, d):
    """A distance >= 3 code with MWPM must correct any single circuit fault."""
    c = circuits.make(noise, d, d, 0.001)
    dem = c.detector_error_model(decompose_errors=True).flattened()
    m = mwpm.matching(c)
    rows, truth = [], []
    for inst in dem:
        if inst.type != "error":
            continue
        row, o = np.zeros(c.num_detectors, bool), False
        for t in inst.targets_copy():
            if t.is_relative_detector_id():
                row[t.val] ^= True
            elif t.is_logical_observable_id():
                o ^= True
        rows.append(row)
        truth.append(o)
    assert len(rows) > 100
    assert np.array_equal(mwpm.decode(m, np.array(rows)), np.array(truth))


def test_code_capacity_threshold_matches_published_10_3_percent():
    """MWPM threshold for independent bit flips is 10.3% (Dennis et al. 2002; Wang et al. 2003)."""
    ps = [0.08, 0.09, 0.10, 0.11, 0.12]
    n = 60000
    k = {d: [_fails(circuits.code_capacity(d, p), n, 100 + d) for p in ps] for d in (5, 9, 13)}
    for a, b in ((5, 9), (9, 13)):
        cross = stats.crossing(ps, k[a], k[b], n, n)
        assert cross is not None and 0.095 < cross < 0.110


def test_circuit_noise_threshold_in_published_range():
    """Circuit-level MWPM thresholds for the surface code sit between ~0.4% and ~1%."""
    n = 40000
    for noise, lo, hi in (("si1000", 0.003, 0.008), ("sd", 0.004, 0.010)):
        ps = [0.002, 0.004, 0.006, 0.008, 0.010]
        k3 = [_fails(circuits.make(noise, 3, 3, p), n, 1) for p in ps]
        k5 = [_fails(circuits.make(noise, 5, 5, p), n, 2) for p in ps]
        cross = stats.crossing(ps, k3, k5, n, n)
        assert cross is not None and lo < cross < hi


def test_below_threshold_distance_helps_above_it_hurts():
    n = 100000
    low = [_fails(circuits.si1000(d, d, 0.002), n, 3) for d in (3, 5)]
    high = [_fails(circuits.si1000(d, d, 0.010), n, 3) for d in (3, 5)]
    assert low[1] < low[0] and high[1] > high[0]


def test_correlated_matching_is_not_worse_at_d5():
    c = circuits.si1000(5, 5, 0.004)
    assert _fails(c, 100000, 4, correlated=True) < _fails(c, 100000, 4)


def test_our_monte_carlo_agrees_with_sinter():
    c = circuits.si1000(3, 3, 0.005)
    n = 200000
    ours = _fails(c, n, 5) / n
    stat = sinter.collect(num_workers=1, tasks=[sinter.Task(circuit=c)], decoders=["pymatching"],
                          max_shots=n, max_errors=10**9)[0]
    theirs = stat.errors / stat.shots
    sigma = (ours * (1 - ours) / n + theirs * (1 - theirs) / stat.shots) ** 0.5
    assert abs(ours - theirs) < 5 * sigma
