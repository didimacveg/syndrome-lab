import numpy as np
import pytest

from syndromelab import capacity, code


@pytest.mark.parametrize("d", [3, 5, 7])
def test_layout_is_a_valid_distance_d_code(d):
    hx, hz, lx, lz = code.matrices(d)
    assert hx.shape == hz.shape == ((d * d - 1) // 2, d * d)
    assert not (hx @ hz.T % 2).any()                 # stabilizers commute
    assert not (hx @ lz % 2).any() and not (hz @ lx % 2).any()  # logicals commute with checks
    assert (lx @ lz) % 2 == 1                        # logical X and Z anticommute
    assert lx.sum() == lz.sum() == d                 # weight d: the code distance
    assert set(np.unique(hx.sum(1))) <= {2, 4} and set(np.unique(hz.sum(1))) <= {2, 4}


def test_layout_d3_explicit():
    lay = code.layout(3)
    assert lay["data"][0] == (1, 1) and lay["data"][-1] == (5, 5)
    assert lay["logical_z"] == [0, 1, 2] and lay["logical_x"] == [0, 3, 6]
    assert sum(s["type"] == "X" for s in lay["stabs"]) == 4


@pytest.mark.parametrize("d", [3, 5])
def test_mwpm_corrects_every_single_qubit_pauli(d):
    cap = capacity.Capacity(d)
    n = d * d
    for q in range(n):
        for ex, ez in ((1, 0), (0, 1), (1, 1)):
            vx, vz = np.zeros(n, np.uint8), np.zeros(n, np.uint8)
            vx[q], vz[q] = ex, ez
            sz, sx = vx @ cap.hz.T % 2, vz @ cap.hx.T % 2
            truth = np.array([vx @ cap.lz % 2, vz @ cap.lx % 2], bool)
            assert np.array_equal(cap.mwpm(sz[None], sx[None])[0], truth)


def test_capacity_sample_is_consistent():
    cap = capacity.Capacity(5)
    grid, labels, sz, sx = cap.sample(0.1, 4000, np.random.default_rng(1))
    assert grid.shape == (4000, 6, 6) and labels.shape == (4000, 2)
    assert grid.sum() == sz.sum() + sx.sum()
    assert np.array_equal(grid.reshape(4000, -1)[:, cap.grid_z], sz)
    # Y errors are present: X and Z components correlate
    assert 0.25 < labels.any(1).mean() < 0.75
    grid0, labels0, *_ = cap.sample(0.0, 100, np.random.default_rng(1))
    assert not grid0.any() and not labels0.any()
