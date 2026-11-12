# Fase 0 · Investigación

Fecha: 12 de noviembre de 2026. Escrito antes de la primera línea de código.

> **Qué es este proyecto y qué no es.** Es una **reproducción rigurosa, abierta y
> explicada, a pequeña escala y en CPU**, de una idea conocida: decodificar el código
> de superficie con redes neuronales y compararlo con el decodificador clásico de
> referencia (MWPM). **No es investigación nueva.** Todo lo que aquí se mide ya se
> sabía cualitativamente; el valor está en que cualquiera puede repetirlo con un
> comando, ver los números con sus intervalos de confianza y entender la física.

## Cómo se ha verificado cada cita

`arxiv.org` no es accesible desde el entorno donde se escribió este documento, así
que las citas se han comprobado mediante búsqueda web (títulos, autores y resúmenes
devueltos por el buscador). Cada entrada lleva una marca:

- **[V]** título, autores e identificador confirmados por búsqueda web en esta sesión.
- **[M]** citado de memoria; el identificador y los detalles deben comprobarse a mano
  antes de usarlos en público (está apuntado en `PASOS_PARA_DIEGO.md`).

No se cita ninguna cifra de un artículo que no se haya podido contrastar.

## 1. Estado del arte

### 1.1 El problema

Un ordenador cuántico útil necesita qubits lógicos mucho más fiables que los
físicos. El código de superficie protege un qubit lógico repartiéndolo entre d²
qubits de datos y midiendo repetidamente d²−1 comprobaciones de paridad
(estabilizadores). El **decodificador** es el programa clásico que, a partir de
esas medidas (el síndrome), decide qué error ha ocurrido. Tiene que ser a la vez
preciso y rapidísimo (en superconductores, del orden de 1 µs por ronda).

### 1.2 Decodificadores clásicos de referencia

- **MWPM (emparejamiento perfecto de peso mínimo).** Dennis, Kitaev, Landahl y
  Preskill, *Topological quantum memory*, J. Math. Phys. 43, 4452 (2002) **[M]**.
  Es el estándar del código de superficie.
- **PyMatching 2 / Sparse Blossom.** Higgott y Gidney, *Sparse Blossom: correcting a
  million errors per core second with minimum-weight matching*, arXiv:2303.15933
  **[M]**. Es la implementación que usamos. Desde la versión 2.3 incluye también
  *correlated matching* (`enable_correlations=True`), que comprobamos en el paquete
  instalado (2.4.0).
- **Stim.** Gidney, *Stim: a fast stabilizer circuit simulator*, Quantum 5, 497
  (2021) **[M]**. Simulador con el que generamos todos los datos.
- **Modelo de ruido SI1000.** Gidney, Newman, Fowler y Broughton, *A fault-tolerant
  honeycomb memory*, Quantum 5, 605 (2021), arXiv:2108.10457 **[M]**. Define el ruido
  «inspirado en superconductores» que usamos como ruido principal.
- **Experimento de referencia en hardware.** Google Quantum AI, *Quantum error
  correction below the surface code threshold*, arXiv:2408.13687 **[V]** (título).

### 1.3 Decodificadores neuronales

- **AlphaQubit.** Bausch, Senior, Heras et al., *Learning high-accuracy error
  decoding for quantum processors*, Nature (28 nov 2024),
  DOI 10.1038/s41586-024-08148-8; preprint arXiv:2310.05900 **[V]**. Red recurrente
  basada en transformers. Evaluada con datos reales de Sycamore en distancias 3 y 5
  y con datos simulados hasta distancia 11. Según el resumen de Google: 6 % menos
  errores que los métodos de redes tensoriales y 30 % menos que *correlated
  matching* en los experimentos mayores de Sycamore. Limitación reconocida: demasiado
  lento para tiempo real.
- **AlphaQubit 2.** Senior, Edlich, Bausch et al., *A scalable and real-time neural
  decoder for topological quantum codes*, arXiv:2512.07737 (8 dic 2025; v2 11 mar
  2026) **[V]**. Decodificación en tiempo real del código de superficie hasta
  distancia 11 y del código de color hasta distancia 9, por debajo de 1 µs por ciclo
  en aceleradores comerciales.
