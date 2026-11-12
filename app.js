'use strict';
const VERSION = 'v3';
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
  cerrarDirecciones();
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

// ---- Direcciones de los scripts (solo en este ordenador, en localStorage) ----
const SCRIPTS = [
  { id: 'dia',     nombre: 'Mi Día',      tipo: 'Apps Script · MI DIA', exec: true },
  { id: 'mascota', nombre: 'Mi Mascota',  tipo: 'Apps Script · MI MASCOTA', exec: true },
  { id: 'compra',  nombre: 'Mi Compra',   tipo: 'Apps Script · MI COMPRA', exec: true,
    def: 'https://script.google.com/macros/s/AKfycbxLGwL8uY56Q8Cl1CBQotiZIzz6NdHRpxFjn4kyqybkL5Or9g34nSiurC1aZ8VTjM6iaQ/exec' },
  { id: 'pedidos', nombre: 'Mis pedidos', tipo: 'Apps Script', exec: true },
  { id: 'tickets', nombre: 'Mis Tickets', tipo: 'Apps Script', exec: true },
  { id: 'viajes',  nombre: 'Mis viajes',  tipo: 'Conserje de Cloudflare', def: 'https://mis-viajes-ia.fgstrash.workers.dev' }
];
const CLAVE_DIR = 'mis-apps-direcciones';
let dirs = {};
try { dirs = JSON.parse(leer(CLAVE_DIR) || '{}') || {}; } catch (e) { dirs = {}; }
const btnDir = $('btnDir');
const textoDir = 'Direcciones de los scripts';
btnDir.addEventListener('mouseenter', () => mostrarGlobo(btnDir, textoDir));
btnDir.addEventListener('focus', () => mostrarGlobo(btnDir, textoDir));
btnDir.addEventListener('mouseleave', ocultarGlobo);
btnDir.addEventListener('blur', ocultarGlobo);

function avisoDe(s, v) {
  if (!v) return '';
  if (!/^https:\/\//.test(v)) return 'Debe empezar por https://';
  if (s.exec && !/\/exec$/.test(v)) return 'Las direcciones de Apps Script deben acabar en /exec';
  return '';
}

SCRIPTS.forEach((s) => {
  const fila = document.createElement('div');
  fila.className = 'fila';
  const info = document.createElement('div');
  const b = document.createElement('b'); b.textContent = s.nombre;
  const sm = document.createElement('small'); sm.textContent = s.tipo;
  info.append(b, sm);
  const inp = document.createElement('input');
  inp.type = 'url';
  inp.spellcheck = false;
  inp.placeholder = s.exec ? 'https://script.google.com/macros/s/…/exec' : 'https://…';
  inp.setAttribute('aria-label', 'Dirección de ' + s.nombre);
  inp.value = dirs[s.id] || s.def || '';
  const copiar = document.createElement('button');
  copiar.type = 'button'; copiar.className = 'pri'; copiar.textContent = 'Copiar';
  const abrirB = document.createElement('button');
  abrirB.type = 'button'; abrirB.className = 'sec'; abrirB.textContent = 'Abrir';
  const aviso = document.createElement('span');
  aviso.className = 'aviso';
  aviso.setAttribute('role', 'status');
  const refrescar = () => {
    const v = inp.value.trim();
    aviso.textContent = avisoDe(s, v);
    copiar.disabled = abrirB.disabled = !v;
  };
  inp.addEventListener('input', () => {
    const v = inp.value.trim();
    if (v) dirs[s.id] = v; else delete dirs[s.id];
    guardar(CLAVE_DIR, JSON.stringify(dirs));
    refrescar();
  });
  copiar.addEventListener('click', async () => {
    const v = inp.value.trim();
    try { await navigator.clipboard.writeText(v); } catch (e) { inp.select(); document.execCommand('copy'); }
    copiar.textContent = 'Copiada ✓';
    setTimeout(() => { copiar.textContent = 'Copiar'; }, 1500);
  });
  abrirB.addEventListener('click', () => { if (inp.value.trim()) window.open(inp.value.trim(), '_blank', 'noopener'); });
  fila.append(info, inp, copiar, abrirB, aviso);
  $('filasDir').appendChild(fila);
  refrescar();
});

function verDirecciones() {
  vivas.forEach((fr) => { fr.hidden = true; });
  cargando.hidden = true;
  $('direcciones').hidden = false;
  $('nombre').textContent = 'Direcciones de los scripts';
  $('dir').textContent = 'Para copiar y pegar en Ajustes de cada app';
  $('recargar').hidden = $('aparte').hidden = true;
  document.title = 'Direcciones · Mis apps';
  for (const b of Object.values(botones)) b.removeAttribute('aria-current');
  btnDir.setAttribute('aria-current', 'page');
  history.replaceState(null, '', '#direcciones');
}
function cerrarDirecciones() {
  $('direcciones').hidden = true;
  $('recargar').hidden = $('aparte').hidden = false;
  btnDir.removeAttribute('aria-current');
}
btnDir.addEventListener('click', verDirecciones);

// Atajos: Alt+1…9 para cambiar de app
document.addEventListener('keydown', (e) => {
  if (!e.altKey || e.ctrlKey || e.metaKey) return;
  const n = parseInt(e.key, 10);
  if (n >= 1 && n <= 9 && APPS[n - 1]) { e.preventDefault(); abrir(APPS[n - 1].id); }
});

// Arranque: la de la dirección (#mi-app), la última usada o Mi Día
const inicial = location.hash.slice(1) || leer('mis-apps-ultima') || 'dia';
if (inicial === 'direcciones') verDirecciones();
else abrir(APPS.some((a) => a.id === inicial && !a.ext) ? inicial : 'dia');

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
