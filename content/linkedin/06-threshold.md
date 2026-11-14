Image: `images/06-threshold.png` · Video option: `videos/02-threshold.mp4`

One chart explains why quantum error correction is possible at all.

Each line is a surface code of a different size. Horizontal axis: how often a physical component fails. Vertical axis: how often the protected, logical qubit fails.

On the left, the bigger code is better. Much better: every step up in size cuts logical errors by a large factor.

On the right, the bigger code is worse. More qubits just means more places for things to go wrong.

The crossing point is the threshold. Below it, you can make a logical qubit as reliable as you want by making the code bigger. Above it, you cannot. For decades the whole field has been about getting hardware under that line. In 2024 Google reported a surface code operating below it.

In my simulation, with the standard decoder and a noise model inspired by superconducting chips, the lines cross at about 0.5%, in line with published values. A caveat I owe you: with codes this small, the crossing is only a rough, biased estimate of the true threshold.

A better decoder moves the crossing to the right. That is why decoders matter.

Interactive version: https://didimacveg.github.io/syndrome-lab/

Built with help from AI tools. A reproduction, not new research.

#QuantumComputing #QuantumErrorCorrection #Physics
