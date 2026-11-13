# Estado

Última actualización: 13 nov 2026. **Todas las partes están construidas.**

| Parte | Estado |
|---|---|
| Fase 0 · `RESEARCH.md` | hecho |
| Fase 1 · `EXPERIMENT.md` | hecho (con anexo de desviaciones) |
| 2.1 Datos con Stim + referencia MWPM + validación | hecho |
| 2.2 Decodificadores neuronales: 13 modelos entrenados y evaluados | hecho |
| 2.3 Web (simulador, resultados, método), bilingüe | hecho, sin desplegar |
| 2.4 Informe PDF (9 páginas) | hecho |
| 2.5 `DEFENSA.md` | hecho |
| 2.6 Contenido (8 publicaciones, 8 imágenes, 3 vídeos, Show HN, calendario) | hecho |

## Probado de verdad

- 52 tests de Python (`python -m pytest tests -q`) y 3110 comprobaciones de
  JavaScript (`node tests_js/test_qec.js`), en verde en el entorno de construcción.
- Validación contra valores publicados: umbral de capacidad de código, cruces con
  ruido de circuito, corrección de todos los fallos individuales, acuerdo con `sinter`.
- Entrenamiento y evaluación completos: 13 modelos de ruido de circuito y 6 del
  simulador; 200 000 disparos de test por punto.
- `make all SCALE=0.01` desde una copia limpia del repositorio: recorre toda la
  cadena (tests, referencias, entrenamiento, evaluación, web, figuras, informe) sin
  errores, en unos 13 minutos.
- La web se ha abierto en Chromium sin errores de consola, en escritorio (1280 px)
  y con emulación de iPhone 13, sin desbordamiento horizontal. Se han revisado a ojo
  capturas de las tres páginas, las 8 imágenes y fotogramas de los 3 vídeos.
- Los decodificadores del navegador coinciden con PyMatching (peso del
  emparejamiento) y con PyTorch (salidas de la red, diferencia < 1e-5).
- Los modelos ONNX se exportan; la web no los usa (usa JavaScript propio).

## No probado

- **`make all` a escala completa en una sola pasada.** Los resultados publicados
  salieron de esos mismos scripts, pero lanzados por partes y con reinicios del
  entorno. Cuatro modelos de d = 5 se reanudaron desde un punto de control.
- **El despliegue en GitHub Pages.** El flujo está escrito pero Pages no está
  activado. No se ha visto la web servida desde `github.io`.
- **La web en un móvil real** ni en Safari o Firefox. Solo Chromium con emulación.
- **Los modelos ONNX con ONNX Runtime** más allá de exportarlos.
- **Reproducción en otra máquina.** No se sabe cuánto cambian los números con otro
  procesador o versión de PyTorch.
- **Las citas marcadas [M]** en `RESEARCH.md`: `arxiv.org` no era accesible.
- **Cómo trata LinkedIn** las imágenes y los vídeos.
- **El nombre** frente a marcas registradas y dominios.

## Estado del CI

Ver el final de este fichero tras el último push (se actualiza a mano).
