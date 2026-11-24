# Contrato visual · Guitarra Criolla

## Dirección

Cuaderno de taller de luthier: papel crema, tinta navy, sello rojo y seis líneas de cuerda. Misma discreción tipográfica que Recluta EN, con un motivo nuevo (diapasón) en lugar del billete.

## Tokens

| Uso | Color |
| --- | --- |
| Fondo | `#E9EDF2` → `#DCE3EC` |
| Papel / cupón | `#FFFDF8`, `#F7F4EC` |
| Navy | `#16263F` |
| Rojo sello | `#C4262E` |
| Texto | `#1D2433`, secundario `#4C5566` |
| Éxito / afinada | `#1E6B4F` |
| Aviso tensar | `#8A4E12` |
| Carbonado | `#3B356B` |

Tipografía: Barlow Condensed 400/600/700 self-hosteada en `fonts/`, con fallback Arial Narrow.

## Reglas

- **Do** mantener objetivos táctiles de al menos 44 px y foco visible de 3 px en rojo.
- **Do** usar `env(safe-area-inset-bottom)` en la barra de pestañas y en los avisos fijos.
- **Do** respetar `prefers-reduced-motion`.
- **Do** dar la instrucción de tensar/aflojar con texto, no solo con color, para que funcione sin ver la aguja.
- **Do** derivar el estado de cada nivel de las lecciones realmente aprendidas.
- **Don't** inventar progreso: una lección sólo se marca aprendida cuando el usuario la califica.
- **Don't** enviar audio del micrófono fuera del dispositivo.

## Iconos

Generados con `node tools/make-icons.js` (PNG sin dependencias). Fondo navy a sangre y seis cuerdas dentro del círculo seguro del 80 %.

| Archivo | SHA-256 |
| --- | --- |
| `icon-192.png` | `6B896FC4A3B47BBEACB09BF2CEA37C94F3FE573CB62F91C79AB5A92716657AA2` |
| `icon-512.png` | `CB5840F3C9B3DC7369699C0116F1760AFADF9BCE473F4A743BD503D2E923C8B3` |

## Provenance

Proyecto nuevo, derivado del patrón de `recluta-en`: HTML/CSS/JS vanilla, sin build, sin backend y sin dependencias externas en runtime.
