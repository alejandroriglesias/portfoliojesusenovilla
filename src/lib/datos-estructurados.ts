/**
 * Datos estructurados (schema.org, JSON-LD) para buscadores.
 * Nunca se incluyen valores pendientes entre [corchetes].
 */
import { getImage } from 'astro:assets';
import { getAjustes } from './ajustes';
import { esMarcador, getSobreMi, type Obra } from './contenido';

const limpio = (v?: string | number | null) =>
  v === undefined || v === null || (typeof v === 'string' && esMarcador(v)) ? undefined : v;

/** Persona: el artista. */
export async function personaJsonLd(sitio: URL) {
  const [ajustes, sobreMi] = await Promise.all([getAjustes(), getSobreMi()]);
  const retrato = sobreMi.data.retrato
    ? new URL((await getImage({ src: sobreMi.data.retrato, width: 800, format: 'jpg', quality: 78 })).src, sitio).href
    : undefined;
  const email = ajustes.email && !esMarcador(ajustes.email) && ajustes.email.includes('@') ? ajustes.email : undefined;
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': new URL('/#artista', sitio).href,
    name: 'Jesús Senovilla',
    url: new URL('/', sitio).href,
    jobTitle: 'Pintor y grabador',
    knowsAbout: ['Pintura al óleo', 'Acuarela', 'Grabado', 'Manera negra', 'Aguafuerte', 'Aguatinta'],
    ...(retrato ? { image: retrato } : {}),
    ...(email ? { email: `mailto:${email}` } : {}),
    ...(ajustes.instagram ? { sameAs: [ajustes.instagram] } : {}),
  };
}

/** Obra de arte (VisualArtwork) para la ficha. */
export async function obraJsonLd(obra: Obra, sitio: URL, nombreTecnica: string, nombrePrincipal: string) {
  const d = obra.data;
  const t = d.tecnica;
  const imagen = await getImage({ src: d.imagen, width: 1200, format: 'jpg', quality: 78 });
  const edicion = t.discriminant === 'grabado' ? limpio(t.value.edicion) : undefined;
  const ejemplares = typeof edicion === 'string' ? Number(edicion.match(/\d+/)?.[0]) : undefined;
  const medidas = typeof limpio(d.medidas) === 'string' ? (d.medidas as string).match(/([\d.,]+)\s*[×x]\s*([\d.,]+)/) : null;
  return {
    '@context': 'https://schema.org',
    '@type': 'VisualArtwork',
    name: d.titulo,
    url: new URL(`/obra/${obra.id}`, sitio).href,
    image: new URL(imagen.src, sitio).href,
    creator: { '@type': 'Person', '@id': new URL('/#artista', sitio).href, name: 'Jesús Senovilla' },
    artform: t.discriminant === 'grabado' ? 'Grabado' : 'Pintura',
    artMedium: t.discriminant === 'grabado' ? nombreTecnica : nombrePrincipal,
    ...(limpio(d.soporte) ? { artworkSurface: d.soporte } : {}),
    ...(d.anio ? { dateCreated: String(d.anio) } : {}),
    ...(ejemplares ? { artEdition: ejemplares } : {}),
    ...(medidas
      ? {
          height: { '@type': 'QuantitativeValue', value: Number(medidas[1].replace(',', '.')), unitCode: 'CMT' },
          width: { '@type': 'QuantitativeValue', value: Number(medidas[2].replace(',', '.')), unitCode: 'CMT' },
        }
      : {}),
    ...(d.entradilla && !esMarcador(d.entradilla) ? { description: d.entradilla } : {}),
    ...(d.interpretacionDe ? { isBasedOn: { '@type': 'CreativeWork', creator: { '@type': 'Person', name: d.interpretacionDe } } } : {}),
  };
}
