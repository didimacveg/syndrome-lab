# Fase 1 · Diseño del experimento

Este documento fija el experimento **antes** de ver resultados. Los cambios
posteriores se anotan en `DECISIONS.md`, nunca se reescriben aquí en silencio.

Hardware de referencia: 4 núcleos de CPU, 15 GB de RAM, sin GPU.

## 1. Pregunta

Con un presupuesto de horas de CPU, ¿puede una red neuronal pequeña decodificar el
código de superficie mejor que MWPM? ¿Hasta qué distancia, a qué coste de latencia,
y qué pasa cuando el ruido cambia respecto al de entrenamiento?

## 2. Códigos

Código de superficie **rotado**, experimento de memoria en base Z, distancias
d = 3, 5 y 7, con **d rondas** de medida de síndrome (lo habitual). Circuitos
generados con `stim.Circuit.generated("surface_code:rotated_memory_z")`.

| d | qubits de datos | estabilizadores | detectores (d rondas) |
|---|---|---|---|
| 3 | 9 | 8 | 24 |
| 5 | 25 | 24 | 120 |
| 7 | 49 | 48 | 336 |

Solo base Z: por simetría del código la base X se comporta de forma equivalente, y
duplicar el cálculo no cabe en el presupuesto. Es una limitación declarada.

## 3. Ruido

**Principal: SI1000** (Gidney et al. 2021), ruido de circuito con un solo parámetro p:

| Operación | Ruido |
|---|---|
| Puerta de dos qubits (CX) | despolarizante de 2 qubits, p |
| Puerta de un qubit (H) | despolarizante de 1 qubit, p/10 |
| Reinicio | error X con probabilidad 2p |
| Medida | resultado invertido con probabilidad 5p |
| Qubit en espera mientras otros hacen puertas | despolarizante, p/10 |
| Qubit en espera mientras otros miden o se reinician | despolarizante, 2p |

Nota: SI1000 se definió para circuitos con puertas CZ. Aquí se aplica al circuito
con CX que genera Stim («SI1000 sobre CX»). Las tasas son las mismas; la
compilación no. Se dice así en todas partes.

**Secundario (para medir generalización): despolarizante uniforme de circuito**
(«SD»), el que Stim genera de serie con sus cuatro parámetros iguales a p.

**Barrido de p:** 0,001 · 0,002 · 0,003 · 0,004 · 0,005 · 0,006 · 0,008 · 0,010.

**Validación adicional del montaje: ruido de capacidad de código** (errores solo en
los datos, medida perfecta, una ronda), porque su umbral con MWPM está publicado con
mucha precisión (≈ 10,3 % de inversión de bit).

## 4. Decodificadores

1. **MWPM** (PyMatching), con el modelo de errores de detector exacto del ruido de
   test. Es el mejor caso para MWPM: conoce el ruido.
2. **Correlated matching** (PyMatching, `enable_correlations=True`). Referencia
   clásica más fuerte. Se añade para que la comparación no sea contra un rival débil.
3. **CNN**: red convolucional 3D sobre el volumen (ronda × fila × columna) de
   eventos de detección. Predice directamente si el observable lógico se ha invertido.
4. **RT (recurrente + transformer)**, inspirada en AlphaQubit pero ~1000 veces más
   pequeña: un estado por estabilizador que se actualiza ronda a ronda, con una capa
   de atención entre estabilizadores en cada ronda. Admite cualquier número de rondas.
5. *(Opcional, no comprometido)* pesos de MWPM aprendidos con datos.

Las redes se entrenan con datos generados al vuelo por Stim (datos «infinitos», sin
sobreajuste a un conjunto fijo), mezclando los valores de p del barrido. Un modelo
por distancia, no por valor de p. Pérdida: entropía cruzada binaria sobre el
observable lógico.

## 5. Métricas

1. **Tasa de error lógico por disparo** frente a p, con intervalo de Wilson al 95 %.
2. **Comparación emparejada**: todos los decodificadores ven exactamente los mismos
   disparos de test. Cociente p_L(red)/p_L(MWPM) con intervalo *bootstrap* emparejado
   y test de McNemar.
3. **Variabilidad por semilla**: 3 semillas de entrenamiento por modelo (2 si d = 7
   no cabe). Se muestran las tres, no solo la mejor.
4. **Umbral**: cruce de las curvas de distancias consecutivas (3–5 y 5–7),
   interpolando en escala logarítmica, con intervalo *bootstrap*. Se advierte de que
   con distancias tan pequeñas el cruce está sesgado respecto al umbral asintótico.
5. **Latencia en CPU**: un núcleo, tiempo por disparo, en lote y disparo a disparo.
6. **Generalización**: redes entrenadas con SI1000 evaluadas con ruido SD, frente a
   MWPM (a) informado del ruido nuevo y (b) con los pesos del ruido antiguo. También,
   para la RT, más rondas que en el entrenamiento.

## 6. Datos de test

Semilla fija, distinta de las de entrenamiento. Disparos por punto (d, p):
500 000 para d = 3, 200 000 para d = 5 y d = 7 (ajustable según el tiempo; el
número real queda grabado en los ficheros de resultados).

## 7. Validación contra resultados publicados

| Comprobación | Valor publicado | Criterio |
|---|---|---|
| Umbral MWPM, capacidad de código | ≈ 10,3 % | cruces d = 5…13 dentro de 9,5–11 % |
| Umbral MWPM, ruido de circuito | 0,5–1 % según modelo | cruces dentro de ese rango |
| Nuestro Monte Carlo frente a `sinter` | — | acuerdo estadístico |
| Por debajo del umbral | p_L decrece con d | se cumple en el p más bajo |

## 8. Presupuesto de cálculo (tope)

| Tarea | Tope |
|---|---|
| Referencias MWPM y validación | 15 min |
| CNN: d = 3, 5, 7 × 3 semillas | 75 min |
| RT: d = 3, 5 × 3 semillas (d = 7 si cabe) | 75 min |
| Redes de capacidad de código para la web | 10 min |
| Evaluación, latencia, generalización | 30 min |

Total: unas 3,5 horas de CPU. Si un modelo no converge en su presupuesto, **no se
amplía**: se publica como está y se explica.

## 9. Hipótesis (escritas antes de medir)

- H1: en d = 3 ambas redes superan a MWPM sin correlaciones.
- H2: en d = 5 la ventaja se reduce o desaparece con este presupuesto.
- H3: en d = 7 las redes pierden frente a MWPM.
- H4: *correlated matching* es más difícil de superar que MWPM.
- H5: las redes son entre 10 y 1000 veces más lentas que PyMatching por disparo.
- H6: con ruido distinto las redes empeoran más que MWPM informado.

## 10. Desviaciones respecto a este diseño (añadido después, 13 nov 2026)

El texto anterior no se ha modificado. Lo que se hizo distinto, con sus motivos, está
en `DECISIONS.md` (D15, D16, D17): 200 000 disparos de test en d = 3 en lugar de
500 000; RT de d = 5 con 2 semillas; RT de d = 7 no entrenada; puntos de control en
el entrenamiento. El presupuesto real fue de 12,4 horas de CPU para los 13 modelos
de ruido de circuito (tope previsto: unas 14 horas de CPU repartidas en 4 núcleos).
Resultado de las hipótesis: H1 confirmada, H2 a medias, H3 confirmada (solo CNN),
H4 confirmada, H5 confirmada, H6 refutada en d = 3 y mixta en d = 5.
