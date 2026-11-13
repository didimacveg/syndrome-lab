Image: `images/02-syndrome.png`

You cannot check a qubit for errors by looking at it. Measuring it destroys the very thing you are protecting. You cannot make a backup copy either: quantum mechanics forbids copying an unknown state.

So how do you correct errors at all?

You ask the neighbours. In a surface code, extra qubits measure the parity of small groups of data qubits: "are you four the same or not?" That question reveals nothing about the stored information, but it changes its answer when an error happens nearby.

The pattern of checks that fire is called the syndrome. One detail took me a while to see: a chain of errors only lights up the checks at its two ends. The middle stays dark. A decoder sees the ends and has to guess the chain.

And if a chain runs all the way across the chip, nothing lights up at all. That is a logical error: undetectable, and fatal for the computation.

In the lab you can draw these chains yourself and watch the checks respond: [link]

Built with help from AI tools. A reproduction for learning, not new research.

#QuantumComputing #QuantumErrorCorrection #Physics
