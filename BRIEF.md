# Brief — Nueva web de Jesús Senovilla

Rehacer **jesusenovilla.com** (hoy un WordPress) como web propia, rápida y moderna, con un **CMS fácil de usar** para que el artista suba obras, fotos y textos sin tocar código.

- Artista: **Jesús Senovilla** — óleo, acuarela y grabado (aguafuerte, aguatinta, manera negra, punta seca, carborundo, alcograbado, zieglerografía, stock-gum).
- Idioma de la web: **español**.
- Diseños de referencia: carpeta `prototipos/` (ver `prototipos/README.md`). Lienzo original: https://claude.ai/artifact/2kM45bEyrfuF7gqUKs8Z5k
- Instagram: https://www.instagram.com/jesusenovilla/

---

## 1. Stack propuesto

| Pieza | Elección | Por qué |
|---|---|---|
| Web pública | **Astro** (versión estable actual), TypeScript | Webs de contenido muy rápidas, buen SEO, HTML por defecto y JS solo donde hace falta (islas). |
| CMS | **Keystatic** (integración oficial con Astro) | Panel en `/keystatic` con formularios sencillos, subida de imágenes y textos enriquecidos. Sin base de datos: el contenido se guarda como archivos en el propio repositorio, así que es 100 % del artista. |
| Estilos | CSS propio con variables (tokens del punto 4), estilos con ámbito en cada componente Astro | Los prototipos ya están en CSS plano; traslado directo. |
| Interacción | JS vanilla en scripts de componente (sin framework de UI) | Los efectos son pequeños y concretos. |
| Imágenes | `astro:assets` (`<Image>` / `getImage`) con `srcset` y formatos modernos | Las obras pesan; la lupa necesita una versión grande aparte. |
| Alojamiento | Netlify o Vercel (plan gratuito) + Keystatic en **modo GitHub** para editar en producción | Coste cero; el artista entra en `/keystatic` con su cuenta y publica. En desarrollo, Keystatic en modo `local`. |

Alternativa si más adelante se quiere un panel con servidor y base de datos propia: Payload CMS. No es la opción por defecto.

---

## 2. Páginas y rutas

| Ruta | Contenido | Prototipo de referencia |
|---|---|---|
| `/` | Portada **activa** (elegible desde el CMS, ver Ajustes) | 01–06 |
| `/inicio/galeria`, `/inicio/luz`, `/inicio/revista`, `/inicio/muro`, `/inicio/boceto`, `/inicio/bandas` | Las seis portadas, siempre accesibles para compararlas | 01–06 |
| `/obra` | Índice completo con filtros por técnica | sección "Obra" de 01/04–06, índice de 02, sumario de 03 |
| `/obra/[slug]` | **Ficha de obra** | **11-ficha-v2** (la v1, `10-ficha-v1`, queda solo como referencia) |
| `/tecnicas/[slug]` | Obras de una técnica + texto "Sobre la técnica" | tarjetas "Técnicas" |
| `/sobre-mi` | Bio, retrato, firma, trayectoria | sección "Sobre mí" |
| `/blog`, `/blog/[slug]` | Entradas (la web actual tiene blog) | estilo tipográfico de la Revista |
| `/contacto` | Email, Instagram, encargos | sección "Contacto"/"Colofón" |
| `/keystatic` | Panel del CMS | — |

Las portadas comparten cabecera, pie y bloques comunes; cada una cambia el **hero** y la paleta.

---

## 3. Modelo de contenido (Keystatic)

### Colección `obras`
| Campo | Tipo | Notas |
|---|---|---|
| `titulo` | texto (slug a partir del título) | |
| `tecnica` | selección: óleo, acuarela, grabado | filtros y rutas de técnica |
| `subtecnica` | selección (solo grabado): aguafuerte, aguatinta, manera negra, punta seca, carborundo, alcograbado, zieglerografía, stock-gum | En el WordPress actual estaban mal colgadas bajo "Óleos": corregirlo. |
| `anio` | número | |
| `medidas` | texto ("alto × ancho cm") | |
| `soporte` | texto (lienzo, tabla, papel…) | |
| `edicion` | texto (p. ej. "50 ejemplares") | solo grabado |
| `estado` | selección: disponible, vendida, no a la venta | punto de color en la ficha |
| `imagen` | imagen, **alta resolución** (≥ 2500 px lado largo) | se usa para la lupa |
| `imagenPlancha` | imagen opcional (recorte sin papel) | portadas 02, 05, 06 y miniaturas |
| `vistas` | lista de imágenes con etiqueta (detalle, plancha…) | miniaturas de la ficha |
| `proceso` | lista {imagen, título, texto} | tira "Cómo se hizo"; si está vacía, la sección no aparece |
| `descripcion` | texto enriquecido | |
| `paleta` | 3 colores hex | Portada 06 (Bandas). Ideal: calcularla al compilar a partir de la imagen (3 colores dominantes) y permitir sobrescribirla. |
| `muro` | {x, y, rotación} opcional | Portada 04 (Muro). Si falta, colocar automáticamente sin solapes. |
| `destacada` | booleano | obra de portada (02, 03, 05) |
| `orden` | número | |

### Colección `tecnicas`
`nombre`, `slug`, `resumen`, `sobreLaTecnica` (texto enriquecido, el bloque negro de la ficha v2), `imagen`.

### Colección `blog`
`titulo`, `fecha`, `portada` (imagen), `extracto`, `cuerpo` (texto enriquecido con imágenes).

### Singleton `sobreMi`
`bio` (texto enriquecido), `retrato` (imagen), `firma` (imagen PNG transparente), `trayectoria` (lista {año, texto}).

