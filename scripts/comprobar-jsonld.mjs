// @ts-check
/**
 * Comprueba los datos estructurados (JSON-LD) de la web compilada.
 *
 *   npm run build && npm run test:jsonld
 *   npm run test:jsonld -- obra/rosa          ← una ficha concreta
 *   npm run test:jsonld -- --schemaorg        ← además, contra el vocabulario oficial de schema.org
 *
 * Revisa todas las fichas de obra de dist/client/obra/*.html (o la indicada):
 *  - que cada bloque <script type="application/ld+json"> sea JSON válido;
 *  - que haya un VisualArtwork con name, url, image, creator, artform y artMedium,
 *    un BreadcrumbList bien numerado, un WebSite y un Person (el creator apunta a él);
 *  - que no haya valores vacíos ni pendientes entre [corchetes];
 *  - las medidas, como Distance («40 cm»);
 *  - con --schemaorg: que cada @type y cada propiedad existan en schema.org.
 * Sale con código 1 si algo falla.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const args = process.argv.slice(2);
const conSchemaOrg = args.includes('--schemaorg');
const concreta = args.find((a) => !a.startsWith('--'));
const DIST = existsSync('dist/client') ? 'dist/client' : 'dist';

/** @type {string[]} */
const errores = [];
const fallo = (/** @type {string} */ donde, /** @type {string} */ msg) => errores.push(`${donde}: ${msg}`);

/** @param {string} html */
function bloques(html) {
  return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1]);
}

/** Recorre un valor JSON-LD buscando vacíos y marcadores. */
function revisarValores(/** @type {unknown} */ v, /** @type {string} */ ruta, /** @type {string} */ donde) {
  if (v === null || v === undefined || v === '') return fallo(donde, `${ruta} está vacío`);
  if (typeof v === 'string') {
    if (/^\[.*\]$/.test(v.trim())) fallo(donde, `${ruta} es un marcador pendiente: ${v}`);
    return;
  }
  if (Array.isArray(v)) {
    if (v.length === 0) fallo(donde, `${ruta} es una lista vacía`);
    v.forEach((x, i) => revisarValores(x, `${ruta}[${i}]`, donde));
    return;
  }
  if (typeof v === 'object') {
    for (const [k, x] of Object.entries(v)) revisarValores(x, `${ruta}.${k}`, donde);
  }
}

/** Tipos y propiedades usados (para --schemaorg). */
const usados = { tipos: new Set(), props: new Set() };
function recoger(/** @type {any} */ v) {
  if (Array.isArray(v)) return v.forEach(recoger);
  if (v && typeof v === 'object') {
    for (const [k, x] of Object.entries(v)) {
      if (k === '@type') [x].flat().forEach((t) => usados.tipos.add(t));
      else if (!k.startsWith('@')) usados.props.add(k);
      recoger(x);
    }
  }
}

const archivos = concreta
  ? [join(DIST, concreta.replace(/^\//, '').replace(/\.html$/, '') + '.html')]
  : readdirSync(join(DIST, 'obra'))
      .filter((f) => f.endsWith('.html'))
      .map((f) => join(DIST, 'obra', f));

if (!archivos.length || !existsSync(archivos[0])) {
  console.error(`No encuentro fichas compiladas en ${DIST}/obra. Ejecuta antes «npm run build».`);
  process.exit(1);
}

let fichas = 0;
for (const archivo of archivos) {
  const donde = archivo.replace(/\\/g, '/').replace(`${DIST}/`, '/').replace(/\.html$/, '');
  const html = readFileSync(archivo, 'utf8');
  /** @type {any[]} */
  const datos = [];
  for (const b of bloques(html)) {
    try {
      datos.push(JSON.parse(b));
    } catch (e) {
      fallo(donde, `JSON-LD no válido: ${/** @type {Error} */ (e).message}`);
    }
  }
  const de = (/** @type {string} */ t) => datos.filter((d) => d['@type'] === t);
  const [obra] = de('VisualArtwork');
  const [persona] = de('Person');
  const [sitio] = de('WebSite');
  const [migas] = de('BreadcrumbList');

  if (!obra) fallo(donde, 'falta el VisualArtwork');
  else {
    for (const p of ['name', 'url', 'image', 'creator', 'artform', 'artMedium']) if (!(p in obra)) fallo(donde, `VisualArtwork sin ${p}`);
    if (!String(obra.url).endsWith(donde)) fallo(donde, `url del VisualArtwork no coincide: ${obra.url}`);
    for (const lado of ['height', 'width']) {
      const m = obra[lado];
      if (m && !(m['@type'] === 'Distance' && /^\d+(,\d+)? cm$/.test(m.name))) fallo(donde, `${lado} no es Distance «N cm»: ${JSON.stringify(m)}`);
    }
    if (persona && obra.creator?.['@id'] !== persona['@id']) fallo(donde, 'creator no apunta al Person del artista');
    if (obra.isPartOf && !(obra.isPartOf.name && obra.isPartOf.url)) fallo(donde, 'isPartOf (serie) sin nombre o url');
  }
  if (!persona) fallo(donde, 'falta el Person del artista');
  else for (const p of ['name', 'jobTitle', 'url']) if (!(p in persona)) fallo(donde, `Person sin ${p}`);
  if (!sitio) fallo(donde, 'falta el WebSite');
  if (!migas) fallo(donde, 'falta el BreadcrumbList');
  else
    migas.itemListElement.forEach((/** @type {any} */ it, /** @type {number} */ i) => {
      if (it.position !== i + 1) fallo(donde, `BreadcrumbList: posición ${it.position} donde iba ${i + 1}`);
      if (!it.name || !it.item) fallo(donde, `BreadcrumbList: elemento ${i + 1} sin name o item`);
    });
  datos.forEach((d, i) => revisarValores(d, `bloque${i}`, donde));
  datos.forEach(recoger);
  fichas++;
}

if (conSchemaOrg) {
  const url = 'https://schema.org/version/latest/schemaorg-current-https.jsonld';
  console.log(`Descargando el vocabulario de schema.org (${url})…`);
  const voc = await (await fetch(url)).json();
  const definidos = new Set(voc['@graph'].map((/** @type {any} */ n) => String(n['@id']).replace(/^schema:/, '')));
  for (const t of usados.tipos) if (!definidos.has(t)) fallo('schema.org', `el tipo «${t}» no existe`);
  for (const p of usados.props) if (!definidos.has(p)) fallo('schema.org', `la propiedad «${p}» no existe`);
  console.log(`schema.org: ${usados.tipos.size} tipos y ${usados.props.size} propiedades comprobados.`);
}

if (errores.length) {
  console.error(`✗ ${errores.length} problemas en ${fichas} fichas:\n- ${errores.slice(0, 60).join('\n- ')}`);
  process.exit(1);
}
console.log(`✓ JSON-LD correcto en ${fichas} ${fichas === 1 ? 'ficha' : 'fichas'}.`);
