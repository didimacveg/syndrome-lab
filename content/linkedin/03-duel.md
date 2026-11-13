Image: `images/03-duel.png`

Same errors, same syndrome, two decoders, two different answers.

The classical decoder, MWPM, pairs up the checks that fired using the shortest chains it can find. Its logic: errors are rare, so the explanation with the fewest errors is the most likely one. It has been the standard since 2002 and it is very fast.

It has a blind spot. A quantum error can flip the bit (X), flip the phase (Z), or do both at once (Y). MWPM handles X and Z separately, so it treats one Y error as two unrelated coincidences. In the example below, three Y errors fool it into the wrong correction. The neural network learned from data that those signals come together, and gets it right.

One example proves nothing, though. I searched for this case on purpose, and I can find cases that go the other way. On the site there are preset buttons for both: "network wins" and "MWPM wins".

The fair way to compare is thousands of random errors, the same ones for both decoders. That is the next post.

Try both presets: [link]

Built with help from AI tools. A reproduction, not new research.

#QuantumErrorCorrection #MachineLearning #QuantumComputing
