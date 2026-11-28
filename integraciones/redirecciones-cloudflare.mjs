// @ts-check
/**
 * Escribe las redirecciones 301 (ver src/lib/redirecciones.mjs) en el archivo
 * `_redirects` de Cloudflare, junto a los archivos estáticos de la compilación.
 * Cloudflare lo aplica antes de servir nada, así que funciona igual para
 * páginas estáticas y para el Worker.
 */
import { readdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { construirRedirecciones } from '../src/lib/redirecciones.mjs';

/** @returns {import('astro').AstroIntegration} */
export default function redireccionesCloudflare() {
  /** @type {URL | undefined} */
  let cliente;
  let raiz = process.cwd();
  return {
    name: 'redirecciones-cloudflare',
    hooks: {
      'astro:config:done': ({ config }) => {
        cliente = config.build.client;
        raiz = fileURLToPath(config.root);
      },
      'astro:build:done': async ({ dir, logger }) => {
        // Con el adaptador, los estáticos van a dist/client; sin él, a dist.
        const destino = fileURLToPath(cliente ?? dir);
        if (!existsSync(destino)) {
          logger.warn(`No existe ${destino}; no se escribe _redirects`);
          return;
        }
        const carpetaObras = join(destino, 'obra');
        const obrasActuales = new Set(
          existsSync(carpetaObras) ? (await readdir(carpetaObras)).filter((f) => f.endsWith('.html')).map((f) => f.slice(0, -5)) : []
        );
        const reglas = construirRedirecciones({ raiz, obrasActuales, logger });
        const lineas = reglas.map(({ desde, hacia }) => `${desde} ${hacia} 301`);
        const contenido = `# Generado en cada compilación (src/lib/redirecciones.mjs)\n${lineas.join('\n')}\n`;
        await writeFile(join(destino, '_redirects'), contenido);
        logger.info(`_redirects: ${lineas.length} redirecciones 301`);
      },
    },
  };
}
