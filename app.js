'use strict';
const VERSION = 'v12';
const MOVIL = matchMedia('(max-width:700px)'); // en el móvil cada app se abre a pantalla completa
const MAX_VIVAS = 5; // apps que se mantienen cargadas para volver al instante
const PASTEL = ['#E4DDF4', '#DDEFE1', '#F7EFCF', '#DCEBFB', '#F8E1EA', '#FBE6D6'];

// ruta: dentro de fau25.github.io. ext: se abre siempre aparte.
const APPS = [
  { id: 'dia',     nombre: 'Mi Día',           desc: 'Tareas y agenda',          ruta: '/organizador/',      d: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4' },
  { id: 'habitos', nombre: 'Hábitos',          desc: 'Seguimiento diario',       ruta: '/mis-habitos/',      d: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM8 12l3 3 5-6' },
  { id: 'compra',  nombre: 'Mi Compra',        desc: 'Lista de la compra',       ruta: '/lista-compra/web/', d: 'M3 4h2l2 11h11l2-8H6M9 20h.01M17 20h.01' },
  { id: 'mascota', nombre: 'Mi Mascota',       desc: 'Cuidados y citas',         ruta: '/mi-mascota/',       d: 'M12 13c-3 0-5 3-5 5s2 2 5 2 5 0 5-2-2-5-5-5zM6.5 10.5h.01M17.5 10.5h.01M9.5 6.5h.01M14.5 6.5h.01' },
  { id: 'viajes',  nombre: 'Mis viajes',       desc: 'Planes de viaje',          ruta: '/mis-viajes/',       d: 'M6 8h12v12H6zM9 8V5h6v3M6 13h12' },
  { id: 'tickets', nombre: 'Mis Tickets',      desc: 'Garantías y devoluciones', ruta: '/mis-tickets/',      d: 'M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6' },
  { id: 'pedidos', nombre: 'Mis pedidos',      desc: 'Envíos y entregas',        ruta: '/mis-pedidos/',      d: 'M3 8l9-5 9 5v8l-9 5-9-5zM3 8l9 5 9-5M12 13v8' },
  { id: 'pronos',  nombre: 'Pronósticos',      desc: 'Pronósticos deportivos',   ruta: '/pronosticos/',      d: 'M5 20V11M12 20V5M19 20v-6M3 20h18' }
];
const IC = {
  enlace: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
  candado: 'M8 11V8a4 4 0 0 1 8 0v3M6 11h12v9H6z',
  flecha: 'M5 12h14M13 6l6 6-6 6',
  abajo: 'M6 9l6 6 6-6', arriba: 'M6 15l6-6 6 6', ok: 'M5 12l5 5 9-10'
};

const $ = (id) => document.getElementById(id);
const marco = $('marco'), cargando = $('cargando');
const vivas = new Map(); // id -> iframe (orden = uso reciente)
const botones = {};
let actual = null;

const guardar = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };
const leer = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const leerJSON = (k, def) => { try { const v = JSON.parse(leer(k)); return v == null ? def : v; } catch (e) { return def; } };

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
function el(tag, cls, txt) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (txt != null) e.textContent = txt;
  return e;
}

// ---- Globo con el nombre al pasar por la barra ----
const globo = el('div', 'globo');
globo.hidden = true;
document.body.appendChild(globo);
function conGlobo(b, texto) {
  const ver = () => { const r = b.getBoundingClientRect(); globo.textContent = texto; globo.hidden = false; globo.style.top = (r.top + r.height / 2 - 14) + 'px'; };
  const ocultar = () => { globo.hidden = true; };
  b.addEventListener('mouseenter', ver); b.addEventListener('focus', ver);
  b.addEventListener('mouseleave', ocultar); b.addEventListener('blur', ocultar);
}