- **Decodificador Mamba.** Lee, Hur y Park, *Scalable Neural Decoders for Practical
  Real-Time Quantum Error Correction*, arXiv:2510.22724 (26 oct 2025) **[V]**.
  Sustituye la atención (coste O(d⁴)) por un núcleo Mamba. Validado con los datos
  públicos de Sycamore (d = 3 y 5) y con ruido SI1000 simulado; en condiciones de
  tiempo real informa de un umbral de 0,0104 frente a 0,0097 del transformer.
- **Redes convolucionales 3D.** *Fully convolutional 3D neural network decoders for
  surface codes with syndrome circuit noise*, arXiv:2506.16113 **[V]** (título).
- **Pre-decodificadores.** Trabajo de NVIDIA (Chamberland et al.), *Fast AI-based
  pre-decoders for surface codes*, arXiv:2604.12841 **[V]** (vía buscador): una red
  local limpia el síndrome y pasa el resto a un decodificador global.
- **«Foundation decoders».** *Efficient foundation decoders for fault-tolerant
  quantum computing*, arXiv:2606.27119 **[V]** (título).
- **Visión crítica.** *Rethink the Role of Neural Decoders in Quantum Error
  Correction*, ICML 2026 **[V]** (título y repositorio
  `GrahamYan/QEC-neural-decoder-benchmark`). Conviene leerlo: cuestiona cuándo
  compensa una red frente a los decodificadores clásicos.
- **QuTech / TU Delft.** Varbanov, Serra-Peralta, Byfield y Terhal, *Neural network
  decoder for near-term surface-code experiments*, arXiv:2307.03280, Phys. Rev.
  Research 7, 013029 (2025) **[V]** (título y revista; autores **[M]**). Red
  recurrente para distancias pequeñas con ruido de circuito, usando Stim y
  PyMatching como referencia. Es el antecedente más cercano a este proyecto y es de
  Delft.
- **Red de grafos.** Lange et al., *Data-driven decoding of quantum error correcting
  codes using graph neural networks*, arXiv:2307.01241 **[M]**.
- **Antecedentes históricos [M].** Torlai y Melko (2017); Krastanov y Jiang (2017);
  Baireuther, O'Brien, Tarasinski y Beenakker (2018, red LSTM, Leiden/Delft);
  Chamberland y Ronagh (2018).

Lo que la literatura deja claro, y lo que esperamos reproducir a pequeña escala:

1. A distancias pequeñas (d = 3, a veces 5) una red entrenada con suficientes datos
   **supera a MWPM sin correlaciones**, porque aprende correlaciones (errores Y,
   errores de «gancho») que el emparejamiento ignora.
2. La ventaja **cuesta cada vez más** al crecer la distancia: los datos y el cálculo
   necesarios crecen muy deprisa. Por eso AlphaQubit necesitó un preentrenamiento
   enorme y por eso existen los trabajos de 2025–2026 sobre escalabilidad.
3. La **latencia** es el punto débil de las redes frente a Sparse Blossom.

### 1.4 Decodificadores neuronales de código abierto que ya existen

| Proyecto | Qué es | Comprobado |
|---|---|---|
| `GrahamYan/QEC-neural-decoder-benchmark` | Código del artículo de ICML 2026 | existe (búsqueda en GitHub) |
| `Sumitchongder/adaptive-qec-decoder` (arXiv:2607.05814) | Decodificador neuronal con refinamiento por PyMatching; pesos publicados | vía buscador |
| `TensorBFS/BPDecoderPlus` | Propagación de creencias en PyTorch (no es una red aprendida) | vía buscador |
| `quantumlib/tesseract-decoder` | Decodificador de búsqueda de Google, Apache-2.0 | vía buscador |
| `yuewuo/qec-lego-bench` | Banco de pruebas de decodificadores | existe (búsqueda en GitHub) |
| Repos de Varbanov et al. y Lange et al. | Código de sus artículos | **[M]**, sin comprobar |

Ya existen, además, muchos repos pequeños de «Stim + PyMatching + una red»
(ver apartado 4). **El espacio está concurrido.** No pretendemos ser los primeros.

### 1.5 En qué se diferencia este proyecto

