Image: `images/07-latency.png`

My neural decoder is more accurate than the classical one on small codes. It is also between 60 and 320 times slower.

That is not a detail. A superconducting quantum chip produces a new round of error information roughly every microsecond. A decoder that falls behind is useless, however accurate it is.

Measured on one CPU core, per shot, at distance 7:
MWPM: 8.5 microseconds
My network: 507 microseconds

Is that a fair fight? No, and I want to be straight about it. PyMatching is heavily optimized C++. My network runs in plain PyTorch with no optimization at all. Real-time neural decoders do exist: DeepMind's follow-up to AlphaQubit reports decoding within a microsecond per cycle on dedicated accelerators. Mine is nowhere near that, and nothing in my project says it could be.

What I took from this: accuracy is only one axis. Speed, hardware cost and robustness to noise you did not train on are the others. My recurrent model, for example, fails when run for more rounds than it was trained on.

All of this is on the results page, losses included: [link]

Built with help from AI tools. A reproduction, not new research.

#QuantumComputing #MachineLearning #Engineering
