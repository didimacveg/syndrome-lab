Image: `images/04-headline.png` · Video option: `videos/03-mwpm-vs-network.mp4`

Does a small neural network beat the standard decoder for quantum error correction? I measured it. The answer depends on the size of the code.

Setup: surface codes of distance 3, 5 and 7, realistic circuit-level noise (faulty gates, faulty measurements), 200,000 test shots per point, and every decoder scored on exactly the same shots. Networks trained on a 4-core CPU.

Logical errors of the network divided by those of MWPM, at 0.3% physical error rate:

Distance 3: 0.88. The network wins.
Distance 5: 0.82. The network wins.
Distance 7: 4.72. The network loses badly.

There is a catch at distance 5. PyMatching also ships a stronger classical decoder, correlated matching. Against that one, my network loses at distance 5: 1.05. If I had only compared with the weaker baseline, the headline would look better and be less true.

Why does it fall apart at distance 7? Budget. The problem grows much faster than my training speed. The published neural decoders that do win at larger sizes were trained on billions of examples. Mine saw 3 million.

This matches what the literature reports. It is a reproduction, not a discovery.

Full results with confidence intervals: [link]

Built with help from AI tools.

#QuantumErrorCorrection #MachineLearning #OpenScience