No en la idea, sino en la ejecución:

1. **Comparación justa y explícita.** Mismo ruido, mismos disparos de test, varias
   semillas, intervalos de confianza, y dos referencias clásicas: MWPM y *correlated
   matching*. MWPM recibe el modelo de errores exacto del ruido (su mejor caso).
2. **Resultados negativos publicados.** Donde la red pierde, se publica y se analiza.
3. **Todo en CPU, en horas.** Cualquiera con un portátil lo reproduce.
4. **Explicado de forma visual**, con una web donde se inyectan errores a mano.
5. **Defendible**: un documento que explica la física desde 2.º de Bachillerato.

## 2. Herramientas y licencias

Licencias leídas de los metadatos de los paquetes instalados (`importlib.metadata`),
no de memoria.

| Herramienta | Versión | Licencia | Uso |
|---|---|---|---|
| Stim | 1.16.0 | Apache-2.0 | Simulación de circuitos y muestreo de síndromes |
| PyMatching | 2.4.0 | Apache-2.0 | MWPM y *correlated matching* |
| sinter | 1.16.0 | Apache-2.0 | Validación cruzada de nuestro muestreo Monte Carlo |
| PyTorch | 2.15.0 | BSD-3-Clause (más licencias de componentes incluidos) | Redes neuronales |
| NumPy | 2.5.3 | BSD-3-Clause | Cálculo numérico |
| SciPy | 1.18.1 | BSD-3-Clause | Ajustes y estadística |
| Matplotlib | 3.11.2 | tipo PSF | Figuras |
| ONNX | 1.23.2 | Apache-2.0 | Exportación de modelos |
| ONNX Runtime | 1.29.0 | MIT | Comprobación de los modelos exportados |
| pytest | 9.2.0 | MIT | Tests |

Todas son permisivas y compatibles entre sí. **Este proyecto se publica con licencia
Apache-2.0**, igual que Stim y PyMatching.

PyTorch frente a JAX: se elige PyTorch por la exportación a ONNX madura y porque en
CPU, con modelos tan pequeños, no hay diferencia práctica.

## 3. Agentes LLM y diseño de circuitos cuánticos (solo como contexto)

En 2026 han aparecido trabajos en los que agentes basados en LLM diseñan circuitos:

- *StabilizerBench: A Benchmark for AI-Assisted Quantum Error Correction Circuit
  Synthesis*, arXiv:2604.21287 (23 abr 2026) **[V]**. 192 códigos estabilizadores,
  12 familias, de 4 a 196 qubits; los agentes resuelven la preparación de estados
  pero fallan en optimización y tolerancia a fallos.
- *An LLM System for Autonomous Variational Quantum Circuit Design*,
  arXiv:2606.13380 (jun 2026) **[V]**.

Es un campo ya concurrido y distinto del nuestro. **Este proyecto no lo toca.** Como
mucho aparece como una línea en «trabajo futuro».

## 4. Nombre

Búsqueda en GitHub (API de búsqueda de repositorios, 12 nov 2026):

- `qec-lab`: **23 repositorios** con ese nombre, varios con un alcance casi idéntico
  («Rotated surface code quantum error correction simulator: Stim + PyMatching…»,
  «A from-scratch quantum error correction laboratory…»).
- `qeclab`: 5 repositorios, y el nombre está **ocupado en PyPI**.
- `qec-bench`: 20 repositorios.
- `syndrome-lab` / `syndromelab`: **ninguno** relacionado con computación cuántica
  (9 resultados de otros temas para `syndrome-lab`, 0 para `syndromelab`); libres en
  PyPI.

**Propuesta: «Syndrome Lab»** (repo `syndrome-lab`, paquete Python `syndromelab`).
Sobrio, técnico y exacto: el síndrome es precisamente el dato que entra al
decodificador. Sigue la lógica de RAAN (un término técnico del dominio).

El repositorio sigue llamándose `qec-lab` hasta que Diego lo renombre (un clic; ver
`PASOS_PARA_DIEGO.md`). El código ya usa `syndromelab`.

Limitación de la comprobación: se ha mirado GitHub y PyPI, no registros de marcas ni
dominios.
