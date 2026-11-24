# Guitarra Criolla · Escuela

PWA instalable para aprender guitarra criolla (6 cuerdas de nylon) desde cero. Diez niveles, 30 lecciones, repaso espaciado y afinador con micrófono que indica si hay que tensar o aflojar cada cuerda. Todo funciona offline y el progreso se guarda en el celular.

## URL pública

https://slipox.github.io/guitarra-criolla/

## Qué incluye

- **10 niveles / 30 lecciones**: postura, cuerdas al aire, primeros acordes, rasgueo, bajo, milonga, cielito, gato, chacarera y una pieza final.
- **Repaso espaciado**: al marcar «Ya la tengo» la lección vuelve en 1 día y después según tu facilidad; «Repetirla después» la trae en 1 hora.
- **Diagramas de acordes** con sonido de referencia (Em, Am, C, G, D, E, A, Dm, G7, C7).
- **Afinador**: botón por cuerda que suena la nota correcta, opción de escuchar las seis y detección con micrófono que muestra la desviación en cents y dice **TENSA** o **AFLOJA** hasta quedar afinada.
- **Registro**: estadísticas, bitácora, exportar/importar JSON, borrar progreso e instalación desde «Registro → INSTALAR APP».
- Sin backend, sin API keys, sin dependencias en runtime.

## Instalar en el celular

1. Abre https://slipox.github.io/guitarra-criolla/ con internet una vez.
2. Pulsa **INSTALAR** en el aviso o **INSTALAR APP** en la pestaña **Registro**.
3. Si el navegador no muestra el diálogo: Android/Chrome → menú ⋮ → **Instalar aplicación**; iPhone/Safari → compartir → **Añadir a la pantalla de inicio**.

El micrófono se usa solo en el dispositivo: no se graba ni se envía audio a ningún servidor.

## Desarrollo local

Sirve la carpeta por HTTP (el service worker no se registra con `file://`):

```powershell
python -m http.server 3000
```

Abre `http://localhost:3000`. Para regenerar los iconos: `node tools/make-icons.js`.

## Archivos

| Archivo | Función |
| --- | --- |
| `index.html` | Estructura de las seis vistas |
| `styles.css` | Sistema visual, contraste, foco y safe-area |
| `app.js` | Estado, SRS, audio y afinador |
| `data.js` | Cuerdas, acordes, niveles y lecciones |
| `sw.js` / `manifest.webmanifest` | Offline e instalación |
| `fonts/` | Barlow Condensed self-hosteada |

Publicado desde `main` en el repo `slipox/guitarra-criolla` con GitHub Pages.