// ---- Aviso inferior (con «Deshacer» opcional) ----
let avisoT = null;
function avisar(texto, deshacer) {
  $('avisoTexto').textContent = texto;
  $('deshacer').hidden = !deshacer;
  $('deshacer').onclick = deshacer ? () => { deshacer(); $('aviso').hidden = true; } : null;
  $('aviso').hidden = false;
  clearTimeout(avisoT);
  avisoT = setTimeout(() => { $('aviso').hidden = true; }, deshacer ? 7000 : 1800);
}

// ---- Barra lateral ----
APPS.forEach((a, i) => {
  const b = el('button', 'app');
  b.type = 'button';
  b.setAttribute('aria-label', a.nombre + (a.ext ? ' (se abre aparte)' : ''));
  b.appendChild(icono(a.d));
  b.addEventListener('click', () => abrir(a.id));
  conGlobo(b, a.nombre + (a.ext ? ' ↗' : '') + (i < 9 ? '  ·  Alt+' + (i + 1) : ''));
  $('lista').appendChild(b);
  botones[a.id] = b;
});
conGlobo($('logo'), 'Inicio  ·  Alt+0');
conGlobo($('btnScripts'), 'Scripts y contraseñas');
$('logo').addEventListener('click', mostrarInicio);

// ---- Inicio ----
function saludo() {
  const ahora = new Date(), h = ahora.getHours();
  $('saludo').textContent = h >= 6 && h < 14 ? 'Buenos días' : h >= 14 && h < 21 ? 'Buenas tardes' : 'Buenas noches';
  const f = ahora.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  $('fecha').textContent = f.charAt(0).toUpperCase() + f.slice(1);
}

function pintarInicio() {
  const r = $('rejilla');
  r.textContent = '';
  const q = $('buscar').value.trim().toLowerCase();
  const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const visibles = APPS.filter((a) => !q || norm(a.nombre).includes(norm(q)));
  visibles.forEach((a) => {
    const i = APPS.indexOf(a);
    const f = el('button', 'ficha');
    f.type = 'button';
    f.dataset.id = a.id;
    const arriba = el('span', 'arriba');
    const tile = el('span', 'tile');
    const img = el('img'); img.src = 'iconos/' + a.id + '.svg'; img.alt = ''; img.width = 64; img.height = 64; img.decoding = 'async';
    tile.appendChild(img);
    const marca = el('span', 'marca');
    if (a.ext) marca.textContent = 'Aparte ↗';
    else if (vivas.has(a.id)) { marca.appendChild(el('i')); marca.append('Abierta'); }
    arriba.append(tile, marca);
    const txt = el('span');
    txt.append(el('b', '', a.nombre), el('small', '', a.desc));
    const flecha = el('span', 'flecha'); flecha.appendChild(icono(IC.flecha));
    f.append(arriba, txt, flecha);
    f.setAttribute('aria-label', a.nombre + ', ' + a.desc);
    f.addEventListener('click', () => abrir(a.id));
    r.appendChild(f);
  });
  // Ficha oscura: seguir con la última app
  const ultima = APPS.find((a) => a.id === leer('mis-apps-ultima') && !a.ext) || APPS[0];
  if (!q) {
    const c = el('div', 'continuar');
    const ico = el('span', 'ico'); ico.appendChild(icono(ultima.d));
    const t = el('div', 'txt');
    t.append(el('b', '', 'Seguir con ' + ultima.nombre),
      el('small', '', 'La última app que abriste. Alt+1…9 salta entre apps y Alt+0 vuelve aquí.'));
    const b = el('button', 'pildora', 'Abrir');
    b.type = 'button';
    b.addEventListener('click', () => abrir(ultima.id));
    c.append(ico, t, b);
    r.appendChild(c);
  }
  $('sinResultados').hidden = visibles.length > 0;
  $('cuenta').textContent = APPS.length + ' apps' + (vivas.size ? ' · ' + vivas.size + ' abiertas' : '');
}
$('buscar').addEventListener('input', pintarInicio);
$('buscar').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { const p = $('rejilla').querySelector('.ficha'); if (p) abrir(p.dataset.id); }
  if (e.key === 'Escape') { $('buscar').value = ''; pintarInicio(); $('buscar').blur(); }
});

