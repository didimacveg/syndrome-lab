# Defensa de Syndrome Lab

Guía para explicar y defender el proyecto en una pizarra. Nivel de partida: 2.º de
Bachillerato (vectores, probabilidad, algo de matrices). Léela con un lápiz.

> **La frase que resume todo.** «He reproducido, a pequeña escala y en CPU, un
> resultado conocido: una red neuronal puede decodificar el código de superficie
> mejor que el algoritmo clásico en códigos pequeños, y mantener esa ventaja al
> crecer el código cuesta mucho cálculo. No es investigación nueva; es una
> reproducción abierta, con la comparación hecha con cuidado.»

Índice: 1) la física · 2) MWPM · 3) las redes · 4) la estadística · 5) los
resultados · 6) las 20 preguntas · 7) lo que nunca debes afirmar.

---

## 1. La física, desde cero

### 1.1 Qué es un qubit

Un bit clásico vale 0 o 1. Un **qubit** es un sistema cuántico con dos estados
básicos, que escribimos |0⟩ y |1⟩, y que puede estar en una **superposición**:

  |ψ⟩ = a|0⟩ + b|1⟩

`a` y `b` son números (en general complejos) llamados amplitudes. Si mides el qubit
obtienes 0 con probabilidad |a|² y 1 con probabilidad |b|², y por eso
|a|² + |b|² = 1. Piensa en |ψ⟩ como un vector de longitud 1 en un plano cuyos ejes
son |0⟩ y |1⟩.

Dos ideas que hay que tener claras:

- **Superposición no es «0 y 1 a la vez»** ni «no sabemos cuál». Es un estado
  distinto, con propiedades propias. La prueba es la interferencia: las amplitudes
  pueden sumarse o cancelarse, cosa que las probabilidades no hacen.
- **Medir cambia el estado.** Al medir, el qubit queda en |0⟩ o en |1⟩ y la
  superposición se pierde. Esto será el problema central de la corrección de errores.

Dos estados que usaremos: |+⟩ = (|0⟩ + |1⟩)/√2 y |−⟩ = (|0⟩ − |1⟩)/√2. Los dos dan
0 o 1 al 50 %, pero son estados distintos: se diferencian en el **signo** (la fase).

### 1.2 Los dos tipos de error: bit y fase

En un bit clásico solo puede pasar una cosa: que se invierta. En un qubit hay dos
errores básicos:

- **Error X (inversión de bit):** cambia |0⟩ ↔ |1⟩. Convierte a|0⟩ + b|1⟩ en
  a|1⟩ + b|0⟩.
- **Error Z (inversión de fase):** deja |0⟩ igual y cambia el signo de |1⟩.
  Convierte a|0⟩ + b|1⟩ en a|0⟩ − b|1⟩. Si mides en 0/1 no notas nada, pero ha
  convertido |+⟩ en |−⟩. No existe en el mundo clásico.
- **Error Y:** las dos cosas a la vez (Y = X seguido de Z, salvo un factor).

Un resultado importante (y poco intuitivo): **cualquier error sobre un qubit,
incluso uno «continuo» como una rotación pequeña, se puede escribir como
combinación de I (nada), X, Y y Z.** Y al medir los síndromes (ahora lo vemos) el
error «colapsa» a uno de esos cuatro. Por eso basta con saber corregir X y Z:
se dice que los errores se **digitalizan**.

Propiedad que usarás mucho: X y Z **anticonmutan**: XZ = −ZX. Aplicar X y luego Z
no es lo mismo que al revés; difieren en un signo.

### 1.3 Por qué no se puede copiar un qubit

La corrección clásica más simple es copiar: guardo 000 en vez de 0 y voto por
mayoría. En cuántica **no se puede copiar un estado desconocido** (teorema de no
clonación). Demostración en tres líneas:

Supón que existe una máquina que copia: |ψ⟩|0⟩ → |ψ⟩|ψ⟩ para cualquier |ψ⟩.
Entonces copia |0⟩ → |0⟩|0⟩ y |1⟩ → |1⟩|1⟩. La mecánica cuántica es **lineal**, así
que para |+⟩ = (|0⟩+|1⟩)/√2 la máquina daría (|0⟩|0⟩ + |1⟩|1⟩)/√2. Pero una copia
de verdad sería |+⟩|+⟩ = (|00⟩+|01⟩+|10⟩+|11⟩)/2. No coinciden. Contradicción.

Además, no puedes «mirar a ver si hay error», porque medir destruye la
superposición. Parece que la corrección de errores cuántica es imposible. No lo es.

### 1.4 La idea que lo salva: medir paridades, no qubits

Empieza por lo sencillo: el **código de repetición** de 3 qubits contra errores X.
Codificamos

  a|0⟩ + b|1⟩  →  a|000⟩ + b|111⟩

