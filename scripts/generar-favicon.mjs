#!/usr/bin/env node
/**
 * Genera los iconos del sitio a partir del emblema circular «J · SENOVILLA»
 * del antiguo WordPress (Logo_Jesu.png, negro sobre transparente, 1000×1000).
 *
 *   node scripts/generar-favicon.mjs [origen.png]
 *
 * Escribe en public/:
 *   favicon.svg           vectorial; oscuro en temas claros y claro en temas oscuros
 *   favicon.ico           16 y 32 px (PNG dentro de un ICO) para navegadores antiguos
 *   apple-touch-icon.png  180 px sobre fondo papel, para iOS
 *   icon-512.png          512 px sobre fondo papel (manifiesto / compartir)
 */
import { writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import potrace from 'potrace';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const origen = resolve(process.argv[2] ?? join(raiz, 'migracion/logos/Logo_Jesu.png'));
const publico = join(raiz, 'public');
const TINTA = '#141414';
const PAPEL = '#FAFAF8';

// 1. La tinta está en el canal alfa: negro sobre blanco para trazarla.
const { data, info } = await sharp(origen).ensureAlpha().extractChannel(3).raw().toBuffer({ resolveWithObject: true });
let alfaMax = 0;
for (const a of data) if (a > alfaMax) alfaMax = a;
alfaMax ||= 255;
const tinta = Buffer.from(data.map((a) => 255 - Math.min(255, Math.round((a * 255) / alfaMax))));
const png = await sharp(tinta, { raw: { width: info.width, height: info.height, channels: 1 } }).png().toBuffer();

const svgTrazado = await new Promise((ok, mal) =>
  potrace.trace(png, { threshold: 128, turdSize: 20, optTolerance: 0.3, color: 'currentColor' }, (e, s) => (e ? mal(e) : ok(s)))
);
const d = svgTrazado.match(/\sd="([^"]+)"/)?.[1];
if (!d) throw new Error('No se obtuvo ningún trazado');

// 2. Recorte cuadrado ajustado al emblema, con un pequeño margen.
const { info: caja } = await sharp(tinta, { raw: { width: info.width, height: info.height, channels: 1 } })
  .threshold(128)
  .negate()
  .trim({ threshold: 10 })
  .toBuffer({ resolveWithObject: true });
const lado = Math.max(caja.width, caja.height);
const margen = Math.round(lado * 0.03);
const cx = -(caja.trimOffsetLeft ?? 0) + caja.width / 2;
const cy = -(caja.trimOffsetTop ?? 0) + caja.height / 2;
const L = lado + margen * 2;
const viewBox = `${Math.round(cx - L / 2)} ${Math.round(cy - L / 2)} ${L} ${L}`;

// 3. favicon.svg: cambia de color con el tema del sistema.
const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}"><style>path{fill:${TINTA}}@media (prefers-color-scheme:dark){path{fill:${PAPEL}}}</style><path fill-rule="evenodd" d="${d}"/></svg>\n`;
await writeFile(join(publico, 'favicon.svg'), favicon);

// 4. Versiones en mapa de bits (desde el SVG, en tinta fija).
const svgFijo = (color) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}"><path fill="${color}" fill-rule="evenodd" d="${d}"/></svg>`);
const rasterizar = (tam, { fondo, relleno = 1 } = {}) => {
  const interior = Math.round(tam * relleno);
  const icono = sharp(svgFijo(TINTA), { density: Math.ceil((72 * interior) / L) * 4 }).resize(interior, interior);
  if (!fondo) return icono.png().toBuffer();
  return icono
    .png()
    .toBuffer()
    .then((b) =>
      sharp({ create: { width: tam, height: tam, channels: 4, background: fondo } })
        .composite([{ input: b, gravity: 'center' }])
        .png()
        .toBuffer()
    );
};

const png16 = await rasterizar(16);
const png32 = await rasterizar(32);
await writeFile(join(publico, 'apple-touch-icon.png'), await rasterizar(180, { fondo: PAPEL, relleno: 0.8 }));
await writeFile(join(publico, 'icon-512.png'), await rasterizar(512, { fondo: PAPEL, relleno: 0.8 }));

// 5. favicon.ico con dos imágenes PNG (16 y 32 px).
const imagenes = [[16, png16], [32, png32]];
const cabecera = Buffer.alloc(6);
cabecera.writeUInt16LE(0, 0); // reservado
cabecera.writeUInt16LE(1, 2); // tipo: icono
cabecera.writeUInt16LE(imagenes.length, 4);
let desplazamiento = 6 + 16 * imagenes.length;
const entradas = imagenes.map(([tam, buf]) => {
  const e = Buffer.alloc(16);
  e.writeUInt8(tam, 0);
  e.writeUInt8(tam, 1);
  e.writeUInt8(0, 2); // sin paleta
  e.writeUInt8(0, 3);
  e.writeUInt16LE(1, 4); // planos
  e.writeUInt16LE(32, 6); // bits por píxel
  e.writeUInt32LE(buf.length, 8);
  e.writeUInt32LE(desplazamiento, 12);
  desplazamiento += buf.length;
  return e;
});
await writeFile(join(publico, 'favicon.ico'), Buffer.concat([cabecera, ...entradas, ...imagenes.map(([, b]) => b)]));

console.log(`favicon.svg (${(favicon.length / 1024).toFixed(1)} KB, viewBox ${viewBox}), favicon.ico, apple-touch-icon.png, icon-512.png`);
