# Calendario de publicación

RAAN se lanza el **martes 17 de noviembre de 2026**. Syndrome Lab no empieza antes
del **martes 24 de noviembre**, para no pisarlo.

Horas en horario de Madrid. LinkedIn: martes y jueves por la mañana. Un solo tema
por publicación.

| Fecha | Canal | Pieza | Material | Objetivo |
|---|---|---|---|---|
| lun 23 nov | (interno) | Revisión final | todo | Pasos 0–5 de `PASOS_PARA_DIEGO.md` hechos, web publicada, enlaces sustituidos |
| **mar 24 nov, 9:00** | LinkedIn | `linkedin/01-launch.md` | `images/01-title.png` o `videos/01-inject-and-correct.mp4` | Presentar el proyecto y la web |
| jue 26 nov, 9:00 | LinkedIn | `linkedin/02-syndrome.md` | `images/02-syndrome.png` | Explicar el síndrome |
| mar 1 dic, 9:00 | LinkedIn | `linkedin/03-duel.md` | `images/03-duel.png` | MWPM frente a la red, un ejemplo |
| **mié 2 dic, 15:00** | Hacker News | `show_hn.md` | enlace a la web | Show HN. Quédate tres horas respondiendo |
| jue 3 dic, 9:00 | LinkedIn | `linkedin/04-result.md` | `images/04-headline.png` o `videos/03-mwpm-vs-network.mp4` | El resultado, con la derrota incluida |
| mar 8 dic | (festivo en España) | sin publicación | | |
| jue 10 dic, 9:00 | LinkedIn | `linkedin/05-fair-comparison.md` | `images/05-ratio.png` | Cómo hacer una comparación justa |
| mar 15 dic, 9:00 | LinkedIn | `linkedin/06-threshold.md` | `images/06-threshold.png` o `videos/02-threshold.mp4` | El umbral |
| jue 17 dic, 9:00 | LinkedIn | `linkedin/07-latency.md` | `images/07-latency.png` | La pega: la velocidad |
| mar 22 dic, 9:00 | LinkedIn | `linkedin/08-what-it-is-not.md` | `images/08-honest.png` | Cierre: qué es y qué no es |
| ene 2027 | correo | Contacto con QuTech, Qblox, QuantWare | web + informe | Solo después de dominar `DEFENSA.md` (paso 8 de `PASOS_PARA_DIEGO.md`) |

## Antes de publicar cada pieza

1. Sustituye `[link]`, `[link to the site]` y `[link to the repo]` por las
   direcciones reales.
2. Comprueba cada cifra contra `results/summary.json`. Si has vuelto a entrenar,
   los números habrán cambiado ligeramente: regenera imágenes con `make content`.
3. Reescribe con tus palabras lo que no suene a ti.
4. LinkedIn: sin rayas largas, y con la mención a la ayuda de IA (ya incluida).
5. Si el Show HN del 2 de diciembre no entra en portada, no lo repitas esa semana.
   Puedes volver a intentarlo una vez, pasadas dos semanas.

## Lo que no hay que hacer

- No publiques dos piezas el mismo día.
- No etiquetes a investigadores ni a empresas para llamar su atención.
- No escribas «gano a MWPM» sin la frase sobre d = 5 y d = 7.

## Comprobado y no comprobado

Las imágenes (1080×1350) y los vídeos (1080×1350, MP4 H.264, 9–14 s) se generan
desde la propia web con `make content` y se han revisado a ojo. No se ha probado
cómo los recomprime LinkedIn ni cómo se ven en su visor.