Ojo: **esto no es copiar** (copiar sería |ψ⟩|ψ⟩|ψ⟩). Es un estado entrelazado: la
información está en los tres qubits a la vez y en ninguno por separado.

Ahora, en vez de medir los qubits, medimos dos **paridades**: «¿son iguales los
qubits 1 y 2?» y «¿son iguales los qubits 2 y 3?». Esas preguntas no revelan si el
estado es 000 o 111 (en ambos casos la respuesta es «sí, iguales»), así que **no
destruyen la superposición**. Pero sí delatan un error:

| Error | ¿1 = 2? | ¿2 = 3? |
|---|---|---|
| ninguno | sí | sí |
| X en el qubit 1 | **no** | sí |
| X en el qubit 2 | **no** | **no** |
| X en el qubit 3 | sí | **no** |

El par de respuestas se llama **síndrome**. Nos dice dónde está el error sin
decirnos nada del dato. Esa es la idea central de toda la corrección de errores
cuántica.

### 1.5 Estabilizadores

«¿Son iguales los qubits 1 y 2?» se escribe matemáticamente como medir el operador
Z₁Z₂ (Z en el qubit 1 por Z en el qubit 2). Vale +1 si son iguales y −1 si no.

Un **estabilizador** es un operador que deja el estado codificado igual (valor
+1). Los estados válidos del código son los que dan +1 en todos los
estabilizadores. Un error que **anticonmuta** con un estabilizador le cambia el
signo a −1: esa comprobación «salta». Un error que conmuta con él pasa
desapercibido para esa comprobación.

- Un estabilizador hecho de Z (como Z₁Z₂) detecta errores X.
- Un estabilizador hecho de X (como X₁X₂) detecta errores Z.

Para protegernos de X **y** de Z necesitamos los dos tipos, y tienen que ser
compatibles entre sí (conmutar), para poder medirlos todos a la vez. El código de
superficie es una manera elegante de conseguirlo.

¿Cómo se mide una paridad sin medir los datos? Con un qubit auxiliar (**ancilla**):
se hace interactuar con los qubits de datos mediante puertas CNOT y se mide **solo
la ancilla**. El resultado es la paridad.

### 1.6 El código de superficie

Coloca los qubits de datos en una cuadrícula de d × d. Entre ellos, en un patrón de
tablero de ajedrez, pon comprobaciones:

- casillas de tipo **Z**: miden la paridad Z de sus 4 qubits vecinos (2 en el
  borde). Detectan errores X.
- casillas de tipo **X**: miden la paridad X de sus vecinos. Detectan errores Z.

Dos casillas vecinas de distinto tipo comparten siempre 2 qubits, y por eso
conmutan (dos signos menos se cancelan). Hay d² − 1 comprobaciones para d² qubits
de datos: queda **exactamente un grado de libertad** libre. Ese es el **qubit
lógico**.

En la web: los círculos son qubits de datos, los cuadrados son las comprobaciones,
los semicírculos del borde son comprobaciones de 2 qubits.

Qué pasa con los errores:

- Un error X en un qubit enciende las casillas Z que lo tocan (1 o 2).
- Una **cadena** de errores X seguidos solo enciende las casillas de sus
  **extremos**: en medio, cada casilla toca dos errores y la paridad no cambia.
- Una cadena que termina en el borde adecuado solo enciende un extremo, o ninguno.

Y aquí está lo esencial:

- Una cadena de errores que forma un **lazo cerrado** es un producto de
  estabilizadores: no hace nada. Es inofensiva.
- Una cadena que **cruza el chip de un borde al borde opuesto** no enciende
  ninguna comprobación (no tiene extremos dentro) y **sí cambia el qubit lógico**.
  Eso es un **operador lógico**. La cadena X de lado a lado es el X lógico; la
  cadena Z de arriba abajo es el Z lógico.

### 1.7 Distancia del código

La **distancia d** es la longitud de la cadena más corta que cruza el chip, es
decir, el número mínimo de errores físicos que provocan un error lógico sin ser
detectados. En el código de superficie rotado de d × d, la distancia es d.

Un código de distancia d puede corregir con seguridad hasta ⌊(d−1)/2⌋ errores:

| d | qubits de datos | corrige seguro |
|---|---|---|
| 3 | 9 | 1 error |
| 5 | 25 | 2 errores |
| 7 | 49 | 3 errores |

¿Por qué (d−1)/2? Si ocurren t errores y el decodificador propone otros t como
corrección, lo que queda es una cadena de como mucho 2t. Si 2t < d, esa cadena no
puede cruzar el chip: o es un lazo inofensivo o no existe.

