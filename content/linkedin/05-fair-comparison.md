Image: `images/05-ratio.png`

The hardest part of this project was not training a neural network. It was building a comparison I could trust.

Five rules I followed, and why:

1. Same test shots for every decoder. Then you can compare shot by shot, and most of the sampling noise cancels out.

2. Give the classical decoder its best case. MWPM gets the exact error model of the noise. No handicap.

3. Add a stronger baseline. Correlated matching flipped my conclusion at distance 5.

4. Several training seeds, all shown. Training has luck in it. Picking the best run and hiding the rest is cheating.

5. Write the hypotheses down before measuring. I wrote six. Four held, one half held, and one was wrong: I expected the networks to cope worse with noise they had never seen than a well-informed MWPM. At distance 3 they still won.

I also changed the plan along the way (fewer seeds where the compute did not fit, one model I could not afford to train). Every deviation is logged in the repository with its reason.

The chart shows the ratio network / MWPM with 95% intervals. Below the dashed line the network wins.

Method page: https://didimacveg.github.io/syndrome-lab/

Built with help from AI tools. A reproduction, not new research.

#MachineLearning #Statistics #QuantumErrorCorrection #OpenScience
