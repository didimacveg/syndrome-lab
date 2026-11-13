import numpy as np
import pytest

from syndromelab import circuits, data


@pytest.mark.parametrize("d", [3, 5, 7])
def test_lattice_roundtrip(d):
    lat = data.Lattice(d, d)
    assert (lat.T, lat.H, lat.W) == (d + 1, d + 1, d + 1)
    assert lat.num_detectors == (d * d - 1) * d == lat.mask.sum()
    assert len(lat.sites) == d * d - 1
    rng = np.random.default_rng(0)
    dets = rng.random((50, lat.num_detectors)) < 0.3
    vol = lat.to_volume(dets)
    assert vol.shape == (50, d + 1, d + 1, d + 1)
    assert np.array_equal(vol.reshape(50, -1)[:, lat.flat_index] > 0, dets)
    assert vol.sum() == dets.sum()            # nothing written outside detector sites
    assert not vol[:, ~lat.mask].any()


def test_lattice_first_and_last_slices_hold_only_z_checks():
    lat = data.Lattice(5, 5)
    assert lat.mask[0].sum() == lat.mask[-1].sum() == 12
    assert all(lat.mask[t].sum() == 24 for t in range(1, 5))
    assert np.array_equal(lat.mask[0], lat.mask[-1])


def test_lattice_matches_stim_coordinates():
    lat = data.Lattice(3, 3)
    coords = circuits.noiseless(3, 3).get_detector_coordinates()
    dets = np.zeros((1, lat.num_detectors), bool)
    dets[0, 7] = True
    x, y, t = coords[7]
    assert lat.to_volume(dets)[0, int(t), int(y) // 2, int(x) // 2] == 1


def test_stream_shapes_and_determinism():
    a = data.Stream("si1000", 3, 3, (0.002, 0.008), seed=5, chunk=512)
    b = data.Stream("si1000", 3, 3, (0.002, 0.008), seed=5, chunk=512)
    for _ in range(5):  # crosses a refill boundary
        xa, ya = a.batch(200)
        xb, yb = b.batch(200)
        assert xa.shape == (200, 4, 4, 4) and ya.shape == (200,)
        assert xa.dtype == np.float32 and set(np.unique(ya)) <= {0.0, 1.0}
        assert np.array_equal(xa, xb) and np.array_equal(ya, yb)
    c = data.Stream("si1000", 3, 3, (0.002, 0.008), seed=6, chunk=512)
    assert not np.array_equal(c.batch(200)[0], data.Stream("si1000", 3, 3, (0.002, 0.008), 5, 512).batch(200)[0])
