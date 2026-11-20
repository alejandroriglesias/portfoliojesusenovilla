#!/usr/bin/env node
/**
 * Convierte la firma manuscrita (PNG blanco sobre transparente, del antiguo
 * WordPress) en un SVG vectorial de un solo color (currentColor).
 *
 *   node scripts/vectorizar-firma.mjs [origen.png]
 *
 * Escribe src/components/marca/firma-trazado.json (viewBox + path) para el
 * componente Firma.astro, y una vista previa en migracion/logos/firma.svg.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import potrace from 'potrace';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const origen = resolve(process.argv[2] ?? join(raiz, 'migracion/originales/Jesu-Firma.png'));
const ESCALA = 6; // se amplía antes de trazar para que las curvas salgan suaves

// 1. La tinta está en el canal alfa: se convierte en negro sobre blanco.
const { data, info } = await sharp(origen).ensureAlpha().extractChannel(3).raw().toBuffer({ resolveWithObject: true });
// La firma original está guardada semitransparente (alfa máx. ≈ 104): se normaliza.
const alfaMax = Math.max(...data) || 255;
const tinta = Buffer.from(data.map((a) => 255 - Math.min(255, Math.round((a * 255) / alfaMax))));
const ampliada = await sharp(tinta, { raw: { width: info.width, height: info.height, channels: 1 } })
  .resize(info.width * ESCALA, info.height * ESCALA, { kernel: 'lanczos3' })
  .blur(Number(process.env.DESENFOQUE ?? 3))
  .png()
  .toBuffer();

// 2. Trazado vectorial.
const svg = await new Promise((ok, mal) =>
  potrace.trace(ampliada, { threshold: Number(process.env.UMBRAL ?? 135), turdSize: 40, optTolerance: 0.4, color: 'currentColor', background: 'transparent' }, (e, s) => (e ? mal(e) : ok(s)))
);
const d = svg.match(/\sd="([^"]+)"/)?.[1];
if (!d) throw new Error('No se obtuvo ningún trazado');

// 3. Recorte ajustado: caja de la tinta en la imagen original (en px ampliados).
const { info: caja } = await sharp(tinta, { raw: { width: info.width, height: info.height, channels: 1 } })
  .threshold(110)
  .negate()
  .trim({ threshold: 10 })
  .toBuffer({ resolveWithObject: true });
const margen = 2;
const x = Math.max(0, (-(caja.trimOffsetLeft ?? 0) - margen) * ESCALA);
const y = Math.max(0, (-(caja.trimOffsetTop ?? 0) - margen) * ESCALA);
const w = (caja.width + margen * 2) * ESCALA;
const h = (caja.height + margen * 2) * ESCALA;
const viewBox = `${x} ${y} ${w} ${h}`;

const destino = join(raiz, 'src/components/marca/firma-trazado.json');
await mkdir(dirname(destino), { recursive: true });
await writeFile(destino, JSON.stringify({ viewBox, d, proporcion: +(w / h).toFixed(4) }) + '\n');
await mkdir(join(raiz, 'migracion/logos'), { recursive: true });
await writeFile(
  join(raiz, 'migracion/logos/firma.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}"><path fill="#141414" d="${d}"/></svg>\n`
);
console.log(`viewBox ${viewBox} · proporción ${(w / h).toFixed(2)} · ${d.length} caracteres de trazado`);