function mostrarInicio() {
  actual = null;
  $('vistaApp').hidden = true;
  $('inicio').hidden = false;
  for (const b of Object.values(botones)) b.removeAttribute('aria-current');
  $('logo').setAttribute('aria-current', 'page');
  history.replaceState(null, '', location.pathname);
  document.title = 'Mis apps';
  saludo();
  pintarInicio();
}

// ---- Abrir una app ----
function abrir(id) {
  const a = APPS.find((x) => x.id === id);
  if (!a) return;
  if (a.ext) { window.open(a.ext, '_blank', 'noopener'); return; }
  if (MOVIL.matches) { guardar('mis-apps-ultima', id); location.href = a.ruta; return; }
  cerrarCajon(false);
  actual = a;
  guardar('mis-apps-ultima', id);
  history.replaceState(null, '', '#' + id);
  document.title = a.nombre + ' · Mis apps';
  $('inicio').hidden = true;
  $('vistaApp').hidden = false;
  $('logo').removeAttribute('aria-current');
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
    f.addEventListener('load', () => {
      f.dataset.cargada = '1';
      if (actual && actual.id === id) cargando.hidden = true;
      try { f.contentWindow.document.addEventListener('keydown', atajosApps); } catch (e) {} // misma dirección: Alt+0…9 también dentro de la app
    });
    marco.appendChild(f);
  }
  vivas.set(id, f);
  vivas.forEach((fr, k) => { fr.hidden = k !== id; });
  if (f.dataset.cargada) cargando.hidden = true;

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
$('aparte').addEventListener('click', () => { if (actual) window.open(actual.ruta, '_blank', 'noopener'); });

// ---- Scripts: lista editable; direcciones y contraseñas solo en este ordenador ----
const SCRIPTS_INICIALES = [
  { id: 'dia',     nombre: 'Mi Día',      tipo: 'Apps Script', exec: true },
  { id: 'mascota', nombre: 'Mi Mascota',  tipo: 'Apps Script', exec: true },
  { id: 'compra',  nombre: 'Mi Compra',   tipo: 'Apps Script', exec: true,
    def: 'https://script.google.com/macros/s/AKfycbxLGwL8uY56Q8Cl1CBQotiZIzz6NdHRpxFjn4kyqybkL5Or9g34nSiurC1aZ8VTjM6iaQ/exec' },
  { id: 'pedidos', nombre: 'Mis pedidos', tipo: 'Apps Script', exec: true },
  { id: 'tickets', nombre: 'Mis Tickets', tipo: 'Apps Script', exec: true },
  { id: 'habitos', nombre: 'Hábitos',     tipo: 'Apps Script', exec: true },
  { id: 'gym',     nombre: 'Mi Gym',      tipo: 'Apps Script', exec: true },
  { id: 'viajes',  nombre: 'Mis viajes',  tipo: 'Cloudflare', def: 'https://mis-viajes-ia.fgstrash.workers.dev' }
];
const CLAVE_LISTA = 'mis-apps-scripts';
const CLAVE_DIR = 'mis-apps-direcciones';
const CLAVE_PASS = 'mis-apps-claves';
let scripts = leerJSON(CLAVE_LISTA, null);
if (!Array.isArray(scripts)) scripts = SCRIPTS_INICIALES.map((s) => ({ ...s }));
const dirs = leerJSON(CLAVE_DIR, {}) || {};
const claves = leerJSON(CLAVE_PASS, {}) || {};
// La dirección por defecto cuenta como guardada (así se puede borrar o cambiar)
scripts.forEach((s) => { if (s.def && !(s.id in dirs)) dirs[s.id] = s.def; delete s.def; });
const guardarTodo = () => {
  guardar(CLAVE_LISTA, JSON.stringify(scripts));
  guardar(CLAVE_DIR, JSON.stringify(dirs));
  guardar(CLAVE_PASS, JSON.stringify(claves));
};
guardarTodo();
let abierto = null;
let ultimoFoco = null;