### 1.8 Error físico frente a error lógico

- **Tasa de error físico p:** probabilidad de que falle un componente (una puerta,
  una medida). En los mejores chips actuales, del orden del 0,1 % al 1 %.
- **Tasa de error lógico p_L:** probabilidad de que, tras decodificar y corregir,
  el qubit lógico haya quedado invertido.

El decodificador **no necesita adivinar el error exacto**. Solo necesita que su
corrección, combinada con el error real, forme algo inofensivo (lazos). Falla
cuando la combinación cruza el chip. En la web: «Corregido» frente a «Error lógico».

Regla aproximada por debajo del umbral:

  p_L ≈ A · (p / p_umbral)^((d+1)/2)

Con d = 3 hacen falta 2 errores para fallar (p_L ∝ p²); con d = 5, 3 errores
(p_L ∝ p³); con d = 7, 4.

### 1.9 El umbral

Aumentar d tiene dos efectos opuestos: hacen falta más errores para romper el
código (bueno), pero hay más qubits y más puertas donde pueden ocurrir (malo).

- Si p está **por debajo del umbral**, gana lo bueno: cada vez que aumentas d, p_L
  cae de forma exponencial. Puedes hacer el qubit lógico tan fiable como quieras.
- Si p está **por encima**, gana lo malo: añadir qubits lo empeora.

El **umbral** es el valor de p que separa ambos regímenes. En una gráfica de p_L
frente a p, es el punto donde **se cruzan** las curvas de distintas distancias. Es
el número que dice si una tecnología puede escalar. Depende del código, del ruido
y **del decodificador**: un decodificador mejor sube el umbral.

Valores de referencia para el código de superficie con MWPM: ≈ 10,3 % con ruido
solo en los datos y medida perfecta; ≈ 0,5–1 % con ruido de circuito realista.

### 1.10 Ruido de circuito y por qué hacen falta varias rondas

En la web, al hacer clic, el error ocurre en un qubit de datos y las comprobaciones
se miden sin fallos. Eso se llama **ruido de capacidad de código**. Es el modelo
más simple y sirve para entender.

En un chip real falla todo: las puertas CNOT que miden las comprobaciones, las
propias medidas, los reinicios, y los qubits mientras esperan. Eso es **ruido de
circuito**. Consecuencias:

1. **Una medida de síndrome puede ser mentira.** Por eso se repite muchas veces
   (**rondas**) y lo que se mira es el **cambio** entre una ronda y la siguiente.
   Cada cambio se llama **evento de detección**.
2. El problema pasa de ser un dibujo en 2D a un volumen en **3D**: dos dimensiones
   de espacio y una de tiempo. Un error de medida aparece como dos eventos
   separados en el tiempo; un error de datos, como dos eventos separados en el
   espacio.
3. Un fallo en una puerta puede propagarse a dos qubits a la vez (errores de
   «gancho»), creando correlaciones.

El modelo de ruido que usamos es **SI1000** (Gidney et al., 2021), con un solo
parámetro p: puertas de dos qubits p, medidas 5p, reinicios 2p, esperas p/10, y
esperar durante una medida 2p. Está pensado para parecerse a un chip superconductor,
donde lo que peor va es la medida.

---

## 2. Qué hace MWPM y por qué funciona

MWPM = *Minimum-Weight Perfect Matching*, emparejamiento perfecto de peso mínimo.

**La idea.** Los eventos de detección aparecen siempre en los **extremos** de las
cadenas de errores. Así que vienen de dos en dos (o de uno, si la cadena acaba en
el borde). Decodificar es decidir **qué evento va con cuál**.

**El principio.** Si los errores son raros e independientes, una explicación con
menos errores es más probable que una con más. Con probabilidad p por error, una
cadena de longitud L tiene probabilidad ≈ p^L. Maximizar la probabilidad es
minimizar la longitud total.

**El algoritmo.**
1. Construye un grafo: cada evento de detección es un nodo. Añade un nodo
   «borde».
2. El peso de la arista entre dos nodos es el coste de la cadena más corta que los
   une. Con ruido realista el peso de cada tramo es log((1−p)/p): los fallos más
   probables pesan menos.
3. Busca el **emparejamiento perfecto** (todos los nodos emparejados, con otro
   nodo o con el borde) de **peso total mínimo**.
4. La corrección son las cadenas elegidas.

El paso 3 se resuelve de forma exacta y eficiente con el **algoritmo Blossom** de
Edmonds (1965). PyMatching implementa una variante moderna, *Sparse Blossom*, que
decodifica millones de errores por segundo.

En la web no usamos Blossom: como hay pocos eventos, probamos todas las formas de
emparejar con programación dinámica. El resultado es el mismo emparejamiento de
peso mínimo (lo comprobamos contra PyMatching en los tests).

