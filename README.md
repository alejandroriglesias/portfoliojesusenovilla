# jesusenovilla.com

Web y CMS de **Jesús Senovilla** (óleo, acuarela y grabado).
Astro 7 + Keystatic · CSS propio · sin base de datos: el contenido son archivos en este repositorio.

---

## Para el artista: cómo editar la web

1. Entra en **https://jesusenovilla.com/keystatic** con tu cuenta de **Keystatic Cloud** (tu correo; no hace falta GitHub).
2. En el menú de la izquierda:
   - **Obras** — cada obra con su imagen, técnica, año, medidas, estado, vistas, proceso…
     - La casilla **Publicada** decide si la obra sale en la web. Las obras traídas del WordPress cuya técnica no se conocía están **sin publicar**: revisa la nota de cada una («Notas internas»), elige la técnica correcta y marca *Publicada*.
     - Las fotos deben tener al menos **2500 px** en el lado largo para que la lupa luzca.
   - **Técnicas** — textos de cada técnica («Sobre la técnica»).
   - **Blog** — entradas. El enlace «Blog» aparece en el menú cuando hay al menos una publicada.
   - **Sobre mí** — biografía, retrato, firma y trayectoria.
   - **Ajustes** — email, Instagram, ciudad del taller, encargos, **portada activa** (cuál de los 7 diseños se ve en la página de inicio) y textos SEO.
3. Pulsa **Guardar**. La web se actualiza sola en 1–2 minutos.

Los textos entre **[corchetes]** son marcadores pendientes de escribir.

---

## Desarrollo

Necesita **Node ≥ 22.23** (ver `.nvmrc`).

```bash
npm install
npm run dev          # http://localhost:4321  ·  panel en /keystatic (guarda en los archivos locales)
npm run build        # compila en dist/
npm run check        # comprobación de tipos
```

En desarrollo se ven también las obras ocultas y las de ejemplo (con un aviso); en producción no.

### Estructura

| Ruta | Qué hay |
|---|---|
| `keystatic.config.ts` | Modelo de contenido del CMS |
| `src/content.config.ts` | Las mismas colecciones para Astro (con `astro:assets`) |
| `src/content/` | Contenido (obras, técnicas, blog, sobre mí, ajustes) |
| `src/assets/` | Imágenes del contenido |
| `src/portadas/` | Las 7 portadas (Galería, Luz, Revista, Muro, Boceto, Bandas, Deriva) |
| `src/components/` | Cabecera, pie, ficha de obra (lupa, proceso…), índice, filtros… |
| `src/lib/redirecciones.mjs` | Redirecciones 301 desde el antiguo WordPress |
| `integraciones/vigilar-ejemplos.mjs` | Detiene la compilación si una imagen de ejemplo llega a `dist/` |
| `scripts/migracion/` | Migración desde WordPress (descarga e importación) |
| `prototipos/` | Diseños de referencia |

### Avisos

- `assets/ejemplos/` son imágenes **generadas por ordenador**: nunca se publican (la compilación falla si lo intentan).
- Si añades un campo a `src/content.config.ts`, borra `.astro/data-store.json` y `node_modules/.astro/data-store.json` y reinicia `npm run dev` (Astro no invalida esa caché).

### Migración desde WordPress (ya hecha)

```bash
npm run migrar:descargar          # exporta el WordPress y descarga los originales a migracion/ (fuera de git)
npm run migrar:importar -- --simular
npm run migrar:importar
```

---

## Puesta en marcha (producción)

### 1. GitHub
Crea un repositorio (privado o público) y sube este proyecto:

```bash
git remote add origin https://github.com/USUARIO/jesusenovilla-web.git
git push -u origin main
```

### 2. Cloudflare (alojamiento)
La web se aloja en **Cloudflare Workers** (plan gratuito: unos 3.000 minutos de compilación al mes, ~1.000 publicaciones; el tráfico a los archivos estáticos es ilimitado).

1. En dash.cloudflare.com: *Workers & Pages → Create → Import a repository* → elige el repositorio.
2. Ajustes de compilación:
   - Build command: `npm run build`
   - Deploy command: `npx wrangler deploy` (el adaptador deja la configuración del Worker en `dist/server/wrangler.json` y Wrangler la encuentra solo)
   - Variable de entorno de compilación `NODE_VERSION = 24` (Astro 7 necesita Node ≥ 22.23).
3. Despliega y comprueba la URL provisional (`*.workers.dev`).

Cada commit en `main` (también los que hace el panel al guardar) vuelve a publicar la web en 1–3 minutos.
Las redirecciones 301 salen de `src/lib/redirecciones.mjs` (se escriben en `_redirects` al compilar) y las cabeceras de `public/_headers`.

Para probar en local con el mismo motor que Cloudflare: `npm run build` y `npx astro preview`.

### 3. Keystatic (edición en producción)
El panel usa **Keystatic Cloud**: quien edita entra con su cuenta de correo (sin GitHub) y Keystatic Cloud guarda los cambios como commits en el repositorio.

- Proyecto: `portfolio-jesu/portfoliojesu` (en `keystatic.config.ts`; se puede cambiar con `PUBLIC_KEYSTATIC_CLOUD_PROJECT`).
- El proyecto está enlazado en keystatic.cloud al repositorio `alejandroriglesias/portfoliojesusenovilla`.
- **Dar acceso a alguien**: keystatic.cloud → equipo `portfolio-jesu` → *Members* → invitar por correo. El plan gratuito admite hasta 3 personas por equipo.
- En local, `npm run dev` guarda en los archivos del proyecto. Para probar el modo nube en local: `PUBLIC_KEYSTATIC_MODO=cloud` en `.env`.

### 4. Dominio
1. Guarda antes una copia del WordPress (exportación WXR y `wp-content/uploads`): cuando el dominio apunte a Cloudflare, dejará de verse.
2. Añade `jesusenovilla.com` a Cloudflare (*Add a domain*) y cambia en el registrador los servidores DNS por los que indique Cloudflare.
3. En el Worker: *Settings → Domains & Routes → Add → Custom domain* → `jesusenovilla.com` (y `www`). El HTTPS se activa solo.

### 5. Buscadores
La web antigua tenía `noindex`; esta es indexable (`robots.txt`, `sitemap-index.xml`, Open Graph y datos estructurados `Person` / `VisualArtwork`).
1. Da de alta el dominio en **Google Search Console** y envía `https://jesusenovilla.com/sitemap-index.xml`.
2. Comprueba que las URL antiguas redirigen (p. ej. `/grabados/rosa → /obra/rosa`).

---

## Calidad (Lighthouse, móvil, compilación local)

| Página | Rendimiento | Accesibilidad | Buenas prácticas | SEO |
|---|---|---|---|---|
| `/` (Luz) | 98 | 100 | 100 | 100 |
| `/obra` | 100 | 100 | 100 | 100 |
| `/obra/rosa` | 96 | 100 | 100 | 100 |
| `/sobre-mi`, `/contacto` | 100 | 100 | 100 | 100 |
| `/tecnicas/grabado` | 100 | 100 | 100 | 100 |

Las portadas de comparación (`/inicio/*`) tienen SEO 69 a propósito: son `noindex`.
En la Revista, Lighthouse marca contraste en la cabecera porque no sabe calcular `mix-blend-mode: difference`; visualmente el texto es oscuro sobre claro.
