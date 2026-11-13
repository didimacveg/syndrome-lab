# Registro de decisiones

Cada entrada: qué se decidió, por qué, y qué se descartó.

## D1 · Nombre: «Syndrome Lab» (paquete `syndromelab`)
`qec-lab` coincide con 23 repositorios de GitHub, varios de alcance casi idéntico, y
`qeclab` está ocupado en PyPI. `syndromelab` está libre en ambos. El repositorio
sigue llamándose `qec-lab` hasta que Diego lo renombre. Detalle en `RESEARCH.md` §4.

## D2 · Licencia Apache-2.0
La misma que Stim y PyMatching. Permisiva y con cláusula de patentes.

## D3 · PyTorch en lugar de JAX
Exportación a ONNX madura; en CPU y con modelos pequeños no hay ventaja de JAX.

## D4 · Dos referencias clásicas, no una
Además de MWPM se evalúa *correlated matching* de PyMatching. Comparar solo con MWPM
sin correlaciones favorecería a la red. Sustituye al punto opcional «pesos de MWPM
aprendidos», que no se hace (ver D10).

## D5 · MWPM recibe el modelo de errores exacto
Los pesos de MWPM salen del modelo de errores de detector del circuito con el mismo
p que el test. Es el mejor caso para MWPM. En el experimento de generalización se
muestran las dos variantes (informado y no informado).

## D6 · SI1000 aplicado al circuito con CX
Stim genera el código de superficie con puertas CX; SI1000 se definió con CZ. Se
aplican las tasas de SI1000 al circuito CX. Recompilar a CZ no cambia la conclusión
y añadiría una fuente de errores propios. Se declara como limitación.

## D7 · Solo memoria en base Z, con d rondas
Reduce el cálculo a la mitad. Limitación declarada.

## D8 · Las redes predicen el observable lógico, no el error físico
Es el planteamiento de AlphaQubit: una salida binaria por disparo. Más sencillo de
entrenar y de comparar.

## D9 · Un modelo por distancia, entrenado con mezcla de p
Un modelo por cada p multiplicaría el coste por 8 y sería menos honesto: en un chip
real p no se conoce con exactitud.

## D10 · No se implementa el ajuste aprendido de pesos de MWPM
Era opcional. El tiempo se dedica a la segunda referencia clásica (D4), que responde
mejor a la pregunta «¿es justo el rival?».

## D11 · Inferencia en el navegador en JavaScript puro, sin ONNX Runtime Web
La red del simulador es diminuta. Escribir su propagación directa en ~100 líneas de
JS evita descargar ~10 MB de WebAssembly en el móvil y elimina dependencias de CDN.
Un test compara la salida de JS con la de PyTorch. Los modelos se exportan también a
ONNX y se verifican con ONNX Runtime en Python.

## D12 · El simulador web usa ruido de capacidad de código
«Hacer clic para inyectar un error X o Z en un qubit de datos» es, por definición,
ruido en los datos con medida perfecta. Las redes del simulador se entrenan para ese
ruido y se evalúan aparte. Los resultados principales (ruido de circuito) se
muestran en la página de resultados. La web lo dice de forma explícita.

## D13 · La red del simulador decide la clase lógica; la corrección se completa
La red predice si la corrección debe incluir o no un operador lógico. La corrección
que se dibuja es la de MWPM, multiplicada por el operador lógico si la red discrepa.
Es la técnica habitual de «decodificador de alto nivel» y se explica en la web.

## D14 · Informe PDF generado con HTML y Chromium
No hay LaTeX en el entorno y no se puede instalar sin coste de tiempo grande. El
informe se maqueta en HTML con estilo de artículo y se imprime a PDF. Reproducible
con `make report`.

## D15 · Disparos de test: 200 000 por punto también en d = 3
El diseño preveía 500 000 para d = 3. La inferencia de seis redes sobre 8 valores de p
tardaba más que el propio entrenamiento. Con 200 000 los intervalos siguen siendo
estrechos (cociente red/MWPM con ±1–2 %). `baseline.json` conserva los 500 000 de d = 3.

## D16 · Menos semillas donde el cálculo no cabe (desviación del diseño)
El rendimiento real con cuatro trabajos en paralelo fue unas 2,5 veces menor que el
del piloto: la RT de d = 5 necesita 2,2 horas de CPU por semilla. Aplicando la regla
prevista en `EXPERIMENT.md` («si no cabe, se reduce y se dice»):
- RT d = 5: 2 semillas en vez de 3.
- CNN d = 7: 2 semillas (como estaba previsto).
- RT d = 7: **no se entrena**. Con el presupuesto vería 1,5 millones de disparos, menos
  de lo que la RT de d = 5 necesita solo para empezar a aprender. Se declara como
  «no cabe en el presupuesto», no como «no funciona».
Decidido con los entrenamientos de d = 5 a medias (se conocían sus curvas de validación
parciales) y antes de cualquier evaluación sobre los disparos de test de d = 5 o d = 7.

## D17 · Puntos de control en el entrenamiento
El entorno de cálculo se reinició durante los entrenamientos. Se añadieron puntos de
control: una ejecución interrumpida se reanuda con un flujo de datos nuevo y queda
marcada (`resumed_at`) en los metadatos. La reproducibilidad exacta solo se garantiza
para ejecuciones no interrumpidas; las reanudadas se señalan con * en la web.
