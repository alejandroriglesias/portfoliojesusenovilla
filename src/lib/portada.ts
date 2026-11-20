import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import sharp from 'sharp';
import { parse } from 'yaml';
import { getAjustes } from './ajustes';
import { etiquetaTecnica, getObras, getSobreMi, getTecnicas, type Obra } from './contenido';

export const PORTADAS = ['galeria', 'luz', 'revista', 'muro', 'boceto', 'bandas'] as const;
export type Portada = (typeof PORTADAS)[number];

export const NOMBRES_PORTADA: Record<Portada, string> = {
  galeria: 'Galería',
  luz: 'Luz',
  revista: 'Revista',
  muro: 'Muro',
  boceto: 'Boceto',
  bandas: 'Bandas',
};

/** Todo lo que necesitan las portadas, en una sola llamada. */
export async function getDatosPortada() {
  const [obras, principales, sobreMi, ajustes] = await Promise.all([
    getObras(),
    getTecnicas('principal'),
    getSobreMi(),
    getAjustes(),
  ]);
  const etiquetas = await Promise.all(obras.map(etiquetaTecnica));
  const destacada = obras.find((o) => o.data.destacada) ?? obras[0];
  return { obras, etiquetas, principales, sobreMi, ajustes, destacada };
}

export type DatosPortada = Awaited<ReturnType<typeof getDatosPortada>>;

// ---------- Paleta de 3 colores ----------

const cachePaletas = new Map<string, [string, string, string]>();
const hex = (r: number, g: number, b: number) =>
  '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase();

/**
 * Tres colores dominantes de la obra. Usa la paleta del CMS si está completa;
 * si no, la calcula al compilar a partir de la imagen (cuantización simple).
 */
export async function paletaDe(obra: Obra): Promise<[string, string, string]> {
  if (obra.data.paleta) return obra.data.paleta;
  const clave = obra.id;
  const guardada = cachePaletas.get(clave);
  if (guardada) return guardada;

  let paleta: [string, string, string] = ['#2A2A2A', '#5F5E5A', '#C9C6BF'];
  try {
    // La ruta de la imagen está en el frontmatter, relativa al archivo de contenido.
    const archivo = resolve(process.cwd(), obra.filePath ?? '');
    const texto = await readFile(archivo, 'utf8');
    const fm = parse(texto.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '') as { imagen?: string };
    if (fm.imagen) {
      const { data } = await sharp(resolve(dirname(archivo), fm.imagen))
        .resize(48, 48, { fit: 'inside' })
        .removeAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
      // Agrupa en cubos de 4 bits por canal y se queda con los 3 más poblados
      // (separados entre sí para no repetir tonos casi iguales).
      const cubos = new Map<number, { n: number; r: number; g: number; b: number }>();
      for (let i = 0; i < data.length; i += 3) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        const k = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
        const c = cubos.get(k) ?? { n: 0, r: 0, g: 0, b: 0 };
        c.n++; c.r += r; c.g += g; c.b += b;
        cubos.set(k, c);
      }
      const ordenados = [...cubos.values()]
        .map((c) => ({ n: c.n, r: c.r / c.n, g: c.g / c.n, b: c.b / c.n }))
        .sort((a, b) => b.n - a.n);
      const elegidos: typeof ordenados = [];
      for (const c of ordenados) {
        if (elegidos.every((e) => Math.hypot(e.r - c.r, e.g - c.g, e.b - c.b) > 24)) elegidos.push(c);
        if (elegidos.length === 3) break;
      }
      while (elegidos.length < 3) elegidos.push(ordenados[elegidos.length] ?? ordenados[0]);
      paleta = elegidos.map((c) => hex(c.r, c.g, c.b)) as [string, string, string];
    }
  } catch {
    /* sin imagen legible: paleta neutra */
  }
  cachePaletas.set(clave, paleta);
  return paleta;
}

/** Color de texto legible sobre una paleta (oscuro sobre claro, claro sobre oscuro). */
export function tintaSobre(paleta: string[]) {
  const lum = (h: string) => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) =>
      v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
    );
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const media = paleta.reduce((s, c) => s + lum(c), 0) / paleta.length;
  return media > 0.35 ? '#141414' : '#F4F2EE';
}
