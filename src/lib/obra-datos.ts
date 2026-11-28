/**
 * Datos técnicos de una obra ya «listos para mostrar»: medidas (siempre
 * «alto × ancho cm»), papel, marco… y el título y la descripción para
 * buscadores. Un dato vacío o entre [corchetes] no aparece nunca.
 */
import type { Obra } from './contenido';
import { esMarcador } from './contenido';

export interface Medidas {
  alto: number;
  ancho: number;
}

const GRANOS = { fino: 'grano fino / satinado', medio: 'grano medio', grueso: 'grano grueso / rugoso' } as const;

const limpio = (v?: string | null) => (v && !esMarcador(v) ? v.trim() : undefined);

/** 32.5 → «32,5» */
export const cm = (n: number) => String(Math.round(n * 10) / 10).replace('.', ',');

/** «40 × 30 cm» */
export const medidasTexto = (m: Medidas) => `${cm(m.alto)} × ${cm(m.ancho)} cm`;

/** Lee «40x30», «40 × 30 cm», «32,5 X 24»… del campo de texto libre. */
export function medidasDeTexto(texto?: string | null): Medidas | undefined {
  const t = limpio(texto);
  const m = t?.match(/(\d+(?:[.,]\d+)?)\s*[×xX*]\s*(\d+(?:[.,]\d+)?)/);
  if (!m) return undefined;
  const alto = parseFloat(m[1].replace(',', '.'));
  const ancho = parseFloat(m[2].replace(',', '.'));
  return alto > 0 && ancho > 0 ? { alto, ancho } : undefined;
}

/** Medidas de referencia de la obra (para buscadores): imagen, si no papel, si no el texto libre. */
export function medidasPrincipales(d: Obra['data']): Medidas | undefined {
  return d.medidasImagen ?? d.medidasPapel ?? medidasDeTexto(d.medidas);
}

/** Lado largo (cm) de lo que se cuelga en la pared: marco, papel, imagen o texto libre. */
export function ladoEnPared(d: Obra['data']): number | undefined {
  const m = d.enmarcado?.medidas ?? d.medidasPapel ?? d.medidasImagen ?? medidasDeTexto(d.medidas);
  return m ? Math.max(m.alto, m.ancho) : undefined;
}

/** «Arches, 300 g/m², 100 % algodón, grano grueso / rugoso» */
export function papelTexto(d: Obra['data']): string | undefined {
  const p = d.papel;
  const partes = [limpio(p.marca), p.gramaje ? `${p.gramaje} g/m²` : undefined, limpio(p.composicion), p.grano ? GRANOS[p.grano] : undefined].filter(
    (x): x is string => !!x
  );
  return partes.length ? partes.join(', ') : undefined;
}

/** Superficie para schema.org: el papel con sus datos o el soporte libre. */
export function superficieTexto(d: Obra['data']): string | undefined {
  const papel = papelTexto(d);
  if (papel) return `Papel ${papel}`;
  return limpio(d.soporte);
}

export interface Dato {
  dt: string;
  dd: string;
}

/** Filas de la cartela (<dl>). */
export function datosTecnicos(
  d: Obra['data'],
  o: { tecnica: string; esGrabado: boolean; edicion?: string }
): Dato[] {
  const libres = !d.medidasImagen && !d.medidasPapel ? medidasDeTexto(d.medidas) : undefined;
  const marco = d.enmarcado
    ? [d.enmarcado.medidas ? medidasTexto(d.enmarcado.medidas) : 'Sí', d.enmarcado.paspartu ? 'con paspartú' : undefined]
        .filter(Boolean)
        .join(', ')
    : undefined;
  const filas: (Dato | undefined)[] = [
    { dt: 'Técnica', dd: o.tecnica },
    d.anio ? { dt: 'Año', dd: String(d.anio) } : undefined,
    d.medidasImagen ? { dt: o.esGrabado ? 'Huella (alto × ancho)' : 'Medidas (alto × ancho)', dd: medidasTexto(d.medidasImagen) } : undefined,
    d.medidasPapel ? { dt: 'Papel (alto × ancho)', dd: medidasTexto(d.medidasPapel) } : undefined,
    libres ? { dt: 'Medidas (alto × ancho)', dd: medidasTexto(libres) } : undefined,
    !libres && !d.medidasImagen && !d.medidasPapel && limpio(d.medidas) ? { dt: 'Medidas', dd: limpio(d.medidas)! } : undefined,
    papelTexto(d) ? { dt: 'Papel', dd: papelTexto(d)! } : limpio(d.soporte) ? { dt: o.esGrabado ? 'Papel' : 'Soporte', dd: limpio(d.soporte)! } : undefined,
    marco ? { dt: 'Enmarcada', dd: marco } : undefined,
    limpio(o.edicion) ? { dt: 'Edición', dd: limpio(o.edicion)! } : undefined,
    limpio(d.interpretacionDe) ? { dt: 'Interpretación de', dd: limpio(d.interpretacionDe)! } : undefined,
    d.certificado ? { dt: 'Certificado', dd: 'Incluye certificado de autenticidad' } : undefined,
  ];
  return filas.filter((f): f is Dato => !!f);
}

/** Texto plano del cuerpo Markdoc (sin marcas), para descripciones. */
export function textoPlano(markdoc?: string): string {
  return (markdoc ?? '')
    .replace(/\{%[^%]*%\}/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Corta en la última palabra que quepa y añade «…». */
export function recortar(texto: string, max: number): string {
  if (texto.length <= max) return texto;
  const corte = texto.slice(0, max - 1);
  return `${corte.slice(0, Math.max(corte.lastIndexOf(' '), max * 0.6)).replace(/[\s,;:.—-]+$/, '')}…`;
}

/** «Ajos — Acuarela original de Jesús Senovilla (2023)» */
export function tituloSeo(obra: Obra, tecnica: string): string {
  const d = obra.data;
  return limpio(d.seo.titulo) ?? `${d.titulo} — ${tecnica} original de Jesús Senovilla${d.anio ? ` (${d.anio})` : ''}`;
}

/** Descripción para buscadores: la del CMS o una con técnica, año, medidas, papel y el principio del texto. */
export function descripcionSeo(obra: Obra, tecnica: string): string {
  const d = obra.data;
  const manual = limpio(d.seo.descripcion);
  if (manual) return recortar(manual, 160);
  const m = medidasPrincipales(d);
  const papel = papelTexto(d);
  const ficha = [
    `${tecnica} original de Jesús Senovilla`,
    d.anio ? String(d.anio) : undefined,
    m ? medidasTexto(m) : undefined,
    papel ? `papel ${papel.split(', ').slice(0, 2).join(' ')}` : limpio(d.soporte)?.toLowerCase(),
  ]
    .filter(Boolean)
    .join(', ');
  const texto = limpio(d.entradilla) ?? limpio(textoPlano(obra.body)) ?? limpio(d.alt);
  const base = d.titulo && !/^sin t[ií]tulo$/i.test(d.titulo) ? `«${d.titulo}»: ${ficha.charAt(0).toLowerCase()}${ficha.slice(1)}.` : `${ficha}.`;
  return recortar(texto ? `${base} ${texto}` : base, 155);
}
