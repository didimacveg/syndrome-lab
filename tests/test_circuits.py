import numpy as np
import pytest
import stim

from syndromelab import circuits, data

NOISE_OPS = {"DEPOLARIZE1", "DEPOLARIZE2", "X_ERROR", "Z_ERROR"}


@pytest.mark.parametrize("d", [3, 5])
def test_si1000_keeps_structure(d):
    base, noisy = circuits.noiseless(d, d), circuits.si1000(d, d, 0.003)
    assert noisy.num_detectors == base.num_detectors == (d * d - 1) * d
    assert noisy.num_observables == 1
    assert noisy.num_measurements == base.num_measurements
    assert noisy.get_detector_coordinates() == base.get_detector_coordinates()


def test_si1000_rates_are_the_published_ones():
    p = 0.004
    seen = {}
    for op in circuits.si1000(3, 3, p):
        if op.name in NOISE_OPS or op.name in ("M", "MR"):
            seen.setdefault(op.name, set()).update(round(a, 9) for a in op.gate_args_copy())
    assert seen["DEPOLARIZE2"] == {p}                      # two-qubit gates
    assert seen["DEPOLARIZE1"] == {round(p / 10, 9), 2 * p}  # 1q gates + gate idle, measurement idle
    assert seen["X_ERROR"] == {2 * p}                      # reset
    assert seen["M"] == {5 * p} and seen["MR"] == {5 * p}  # measurement flips


def test_si1000_every_qubit_gets_noise_every_moment():
    c = circuits.si1000(3, 3, 0.001)
    qubits = set(c.get_final_qubit_coordinates())
    moment, checked = set(), 0
    for op in list(c) + [stim.CircuitInstruction("TICK", [])]:
        if op.name == "TICK":
            if moment:
                assert moment == qubits
                checked += 1
            moment = set()
        elif op.name in NOISE_OPS or (op.name in ("M", "MR") and op.gate_args_copy()):
            moment.update(t.value for t in op.targets_copy())
    assert checked == 1 + 3 * 7  # initial reset + 7 moments per round


@pytest.mark.parametrize("noise", ["si1000", "sd"])
def test_zero_noise_gives_no_events(noise):
    det, obs = data.sample(circuits.make(noise, 3, 3, 0.0), 2000, seed=1)
    assert not det.any() and not obs.any()


@pytest.mark.parametrize("noise", ["si1000", "sd"])
def test_error_model_is_graphlike_after_decomposition(noise):
    dem = circuits.make(noise, 5, 5, 0.002).detector_error_model(decompose_errors=True)
    assert dem.num_detectors == 120 and dem.num_errors > 0


def test_sampling_is_reproducible():
    c = circuits.si1000(3, 3, 0.005)
    a, b = data.sample(c, 5000, seed=42), data.sample(c, 5000, seed=42)
    assert np.array_equal(a[0], b[0]) and np.array_equal(a[1], b[1])
    assert not np.array_equal(a[0], data.sample(c, 5000, seed=43)[0])


def test_more_noise_means_more_events():
    rates = [data.sample(circuits.si1000(3, 3, p), 20000, 3)[0].mean() for p in (0.001, 0.003, 0.009)]
    assert rates[0] < rates[1] < rates[2]


def test_code_capacity_only_has_data_flips():
    c = circuits.code_capacity(5, 0.07)
    noise = [op for op in c if op.name in NOISE_OPS]
    assert len(noise) == 1 and noise[0].name == "X_ERROR" and len(noise[0].targets_copy()) == 25
    assert all(op.gate_args_copy() == [] for op in c if op.name in ("M", "MR"))
