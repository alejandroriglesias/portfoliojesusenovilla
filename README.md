# jesusenovilla.com

Web y CMS de **Jesús Senovilla** (óleo, acuarela y grabado).
Astro 7 + Keystatic · CSS propio · sin base de datos: el contenido son archivos en este repositorio.

---

## Para el artista: cómo editar la web

1. Entra en **https://jesusenovilla.com/keystatic** con tu cuenta de GitHub.
2. En el menú de la izquierda:
   - **Obras** — cada obra con su imagen, técnica, año, medidas, estado, vistas, proceso…
     - La casilla **Publicada** decide si la obra sale en la web. Las obras traídas del WordPress cuya técnica no se conocía están **sin publicar**: revisa la nota de cada una («Notas internas»), elige la técnica correcta y marca *Publicada*.
     - Las fotos deben tener al menos **2500 px** en el lado largo para que la lupa luzca.
   - **Técnicas** — textos de cada técnica («Sobre la técnica»).
   - **Blog** — entradas. El enlace «Blog» aparece en el menú cuando hay al menos una publicada.
   - **Sobre mí** — biografía, retrato, firma y trayectoria.
   - **Ajustes** — email, Instagram, ciudad del taller, encargos, **portada activa** (cuál de los 6 diseños se ve en la página de inicio) y textos SEO.
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
| `src/portadas/` | Las 6 portadas (Galería, Luz, Revista, Muro, Boceto, Bandas) |
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

### 2. Netlify
1. *Add new site → Import an existing project →* elige el repositorio. La configuración se lee de `netlify.toml` (Node 24, `npm run build`, carpeta `dist`).
2. En *Site configuration → Environment variables* añade:
   `PUBLIC_KEYSTATIC_GITHUB_REPO = USUARIO/jesusenovilla-web`
3. Despliega. Comprueba la URL provisional (`*.netlify.app`).

### 3. Keystatic (edición en producción)
Keystatic usa una GitHub App para que el artista entre con su cuenta de GitHub.

1. En local, crea `.env` con:
   ```
   PUBLIC_KEYSTATIC_GITHUB_REPO=USUARIO/jesusenovilla-web
   PUBLIC_KEYSTATIC_MODO=github
   ```
2. `npm run dev` y abre http://localhost:4321/keystatic → sigue el asistente «Create GitHub App». Al terminar, Keystatic escribe en `.env` estas variables:
   `KEYSTATIC_GITHUB_CLIENT_ID`, `KEYSTATIC_GITHUB_CLIENT_SECRET`, `KEYSTATIC_SECRET`, `PUBLIC_KEYSTATIC_GITHUB_APP_SLUG`.
3. Cópialas a las variables de entorno de Netlify y vuelve a desplegar.
4. En la configuración de la GitHub App (github.com → Settings → Developer settings → GitHub Apps) añade como *Callback URL*:
   `https://jesusenovilla.com/api/keystatic/github/oauth/callback` (y la de `*.netlify.app` si se va a usar).
5. Instala la App en el repositorio y da acceso al artista (colaborador del repositorio).
6. Quita `PUBLIC_KEYSTATIC_MODO=github` de tu `.env` local para volver a editar en local.

### 4. Dominio
1. En Netlify: *Domain management → Add domain →* `jesusenovilla.com` (y `www`).
2. En el proveedor del dominio, cambia los DNS a los que indique Netlify. El HTTPS se activa solo.
3. Cuando el dominio apunte a Netlify, el WordPress deja de verse; guarda antes una copia (exportación WXR y `wp-content/uploads`) por si acaso.

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
