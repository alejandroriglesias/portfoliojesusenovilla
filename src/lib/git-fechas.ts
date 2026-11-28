/**
 * Fecha del último cambio de un archivo de contenido, sacada del historial de
 * git (cada guardado desde el panel es un commit). Sirve para <lastmod> del
 * sitemap. Si no hay historial (p. ej. un clon superficial), no se pone fecha.
 */
import { execFileSync } from 'node:child_process';

const cache = new Map<string, string | undefined>();

export function ultimoCambio(...rutas: string[]): string | undefined {
  const clave = rutas.join('|');
  if (cache.has(clave)) return cache.get(clave);
  let fecha: string | undefined;
  try {
    fecha =
      execFileSync('git', ['log', '-1', '--format=%cI', '--', ...rutas], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim() || undefined;
  } catch {
    fecha = undefined;
  }
  cache.set(clave, fecha);
  return fecha;
}

/** La más reciente de varias fechas ISO. */
export const masReciente = (...fechas: (string | undefined)[]) =>
  fechas.filter((f): f is string => !!f).sort().at(-1);
