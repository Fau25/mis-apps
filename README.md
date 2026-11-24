# Mis apps

Panel personal que reúne todas las apps en una sola, en el ordenador y en el móvil.
Web: https://fau25.github.io/mis-apps/ (instalable: Chrome/Edge en el PC, «Añadir a pantalla de inicio» en el móvil).

## Cómo funciona
- Cada app se abre dentro del panel en un iframe con su ruta de fau25.github.io (misma dirección), así conserva sus datos, sesiones y service worker.
- En el ordenador: barra lateral a la izquierda y la app a la derecha. Atajos Alt+1…9 y Alt+0 (Inicio).
- En el móvil: la app ocupa toda la pantalla, con una barra fina arriba para volver («‹» o el gesto «atrás»). Abajo se deja la zona segura del teléfono, pintada con el color de la app.
- Se mantienen cargadas las últimas apps usadas (`MAX_VIVAS`: 5 en el PC, 3 en el móvil) para volver al instante.
- `#id` en la dirección abre esa app (p. ej. `#dia`); `#scripts` abre el apartado Scripts.

## Scripts
- Lista de los scripts de cada app con su dirección y contraseña, para copiarlas.
- Se guardan **solo en cada dispositivo** (localStorage). Las direcciones de los scripts no van en este repositorio (es público) y las contraseñas nunca.
- Si una app ya está conectada en el dispositivo, el panel toma de ella la dirección de su script (nunca la contraseña).
- Exportar / Importar pasa las direcciones (sin contraseñas) de un dispositivo a otro.

## Estilo
«Aurora · Alba»: fondo claro con brumas lavanda, menta y melocotón, cristal blanco, letra Sora (incluida en `fuentes/`) y acento melocotón.

## Para actualizar
- Subir `VERSION` en app.js y `CACHE` en sw.js con el mismo número.
- Añadir una app: una línea en `APPS` (app.js); si tiene script, también en `SCRIPTS_INICIALES` y, si guarda su dirección en el dispositivo, en `DIR_EN_APP`.
