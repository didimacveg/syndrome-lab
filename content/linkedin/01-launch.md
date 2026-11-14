Image: `images/01-title.png` · Video option: `videos/01-inject-and-correct.mp4`

Quantum computers make mistakes constantly. The hard part is not building more qubits. It is noticing the errors and fixing them without looking at the data.

I built Syndrome Lab to understand how that works. It is an open lab where you can click on a simulated quantum chip, inject errors, and watch two decoders try to fix them: the classical algorithm everyone uses (minimum-weight perfect matching) and a small neural network I trained on a CPU.

To be clear about what this is: a reproduction of known results at small scale. Not new research. Google DeepMind's AlphaQubit showed in 2024 that neural decoders can beat classical ones. I wanted to see how much of that I could reproduce with a laptop-class machine and an honest comparison.

Short answer: the network wins on the smallest code, and loses as the code grows. Both results are published.

I am 17 and in my last year of secondary school in Madrid. I built this with a lot of help from AI coding tools, and I say so everywhere in the project.

Try it: https://didimacveg.github.io/syndrome-lab/
Code, data and trained models: https://github.com/didimacveg/syndrome-lab

#QuantumComputing #QuantumErrorCorrection #MachineLearning #OpenScience
