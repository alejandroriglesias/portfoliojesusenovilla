import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import { apuntarNombre } from './nombres-imagenes';

export type Obra = CollectionEntry<'obras'>;
export type Tecnica = CollectionEntry<'tecnicas'>;

/**
 * En producción las obras marcadas como «ejemplo» (imágenes generadas) o como
 * no publicadas NO aparecen. En desarrollo sí se ven (con un aviso), para revisar.
 * Un control adicional en astro.config.mjs hace fallar la compilación si
 * alguna imagen de ejemplo llega a dist/.
 */
export const mostrarEjemplos = import.meta.env.DEV;

const porOrden = (a: Obra, b: Obra) =>
  a.data.orden - b.data.orden || (b.data.anio ?? 0) - (a.data.anio ?? 0) || a.data.titulo.localeCompare(b.data.titulo, 'es');

export async function getObras() {
  const obras = await getCollection('obras', (o) => mostrarEjemplos || (!o.data.ejemplo && o.data.publicada));
  if (import.meta.env.PROD) obras.forEach(apuntarNombres);
  return obras.sort(porOrden);
}

/** Nombres de archivo descriptivos para las fotos de la obra (ver nombres-imagenes.ts). */
function apuntarNombres(o: Obra) {
  const base = `${o.id}-${slugTecnica(o)}-jesus-senovilla`;
  apuntarNombre(o.data.imagen, base);
  apuntarNombre(o.data.imagenPlancha, `${o.id}-plancha-${slugTecnica(o)}-jesus-senovilla`);
  o.data.vistas.forEach((v, i) => apuntarNombre(v.imagen, `${o.id}-${v.tipo === 'otra' ? `vista-${i + 1}` : v.tipo}-${slugTecnica(o)}-jesus-senovilla`));
  o.data.proceso.forEach((p, i) => apuntarNombre(p.imagen, `${o.id}-proceso-${i + 1}-jesus-senovilla`));
}

// ---------- Series ----------
export type Serie = CollectionEntry<'series'>;

export async function getSeries() {
  const series = await getCollection('series');
  return series.sort((a, b) => a.data.orden - b.data.orden || a.data.titulo.localeCompare(b.data.titulo, 'es'));
}

export async function getSerieDe(obra: Obra) {
  return obra.data.serie ? await getEntry('series', obra.data.serie) : undefined;
}

export async function getObrasDeSerie(id: string) {
  return (await getObras()).filter((o) => o.data.serie === id);
}

/** Relacionadas: primero las de la misma serie, después las de la misma técnica concreta (máx. 4). */
export async function getRelacionadas(obra: Obra, max = 4) {
  const todas = (await getObras()).filter((o) => o.id !== obra.id);
  const misma = obra.data.serie ? todas.filter((o) => o.data.serie === obra.data.serie) : [];
  const tecnica = todas.filter((o) => !misma.includes(o) && slugTecnica(o) === slugTecnica(obra));
  return [...misma, ...tecnica].slice(0, max);
}

export async function getObrasDestacadas() {
  return (await getObras()).filter((o) => o.data.destacada);
}

/** Slug de la técnica más concreta (subtécnica si es grabado). */
export function slugTecnica(obra: Obra) {
  const t = obra.data.tecnica;
  return t.discriminant === 'grabado' ? t.value.subtecnica : t.discriminant;
}

export async function getObrasDeTecnica(slug: string) {
  return (await getObras()).filter((o) => o.data.tecnica.discriminant === slug || slugTecnica(o) === slug);
}

export async function getTecnicas(grupo?: 'principal' | 'grabado') {
  const ts = await getCollection('tecnicas', (t) => !grupo || t.data.grupo === grupo);
  return ts.sort((a, b) => a.data.orden - b.data.orden);
}

/** Etiqueta legible: «Grabado · Manera negra», «Óleo»… */
export async function etiquetaTecnica(obra: Obra) {
  const t = obra.data.tecnica;
  const principal = await getEntry('tecnicas', t.discriminant);
  const nombre = principal?.data.nombre ?? t.discriminant;
  if (t.discriminant !== 'grabado') return nombre;
  const sub = await getEntry('tecnicas', t.value.subtecnica);
  return `${nombre} · ${sub?.data.nombre ?? t.value.subtecnica}`;
}


export async function getSobreMi() {
  const e = await getEntry('sobreMi', 'index');
  if (!e) throw new Error('Falta src/content/sobre-mi/index.mdoc');
  return e;
}

/** Un valor entre [corchetes] es un marcador pendiente de rellenar. */
export const esMarcador = (v?: string | null) => !v || /^\[.*\]$/.test(v.trim());
