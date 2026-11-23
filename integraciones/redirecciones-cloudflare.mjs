// @ts-check
/**
 * Escribe las redirecciones 301 (src/lib/redirecciones.mjs) en el archivo
 * `_redirects` de Cloudflare, junto a los archivos estáticos de la compilación.
 * Cloudflare lo aplica antes de servir nada, así que funciona igual para
 * páginas estáticas y para el Worker.
 */
import { readdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { redirecciones } from '../src/lib/redirecciones.mjs';

/** @returns {import('astro').AstroIntegration} */
export default function redireccionesCloudflare() {
  /** @type {URL | undefined} */
  let cliente;
  return {
    name: 'redirecciones-cloudflare',
    hooks: {
      'astro:config:done': ({ config }) => {
        cliente = config.build.client;
      },
      'astro:build:done': async ({ dir, logger }) => {
        // Con el adaptador, los estáticos van a dist/client; sin él, a dist.
        const destino = fileURLToPath(cliente ?? dir);
        const lineas = Object.entries(redirecciones).map(([desde, { destination, status }]) => `${desde} ${destination} ${status}`);
        const contenido = `# Generado en cada compilación desde src/lib/redirecciones.mjs\n${lineas.join('\n')}\n`;
        try {
          await readdir(destino);
        } catch {
          logger.warn(`No existe ${destino}; no se escribe _redirects`);
          return;
        }
        await writeFile(join(destino, '_redirects'), contenido);
        logger.info(`_redirects: ${lineas.length} redirecciones 301`);
      },
    },
  };
}
