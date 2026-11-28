"""Pruebas del panel «Mis apps» (Playwright, Chromium).

Uso:  python3 -m http.server 8766 --directory ..   (la carpeta que contiene mis-apps/)
      python3 tests/test_panel.py
En GitHub Actions las lanza .github/workflows/pruebas.yml. Imprime «TODO BIEN ✓» o la lista de fallos.
"""
import json, re, sys, pathlib
from playwright.sync_api import sync_playwright

RAIZ = pathlib.Path(__file__).resolve().parent.parent
URL = 'http://localhost:8766/mis-apps/'
fallos = []

def ok(cond, nombre, extra=''):
    print(('  ✓ ' if cond else '  ✗ ') + nombre + ('' if cond else f'  → {extra}'))
    if not cond:
        fallos.append(nombre)

# Versión única: app.js y sw.js deben llevar el mismo número
print('Versión')
v_app = re.search(r"const VERSION = '(v\d+)'", (RAIZ / 'app.js').read_text()).group(1)
v_sw = re.search(r"const CACHE = 'mis-apps-(v\d+)'", (RAIZ / 'sw.js').read_text()).group(1)
ok(v_app == v_sw, 'VERSION (app.js) y CACHE (sw.js) coinciden', f'{v_app} ≠ {v_sw}')
# Solo puede haber en el código la dirección de Mi Compra (ya pública en su propia app)
urls = set(re.findall(r'https://script\.google\.com/macros/s/[\w-]+/exec', (RAIZ / 'app.js').read_text()))
ok(len(urls) <= 1 and all('AKfycbxLGwL8' in u for u in urls), 'no hay direcciones privadas de scripts en el código', len(urls))