**Por qué funciona tan bien.** Es rápido, exacto para su objetivo, y su objetivo
(la explicación con menos errores) es casi el correcto cuando p es pequeño.

**Dónde falla. Tres debilidades, y son la razón de ser de las redes:**

1. **Trata los errores X y Z por separado.** Un error Y enciende comprobaciones de
   los dos tipos. Para MWPM son dos sucesos independientes (probabilidad ≈ p²);
   en realidad es un solo suceso (probabilidad ≈ p). Ignora esa correlación.
2. **Busca el error más probable, no la clase más probable.** Lo correcto sería
   sumar la probabilidad de *todas* las cadenas que llevan al mismo resultado
   lógico (decodificación de máxima verosimilitud). Muchas cadenas medianas pueden
   pesar más que una corta.
3. **Los errores de gancho** del circuito crean correlaciones que un grafo de
   parejas no representa bien.

*Correlated matching* (nuestra segunda referencia) arregla parte del punto 1: hace
una primera pasada y usa lo que encuentra en un tipo de comprobaciones para ajustar
los pesos del otro.

---

## 3. Las redes neuronales

### 3.1 El planteamiento

Entrada: todos los eventos de detección de un disparo (ceros y unos en un volumen
ronda × fila × columna). Salida: **un solo número**, la probabilidad de que el
observable lógico se haya invertido. Si es mayor que 0,5, decimos «invertido».

Es un problema de **clasificación binaria**. No pedimos a la red el error físico,
solo la respuesta que importa. Es el mismo planteamiento que AlphaQubit.

Entrenamiento: Stim genera disparos simulados (sabemos la respuesta correcta
porque es una simulación), la red predice, medimos cuánto se equivoca con la
**entropía cruzada**, y ajustamos los pesos por descenso de gradiente (optimizador
AdamW). Los datos se generan al vuelo: la red nunca ve dos veces el mismo disparo,
así que no puede memorizar.

### 3.2 Qué puede aprender una red que MWPM no ve

Nadie le dice a la red qué es un error Y ni un gancho. Pero si en los datos ciertos
patrones de eventos aparecen juntos más de lo que el azar explicaría, la red
aprende que son un solo suceso. Con suficientes datos se acerca a la decodificación
de máxima verosimilitud, que es el óptimo teórico.

### 3.3 CNN (red convolucional)

Una **convolución** desliza un filtro pequeño (3×3×3) por el volumen y calcula, en
cada posición, una combinación de los valores vecinos. La misma operación en todas
partes: tiene sentido porque la física es local e igual en todo el chip.

Nuestra CNN: una capa de entrada, dos **bloques residuales** (cada uno suma su
resultado a su entrada, lo que facilita el entrenamiento), y una capa final que
aplana todo y da el número. Lleva además un **sesgo posicional aprendido**: un
valor por posición, para que la red sepa dónde están los bordes y qué casillas son
X o Z (una convolución pura no distingue el centro del borde, y el borde importa).

Limitación: está construida para un número fijo de rondas.

### 3.4 RT (transformer recurrente)

Inspirada en AlphaQubit, unas mil veces más pequeña.

- Un **vector de estado por cada comprobación** (8 para d = 3, 24 para d = 5).
  Es la «memoria» de la red sobre esa casilla.
- En cada ronda: (1) se mezcla en el estado el nuevo evento de esa casilla;
  (2) un bloque de **atención** permite a cada casilla consultar a las demás.
- Los **mismos pesos** se usan en todas las rondas (eso es «recurrente»). Por eso
  puede ejecutarse con más rondas de las entrenadas.
- Al final, se promedian los estados y se obtiene el número.

**Atención**, en una frase: cada casilla calcula una media ponderada de los estados
de las demás, y los pesos de esa media los decide la propia red según lo parecidos
o relevantes que le resulten. Coste: crece con el cuadrado del número de casillas,
es decir, con d⁴. Ese es precisamente el problema de escalabilidad que atacan los
trabajos de 2025–2026 (Mamba, AlphaQubit 2).

### 3.5 La red del simulador web

Es otra red, más pequeña: una CNN en 2D entrenada para el ruido del simulador
(errores en los datos, medida perfecta). Predice dos bits (inversión lógica por
errores X y por errores Z). Para dibujar una corrección se toma la de MWPM y, si
la red no está de acuerdo con su clase lógica, se le añade una cadena lógica.
Corre en el navegador en JavaScript puro, sin librerías.

---

## 4. La estadística

### 4.1 Por qué hacen falta tantos disparos

