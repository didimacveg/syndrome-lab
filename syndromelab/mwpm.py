"""Classical reference decoders built on PyMatching."""
from __future__ import annotations

import numpy as np
import pymatching
import stim


def matching(circuit: stim.Circuit, correlated: bool = False) -> pymatching.Matching:
    dem = circuit.detector_error_model(decompose_errors=True)
    if correlated:
        return pymatching.Matching.from_detector_error_model(dem, enable_correlations=True)
    return pymatching.Matching.from_detector_error_model(dem)


def decode(m: pymatching.Matching, dets: np.ndarray, correlated: bool = False) -> np.ndarray:
    """Predicted observable flip, bool [N]."""
    if correlated:
        return m.decode_batch(dets, enable_correlations=True)[:, 0].astype(bool)
    return m.decode_batch(dets)[:, 0].astype(bool)
