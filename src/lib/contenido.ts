import { getCollection, getEntry, type CollectionEntry } from 'astro:content';

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
  return obras.sort(porOrden);
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