Medir p_L es como estimar la probabilidad de cara de una moneda trucada tirándola.
Con N disparos y k fallos, la estimación es k/N, con un error aproximado de
√(p_L/N). Para medir p_L = 0,1 % con un 5 % de precisión hacen falta unos 400 000
disparos. Por eso usamos 200 000 por punto y por eso los puntos con p muy baja
tienen barras de error grandes.

### 4.2 Intervalo de confianza de Wilson

Un intervalo al 95 % es un rango construido de modo que, si repitieras el
experimento muchas veces, contendría el valor verdadero el 95 % de ellas. Usamos el
de **Wilson** y no el «normal» de los libros (k/N ± 1,96·√…) porque el normal
falla cuando hay pocos fallos: con 0 fallos da un intervalo de anchura cero, lo
cual es absurdo. El de Wilson se comporta bien incluso entonces.

### 4.3 Comparación emparejada

Todos los decodificadores ven **los mismos disparos**. Así, en vez de comparar dos
porcentajes cada uno con su ruido, miramos disparo a disparo:

- fallan los dos → no dice nada sobre cuál es mejor;
- aciertan los dos → tampoco;
- **solo falla uno** → esto es lo que informa.

El **test de McNemar** pregunta: si fueran igual de buenos, los disparos
discordantes se repartirían al 50 %, como una moneda. ¿Es compatible lo observado
con una moneda justa?

El **cociente** p_L(red)/p_L(MWPM) lleva un intervalo **bootstrap emparejado**:
se remuestrean los disparos miles de veces (con reemplazo), se recalcula el cociente
cada vez, y se toma el rango central del 95 %. Si ese intervalo no contiene el 1,
la diferencia es significativa.

Es como comparar dos correctores de exámenes dándoles los mismos exámenes en vez
de montones distintos: desaparece el ruido de «a uno le tocaron exámenes más
difíciles».

### 4.4 Semillas

Entrenar una red tiene azar: los pesos iniciales y los datos que ve. Dos
entrenamientos idénticos salvo por la **semilla** dan redes algo distintas. Si
entrenara una sola y saliera bien, no sabrías si es mérito del método o suerte.
Por eso hay 3 semillas por modelo (2 en d = 7) y **se muestran todas**. Elegir la
mejor y enseñar solo esa sería hacer trampa.

Matiz honesto: los intervalos «agregados» de las gráficas reutilizan los mismos
disparos de test para las tres semillas. Miden el ruido del test, no la diferencia
entre entrenamientos. Para eso están los puntos tenues por semilla.

### 4.5 Cómo se estima el umbral, y sus límites

Buscamos el p donde se cruzan las curvas de dos distancias consecutivas,
interpolando en escala logarítmica. El intervalo sale de un *bootstrap*: se
resortean los recuentos de fallos según su distribución binomial y se recalcula el
cruce.

Límite importante: con d = 3, 5 y 7 el cruce **no es el umbral asintótico**. El
cruce 3–5 y el 5–7 salen distintos (efecto de tamaño finito). Para un umbral de
verdad harían falta distancias mucho mayores. Di siempre «cruce a tamaño finito».

### 4.6 Validación: cómo sabemos que el montaje está bien

1. MWPM corrige el 100 % de los fallos individuales del modelo de ruido en d = 3
   y 5. Si no, habría un error en los circuitos.
2. Con ruido solo en los datos, los cruces salen en 9,6–9,8 % (publicado: 10,3 %
   asintótico; a distancias pequeñas se sabe que queda algo por debajo).
3. Con ruido de circuito, los cruces caen donde dice la literatura (≈ 0,5 %).
4. Nuestro contador de fallos coincide con `sinter`, la herramienta oficial.
5. El código JavaScript de la web da el mismo peso de emparejamiento que
   PyMatching y las mismas salidas que PyTorch.

---

## 5. Los resultados, en números que debes saberte

Todo con ruido de circuito SI1000, 200 000 disparos de test por punto, los mismos
para todos los decodificadores. «Cociente» = errores lógicos de la red divididos
entre los de la referencia. Menor que 1: gana la red.

| Distancia | Red | Frente a MWPM | Frente a emparejamiento correlacionado |
|---|---|---|---|
| 3 | CNN | **0,82 – 0,96** (gana siempre) | 0,79 – 0,98 (gana siempre) |
| 3 | RT | **0,87 – 0,97** (gana siempre) | 0,84 – 0,99 (gana siempre) |
| 5 | CNN | **0,81 – 0,96**, empate en p = 1 % | **1,04 – 1,09** (pierde; empate en p = 0,1 %) |
| 5 | RT | **1,3 – 2,9** (pierde) | 1,3 – 3,4 (pierde) |
| 7 | CNN | **1,4 – 16** (pierde) | 1,4 – 43 (pierde) |
| 7 | RT | no entrenada (no cabía en el presupuesto) | |

