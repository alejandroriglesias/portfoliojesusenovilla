// @ts-check
/**
 * Integración de Astro: al terminar la compilación, comprueba que ninguna
 * imagen de ejemplo (generada por ordenador) ha llegado a dist/.
 * Si encuentra alguna, la compilación FALLA.
 *
 * Considera «de ejemplo»:
 *  - todo lo que hay en assets/ejemplos/
 *  - las imágenes de las obras con `ejemplo: true` en src/content/obras/*.mdoc
 * y busca en dist/ archivos con el mismo contenido (hash) o con «EJEMPLO» en el nombre.
 */
import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

/** @param {string} dir @returns {AsyncGenerator<string>} */
async function* recorrer(dir) {
  if (!existsSync(dir)) return;
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* recorrer(p);
    else yield p;
  }
}

/** @param {string} p */
const hash = async (p) => createHash('sha1').update(await readFile(p)).digest('hex');
/** @param {string} p */
const esImagen = (p) => /\.(jpe?g|png|webp|avif|gif|tiff?)$/i.test(p);

/** @returns {import('astro').AstroIntegration} */
export default function vigilarEjemplos() {
  let raiz = process.cwd();
  return {
    name: 'vigilar-ejemplos',
    hooks: {
      'astro:config:done': ({ config }) => {
        raiz = fileURLToPath(config.root);
      },
      'astro:build:done': async ({ dir, logger }) => {
        const prohibidas = new Map(); // hash -> origen

        for await (const p of recorrer(join(raiz, 'assets/ejemplos'))) {
          if (esImagen(p)) prohibidas.set(await hash(p), relative(raiz, p));
        }

        const carpetaObras = join(raiz, 'src/content/obras');
        for await (const p of recorrer(carpetaObras)) {
          if (!p.endsWith('.mdoc')) continue;
          const texto = await readFile(p, 'utf8');
          const fm = texto.match(/^---\r?\n([\s\S]*?)\r?\n---/);
          const datos = fm ? parse(fm[1]) : {};
          if (!datos?.ejemplo) continue;
          const rutas = [datos.imagen, datos.imagenPlancha, ...(datos.vistas ?? []).map((/** @type {{imagen?: string}} */ v) => v.imagen), ...(datos.proceso ?? []).map((/** @type {{imagen?: string}} */ v) => v.imagen)].filter(Boolean);
          for (const r of rutas) {
            const abs = resolve(dirname(p), r);
            if (existsSync(abs)) prohibidas.set(await hash(abs), relative(raiz, abs));
          }
        }

        // Salida pública (dist/) y, si existe, la función del servidor de Netlify.
        const carpetas = [fileURLToPath(dir), join(raiz, '.netlify')];
        const encontradas = [];
        const archivos = (async function* () {
          for (const c of carpetas) yield* recorrer(c);
        })();
        for await (const p of archivos) {
          if (!esImagen(p)) continue;
          if (/EJEMPLO/i.test(p)) {
            encontradas.push(`${relative(raiz, p)} (nombre)`);
            continue;
          }
          const h = await hash(p);
          if (prohibidas.has(h)) encontradas.push(`${relative(raiz, p)} = ${prohibidas.get(h)}`);
        }

        if (encontradas.length) {
          logger.error('Se han colado imágenes de ejemplo en la compilación:\n  ' + encontradas.join('\n  '));
          throw new Error('Compilación detenida: hay imágenes de ejemplo en dist/. Ver BRIEF §7.');
        }
        logger.info(`OK: ninguna de las ${prohibidas.size} imágenes de ejemplo está en la compilación.`);
      },
    },
  };
}
