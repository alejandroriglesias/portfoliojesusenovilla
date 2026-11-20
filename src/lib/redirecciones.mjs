// @ts-check
/**
 * Redirecciones 301 desde las URL del antiguo WordPress (rastreadas en la fase 6).
 * Se aplican en astro.config.mjs; con el adaptador de Netlify salen en _redirects.
 */

/** Categorías de WordPress → páginas de técnica. */
const CATEGORIAS = {
  oleos: 'oleo',
  acuarelas: 'acuarela',
  grabados: 'grabado',
  'grabados/aguafuerte': 'aguafuerte',
  'grabados/aguafuerteaguatinta': 'aguafuerte-y-aguatinta',
  'grabados/alcograbado': 'alcograbado',
  'grabados/carborundo': 'carborundo',
  'grabados/manera-negra': 'manera-negra',
  'grabados/punta-seca': 'punta-seca',
  'grabados/stock-gum': 'stock-gum',
  'grabados/zieglerografia': 'zieglerografia',
};

/** @type {Record<string, { status: 301; destination: string }>} */
export const redirecciones = {};
const r = (/** @type {string} */ desde, /** @type {string} */ hacia) => {
  redirecciones[desde] = { status: 301, destination: hacia };
};

// Entradas (obras) — los enlaces de WordPress eran /<categoría>/<slug>
r('/oleos/repollo', '/obra/repollo');
r('/acuarelas/acuarela-1-2', '/obra/paisaje-abstracto');
r('/grabados/rosa', '/obra/rosa');

// Archivos de categoría (con y sin el prefijo /category/)
for (const [wp, tecnica] of Object.entries(CATEGORIAS)) {
  r(`/category/${wp}`, `/tecnicas/${tecnica}`);
  if (!wp.includes('/')) r(`/${wp}`, `/tecnicas/${tecnica}`);
}
r('/category/sin-categoria', '/obra');
r('/tag/manera-negra', '/tecnicas/manera-negra');

// Páginas
r('/portfolios', '/obra');
r('/portfolio/test', '/obra');
r('/pagina-ejemplo', '/');
r('/feed', '/');
