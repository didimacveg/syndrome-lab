# Pasos para Diego

Todo lo que depende de ti, en orden. Comandos para una terminal Ubuntu o WSL.
No te saltes ninguno.

## 0. Antes de nada: léelo

1. Lee `docs/DEFENSA.md` entera, con lápiz. Es lo que tienes que saber explicar.
2. Lee `docs/RESEARCH.md` y abre a mano cada artículo marcado con **[M]** (citado
   de memoria, sin verificar en línea) para confirmar título, autores e
   identificador. Corrige lo que no cuadre. `arxiv.org` no era accesible desde el
   entorno donde se generó el proyecto.
3. Lee el informe `report/syndrome-lab-report.pdf` y comprueba que entiendes cada
   figura.

## 1. Traer el proyecto a tu ordenador

```bash
sudo apt update
```

```bash
sudo apt install -y git python3 python3-venv python3-pip nodejs make
```

```bash
git clone https://github.com/didimacveg/syndrome-lab.git
```

```bash
cd syndrome-lab
```

```bash
git checkout claude/fervent-archimedes-ntk2kz
```

## 2. Instalar y pasar los tests

```bash
python3 -m venv .venv
```

```bash
source .venv/bin/activate
```

```bash
pip install --upgrade pip
```

```bash
pip install torch --index-url https://download.pytorch.org/whl/cpu
```

```bash
pip install -r requirements.txt
```

```bash
make test
```

Debe terminar con todos los tests en verde (Python) y «checks passed» (JavaScript).
Si `sinter` no se instala, ejecuta `pip install --upgrade setuptools wheel` y repite.

## 3. Ver la web en tu ordenador

```bash
make serve
```

Abre `http://localhost:8000` en el navegador. Pruébala también en el móvil
(misma wifi, usando la IP de tu ordenador). Para parar el servidor: Ctrl+C.

## 4. (Opcional, horas) Reproducir todos los resultados desde cero

Prueba rápida de que toda la cadena funciona (unos minutos, resultados sin valor):

```bash
make all SCALE=0.01
```

```bash
git checkout -- models results web/data report
```

El segundo comando deshace la prueba y recupera los modelos y resultados buenos.

Reproducción completa (varias horas con 4 núcleos):

```bash
make clean-results
```

```bash
make all
```

Los números no serán idénticos bit a bit en otra máquina (PyTorch no garantiza
resultados idénticos entre procesadores distintos), pero sí compatibles dentro de
los intervalos de confianza.

## 5. Publicar: fusionar en `main` y activar GitHub Pages

1. En GitHub, abre el repositorio, pestaña **Pull requests**, **New pull request**,
   base `main`, compare `claude/fervent-archimedes-ntk2kz`. Créalo y pulsa
   **Merge**. (O pídeselo a Claude: «crea el pull request».)
2. **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Pestaña **Actions**, flujo **pages**, **Run workflow** (rama `main`).
4. En un minuto la web estará en `https://didimacveg.github.io/syndrome-lab/`.
5. Comprueba en la pestaña **Actions** que el flujo **tests** está en verde para el
   último commit (pasó en GitHub durante la construcción; ver `STATUS.md`).

## 6. Decidir el nombre (hecho: el repositorio ya se llama `syndrome-lab`)

Propuesta: **Syndrome Lab** (motivos en `docs/RESEARCH.md` §4). Si te convence:

1. **Settings → General → Repository name** → `syndrome-lab` → **Rename**.
2. En tu ordenador:

```bash
git remote set-url origin https://github.com/didimacveg/syndrome-lab.git
```

3. Cambia las direcciones antiguas en la web y los textos:

```bash
grep -rl "didimacveg/qec-lab" --include="*.md" --include="*.js" --include="*.html" --include="*.py" . | xargs sed -i 's#didimacveg/qec-lab#didimacveg/syndrome-lab#g; s#didimacveg.github.io/qec-lab#didimacveg.github.io/syndrome-lab#g'
```

```bash
git commit -am "Rename to syndrome-lab" && git push
```

Si prefieres otro nombre, busca antes en GitHub y PyPI que esté libre. No se han
comprobado marcas registradas ni dominios.

## 7. Revisar el contenido antes de publicarlo

1. Lee las 8 publicaciones de `content/linkedin/`. Reescribe con tus palabras lo
   que no suene a ti. Comprueba que cada cifra coincide con `results/summary.json`.
2. Mira las imágenes de `content/images/` y los vídeos de `content/videos/`.
3. Lee `content/show_hn.md`. Hacker News penaliza el tono comercial: mantenlo seco.
4. Sigue `content/CALENDARIO.md`. No empieces antes del 24 de noviembre de 2026
   (RAAN se lanza el 17).

## 8. Contacto con QuTech, Qblox, QuantWare

No envíes nada hasta haber hecho los pasos 0 a 5 y poder responder sin mirar a las
20 preguntas de `DEFENSA.md`. Cuando escribas:

- di en la primera línea que es una reproducción hecha por un estudiante de
  Bachillerato, con ayuda de IA;
- enlaza la web y el informe, no adjuntes nada;
- haz una pregunta concreta (por ejemplo, qué experimento harían ellos a
  continuación), no pidas «opinión».

## 9. Cosas que solo tú puedes decidir

- Si quieres añadir tu correo o tu web personal al pie de la web y al informe
  (ahora solo aparece tu nombre y el repositorio).
- Si quieres un dominio propio.
- Si mantienes la licencia Apache-2.0.
