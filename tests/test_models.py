import numpy as np
import pytest
import torch

from syndromelab import capacity, circuits, data, evaluate, models, train


@pytest.mark.parametrize("d", [3, 5])
def test_output_shapes(d):
    lat = data.Lattice(d, d)
    x = torch.from_numpy(lat.to_volume(np.random.default_rng(0).random((7, lat.num_detectors)) < 0.1))
    assert models.CNN((lat.T, lat.H, lat.W), channels=8, blocks=1)(x).shape == (7, 1)
    assert models.RT(lat.site_flat, dim=16, heads=2)(x).shape == (7, 1)
    assert models.CNN((d + 1, d + 1), channels=8, blocks=1, outputs=2)(x[:, 0]).shape == (7, 2)


def test_rt_accepts_other_numbers_of_rounds():
    net = models.RT(data.Lattice(3, 3).site_flat, dim=16, heads=2)
    for rounds in (2, 3, 9):
        lat = data.Lattice(3, rounds)
        assert net(torch.zeros(2, lat.T, lat.H, lat.W)).shape == (2, 1)


def test_rt_only_reads_stabilizer_sites():
    lat = data.Lattice(3, 3)
    net = models.RT(lat.site_flat, dim=16, heads=2).eval()
    x = torch.zeros(1, lat.T, lat.H, lat.W)
    y = x.clone()
    y[:, :, 0, 0] = 1  # (0, 0) is a corner with no stabilizer
    assert (0, 0) not in lat.sites
    assert torch.equal(net(x), net(y))


def test_save_load_roundtrip(tmp_path):
    lat = data.Lattice(3, 3)
    x = torch.rand(5, lat.T, lat.H, lat.W).round()
    for net in (models.CNN((lat.T, lat.H, lat.W), channels=8, blocks=1), models.RT(lat.site_flat, dim=16, heads=2)):
        net.eval()
        models.save(net, tmp_path / "m.pt", note="x")
        again, meta = models.load(tmp_path / "m.pt")
        assert meta == {"note": "x"}
        assert torch.equal(net(x), again(x))


def test_training_is_deterministic_and_learns():
    a, ma = train.train("cnn", 3, seed=1, steps=500, batch=256, model_kw=dict(channels=16, blocks=1),
                        log_every=500, val_shots=4000)
    b, mb = train.train("cnn", 3, seed=1, steps=500, batch=256, model_kw=dict(channels=16, blocks=1),
                        log_every=500, val_shots=4000)
    assert ma["log"][-1]["val_fail"] == mb["log"][-1]["val_fail"]
    assert all(torch.equal(p, q) for p, q in zip(a.parameters(), b.parameters()))
    # a constant "never flips" guess fails as often as the observable flips; the net must beat it
    c = circuits.si1000(3, 3, 0.005)
    _, obs = data.sample(c, 4000, seed=777)
    assert ma["log"][-1]["val_fail"] < 0.9 * obs.mean()


def test_capacity_training_beats_trivial_guess():
    net, meta = capacity.train(3, seed=0, steps=400, batch=256, channels=16, blocks=1)
    cap = capacity.Capacity(3)
    grid, labels, sz, sx = cap.sample(0.08, 20000, np.random.default_rng(9))
    fail = (models.predict(net, grid) != labels).any(1).mean()
    assert fail < 0.6 * labels.any(1).mean()


def test_evaluate_point_counts_are_consistent():
    lat = data.Lattice(3, 3)
    torch.manual_seed(0)
    nets = {"a": models.CNN((lat.T, lat.H, lat.W), channels=8, blocks=1).eval()}
    pt = evaluate.evaluate_point(3, "si1000", 0.006, 6000, seed=11, nets=nets, chunk=2500)
    assert pt["shots"] == 6000
    for base in evaluate.BASELINES:
        both, only_net, only_base = pt["paired"][f"a|{base}"]
        assert both + only_net == pt["fails"]["a"]
        assert both + only_base == pt["fails"][base]
    again = evaluate.evaluate_point(3, "si1000", 0.006, 6000, seed=11, nets=nets, chunk=2500)
    assert again["fails"] == pt["fails"] and again["paired"] == pt["paired"]  # reproducible
    s = evaluate.summarize(pt)
    assert s["ci"]["mwpm"][0] <= s["rate"]["mwpm"] <= s["ci"]["mwpm"][1]
    assert 0 <= s["ratio"]["a|mwpm"]["mcnemar_p"] <= 1


def test_mismatched_weights_do_not_change_the_data():
    a = evaluate.evaluate_point(3, "sd", 0.006, 5000, seed=3)
    b = evaluate.evaluate_point(3, "sd", 0.006, 5000, seed=3, weights_from=("si1000", 0.006))
    assert a["weights_from"] is None and b["weights_from"] == ["si1000", 0.006]
    assert abs(a["fails"]["mwpm"] - b["fails"]["mwpm"]) < 200


def test_interrupted_training_resumes_from_checkpoint(tmp_path):
    out = tmp_path / "m.pt"
    kw = dict(batch=64, model_kw=dict(channels=8, blocks=1), val_shots=500, out=out)
    # a checkpoint is written at every log point except the last one
    train.train("cnn", 3, seed=2, steps=40, log_every=20, **kw)
    assert out.exists() and not (tmp_path / "m.pt.ckpt").exists()
    _, meta = models.load(out)
    assert meta["resumed_at"] == [] and meta["samples"] == 40 * 64
    # simulate a crash: leave a checkpoint behind, then run again with a longer schedule
    import os
    import torch as _t
    net, _ = models.load(out)
    opt = _t.optim.AdamW(net.parameters(), lr=1e-3, weight_decay=1e-4)
    _t.save(dict(model=net.state_dict(), opt=opt.state_dict(), step=40, log=meta["log"], run=0.5, elapsed=1.0,
                 resumed=[]), str(out) + ".ckpt")
    os.remove(out)
    _, meta2 = train.train("cnn", 3, seed=2, steps=60, log_every=20, **kw)
    assert meta2["resumed_at"] == [40]
    assert [e["step"] for e in meta2["log"]] == [20, 40, 60]
    assert not os.path.exists(str(out) + ".ckpt")
