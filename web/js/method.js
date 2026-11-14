(function () {
  'use strict';
  I18N.add({
    'm.tag': ['METHOD · LIMITS · HOW TO REPRODUCE', 'MÉTODO · LÍMITES · CÓMO REPRODUCIRLO'],
    'm.h1': ['How the comparison is made, and <em>what it cannot tell you</em>', 'Cómo se hace la comparación y <em>qué no puede decirte</em>'],
    'm.lead': ['Everything on this site can be regenerated from the repository with one command. This page states the choices that were made, so you can disagree with them.', 'Todo lo de esta web se puede regenerar desde el repositorio con un comando. Esta página explica las decisiones tomadas, para que puedas discrepar de ellas.'],
  });
  const EN = `
<h2>1. Scope</h2>
<p>Syndrome Lab is a <strong>reproduction</strong>, not new research. It re-creates at small scale, on a CPU, a result that is well established: neural networks can decode the surface code better than minimum-weight perfect matching at small code distances, and keeping that advantage at larger distances is expensive. The reference works are AlphaQubit (Bausch et al., Nature 2024), its real-time successor (Senior et al., arXiv:2512.07737), Mamba-based decoders (Lee, Hur and Park, arXiv:2510.22724) and, closest in spirit, the QuTech work of Varbanov et al. (Phys. Rev. Research 7, 013029).</p>
<h2>2. The experiment</h2>
<ul>
<li><strong>Code:</strong> rotated surface code, distances 3, 5 and 7, memory experiment in the Z basis with d rounds of syndrome extraction. Circuits come from Stim's generator.</li>
<li><strong>Noise:</strong> SI1000, a one-parameter circuit-level model inspired by superconducting hardware (Gidney et al. 2021): two-qubit gates depolarize with probability p, measurements flip with 5p, resets fail with 2p, idling costs p/10, and idling during measurement costs 2p. The rates are applied to Stim's CX-based circuit rather than to a CZ compilation.</li>
<li><strong>Sweep:</strong> p from 0.1% to 1.0%, eight values.</li>
<li><strong>Task:</strong> given all detection events of a shot, predict whether the logical observable flipped.</li>
</ul>
<h2>3. The decoders</h2>
<ul>
<li><strong>MWPM</strong> (PyMatching 2). It is given the exact detector error model of the test noise, which is its best case.</li>
<li><strong>Correlated matching</strong> (PyMatching, <code>enable_correlations</code>). A stronger classical baseline, included so the networks are not compared only with the weaker one.</li>
<li><strong>CNN</strong>: a 3D convolutional residual network over the (round, row, column) volume of detection events.</li>
<li><strong>RT</strong>: a recurrent transformer. One state vector per stabilizer, updated each round by an attention block with shared weights. It is the AlphaQubit idea reduced by roughly three orders of magnitude.</li>
</ul>
<p>Networks are trained on shots generated on the fly by Stim, mixing all eight values of p, with one model per distance and three training seeds (two at distance 7).</p>
<h2>4. Statistics</h2>
<ul>
<li><strong>Same shots for everyone.</strong> The test set is generated once per (distance, p) with a fixed seed that is never used in training.</li>
<li><strong>Wilson intervals</strong> (95%) on every logical error rate.</li>
<li><strong>Paired comparison.</strong> For network against baseline we count the shots where only one of them fails. The ratio of error rates carries a paired bootstrap interval, and an exact McNemar test is stored in the result files.</li>
<li><strong>Seeds.</strong> Curves pool failures over training seeds and also show each seed. Pooled intervals reuse the same test shots across seeds, so they describe sampling noise of the test set, not the spread between trainings. The spread is what the per-seed dots are for.</li>
<li><strong>Threshold.</strong> Crossing of the curves of consecutive distances, interpolated in log-log scale, with a parametric bootstrap interval.</li>
</ul>
<h2>5. Validation of the setup</h2>
<ul>
<li>MWPM corrects every single fault of the circuit-level error model at distances 3 and 5 (tested exhaustively).</li>
<li>With bit-flip noise on data qubits and perfect measurement, the MWPM crossings land at 9.6 to 9.8% for distances 5 to 13, against the published asymptotic threshold of 10.3%. Small-distance crossings of the rotated code are known to sit below the asymptotic value.</li>
<li>Circuit-level crossings fall in the published range: about 0.5% for SI1000 and 0.6 to 0.7% for uniform depolarizing noise with uncorrelated matching.</li>
<li>Our Monte Carlo loop agrees with <code>sinter</code>, Stim's own sampling tool.</li>
<li>The JavaScript decoders on the Play page are tested against PyMatching (same matching weight) and PyTorch (same network outputs).</li>
</ul>
<h2>6. The playground uses simpler noise</h2>
<p>Clicking a data qubit is, by definition, an error on a data qubit with perfect syndrome measurement. That is called code-capacity noise. The playground network was trained for exactly that setting and is evaluated separately on the Results page. It predicts only the logical class of the error. The correction drawn on screen is the matching correction, multiplied by a logical operator when the network disagrees with matching.</p>
<h2>7. Limitations</h2>
<ul>
<li>Small distances only. Nothing here says anything about distance 11 or beyond.</li>
<li>Simulated noise only. No leakage, no crosstalk, no drift, no real hardware data.</li>
<li>Z-basis memory only. No logical gates, no lattice surgery.</li>
<li>CPU budget of at most a couple of hours per model. With more training the networks would improve, and the published ones did.</li>
<li>Latency was measured in plain PyTorch on a CPU. It is not a statement about what dedicated hardware can do.</li>
<li>The networks output a single bit per shot. They do not produce a physical correction and they are not streaming decoders.</li>
<li>Thresholds from distances 3 to 7 are finite-size crossings, not asymptotic thresholds.</li>
</ul>
<h2>8. Reproduce it</h2>
<pre>git clone https://github.com/didimacveg/syndrome-lab
cd syndrome-lab
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
make test      # unit tests and validation against published values
make all       # data, baselines, training, evaluation, figures, site data (hours on 4 cores)</pre>
<p>Seeds, configurations and trained weights are in the repository. Runs are deterministic on the same machine and thread count when they are not interrupted. Interrupted runs resume from a checkpoint and are flagged in the model metadata.</p>
<h2>9. Credits</h2>
<p>Stim (Gidney), PyMatching (Higgott and Gidney), sinter, PyTorch. Built by Diego Macías Vega, a secondary-school student in Madrid, with substantial help from AI coding tools. Errors are his to fix: please open an issue.</p>`;
  const ES = `
<h2>1. Alcance</h2>
<p>Syndrome Lab es una <strong>reproducción</strong>, no investigación nueva. Recrea a pequeña escala, en CPU, un resultado bien establecido: las redes neuronales pueden decodificar el código de superficie mejor que el emparejamiento perfecto de peso mínimo en distancias pequeñas, y mantener esa ventaja en distancias mayores es caro. Los trabajos de referencia son AlphaQubit (Bausch et al., Nature 2024), su sucesor en tiempo real (Senior et al., arXiv:2512.07737), los decodificadores basados en Mamba (Lee, Hur y Park, arXiv:2510.22724) y, el más cercano en espíritu, el trabajo de QuTech de Varbanov et al. (Phys. Rev. Research 7, 013029).</p>
<h2>2. El experimento</h2>
<ul>
<li><strong>Código:</strong> código de superficie rotado, distancias 3, 5 y 7, experimento de memoria en base Z con d rondas de extracción de síndrome. Los circuitos salen del generador de Stim.</li>
<li><strong>Ruido:</strong> SI1000, un modelo de ruido de circuito de un solo parámetro inspirado en hardware superconductor (Gidney et al. 2021): las puertas de dos qubits despolarizan con probabilidad p, las medidas se invierten con 5p, los reinicios fallan con 2p, esperar cuesta p/10 y esperar durante una medida cuesta 2p. Las tasas se aplican al circuito con puertas CX de Stim, no a una compilación con CZ.</li>
<li><strong>Barrido:</strong> p de 0,1 % a 1,0 %, ocho valores.</li>
<li><strong>Tarea:</strong> dados todos los eventos de detección de un disparo, predecir si el observable lógico se ha invertido.</li>
</ul>
<h2>3. Los decodificadores</h2>
<ul>
<li><strong>MWPM</strong> (PyMatching 2). Recibe el modelo de errores exacto del ruido de test: su mejor caso.</li>
<li><strong>Emparejamiento correlacionado</strong> (PyMatching, <code>enable_correlations</code>). Una referencia clásica más fuerte, incluida para no comparar las redes solo con la más débil.</li>
<li><strong>CNN</strong>: red residual convolucional 3D sobre el volumen (ronda, fila, columna) de eventos de detección.</li>
<li><strong>RT</strong>: transformer recurrente. Un vector de estado por estabilizador, actualizado en cada ronda por un bloque de atención con pesos compartidos. Es la idea de AlphaQubit reducida unos tres órdenes de magnitud.</li>
</ul>
<p>Las redes se entrenan con disparos generados al vuelo por Stim, mezclando los ocho valores de p, con un modelo por distancia y tres semillas de entrenamiento (dos en distancia 7).</p>
<h2>4. Estadística</h2>
<ul>
<li><strong>Los mismos disparos para todos.</strong> El conjunto de test se genera una vez por (distancia, p) con una semilla fija que nunca se usa al entrenar.</li>
<li><strong>Intervalos de Wilson</strong> (95 %) en cada tasa de error lógico.</li>
<li><strong>Comparación emparejada.</strong> Para red frente a referencia se cuentan los disparos en los que solo falla una de las dos. El cociente de tasas lleva un intervalo bootstrap emparejado y en los ficheros de resultados se guarda un test exacto de McNemar.</li>
<li><strong>Semillas.</strong> Las curvas agregan los fallos de todas las semillas y además muestran cada una. Los intervalos agregados reutilizan los mismos disparos de test entre semillas: describen el ruido de muestreo del test, no la dispersión entre entrenamientos. Para eso están los puntos por semilla.</li>
<li><strong>Umbral.</strong> Cruce de las curvas de distancias consecutivas, interpolado en escala log-log, con intervalo bootstrap paramétrico.</li>
</ul>
<h2>5. Validación del montaje</h2>
<ul>
<li>MWPM corrige todos y cada uno de los fallos individuales del modelo de errores de circuito en distancias 3 y 5 (comprobado de forma exhaustiva).</li>
<li>Con ruido de inversión de bit en los datos y medida perfecta, los cruces de MWPM caen en 9,6–9,8 % para distancias 5 a 13, frente al umbral asintótico publicado de 10,3 %. Es sabido que los cruces a distancias pequeñas del código rotado quedan por debajo del valor asintótico.</li>
<li>Los cruces con ruido de circuito caen en el rango publicado: en torno al 0,5 % para SI1000 y 0,6–0,7 % para despolarizante uniforme con emparejamiento sin correlaciones.</li>
<li>Nuestro bucle Monte Carlo coincide con <code>sinter</code>, la herramienta de muestreo de Stim.</li>
<li>Los decodificadores en JavaScript de la página Jugar se comprueban contra PyMatching (mismo peso de emparejamiento) y PyTorch (mismas salidas de la red).</li>
</ul>
<h2>6. El simulador usa un ruido más simple</h2>
<p>Hacer clic en un qubit de datos es, por definición, un error en un qubit de datos con medida de síndrome perfecta. Eso se llama ruido de capacidad de código. La red del simulador se entrenó exactamente para ese caso y se evalúa aparte en la página de Resultados. Solo predice la clase lógica del error. La corrección que se dibuja es la del emparejamiento, multiplicada por un operador lógico cuando la red discrepa.</p>
<h2>7. Limitaciones</h2>
<ul>
<li>Solo distancias pequeñas. Nada de esto dice algo sobre distancia 11 o más.</li>
<li>Solo ruido simulado. Sin fugas, sin diafonía, sin derivas, sin datos de hardware real.</li>
<li>Solo memoria en base Z. Sin puertas lógicas ni cirugía de retícula.</li>
<li>Presupuesto de CPU de un par de horas por modelo como mucho. Con más entrenamiento las redes mejorarían, y las publicadas lo hicieron.</li>
<li>La latencia se midió en PyTorch sin optimizar y en CPU. No dice nada de lo que puede hacer hardware dedicado.</li>
<li>Las redes dan un solo bit por disparo. No producen una corrección física ni son decodificadores en flujo continuo.</li>
<li>Los umbrales con distancias 3 a 7 son cruces a tamaño finito, no umbrales asintóticos.</li>
</ul>
<h2>8. Reprodúcelo</h2>
<pre>git clone https://github.com/didimacveg/syndrome-lab
cd syndrome-lab
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
make test      # tests unitarios y validación contra valores publicados
make all       # datos, referencias, entrenamiento, evaluación, figuras y datos de la web (horas con 4 núcleos)</pre>
<p>Semillas, configuraciones y pesos entrenados están en el repositorio. Las ejecuciones son deterministas en la misma máquina y con el mismo número de hilos si no se interrumpen. Las interrumpidas se reanudan desde un punto de control y quedan marcadas en los metadatos del modelo.</p>
<h2>9. Créditos</h2>
<p>Stim (Gidney), PyMatching (Higgott y Gidney), sinter, PyTorch. Hecho por Diego Macías Vega, estudiante de Bachillerato en Madrid, con ayuda sustancial de herramientas de programación con IA. Los errores son suyos: abre un issue.</p>`;
  I18N.listeners.push(() => { document.getElementById('prose').innerHTML = I18N.lang === 'es' ? ES : EN; });
})();
