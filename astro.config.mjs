// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import markdoc from '@astrojs/markdoc';
import keystatic from '@keystatic/astro';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';
import vigilarEjemplos from './integraciones/vigilar-ejemplos.mjs';
import redireccionesCloudflare from './integraciones/redirecciones-cloudflare.mjs';

const SITIO = 'https://jesusenovilla.com';

// La web pública se genera estática; solo el panel /keystatic y su API
// se sirven bajo demanda desde un Worker de Cloudflare.
export default defineConfig({
  site: SITIO,
  output: 'static',
  adapter: cloudflare({
    // Las imágenes se optimizan al compilar (con sharp); en el Worker no hace falta procesarlas.
    imageService: 'compile',
    // Las páginas se prerenderizan con Node: leen archivos de contenido y usan sharp
    // (p. ej. la paleta de la portada Bandas), cosas que el runtime de Workers no permite.
    prerenderEnvironment: 'node',
  }),
  integrations: [
    // React solo lo usa el panel de Keystatic; la web pública no envía React.
    react(),
    markdoc(),
    keystatic(),
    sitemap({
      // Fuera del sitemap: las portadas de comparación (noindex), el panel y la prueba de letras.
      filter: (url) => !/\/(inicio|keystatic|tipografias)(\/|$)/.test(new URL(url).pathname),
      i18n: undefined,
    }),
    // 301 desde las URL del antiguo WordPress (fase 6) → _redirects de Cloudflare.
    redireccionesCloudflare(),
    vigilarEjemplos(),
  ],
  trailingSlash: 'never',
  // Genera obra/rosa.html (no obra/rosa/index.html): así /obra/rosa se sirve
  // sin redirigir a /obra/rosa/ y coincide con las canónicas y el sitemap.
  build: { format: 'file' },
  image: {
    layout: 'constrained',
  },
});
