# Mis apps

Panel personal para el PC: barra de iconos a la izquierda y la app elegida a la derecha.
Web: https://fau25.github.io/mis-apps/ (instalar en Chrome/Edge como aplicación).

- Las apps se abren dentro del panel desde la misma dirección (fau25.github.io), así conservan sus datos, sesiones y service workers.
- Se mantienen cargadas las 5 últimas usadas (`MAX_VIVAS` en app.js) para volver al instante.
- Picaje Studio se abre siempre aparte.
- Atajos: Alt+1…9. Se recuerda la última app; `#id` en la dirección abre una concreta (p. ej. `#gym`).
- Añadir una app: una línea en `APPS` (app.js).

Para actualizar: subir `VERSION` (app.js) y `CACHE` (sw.js).