Los rangos recorren p de 1 % (extremo cercano a 1) a 0,1 %.

En p = 0,3 %, el punto de referencia de la web:

- d = 3: CNN 0,88 [0,87 – 0,89].
- d = 5: CNN 0,82 [0,81 – 0,84] frente a MWPM; 1,05 [1,03 – 1,07] frente al correlacionado.
- d = 7: CNN 4,72 [4,57 – 4,90].

Otros números:

- **Cruces (umbral a tamaño finito), SI1000:** MWPM 0,47 % (d = 3–5) y 0,53 % (5–7).
  Correlacionado 0,53 % y 0,59 %. CNN 0,47 % (3–5) y **sin cruce** entre 5 y 7.
  La RT «cruza» en 0,17 %, pero es un artefacto de estar mal entrenada en d = 5.
- **Latencia (un núcleo, en lote):** MWPM 0,3 µs (d = 3), 2,4 µs (d = 5), 8,5 µs
  (d = 7). Redes: 53–94 µs, 176–206 µs, 507 µs. Es decir, **entre 60 y 320 veces
  más lentas**. Disparo a disparo: 0,5–1,6 ms frente a 3–14 µs.
- **Ruido no visto (despolarizante uniforme):** en d = 3 las redes siguen ganando
  a MWPM incluso informado (0,87–0,92). En d = 5 la CNN mantiene ventaja sobre
  MWPM para p ≥ 0,4 % y la pierde frente al correlacionado (1,12–1,37). MWPM con
  pesos del ruido equivocado solo empeora un 2–13 %.
- **Más rondas que en el entrenamiento (RT):** falla. Con 4 veces más rondas, 2,4
  veces el error de MWPM en d = 3.
- **Coste:** 13 modelos, 12,4 horas de CPU en total. CNN d = 3: 35 min. CNN d = 5:
  93 min. RT d = 5: 72 min. CNN d = 7: 58 min.
- **Tamaños:** CNN 180 000 (d = 3), 253 000 (d = 5), 561 000 (d = 7) parámetros. RT
  39 000 (d = 3), 23 000 (d = 5). AlphaQubit tiene del orden de millones y se
  entrenó con miles de millones de ejemplos.
- **Simulador web (ruido solo en datos):** la CNN comete 0,89 veces los errores de
  MWPM en d = 3 y 0,70 en d = 5 (con 8 % de error por qubit).

**La historia en tres frases.** En d = 3 la red gana a todo. En d = 5 gana al
MWPM básico pero pierde contra la versión mejorada del clásico. En d = 7, con el
mismo presupuesto, pierde por mucho. Y siempre es cientos de veces más lenta.

**Hipótesis previas** (escritas antes de medir, en `EXPERIMENT.md`): H1 confirmada;
H2 a medias (la CNN aún gana a MWPM en d = 5, la RT no); H3 confirmada; H4
confirmada (y decisiva en d = 5); H5 confirmada; **H6 refutada en d = 3**: esperaba
que las redes generalizaran peor a otro ruido que MWPM, y en d = 3 no fue así.
Dilo: equivocarse en una hipótesis escrita de antemano y contarlo es buena señal.

---

## 6. Las 20 preguntas más probables, con respuesta

**1. ¿Qué has hecho exactamente, en una frase?**
He reproducido a pequeña escala y en CPU la comparación entre decodificadores
neuronales y MWPM en el código de superficie, con la misma estadística para todos,
y lo he publicado todo, incluidas las derrotas de la red.

**2. ¿Qué hay de nuevo aquí?**
Nada en cuanto a ciencia. El resultado se conoce desde hace años y AlphaQubit lo
llevó mucho más lejos. Lo que aporto es una versión pequeña, abierta y
reproducible con un comando, con una web para entenderlo. Es un ejercicio de
aprendizaje hecho con rigor.

**3. ¿Por qué la red gana a MWPM en d = 3?**
Porque MWPM trata los errores X y Z como independientes y busca la cadena más
probable, no la clase lógica más probable. Con ruido de circuito hay correlaciones
(errores Y, errores de gancho en las puertas CNOT) que el grafo de emparejamiento
no representa. Con solo 24 detectores, unos millones de ejemplos bastan para que
una red pequeña aprenda esas correlaciones y se acerque al decodificador óptimo.

**4. ¿Y por qué pierde en d = 7?**
Por presupuesto. El número de detectores crece como d³ (24, 120, 336) y los
patrones que hay que distinguir crecen mucho más rápido. A la vez, mi velocidad de
entrenamiento cayó de miles de disparos por segundo a unos cientos. En d = 7 la
red vio 3 millones de ejemplos; los trabajos publicados usan miles de millones.
MWPM no necesita entrenar: lleva la geometría del código incorporada.

