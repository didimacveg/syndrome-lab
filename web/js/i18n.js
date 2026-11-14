// Tiny bilingual layer: every text node with data-i18n="key" is filled from I18N.dict[key] = [en, es].
(function () {
  const I18N = { dict: {}, lang: 'en', listeners: [] };
  try { I18N.lang = localStorage.getItem('sl-lang') || ((navigator.language || 'en').startsWith('es') ? 'es' : 'en'); } catch (e) { /* storage blocked */ }
  const q = new URLSearchParams(location.search).get('lang'); if (q === 'es' || q === 'en') I18N.lang = q;
  I18N.add = function (d) { Object.assign(I18N.dict, d); };
  I18N.t = function (key, vars) {
    const e = I18N.dict[key]; let s = e ? e[I18N.lang === 'es' ? 1 : 0] : key;
    if (vars) for (const k in vars) s = s.split('{' + k + '}').join(vars[k]);
    return s;
  };
  I18N.apply = function () {
    document.documentElement.lang = I18N.lang;
    document.querySelectorAll('[data-i18n]').forEach(el => { el.innerHTML = I18N.t(el.dataset.i18n); });
    document.querySelectorAll('.lang').forEach(b => { b.textContent = I18N.lang === 'es' ? 'EN' : 'ES'; b.setAttribute('aria-label', I18N.lang === 'es' ? 'Switch to English' : 'Cambiar a español'); });
    I18N.listeners.forEach(f => f());
  };
  I18N.toggle = function () { I18N.lang = I18N.lang === 'es' ? 'en' : 'es'; try { localStorage.setItem('sl-lang', I18N.lang); } catch (e) { /* ignore */ } I18N.apply(); };
  I18N.add({
    'nav.play': ['Play', 'Jugar'], 'nav.results': ['Results', 'Resultados'], 'nav.method': ['Method', 'Método'],
    'foot.1': ['Syndrome Lab is an open, small-scale, CPU-only <strong>reproduction</strong> of known results on neural decoding of the surface code. It is not new research.',
      'Syndrome Lab es una <strong>reproducción</strong> abierta, a pequeña escala y en CPU, de resultados conocidos sobre decodificación neuronal del código de superficie. No es investigación nueva.'],
    'foot.2': ['Built by Diego Macías Vega with the help of AI tools. Simulated with <a href="https://github.com/quantumlib/Stim">Stim</a>, baseline by <a href="https://github.com/oscarhiggott/PyMatching">PyMatching</a>. Code and data: <a href="https://github.com/didimacveg/syndrome-lab">GitHub</a>, Apache-2.0.',
      'Hecho por Diego Macías Vega con ayuda de herramientas de IA. Simulado con <a href="https://github.com/quantumlib/Stim">Stim</a>, referencia con <a href="https://github.com/oscarhiggott/PyMatching">PyMatching</a>. Código y datos: <a href="https://github.com/didimacveg/syndrome-lab">GitHub</a>, Apache-2.0.'],
  });
  window.I18N = I18N;
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.lang').forEach(b => b.addEventListener('click', I18N.toggle));
    I18N.apply();
  });
})();