with sync_playwright() as p:
    b = p.chromium.launch()

    def pagina(movil, pre=''):
        vp = {'width': 390, 'height': 844} if movil else {'width': 1280, 'height': 800}
        c = b.new_context(viewport=vp, is_mobile=movil, has_touch=movil, service_workers='block',
                          accept_downloads=True, permissions=['clipboard-read', 'clipboard-write'])
        c.route('https://**', lambda r: r.abort())
        if pre:
            c.add_init_script("if(!sessionStorage.x){sessionStorage.x=1;" + pre + "}")
        pg = c.new_page()
        errores = []
        pg.on('pageerror', lambda e: errores.append(str(e)))
        pg.goto(URL); pg.wait_for_timeout(700)
        return c, pg, errores

    print('Inicio')
    c, pg, err = pagina(False)
    ok(pg.locator('.ficha').count() == 8, '8 apps en el Inicio', pg.locator('.ficha').count())
    pg.keyboard.press('Alt+2'); pg.wait_for_timeout(400)
    ok(pg.url.endswith('#habitos') and not pg.evaluate("document.getElementById('vistaApp').hidden"), 'Alt+2 abre Hábitos')
    pg.keyboard.press('Alt+0'); pg.wait_for_timeout(300)
    ok(not pg.evaluate("document.getElementById('inicio').hidden"), 'Alt+0 vuelve al Inicio')
    pg.evaluate("location.hash='compra'"); pg.wait_for_timeout(400)
    ok(pg.evaluate("document.title").startswith('Mi Compra'), 'cambiar #id con el panel abierto abre la app')
    ok(not err, 'sin errores de JavaScript (escritorio)', err)
    c.close()

    print('Móvil')
    c, pg, err = pagina(True)
    pg.locator('.ficha', has_text='Mi Día').click(); pg.wait_for_timeout(800)
    ok(pg.url.endswith('/mis-apps/#dia'), 'la app se abre dentro del panel (no sale al navegador)', pg.url)
    ok(pg.evaluate("getComputedStyle(document.getElementById('navMovil')).display") == 'none', 'el menú del panel se oculta con una app abierta')
    alto = pg.evaluate("document.querySelector('#marco iframe:not([hidden])').getBoundingClientRect().height")
    ok(alto > 600, 'la app ocupa la pantalla (iframe alto)', alto)
    pg.click('#volverApp'); pg.wait_for_timeout(400)
    ok(not pg.evaluate("document.getElementById('inicio').hidden"), '«‹» vuelve al Inicio')
    pg.locator('.ficha', has_text='Hábitos').click(); pg.wait_for_timeout(600)
    pg.click('#cambiarApp'); pg.wait_for_timeout(300)
    ok(pg.locator('#hojaApps .hojaApp').count() == 8, 'la hoja ▦ lista las 8 apps')
    pg.locator('#hojaApps .hojaApp', has_text='Mi Compra').click(); pg.wait_for_timeout(600)
    ok(pg.url.endswith('#compra') and pg.evaluate("document.getElementById('hojaApps').hidden"), 'la hoja cambia de app sin pasar por el Inicio')
    pg.go_back(); pg.wait_for_timeout(400)
    ok(pg.evaluate("document.getElementById('vistaApp').hidden"), '«atrás» del móvil vuelve al Inicio')
    pg.evaluate("localStorage.setItem('mp-datos', JSON.stringify({pedidos:[{estado:'in_transit'},{estado:'delivered'}]}))")
    pg.reload(); pg.wait_for_timeout(600)
    ok(pg.locator('.ficha[data-id=pedidos] small').inner_text() == '1 pedido en camino', 'las fichas muestran el dato vivo de cada app', pg.locator('.ficha[data-id=pedidos] small').inner_text())
    pg.evaluate("""() => { const d = new Date(), h = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      localStorage.setItem('midia-v1', JSON.stringify({ tasks: [{ id: 'a', t: 'Tarea de prueba', d: '2000-01-01' }, { id: 'b', t: 'Otra', d: h }], events: [], bdays: [] }));
      localStorage.setItem('habitos-v1', JSON.stringify({ habitos: [{ id: '1', nombre: 'Leer', frecuencia: 'diario', dias: [], creado: '2000-01-01', hechos: {} }] })); }""")
    pg.reload(); pg.wait_for_timeout(600)
    ok(pg.locator('#pendiente').is_visible() and pg.locator('#pendCuenta').inner_text() == '· 3' and pg.locator('.pendChip').first.inner_text() == 'Atrasada', '«Pendiente hoy» junta Mi Día y Hábitos, lo atrasado primero', pg.locator('#pendiente').inner_text())
    ok(pg.locator('#navMovil .nb').count() == 2 and all(t for t in pg.locator('#navMovil .nb span').all_inner_texts()), 'menú inferior: 2 pestañas, todas con nombre')
    ok(not err, 'sin errores de JavaScript (móvil)', err)
    c.close()

    print('Scripts')
    pre = ("localStorage.setItem('midia-v1',JSON.stringify({cfg:{url:'https://script.google.com/macros/s/PRUEBA_DIA/exec',key:'x'}}));"
           "localStorage.setItem('mis-apps-claves',JSON.stringify({dia:'inventada123'}));")
    c, pg, err = pagina(False, pre)
    dirs = json.loads(pg.evaluate("localStorage.getItem('mis-apps-direcciones')"))
    ok(dirs.get('dia', '').endswith('PRUEBA_DIA/exec'), 'toma la dirección de la app conectada', dirs)
    ok(json.loads(pg.evaluate("localStorage.getItem('mis-apps-claves')")) == {'dia': 'inventada123'}, 'no toca las contraseñas')
    pg.click('#btnScripts'); pg.wait_for_timeout(300)
    pg.locator('[data-mas="dia"]').click(); pg.wait_for_timeout(200)
    pg.get_by_label('Copiar la contraseña de Mi Día').last.click(); pg.wait_for_timeout(200)
    ok(pg.evaluate('navigator.clipboard.readText()') == 'inventada123', 'copiar la contraseña')
    with pg.expect_download() as dl:
        pg.click('#exportar')
    archivo = pathlib.Path('/tmp/mis-scripts-prueba.json'); dl.value.save_as(archivo)
    texto = archivo.read_text()
    ok('inventada123' not in texto and 'PRUEBA_DIA' in texto, 'exportar lleva direcciones y nunca contraseñas')
    c.close()
    c2, pg2, err2 = pagina(True)
    pg2.set_input_files('#archivoImportar', str(archivo)); pg2.wait_for_timeout(300)
    ok(json.loads(pg2.evaluate("localStorage.getItem('mis-apps-direcciones')")).get('dia', '').endswith('PRUEBA_DIA/exec'), 'importar en otro dispositivo')
    ok(not err + err2, 'sin errores de JavaScript (Scripts)', err + err2)
    c2.close()
    b.close()

print()
if fallos:
    print(f'{len(fallos)} FALLOS: ' + '; '.join(fallos)); sys.exit(1)
print('TODO BIEN ✓')