**5. ¿Has comparado con un rival justo? MWPM sin correlaciones es flojo.**
Por eso incluí *correlated matching* de PyMatching como segunda referencia. Y
cambia la conclusión: en d = 5 mi CNN gana al MWPM básico (0,82) pero pierde contra
el correlacionado (1,05). Además, MWPM recibe el modelo de errores exacto del ruido
de test, que es su mejor caso. No he comparado con decodificadores de redes
tensoriales ni con *belief-matching*, que son aún mejores.

**6. ¿Cómo sabes que la diferencia no es ruido estadístico?**
Todos los decodificadores ven los mismos 200 000 disparos, así que comparo
disparo a disparo. El cociente lleva un intervalo *bootstrap* emparejado al 95 %
y hay un test de McNemar guardado. En d = 3, p = 0,3 %: 0,88 con intervalo
[0,87 – 0,89]. Y hay tres semillas de entrenamiento que coinciden en ±1 %.

**7. ¿Por qué SI1000 y no despolarizante estándar?**
Porque se parece más a un chip superconductor: la medida es lo que peor va (5p) y
esperar durante una medida también cuesta (2p). Es el modelo que usan varios de
los artículos recientes, así que facilita comparar. El despolarizante uniforme lo
uso como ruido «no visto» para medir generalización.

**8. ¿Tu SI1000 es el de verdad?**
No del todo, y lo digo en todas partes: aplico las tasas de SI1000 al circuito con
puertas CX que genera Stim. La definición original usa CZ. Las probabilidades son
las mismas; la compilación no. No cambia la conclusión cualitativa, pero mis
números no son comparables al decimal con los de un artículo que use CZ.

**9. ¿Qué umbral obtienes y cómo lo comparas con la literatura?**
Cruces de MWPM en 0,47 % (d = 3–5) y 0,53 % (d = 5–7). Lo publicado para SI1000
con emparejamiento ronda el 0,45–0,5 %. Pero insisto: son cruces a tamaño finito,
no el umbral asintótico. Para eso hacen falta distancias mucho mayores y un
análisis de escalado de tamaño finito.

**10. ¿Por qué el cruce de tu RT sale en 0,17 %? ¿Tu red tiene peor umbral?**
No se puede concluir eso. Mi RT de d = 5 está mal entrenada (pierde contra la de
d = 3 casi en todo el rango), así que su curva queda artificialmente alta y cruza
muy pronto. Es un artefacto del presupuesto de entrenamiento. Lo dejo publicado
con esa advertencia en vez de esconderlo.

**11. ¿Qué arquitectura usa AlphaQubit y en qué se diferencia la tuya?**
AlphaQubit es un transformer recurrente: un estado por estabilizador, actualizado
en cada ronda con atención y convoluciones, preentrenado con datos simulados y
afinado con datos reales de Sycamore, usando además información analógica de la
medida. Mi RT copia la idea central (estado por estabilizador + atención +
recurrencia) y nada más: es unas mil veces más pequeña, sin convoluciones dentro
del bloque, sin información analógica, sin datos reales y entrenada minutos.

**12. ¿Por qué tu RT pierde contra tu CNN, si AlphaQubit es un transformer?**
Por coste por paso. En CPU mi RT de d = 5 procesa la mitad de ejemplos por segundo
que la CNN y pasó buena parte del entrenamiento en una meseta. Seguía mejorando
cuando se acabó el presupuesto, y sus dos semillas difieren mucho (1,5 y 2,5 veces
MWPM), señal de que está lejos de converger. No dice nada contra la arquitectura.

**13. ¿Se podría usar tu red en un chip real?**
No. Tres motivos: es entre 60 y 320 veces más lenta que PyMatching y a tres
órdenes de magnitud del microsegundo por ronda; da una respuesta al final del
experimento, no ronda a ronda (no es un decodificador en tiempo real ni por
ventanas); y solo ha visto ruido simulado, sin fugas ni diafonía.

**14. ¿Qué pasa si el ruido real no es el de entrenamiento?**
Lo medí con ruido despolarizante uniforme. En d = 3 las redes siguen ganando,
cosa que no esperaba. En d = 5 la ventaja se reduce y frente al correlacionado
empeora (hasta 1,37). Y hay un fallo claro: la RT no generaliza a más rondas de
las que vio (2,4 veces peor que MWPM con 4 veces más rondas), aunque comparte
pesos entre rondas. Los trabajos publicados entrenan con números de rondas
variados para conseguirlo; yo no lo hice.

**15. ¿Por qué solo memoria en base Z?**
Para reducir el cálculo a la mitad. Por la simetría del código de superficie la
base X se comporta de forma equivalente con este ruido. Es una limitación
declarada. Tampoco hay puertas lógicas ni cirugía de retícula.

