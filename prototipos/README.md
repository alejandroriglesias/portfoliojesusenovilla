# Prototipos

Diseños hechos en un lienzo de Claude. Cada archivo `.dc.html` es una página completa.

## Cómo leer un `.dc.html`
- El marcado visible va dentro de `<x-dc>…</x-dc>`. Los estilos globales están en `<helmet><style>`; el resto son estilos en línea.
- `{{nombre}}` es un valor que calcula `renderVals()` en el `<script type="text/x-dc">` del final (clase `Component`, con `this.state` y `this.setState` al estilo de React).
- `<sc-for list="{{lista}}" as="item">` repite su contenido; `<sc-if value="{{cond}}">` lo muestra u oculta.
- Los eventos van en camelCase: `onClick="{{fn}}"`, `onPointerMove`, `onPointerEnter`…
- `<script src="./support.js">` es el motor del lienzo y **no está incluido**: los archivos no funcionan al abrirlos sueltos en el navegador. Son la referencia exacta de diseño y comportamiento para portarlos a Astro.
- Las imágenes apuntan a `../assets/`.

## Archivos

| Archivo | Qué es | Interacciones clave a conservar |
|---|---|---|
| `01-inicio-galeria.dc.html` | Portada v1, de galería, limpia | Insignia giratoria sobre la obra destacada; banda de técnicas en bucle; filtros por técnica; mosaico con zoom suave al pasar el ratón; filas de técnica que filtran y bajan a la obra |
| `02-inicio-luz.dc.html` | Portada v2 "rompedora" | Hero negro con **círculo de luz** que sigue al cursor (`radial-gradient` como máscara) y descubre obras flotando y el apellido en rojo; letras que suben al cargar; menú superpuesto con `mix-blend-mode: difference`; **índice** de títulos gigantes con la imagen flotando junto al cursor; conmutador Índice/Mosaico; contacto a pantalla completa en color de acento |
| `03-inicio-revista.dc.html` | Portada "revista de arte" en blanco y negro | Cabecera "SENOVILLA" con **peso variable** según la cercanía del cursor; titulares-menú; **al hacer scroll** (con `view-timeline`) los textos se desvanecen, el fondo pasa a negro y la obra crece; sumario con filas que se invierten; reportaje a doble página con capitular; colofón |
| `04-inicio-muro.dc.html` | Portada "muro de taller" | **Lienzo infinito arrastrable** (9 teselas de 1800×1200 repetidas alrededor de la cámara), obras con cinta y giradas, notas, zoom (−/+), botón Centrar, coordenadas y visor a pantalla completa con anterior/siguiente; debajo, las secciones comunes |
| `05-inicio-boceto.dc.html` | Portada "del boceto a la estampa" | Secuencia **automática** de 4 fases: boceto SVG que se dibuja (`stroke-dashoffset`), graneado (capa negra con grano), bruñido (`clip-path: circle()` que crece y descubre la plancha), estampa final. Fases pulsables y botón "Ver otra vez"; debajo, las secciones comunes |
| `06-inicio-bandas.dc.html` | Portada "bandas de color" | Franjas verticales con los 3 colores dominantes de cada obra; suben al cargar; al pasar el ratón la franja se ensancha (`flex-grow`) y aparece la obra; la cartela inferior cambia; en móvil, franjas horizontales; debajo, las secciones comunes |
| `10-ficha-v1.dc.html` | Ficha de obra v1 | Solo referencia |
| `11-ficha-v2.dc.html` | **Ficha de obra definitiva** | Hero negro con la estampa; **lupa** circular (zoom 2–5×, limitado según la resolución); miniaturas (estampa / plancha / detalle) que recortan la misma foto; título gigante en `difference`; ficha técnica; tira horizontal "Cómo se hizo"; bloque "Sobre la técnica"; bloque de consulta en color de acento; anterior/siguiente a pantalla partida |

Secciones comunes de 04–06: presentación, obra con filtros, técnicas, sobre mí, contacto y pie.
