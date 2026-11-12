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
