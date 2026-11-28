/**
 * Nombres de archivo descriptivos para las fotos de las obras.
 *
 * Keystatic guarda cada foto como «imagen.jpg» (o «vista-1.jpg»…) en la carpeta
 * de la obra, y Astro genera «imagen.<hash>_<variante>.webp». Al compilar, cada
 * foto se apunta aquí con el nombre que debería tener
 * («ajos-i-acuarela-jesus-senovilla»), y la integración
 * integraciones/nombres-imagenes.mjs renombra los archivos y sus referencias
 * al terminar («ajos-i-acuarela-jesus-senovilla.<hash>_<variante>.webp»).
 */
import { appendFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

export const ARCHIVO_NOMBRES = 'node_modules/.astro/nombres-imagenes.tsv';

const apuntadas = new Set<string>();

/** Convierte un texto en un trozo de nombre de archivo: «Sin título» → «sin-titulo». */
export const aNombre = (t: string) =>
  t
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export function apuntarNombre(imagen: { src: string } | null | undefined, nombre: string) {
  if (!import.meta.env.PROD || !imagen) return;
  // En la compilación, src vale p. ej. «/_astro/imagen.0HshxySe.jpg».
  const m = imagen.src.match(/\/_astro\/([^/?]+?)\.([A-Za-z0-9_-]{8})\.(?:jpe?g|png|webp|avif|tiff?)(?:\?|$)/i);
  if (!m) return;
  const clave = `${m[1]}.${m[2]}`;
  if (apuntadas.has(clave)) return;
  apuntadas.add(clave);
  try {
    mkdirSync(dirname(ARCHIVO_NOMBRES), { recursive: true });
    appendFileSync(ARCHIVO_NOMBRES, `${clave}\t${aNombre(nombre)}.${m[2]}\n`);
  } catch {
    // Sin permiso de escritura: se quedan los nombres de Astro.
  }
}
