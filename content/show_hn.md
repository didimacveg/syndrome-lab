# Show HN draft

**Title (max 80 characters):**

Show HN: Syndrome Lab – break a simulated quantum chip, watch two decoders fix it

**URL:** the GitHub Pages site (not the repository)

**First comment (post it yourself right after submitting):**

Hi HN. I'm 17, in my last year of secondary school in Madrid. I wanted to understand quantum error correction decoders, so I built a small lab around one question: can a neural network trained on a CPU out-decode minimum-weight perfect matching (MWPM) on the surface code?

This is a reproduction of known results (AlphaQubit and earlier work), not new research. What I tried to do well is the comparison.

What's there:

- A playground: click data qubits to inject X/Y/Z errors, see the syndrome, and step through how MWPM and a small CNN each correct it. Both decoders run in your browser in plain JavaScript, no WASM, no dependencies. The JS matcher is tested against PyMatching and the JS network against PyTorch.
- Results under circuit-level noise (SI1000) for distances 3, 5, 7: Stim for simulation, PyMatching as baseline, same test shots for every decoder, three seeds, paired bootstrap intervals.
- A 9-page report and a method page listing the limitations.

What I found, at 0.3% physical error rate (network errors / MWPM errors):

- d=3: 0.88, network wins
- d=5: 0.82 vs plain MWPM, but 1.05 vs PyMatching's correlated matching, so it loses to the stronger classical baseline
- d=7: 4.7, network loses badly with my budget (3M training shots, about an hour of CPU)

And the networks are 60 to 320 times slower per shot than PyMatching on a CPU.

Things I know are weak: tiny distances, simulated Pauli noise only, Z-basis memory only, SI1000 rates applied to Stim's CX circuit rather than a CZ compilation, a recurrent transformer that is clearly under-trained at d=5 and does not generalize to more rounds, and thresholds that are really just finite-size crossings.

I used AI coding tools heavily to build this and I say so in the repo. I've tried to make sure I understand every piece, but if something is wrong I'd like to know.

Everything reruns with `make all` (hours on 4 cores) or `make all SCALE=0.01` (minutes, meaningless numbers, but it exercises the pipeline).

Repo: https://github.com/didimacveg/syndrome-lab

**Notes for Diego (do not post):**

- Post between 14:00 and 17:00 Madrid time, Tuesday to Thursday. Stay online for three hours and answer every comment.
- HN readers will include people who work on this. Answer "I don't know" when you don't. Do not argue.
- Expected hard questions: why not belief-matching or tensor-network baselines (answer: out of scope, would be a good addition), why CX instead of CZ (answer: DECISIONS.md D6), how much the AI did (answer honestly).
- Do not ask for upvotes anywhere. It gets posts killed.
- Replace the repo URL if you rename the repository.