### Singleton `ajustes`
`email`, `instagram`, `portadaActiva` (selección: galeria, luz, revista, muro, boceto, bandas), `frasePortada`, `edicionRevista` (p. ej. "Nº 01 — Invierno 2026"), textos SEO por defecto.

Hay contenido inicial en `contenido/obras.json` (mira el campo `ejemplo`).

---

## 4. Sistema visual (tokens)

**Tipografías** (Google Fonts, o mejor autoalojadas):
- **Syne**: titulares. Pesos 600–800; la portada Revista usa el eje variable 400–800 (las letras de la cabecera cambian de peso según el cursor).
- **Inter**: texto e interfaz, pesos 400 / 500 / 600.

**Colores base**
| Token | Valor | Uso |
|---|---|---|
| `--ink` | `#141414` / `#111111` | texto principal |
| `--paper` | `#FAFAF8` / `#F5F4F0` | fondo claro |
| `--black` | `#0B0B0B` / `#0A0A0A` | secciones oscuras |
| `--muted` | `#5F5E5A` / `#5F5C55` | texto secundario (contraste AA comprobado) |
| `--line` | `rgba(20,20,20,.14)` | filetes |
| `--accent` | `#C8371A` | rojo bermellón ("tinta"); botones, puntos, acentos |
| `--accent-on-dark` | `#F2714F` | acento sobre negro (contraste AA) |

Paletas por portada (fondos): Muro `#F3F0EA`/`#ECE8E1`; Boceto `#F6F4EF`/`#ECE9E2`; Bandas `#F4F2EE`; Revista solo blanco/negro más acento.

**Escala**: titulares gigantes con `clamp()` (p. ej. `clamp(52px, 8vw, 132px)`), interlineado 0.85–0.95 e interletraje entre −0.03em y −0.055em; etiquetas en versalitas de 12–13 px con interletraje 0.16em. Contenedor máximo de 1360–1440 px y márgenes laterales `clamp(20px, 4vw, 48px)`.

**Reglas**: botones tipo píldora (radio 999px) con altura mínima de 44 px; todo debe funcionar a ancho de móvil; respetar `prefers-reduced-motion` en todos los efectos.

---

## 5. Componentes a construir

- `Header` (variantes: sólida fija; superpuesta con `mix-blend-mode: difference`)
- `Footer`
- `FiltroTecnicas` (píldoras con `aria-pressed`)
- `TarjetaObra` (mosaico) y `FilaIndice` (índice con vista previa flotante que sigue al cursor)
- `TarjetasTecnica`
- `SobreMi`, `Contacto`, `Colofon`
- `Lupa` (ficha v2): zoom circular que sigue al cursor sobre la imagen grande; zoom 2–5×
- `TiraProceso` (deslizamiento horizontal con *scroll-snap*)
- Heroes: `HeroGaleria`, `HeroLuz` (círculo de luz con máscara radial), `HeroRevista` (*scroll-driven animations* con `view-timeline`, con alternativa estática), `HeroMuro` (lienzo infinito que se arrastra, con 9 teselas repetidas, zoom y visor), `HeroBoceto` (secuencia temporal de 4 fases: trazo SVG que se dibuja, graneado, bruñido con `clip-path`, estampa), `HeroBandas` (acordeón de franjas de color con revelado de la obra)

El detalle de cada interacción está en `prototipos/README.md`.

---

## 6. Migración desde WordPress

1. Rastrear jesusenovilla.com y listar todas las URLs (obras, categorías Óleos/Acuarelas/Grabados, blog, páginas).
2. Exportar el contenido (WXR desde el panel o la API REST `wp-json/wp/v2/…`) y **las imágenes originales** de `wp-content/uploads` (no las miniaturas).
3. Convertir a entradas de Keystatic (script de importación).
4. Redirecciones 301 de todas las URLs antiguas a las nuevas.
5. **La web actual tiene `noindex`**: la nueva debe ser indexable (meta robots, `sitemap.xml`, `robots.txt`, Open Graph y datos estructurados `VisualArtwork`/`Person`).

---

## 7. Contenido pendiente / avisos importantes

- Los textos entre **[corchetes]** son marcadores: bio, email, medidas, años, trayectoria, etc.
- `assets/ejemplos/*-EJEMPLO.jpg` son **imágenes generadas por ordenador** para ver el efecto de conjunto. **No son obras del artista y no deben publicarse.** Los títulos "Árbol", "Membrillos", "Trigal", "Noche" y "Mar gris" también son inventados. "Repollo" (óleo, 2019) y "Paisaje abstracto" (acuarela, 2019) sí son obras reales, pero sus imágenes de ejemplo no lo son.
- `assets/obras/rosa-*.jpg` es la foto real de **Rosa** (manera negra, 2010, estampa 1/50 firmada). Su resolución es baja: hay que volver a fotografiarla a ≥ 2500 px para que la lupa luzca.
- La biografía del WordPress actual es texto de relleno; hay que escribirla de nuevo.

---

## 8. Fases sugeridas

1. Montar el proyecto Astro y Keystatic, los tokens, el layout, el `Header` y el `Footer`.
2. Esquemas de Keystatic y contenido inicial desde `contenido/obras.json`.
3. Ficha de obra (v2) con lupa, vistas y proceso.
4. `/obra`, `/tecnicas/[slug]`, `/sobre-mi`, `/contacto`, `/blog`.
5. Portadas, una a una (01 → 06), con selector `portadaActiva`.
6. Migración del WordPress y redirecciones.
7. SEO, rendimiento (Lighthouse ≥ 95), accesibilidad y despliegue con Keystatic en modo GitHub.