function colorDe(id) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const i = APPS.findIndex((a) => a.id === id);
  return PASTEL[(i >= 0 ? i : h) % PASTEL.length];
}
function avisoDe(s, v) {
  if (!v) return '';
  if (!/^https:\/\//.test(v)) return 'Debe empezar por https://';
  if (s.exec && /script\.google\.com/.test(v) && !/\/exec$/.test(v)) return 'Las direcciones de Apps Script acaban en /exec';
  return '';
}
async function copiar(texto, boton, que) {
  try { await navigator.clipboard.writeText(texto); } catch (e) { avisar('No se pudo copiar'); return; }
  const svg = boton.querySelector('svg');
  const nuevo = icono(IC.ok);
  boton.replaceChild(nuevo, svg);
  boton.classList.add('hecho');
  setTimeout(() => { boton.replaceChild(svg, nuevo); boton.classList.remove('hecho'); }, 1400);
  avisar(que + ' copiada');
}
function botonIcono(d, etiqueta, cls) {
  const b = el('button', 'icob' + (cls ? ' ' + cls : ''));
  b.type = 'button';
  b.setAttribute('aria-label', etiqueta);
  b.title = etiqueta.split(' de ')[0];
  b.appendChild(icono(d));
  return b;
}

function pintarScripts() {
  const cont = $('filas');
  cont.textContent = '';
  const q = $('buscarScript').value.trim().toLowerCase();
  $('cuentaScripts').textContent = scripts.length + ' guardados';
  scripts.filter((s) => !q || s.nombre.toLowerCase().includes(q)).forEach((s) => {
    const fila = el('div', 'script' + (abierto === s.id ? ' abierto' : ''));
    const linea = el('div', 'linea');
    const app = APPS.find((a) => a.id === s.id);
    const ini = el('span', 'ini', app ? null : (s.nombre.trim()[0] || '?').toUpperCase());
    if (app) ini.appendChild(icono(app.d));
    ini.style.background = colorDe(s.id);
    ini.setAttribute('aria-hidden', 'true');
    const nom = el('span', 'nom', s.nombre);
    const bUrl = botonIcono(IC.enlace, 'Copiar la dirección de ' + s.nombre);
    const bPass = botonIcono(IC.candado, 'Copiar la contraseña de ' + s.nombre);
    bUrl.disabled = !dirs[s.id];
    bPass.disabled = !claves[s.id];
    bUrl.addEventListener('click', () => copiar(dirs[s.id], bUrl, 'Dirección'));
    bPass.addEventListener('click', () => copiar(claves[s.id], bPass, 'Contraseña'));
    const bMas = botonIcono(abierto === s.id ? IC.arriba : IC.abajo, 'Detalles de ' + s.nombre, 'mas');
    bMas.setAttribute('aria-expanded', String(abierto === s.id));
    bMas.addEventListener('click', () => { abierto = abierto === s.id ? null : s.id; pintarScripts(); enfocar('[data-mas="' + s.id + '"]'); });
    bMas.dataset.mas = s.id;
    linea.append(ini, nom, bUrl, bPass, bMas);
    fila.appendChild(linea);
    if (abierto === s.id) fila.appendChild(detalle(s, { nom, ini, bUrl, bPass }));
    cont.appendChild(fila);
  });
  if (!cont.children.length) cont.appendChild(el('p', 'vacio', scripts.length ? 'Ningún script coincide.' : 'No hay scripts. Pulsa «+ Añadir script».'));
}
function enfocar(sel) { const e = $('filas').querySelector(sel); if (e) e.focus(); }

function detalle(s, refs) {
  const d = el('div', 'detalle');
  // Nombre
  const cN = el('label', 'campo', 'Nombre');
  const iN = el('input');
  iN.value = s.nombre; iN.spellcheck = false; iN.dataset.nombre = s.id;
  iN.addEventListener('input', () => {
    s.nombre = iN.value || 'Sin nombre';
    refs.nom.textContent = s.nombre;
    if (!refs.ini.querySelector('svg')) refs.ini.textContent = (s.nombre.trim()[0] || '?').toUpperCase();
    guardarTodo();
  });
  cN.appendChild(iN);
  // Dirección
  const cU = el('label', 'campo', 'Dirección');
  const f1 = el('span', 'fila2');
  const iU = el('input', 'url');
  iU.type = 'url'; iU.spellcheck = false; iU.value = dirs[s.id] || '';
  iU.placeholder = 'https://script.google.com/macros/s/…/exec';
  const bAbrir = el('button', 'mini', 'Abrir'); bAbrir.type = 'button';
  const aviso = el('span', 'avisoCampo'); aviso.setAttribute('role', 'status');
  const refrescarU = () => { const v = iU.value.trim(); aviso.textContent = avisoDe(s, v); bAbrir.disabled = refs.bUrl.disabled = !v; };
  iU.addEventListener('input', () => { const v = iU.value.trim(); if (v) dirs[s.id] = v; else delete dirs[s.id]; guardarTodo(); refrescarU(); });
  bAbrir.addEventListener('click', () => { if (dirs[s.id]) window.open(dirs[s.id], '_blank', 'noopener'); });
  f1.append(iU, bAbrir);
  cU.append(f1, aviso);
  refrescarU();
  // Contraseña (oculta salvo que pulses «Ver»; se vuelve a ocultar sola)
  const cP = el('label', 'campo', 'Contraseña');
  const f2 = el('span', 'fila2');
  const iP = el('input');
  iP.type = 'password'; iP.autocomplete = 'off'; iP.spellcheck = false; iP.value = claves[s.id] || ''; iP.placeholder = 'Contraseña';
  const bVer = el('button', 'mini', 'Ver'); bVer.type = 'button';
  let t = null;
  const refrescarP = () => { bVer.disabled = refs.bPass.disabled = !iP.value; };
  iP.addEventListener('input', () => { if (iP.value) claves[s.id] = iP.value; else delete claves[s.id]; guardarTodo(); refrescarP(); });
  bVer.addEventListener('click', () => {
    const oculta = iP.type === 'password';
    iP.type = oculta ? 'text' : 'password'; bVer.textContent = oculta ? 'Ocultar' : 'Ver';
    clearTimeout(t);
    if (oculta) t = setTimeout(() => { iP.type = 'password'; bVer.textContent = 'Ver'; }, 10000);
  });
  f2.append(iP, bVer);
  cP.appendChild(f2);
  refrescarP();
  // Eliminar (con deshacer)
  const bBorrar = el('button', 'borrar', 'Eliminar script'); bBorrar.type = 'button';
  bBorrar.addEventListener('click', () => {
    const pos = scripts.indexOf(s);
    const copia = { s, pos, url: dirs[s.id], pass: claves[s.id] };
    scripts.splice(pos, 1);
    delete dirs[s.id]; delete claves[s.id];
    abierto = null;
    guardarTodo(); pintarScripts();
    $('anadir').focus();
    avisar('«' + s.nombre + '» eliminado', () => {
      scripts.splice(Math.min(copia.pos, scripts.length), 0, copia.s);
      if (copia.url) dirs[s.id] = copia.url;
      if (copia.pass) claves[s.id] = copia.pass;
      guardarTodo(); abierto = s.id; pintarScripts();
    });
  });
  d.append(cN, cU, cP, bBorrar);
  return d;
}

$('anadir').addEventListener('click', () => {
  const s = { id: 's' + Date.now().toString(36), nombre: 'Nuevo script', tipo: 'Apps Script', exec: true };
  scripts.push(s);
  guardarTodo();
  $('buscarScript').value = '';
  abierto = s.id;
  pintarScripts();
  const i = $('filas').querySelector('[data-nombre="' + s.id + '"]');
  if (i) { i.focus(); i.select(); i.scrollIntoView({ block: 'nearest' }); }
});
$('buscarScript').addEventListener('input', pintarScripts);

function abrirCajon() {
  ultimoFoco = document.activeElement;
  pintarScripts();
  $('velo').hidden = $('cajon').hidden = false;
  $('btnScripts').setAttribute('aria-expanded', 'true');
  if (!MOVIL.matches) $('buscarScript').focus(); else $('cerrarCajon').focus();
}
function cerrarCajon(devolverFoco = true) {
  if ($('cajon').hidden) return;
  $('velo').hidden = $('cajon').hidden = true;
  $('btnScripts').setAttribute('aria-expanded', 'false');
  navActivo($('buscar').closest('.buscar').classList.contains('ver') ? 'nBuscar' : 'nInicio');
  if (devolverFoco && ultimoFoco && ultimoFoco.focus) ultimoFoco.focus();
}
$('btnScripts').addEventListener('click', () => ($('cajon').hidden ? abrirCajon() : cerrarCajon()));
$('abrirScripts').addEventListener('click', abrirCajon);
$('cerrarCajon').addEventListener('click', () => cerrarCajon());
$('velo').addEventListener('click', () => cerrarCajon());

// ---- Menú inferior (móvil) ----
function navActivo(id) {
  ['nInicio', 'nBuscar', 'nScripts'].forEach((k) => $(k).classList.toggle('activo', k === id));
}
$('nInicio').addEventListener('click', () => { cerrarCajon(false); $('buscar').closest('.buscar').classList.remove('ver'); $('buscar').value = ''; pintarInicio(); navActivo('nInicio'); $('inicio').scrollTo({ top: 0, behavior: 'smooth' }); });
$('nBuscar').addEventListener('click', () => { cerrarCajon(false); const l = $('buscar').closest('.buscar'); l.classList.add('ver'); navActivo('nBuscar'); $('buscar').focus(); });
$('nScripts').addEventListener('click', () => { abrirCajon(); navActivo('nScripts'); });

// ---- Teclado ----
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !$('cajon').hidden) { e.preventDefault(); cerrarCajon(); return; }
  if (e.key === 'Tab' && !$('cajon').hidden) { // el foco no sale del panel lateral
    const f = [...$('cajon').querySelectorAll('button:not(:disabled),input')];
    if (!f.length) return;
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    return;
  }
  const escribiendo = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
  if (e.key === '/' && !escribiendo && !$('inicio').hidden && $('cajon').hidden) { e.preventDefault(); $('buscar').focus(); return; }
  atajosApps(e);
});
function atajosApps(e) {
  if (!e.altKey || e.ctrlKey || e.metaKey) return;
  const n = parseInt(e.code && e.code.startsWith('Digit') ? e.code.slice(5) : e.key, 10);
  if (n === 0) { e.preventDefault(); cerrarCajon(false); mostrarInicio(); }
  else if (n >= 1 && n <= 9 && APPS[n - 1]) { e.preventDefault(); abrir(APPS[n - 1].id); }
}

// ---- Arranque: #mi-app abre esa app; si no, el Inicio ----
const inicial = location.hash.slice(1);
if (APPS.some((a) => a.id === inicial && !a.ext) && !MOVIL.matches) abrir(inicial);
else {
  mostrarInicio();
  if (inicial === 'scripts' || inicial === 'direcciones') abrirCajon();
}
$('logo').title = '';
$('logo').dataset.version = VERSION;

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
