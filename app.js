'use strict';
const VERSION = 'v1';
const MAX_VIVAS = 5; // apps que se mantienen cargadas para volver al instante

// ruta: dentro de fau25.github.io. ext: se abre siempre aparte.
const APPS = [
  { id: 'dia',      nombre: 'Mi Día',           ruta: '/organizador/',          d: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4' },
  { id: 'habitos',  nombre: 'Hábitos',          ruta: '/mis-habitos/',          d: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM8 12l3 3 5-6' },
  { id: 'gym',      nombre: 'Mi Gym',           ruta: '/mi-gym/',               d: 'M6 7v10M3 9v6M18 7v10M21 9v6M6 12h12' },
  { id: 'compra',   nombre: 'Mi Compra',        ruta: '/lista-compra/web/',     d: 'M3 4h2l2 11h11l2-8H6M9 20h.01M17 20h.01' },
  { id: 'mascota',  nombre: 'Mi Mascota',       ruta: '/mi-mascota/',           d: 'M12 13c-3 0-5 3-5 5s2 2 5 2 5 0 5-2-2-5-5-5zM6.5 10.5h.01M17.5 10.5h.01M9.5 6.5h.01M14.5 6.5h.01' },
  { id: 'viajes',   nombre: 'Mis viajes',       ruta: '/mis-viajes/',           d: 'M6 8h12v12H6zM9 8V5h6v3M6 13h12' },
  { id: 'tickets',  nombre: 'Mis Tickets',      ruta: '/mis-tickets/',          d: 'M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6' },
  { id: 'pedidos',  nombre: 'Mis pedidos',      ruta: '/mis-pedidos/',          d: 'M3 8l9-5 9 5v8l-9 5-9-5zM3 8l9 5 9-5M12 13v8' },
  { id: 'textil',   nombre: 'Pedidos textiles', ruta: '/pedidos-textil/',       d: 'M8 4L3 7l2 4 3-1v10h8V10l3 1 2-4-5-3c0 2-2 3-4 3s-4-1-4-3z' },
  { id: 'picaje',   nombre: 'Picaje Studio',    ext: 'https://claude.ai/artifact/3sBJDKricWYNvFEtZKnrwn', d: 'M7 4h10M7 20h10M8 4v16M16 4v16M8 9l8 3M8 13l8 3' },
  { id: 'vectoriza',nombre: 'Vectoriza',        ruta: '/vectoriza-mascotas/',   d: 'M12 3l7 7-7 11-7-11zM12 3v8' },
  { id: 'pronos',   nombre: 'Pronósticos',      ruta: '/pronosticos/',          d: 'M5 20V11M12 20V5M19 20v-6M3 20h18' }
];

const $ = (id) => document.getElementById(id);
const marco = $('marco'), cargando = $('cargando');
const vivas = new Map(); // id -> iframe (orden = uso reciente)
const botones = {};
let actual = null;

const guardar = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };
const leer = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };

function icono(d) {
  const ns = 'http://www.w3.org/2000/svg';
  const s = document.createElementNS(ns, 'svg');
  s.setAttribute('viewBox', '0 0 24 24');
  s.setAttribute('aria-hidden', 'true');
  const p = document.createElementNS(ns, 'path');
  p.setAttribute('d', d);
  s.appendChild(p);
  return s;
}

// Globo con el nombre al pasar el ratón o con el foco
const globo = document.createElement('div');
globo.className = 'globo';
globo.hidden = true;
document.body.appendChild(globo);
function mostrarGlobo(b, texto) {
  const r = b.getBoundingClientRect();
  globo.textContent = texto;
  globo.hidden = false;
  globo.style.top = (r.top + r.height / 2 - 15) + 'px';
}
const ocultarGlobo = () => { globo.hidden = true; };

APPS.forEach((a, i) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'app';
  b.setAttribute('aria-label', a.nombre + (a.ext ? ' (se abre aparte)' : ''));
  b.appendChild(icono(a.d));
  b.addEventListener('click', () => abrir(a.id));
  const txt = a.nombre + (a.ext ? ' ↗' : '') + (i < 9 ? '  ·  Alt+' + (i + 1) : '');
  b.addEventListener('mouseenter', () => mostrarGlobo(b, txt));
  b.addEventListener('focus', () => mostrarGlobo(b, txt));
  b.addEventListener('mouseleave', ocultarGlobo);
  b.addEventListener('blur', ocultarGlobo);
  $('lista').appendChild(b);
  botones[a.id] = b;
});
$('logo').title = 'Mis apps · ' + VERSION;

function abrir(id) {
  const a = APPS.find((x) => x.id === id);
  if (!a) return;
  if (a.ext) { window.open(a.ext, '_blank', 'noopener'); return; }
  actual = a;
  guardar('mis-apps-ultima', id);
  history.replaceState(null, '', '#' + id);
  document.title = a.nombre + ' · Mis apps';
  $('nombre').textContent = a.nombre;
  $('dir').textContent = 'fau25.github.io' + a.ruta;
  for (const [k, b] of Object.entries(botones)) {
    if (k === id) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
  }

  let f = vivas.get(id);
  if (f) {
    vivas.delete(id); // pasa a ser la más reciente
  } else {
    f = document.createElement('iframe');
    f.title = a.nombre;
    f.setAttribute('allow', 'clipboard-read; clipboard-write; camera; microphone; fullscreen; web-share; geolocation');
    f.src = a.ruta;
    cargando.hidden = false;
    f.addEventListener('load', () => { if (actual && actual.id === id) cargando.hidden = true; });
    marco.appendChild(f);
  }
  vivas.set(id, f);
  vivas.forEach((fr, k) => { fr.hidden = k !== id; });
  if (f.dataset.cargada) cargando.hidden = true;
  f.addEventListener('load', () => { f.dataset.cargada = '1'; }, { once: true });

  // Libera las que llevan más tiempo sin usarse
  while (vivas.size > MAX_VIVAS) {
    const [k, fr] = vivas.entries().next().value;
    fr.remove();
    vivas.delete(k);
    botones[k].classList.remove('abierta');
  }
  vivas.forEach((_, k) => botones[k].classList.add('abierta'));
  try { f.focus(); } catch (e) {}
}

$('recargar').addEventListener('click', () => {
  if (!actual) return;
  const f = vivas.get(actual.id);
  if (!f) return;
  cargando.hidden = false;
  try { f.contentWindow.location.reload(); } catch (e) { f.src = actual.ruta; }
  f.addEventListener('load', () => { cargando.hidden = true; }, { once: true });
});

$('aparte').addEventListener('click', () => {
  if (actual) window.open(actual.ruta, '_blank', 'noopener');
});

// Atajos: Alt+1…9 para cambiar de app
document.addEventListener('keydown', (e) => {
  if (!e.altKey || e.ctrlKey || e.metaKey) return;
  const n = parseInt(e.key, 10);
  if (n >= 1 && n <= 9 && APPS[n - 1]) { e.preventDefault(); abrir(APPS[n - 1].id); }
});

// Arranque: la de la dirección (#mi-app), la última usada o Mi Día
const inicial = location.hash.slice(1) || leer('mis-apps-ultima') || 'dia';
abrir(APPS.some((a) => a.id === inicial && !a.ext) ? inicial : 'dia');

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