**16. ¿Cómo sé que tu simulación está bien y no tienes un error en los circuitos?**
Cuatro comprobaciones automáticas: MWPM corrige el 100 % de los fallos
individuales del modelo de errores en d = 3 y 5; el umbral con ruido solo en los
datos sale en 9,6–9,8 % frente al 10,3 % publicado; el cruce con ruido de
circuito cae donde dice la literatura; y mi recuento de errores coincide con
`sinter`. Hay 52 tests en Python y más de 3000 comprobaciones en JavaScript.

**17. ¿Qué es un evento de detección y por qué no usas el síndrome directamente?**
Es el cambio de una comprobación entre dos rondas consecutivas. Con medidas
defectuosas, el valor absoluto de una comprobación no es fiable; el cambio sí
localiza un fallo en el espacio y en el tiempo. Un error de medida produce dos
eventos seguidos en el tiempo en la misma casilla.

**18. ¿Cuánto has hecho tú y cuánto la IA?**
El proyecto se ha construido con ayuda sustancial de herramientas de IA
(programación, redacción y análisis), y lo digo en la web, en el informe y en el
repositorio. Mi parte es haberlo definido, entender cada pieza hasta poder
explicarla aquí, comprobar los resultados y responder de ellos. *(Diego: esta
respuesta solo es honesta si de verdad has hecho ese trabajo. Hazlo antes de
enseñar el proyecto.)*

**19. ¿Qué harías con una GPU y un mes?**
Primero, entrenar d = 5 y d = 7 mucho más para separar «falta de presupuesto» de
«falta de arquitectura». Segundo, entrenar la RT con rondas variables. Tercero,
probar con los datos públicos de Sycamore. Cuarto, un híbrido: que la red ajuste
los pesos del grafo y MWPM haga el emparejamiento, para heredar su velocidad.

**20. ¿Qué has aprendido que no esperabas?**
Que elegir bien al rival cambia el titular (en d = 5, de «gano» a «pierdo»). Que
una hipótesis mía (H6) era falsa en d = 3. Y que lo difícil no fue entrenar la
red sino montar una comparación en la que me pudiera fiar de la diferencia.

Preguntas de física que también pueden caer (respuestas en la sección 1):
qué es un estabilizador, por qué medir el síndrome no destruye el estado, por qué
la distancia d corrige (d−1)/2 errores, qué es un operador lógico, por qué existe
un umbral.

---

## 7. Lo que nunca debes afirmar

1. **«He creado un decodificador mejor que MWPM.»** Falso en general. Gana en
   d = 3, pierde contra el correlacionado en d = 5 y pierde por mucho en d = 7.
2. **«Es investigación nueva» / «he descubierto…».** Es una reproducción.
3. **«He reproducido AlphaQubit.»** No. He reproducido el *patrón cualitativo* con
   una red inspirada en su idea, mil veces menor, sin datos reales.
4. **«Mi red tiene un umbral de X %.»** Solo hay cruces a tamaño finito con
   distancias 3–7, y el de la RT es un artefacto.
5. **«Las redes neuronales son mejores (o peores) que MWPM.»** Depende de la
   distancia, del presupuesto y del rival. Tu resultado solo vale para tu montaje.
6. **«Funcionaría en un ordenador cuántico real.»** Solo ruido simulado, sin
   tiempo real, cientos de veces demasiado lenta.
7. **«Las redes son demasiado lentas para tiempo real.»** Tampoco. *Las tuyas*, en
   PyTorch sobre CPU, lo son. AlphaQubit 2 informa de tiempo real en aceleradores.
8. **«La RT es peor arquitectura que la CNN.»** Solo que con tu presupuesto en CPU
   rindió peor.
9. **«El modelo de ruido es SI1000»** sin añadir «aplicado al circuito con CX».
10. **«Los resultados son reproducibles bit a bit.»** Solo las ejecuciones no
    interrumpidas, en la misma máquina. Cuatro modelos de d = 5 se reanudaron
    desde un punto de control y están marcados.
11. **«Lo hice yo solo.»** Se hizo con ayuda sustancial de IA. Dilo siempre.
12. **Cualquier cifra que no esté en `results/summary.json`.** Si no la
    encuentras ahí, no la digas.
13. **Citar un artículo que no has abierto.** Varias referencias de `RESEARCH.md`
    están marcadas [M] (de memoria). Compruébalas antes de nombrarlas.
14. **«QuTech / Google / etc. usan esto.»** No tienes ninguna relación con ellos.

Si te preguntan algo que no sabes: «No lo sé. Lo que sí medí es…». En una
entrevista con investigadores, eso puntúa más que improvisar.
