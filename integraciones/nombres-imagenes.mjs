// @ts-check
/**
 * Al terminar la compilación, da nombres descriptivos a las fotos de las obras:
 * «imagen.0HshxySe_17QzoB.webp» → «ajos-i-acuarela-jesus-senovilla.0HshxySe_17QzoB.webp».
 * La lista de nombres la apunta src/lib/nombres-imagenes.ts mientras se generan
 * las páginas; aquí se renombran los archivos de _astro/ y se cambian sus
 * referencias en el HTML, el sitemap y los JSON. El hash se conserva, así que
 * cada archivo sigue siendo único y cacheable para siempre.
 */
import { readdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ARCHIVO = 'node_modules/.astro/nombres-imagenes.tsv';
const TEXTO = /\.(html|xml|json|txt|css|js|webmanifest)$/i;

/** @param {string} dir @returns {AsyncGenerator<string>} */
async function* recorrer(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* recorrer(p);
    else yield p;
  }
}

/** @returns {import('astro').AstroIntegration} */
export default function nombresImagenes() {
  /** @type {URL | undefined} */
  let cliente;
  return {
    name: 'nombres-imagenes',
    hooks: {
      'astro:config:done': ({ config }) => {
        cliente = config.build.client;
      },
      'astro:build:start': async () => {
        await rm(ARCHIVO, { force: true });
      },
      'astro:build:done': async ({ dir, logger }) => {
        if (!existsSync(ARCHIVO)) {
          logger.warn('No hay nombres apuntados; las fotos conservan el nombre de Astro.');
          return;
        }
        /** @type {Map<string, string>} clave «imagen.HASH» → nombre «ajos-i-acuarela-jesus-senovilla.HASH» */
        const nombres = new Map(
          readFileSync(ARCHIVO, 'utf8')
            .split('\n')
            .filter(Boolean)
            .map((l) => /** @type {[string, string]} */ (l.split('\t')))
        );
        const raiz = fileURLToPath(cliente ?? dir);
        const astro = join(raiz, '_astro');
        if (!existsSync(astro)) return;

        // 1. Renombrar los archivos: «clave» + «_variante.ext» o «.ext»
        let archivos = 0;
        for (const f of await readdir(astro)) {
          const m = f.match(/^(.+?\.[A-Za-z0-9_-]{8})([_.].*)$/);
          const nuevo = m && nombres.get(m[1]);
          if (!nuevo) continue;
          await rename(join(astro, f), join(astro, nuevo + m[2]));
          archivos++;
        }

        // 2. Cambiar las referencias («/_astro/clave» → «/_astro/nombre»)
        const patron = new RegExp(
          `/_astro/(${[...nombres.keys()].map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})(?=[_.])`,
          'g'
        );
        let paginas = 0;
        for await (const p of recorrer(raiz)) {
          if (!TEXTO.test(p)) continue;
          const texto = await readFile(p, 'utf8');
          if (!texto.includes('/_astro/')) continue;
          const nuevo = texto.replace(patron, (_, clave) => `/_astro/${nombres.get(clave)}`);
          if (nuevo !== texto) {
            await writeFile(p, nuevo);
            paginas++;
          }
        }
        logger.info(`${archivos} fotos con nombre descriptivo (${nombres.size} originales), ${paginas} archivos actualizados`);
      },
    },
  };
}
