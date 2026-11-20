// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import markdoc from '@astrojs/markdoc';
import keystatic from '@keystatic/astro';
import netlify from '@astrojs/netlify';
import sitemap from '@astrojs/sitemap';
import vigilarEjemplos from './integraciones/vigilar-ejemplos.mjs';
import { redirecciones } from './src/lib/redirecciones.mjs';

const SITIO = 'https://jesusenovilla.com';

// La web pública se genera estática; solo el panel /keystatic y su API
// se sirven bajo demanda (por eso hace falta un adaptador).
export default defineConfig({
  site: SITIO,
  output: 'static',
  adapter: netlify({
    // Las imágenes se optimizan al compilar (con sharp), no en el CDN de
    // Netlify: así la web no depende del proveedor y se puede probar en local.
    imageCDN: false,
  }),
  integrations: [
    // React solo lo usa el panel de Keystatic; la web pública no envía React.
    react(),
    markdoc(),
    keystatic(),
    sitemap({
      // Fuera del sitemap: las portadas de comparación (noindex) y el panel.
      filter: (url) => !/\/(inicio|keystatic)(\/|$)/.test(new URL(url).pathname),
      i18n: undefined,
    }),
    vigilarEjemplos(),
  ],
  trailingSlash: 'never',
  // Genera obra/rosa.html (no obra/rosa/index.html): así Netlify sirve /obra/rosa
  // sin redirigir a /obra/rosa/ y coincide con las canónicas y el sitemap.
  build: { format: 'file' },
  // 301 desde las URL del antiguo WordPress (fase 6).
  redirects: redirecciones,
  image: {
    layout: 'constrained',
  },
});
