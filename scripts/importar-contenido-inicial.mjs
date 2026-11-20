#!/usr/bin/env node
/**
 * Convierte contenido/obras.json en entradas de Keystatic (fase 2).
 *
 *   node scripts/importar-contenido-inicial.mjs [--forzar]
 *
 * - Copia las imágenes a src/assets/obras/<slug>/ con el nombre que usa Keystatic.
 * - Escribe src/content/obras/<slug>.mdoc, src/content/tecnicas/<slug>.mdoc
 *   y src/content/sobre-mi/index.mdoc.
 * - No sobrescribe entradas existentes salvo con --forzar (para no pisar
 *   cambios hechos desde el panel).
 */
import { copyFile, mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stringify } from 'yaml';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const forzar = process.argv.includes('--forzar');

const existe = (p) => access(p).then(() => true, () => false);
const esMarcador = (v) => typeof v === 'string' && /^\[.*\]$/.test(v.trim());

const TECNICA = { 'óleo': 'oleo', oleo: 'oleo', acuarela: 'acuarela', grabado: 'grabado' };
const SUBTECNICAS = [
  ['Aguafuerte', 'aguafuerte'],
  ['Aguatinta', 'aguatinta'],
  ['Manera negra', 'manera-negra'],
  ['Punta seca', 'punta-seca'],
  ['Carborundo', 'carborundo'],
  ['Alcograbado', 'alcograbado'],
  ['Zieglerografía', 'zieglerografia'],
  ['Stock-gum', 'stock-gum'],
];
const slugSub = (texto) => SUBTECNICAS.find(([n]) => n.toLowerCase() === texto?.toLowerCase())?.[1];

function mdoc(datos, cuerpo = '') {
  // Quita claves vacías para que el archivo quede limpio.
  const limpio = JSON.parse(JSON.stringify(datos, (_k, v) => (v === null || v === undefined ? undefined : v)));
  return `---\n${stringify(limpio, { lineWidth: 0 })}---\n${cuerpo ? cuerpo.trim() + '\n' : ''}`;
}

async function escribir(ruta, contenido) {
  const abs = join(raiz, ruta);
  if (!forzar && (await existe(abs))) {
    console.log(`  = ${ruta} (ya existe, se respeta)`);
    return;
  }
  await mkdir(dirname(abs), { recursive: true });
  await writeFile(abs, contenido, 'utf8');
  console.log(`  + ${ruta}`);
}

/** Copia una imagen a src/assets/obras/<slug>/<campo>.<ext> y devuelve la ruta para Keystatic. */
async function copiarImagen(origen, slug, campo) {
  if (!origen) return undefined;
  const ext = extname(origen).toLowerCase();
  const destinoRel = `src/assets/obras/${slug}/${campo}${ext}`;
  const destino = join(raiz, destinoRel);
  await mkdir(dirname(destino), { recursive: true });
  if (forzar || !(await existe(destino))) await copyFile(join(raiz, origen), destino);
  return `../../assets/obras/${slug}/${campo}${ext}`;
}

const json = JSON.parse(await readFile(join(raiz, 'contenido/obras.json'), 'utf8'));

// ---------- Obras ----------
console.log('Obras');
for (const [i, o] of json.obras.entries()) {
  // Tras la migración de WordPress (fase 6) las obras de ejemplo ya no se crean.
  if (o.ejemplo) {
    console.log(`  - ${o.slug} (ejemplo: omitida)`);
    continue;
  }
  const tecnica = TECNICA[o.tecnica];
  if (!tecnica) throw new Error(`Técnica desconocida en «${o.titulo}»: ${o.tecnica}`);

  const datos = {
    titulo: o.titulo,
    tecnica:
      tecnica === 'grabado'
        ? {
            discriminant: 'grabado',
            value: { subtecnica: slugSub(o.subtecnica) ?? 'aguafuerte', edicion: o.edicion },
          }
        : { discriminant: tecnica },
    anio: o.anio ? String(o.anio) : undefined,
    medidas: o.medidas,
    soporte: o.soporte,
    // "[disponible / vendida]" es un marcador: se deja «sin indicar».
    estado: ['disponible', 'vendida', 'no-a-la-venta'].includes(o.estado) ? o.estado : 'sin-indicar',
    imagen: await copiarImagen(o.imagen, o.slug, 'imagen'),
    imagenPlancha: await copiarImagen(o.imagenPlancha, o.slug, 'imagenPlancha'),
    paleta: o.paleta
      ? { color1: o.paleta[0], color2: o.paleta[1], color3: o.paleta[2] }
      : undefined,
    destacada: o.destacada === true,
    orden: (i + 1) * 10,
    ejemplo: o.ejemplo === true,
    notas: [o.ejemplo ? 'Imagen generada por ordenador: NO es la obra real.' : null, o.notas]
      .filter(Boolean)
      .join(' ') || undefined,
  };
  await escribir(`src/content/obras/${o.slug}.mdoc`, mdoc(datos));
}

// ---------- Técnicas ----------
console.log('Técnicas');
const principales = json.tecnicas.map((t, i) => ({ ...t, orden: (i + 1) * 10 }));
for (const t of principales) {
  await escribir(
    `src/content/tecnicas/${t.slug}.mdoc`,
    mdoc(
      { nombre: t.nombre, grupo: 'principal', resumen: t.resumen, orden: t.orden },
      '[Texto «Sobre la técnica» pendiente.]'
    )
  );
}
for (const [i, [nombre, slug]] of SUBTECNICAS.entries()) {
  const texto =
    slug === 'manera-negra'
      ? json.tecnicas.find((t) => t.slug === 'grabado')?.sobreLaTecnica_maneraNegra
      : undefined;
  await escribir(
    `src/content/tecnicas/${slug}.mdoc`,
    mdoc(
      { nombre, grupo: 'grabado', resumen: `[Resumen sobre ${nombre.toLowerCase()}]`, orden: (i + 1) * 10 },
      texto ?? '[Texto «Sobre la técnica» pendiente.]'
    )
  );
}

// ---------- Sobre mí ----------
console.log('Sobre mí');
await escribir(
  'src/content/sobre-mi/index.mdoc',
  mdoc(
    {
      trayectoria: [
        { anio: '[Año]', texto: '[Exposición o premio], [lugar]' },
        { anio: '[Año]', texto: '[Exposición o premio], [lugar]' },
        { anio: '[Año]', texto: '[Exposición o premio], [lugar]' },
      ],
    },
    '[Presentación: formación, trayectoria, qué buscas en tu obra y cómo trabajas en el taller. Tres o cuatro líneas.]'
  )
);

// ---------- Ajustes ----------
console.log('Ajustes');
const rutaAjustes = join(raiz, 'src/content/ajustes/index.json');
const ajustes = JSON.parse(await readFile(rutaAjustes, 'utf8'));
for (const k of ['email', 'instagram', 'portadaActiva', 'edicionRevista']) {
  if (json.ajustes[k] !== undefined && (forzar || esMarcador(ajustes[k]) || !ajustes[k])) ajustes[k] = json.ajustes[k];
}
await writeFile(rutaAjustes, JSON.stringify(ajustes, null, 2) + '\n', 'utf8');
console.log('  ~ src/content/ajustes/index.json');

console.log('\nListo.');
