// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import markdoc from '@astrojs/markdoc';
import keystatic from '@keystatic/astro';
import cloudflare from '@astrojs/cloudflare';
import vigilarEjemplos from './integraciones/vigilar-ejemplos.mjs';
import redireccionesCloudflare from './integraciones/redirecciones-cloudflare.mjs';
import nombresImagenes from './integraciones/nombres-imagenes.mjs';

// Dominio definitivo: canónicas, sitemap, Open Graph y datos estructurados.
// Se cambia con la variable de entorno SITE_URL (en Cloudflare: Settings → Build → Variables).
const SITIO = (process.env.SITE_URL || 'https://jesusenovilla.com').replace(/\/+$/, '');

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
    // El sitemap lo genera src/pages/sitemap.xml.ts (con fechas e imágenes).
    // 301 (WordPress, tabla del panel y direcciones antiguas de obras) → _redirects de Cloudflare.
    redireccionesCloudflare(),
    // Nombres de archivo descriptivos para las fotos de las obras.
    nombresImagenes(),
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
