// @ts-check
/**
 * Redirecciones 301 de la web. Tres fuentes:
 *  1. La tabla editable del panel (Configuración → Redirecciones):
 *     src/content/redirecciones/index.json — sobre todo, las URL del antiguo WordPress.
 *  2. Las «Direcciones antiguas» anotadas en cada obra.
 *  3. Los cambios de dirección de una obra hechos desde el panel, que se
 *     detectan solos en el historial de git (Keystatic renombra el archivo).
 * Las escribe en _redirects la integración integraciones/redirecciones-cloudflare.mjs.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';

/** «Ajos I» o «Ajos-1.mdoc» → «ajos-i» / «ajos-1» (como los id de Astro). */
export const aSlug = (/** @type {string} */ t) =>
  t
    .replace(/\.mdoc$/, '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/** «https://jesusenovilla.com/oleos/repollo/» → «/oleos/repollo». */
export function aRuta(/** @type {string} */ url) {
  let r = String(url ?? '').trim();
  if (!r) return '';
  r = r.replace(/^https?:\/\/[^/]+/i, '');
  if (!r.startsWith('/')) r = `/${r}`;
  r = r.replace(/[?#].*$/, '');
  if (r.length > 1) r = r.replace(/\/+$/, '');
  return r;
}

/** Cambios de nombre de archivos de obra en git: [[antiguo, nuevo], …] en orden cronológico. */
function renombradosEnGit(/** @type {string} */ raiz) {
  try {
    const salida = execFileSync('git', ['log', '--reverse', '--diff-filter=R', '-M', '--name-status', '--format=', '--', 'src/content/obras'], {
      cwd: raiz,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return salida
      .split('\n')
      .map((l) => l.split('\t'))
      .filter((c) => c[0]?.startsWith('R') && c[1] && c[2])
      .map((c) => [aSlug(c[1].split('/').pop() ?? ''), aSlug(c[2].split('/').pop() ?? '')]);
  } catch {
    return [];
  }
}

/**
 * @param {{ raiz: string, obrasActuales: Set<string>, logger?: { info: (m: string) => void, warn: (m: string) => void } }} o
 * @returns {{ desde: string, hacia: string }[]}
 */
export function construirRedirecciones({ raiz, obrasActuales, logger }) {
  /** @type {Map<string, string>} */
  const mapa = new Map();
  const poner = (/** @type {string} */ desde, /** @type {string} */ hacia) => {
    const d = aRuta(desde);
    const h = /^https?:\/\//i.test(hacia) && !/^https?:\/\/(www\.)?jesusenovilla\.com/i.test(hacia) ? hacia.trim() : aRuta(hacia);
    if (!d || !h || d === h || d === '/') return;
    if (!mapa.has(d)) mapa.set(d, h);
  };

  // 2 y 3. Obras: direcciones antiguas anotadas y renombrados en git
  /** @type {Map<string, string>} antiguo → actual */
  const antiguas = new Map();
  const carpeta = join(raiz, 'src/content/obras');
  if (existsSync(carpeta)) {
    for (const f of readdirSync(carpeta)) {
      if (!f.endsWith('.mdoc')) continue;
      const fm = readFileSync(join(carpeta, f), 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/);
      const datos = fm ? parse(fm[1]) : {};
      for (const a of datos?.direccionesAntiguas ?? []) {
        if (typeof a === 'string' && a.trim()) antiguas.set(aSlug(a.replace(/^.*\/obra\//, '')), aSlug(f));
      }
    }
  }
  const git = renombradosEnGit(raiz);
  // Sigue las cadenas (a → b → c): cada nombre antiguo acaba en el actual.
  /** @type {Map<string, string>} */
  const siguiente = new Map(git);
  for (const [viejo] of git) {
    let actual = viejo;
    const vistos = new Set();
    while (siguiente.has(actual) && !vistos.has(actual)) {
      vistos.add(actual);
      actual = /** @type {string} */ (siguiente.get(actual));
    }
    if (!antiguas.has(viejo)) antiguas.set(viejo, actual);
  }
  let obras = 0;
  for (const [viejo, actual] of antiguas) {
    // Nunca tapar una obra que existe con ese nombre, ni apuntar a una que ya no está.
    if (viejo === actual || obrasActuales.has(viejo) || !obrasActuales.has(actual)) continue;
    poner(`/obra/${viejo}`, `/obra/${actual}`);
    obras++;
  }
  if (logger) {
    logger.info(`Direcciones antiguas de obras: ${obras} (${git.length} cambios de nombre en git)`);
    try {
      const superficial = execFileSync('git', ['rev-parse', '--is-shallow-repository'], { cwd: raiz, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
      if (superficial === 'true')
        logger.warn('Clon de git superficial: los cambios de dirección antiguos pueden no detectarse. Anótalos en «Direcciones antiguas» de la obra.');
    } catch {
      // Sin git: solo cuentan las direcciones anotadas a mano.
    }
  }

  // 1. Tabla del panel
  const tabla = join(raiz, 'src/content/redirecciones/index.json');
  if (existsSync(tabla)) {
    const { reglas = [] } = JSON.parse(readFileSync(tabla, 'utf8'));
    for (const r of reglas) poner(r?.desde, r?.hacia);
  }
  // Técnica: el sitemap antiguo (@astrojs/sitemap) pasó a /sitemap.xml.
  poner('/sitemap-index.xml', '/sitemap.xml');
  poner('/sitemap-0.xml', '/sitemap.xml');

  // Sin cadenas: si el destino también se redirige, se apunta directamente al final.
  for (const [d, h] of mapa) {
    let fin = h;
    const vistos = new Set([d]);
    while (mapa.has(fin) && !vistos.has(fin)) {
      vistos.add(fin);
      fin = /** @type {string} */ (mapa.get(fin));
    }
    mapa.set(d, fin);
  }
  return [...mapa].map(([desde, hacia]) => ({ desde, hacia }));
}
