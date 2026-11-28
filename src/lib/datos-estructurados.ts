/**
 * Datos estructurados (schema.org, JSON-LD) para buscadores y asistentes de IA.
 * Nunca se incluyen valores vacíos ni pendientes entre [corchetes].
 * Comprobación: scripts/comprobar-jsonld.mjs (npm run test:jsonld).
 */
import { getImage } from 'astro:assets';
import { getAjustes } from './ajustes';
import { esMarcador, getSobreMi, type Obra, type Serie } from './contenido';
import { medidasPrincipales, cm, superficieTexto, textoPlano } from './obra-datos';

const limpio = (v?: string | number | null) =>
  v === undefined || v === null || v === '' || (typeof v === 'string' && esMarcador(v)) ? undefined : v;

/** Quita las propiedades vacías (undefined, '', [] o {}) de un objeto JSON-LD. */
function compacto<T extends Record<string, unknown>>(o: T): T {
  return Object.fromEntries(
    Object.entries(o).filter(([, v]) => v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0))
  ) as T;
}

export const idArtista = (sitio: URL) => new URL('/#artista', sitio).href;
export const idSitio = (sitio: URL) => new URL('/#sitio', sitio).href;

/** El sitio web. */
export async function sitioJsonLd(sitio: URL) {
  const ajustes = await getAjustes();
  return compacto({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': idSitio(sitio),
    name: limpio(ajustes.persona?.nombre) ?? 'Jesús Senovilla',
    url: new URL('/', sitio).href,
    inLanguage: 'es-ES',
    description: limpio(ajustes.seoDescripcion),
    author: { '@id': idArtista(sitio) },
    publisher: { '@id': idArtista(sitio) },
  });
}

/** Persona: el artista (datos de Ajustes y de «Sobre mí»). */
export async function personaJsonLd(sitio: URL) {
  const [ajustes, sobreMi] = await Promise.all([getAjustes(), getSobreMi()]);
  const s = sobreMi.data;
  const retrato = s.retrato
    ? new URL((await getImage({ src: s.retrato, width: 800, format: 'jpg', quality: 78 })).src, sitio).href
    : undefined;
  const email = ajustes.email && !esMarcador(ajustes.email) && ajustes.email.includes('@') ? ajustes.email : undefined;
  const perfiles = [ajustes.instagram, ajustes.facebook, ajustes.tiktok, ajustes.youtube, ...(ajustes.otrosPerfiles ?? [])].filter(
    (u): u is string => !!u && /^https?:\/\//.test(u)
  );
  const lugar = limpio(s.lugar) ?? limpio(ajustes.taller);
  const bio = textoPlano(sobreMi.body);
  return compacto({
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': idArtista(sitio),
    name: limpio(ajustes.persona?.nombre) ?? 'Jesús Senovilla',
    url: new URL('/sobre-mi', sitio).href,
    jobTitle: limpio(ajustes.persona?.profesion) ?? 'Pintor y grabador',
    description: limpio(ajustes.persona?.descripcion) ?? (bio && !bio.startsWith('[') ? bio.slice(0, 300) : undefined),
    image: retrato,
    email: email ? `mailto:${email}` : undefined,
    sameAs: [...new Set(perfiles)],
    knowsAbout: ['Pintura al óleo', 'Acuarela', 'Grabado', 'Aguafuerte', 'Aguatinta', 'Manera negra', 'Punta seca'],
    workLocation: lugar ? { '@type': 'Place', name: lugar } : undefined,
    alumniOf: s.formacion
      .filter((f) => limpio(f.centro))
      .map((f) => ({ '@type': 'EducationalOrganization', name: f.centro })),
    hasCredential: s.formacion
      .filter((f) => limpio(f.titulo))
      .map((f) => compacto({ '@type': 'EducationalOccupationalCredential', name: f.titulo, dateCreated: limpio(f.anio) })),
    award: s.premios.filter((p) => limpio(p.nombre)).map((p) => (limpio(p.anio) ? `${p.nombre} (${p.anio})` : p.nombre!)),
    subjectOf: s.exposiciones
      .filter((e) => limpio(e.titulo))
      .map((e) =>
        compacto({
          '@type': 'ExhibitionEvent',
          name: e.titulo,
          startDate: limpio(e.anio),
          location: limpio(e.lugar) ? { '@type': 'Place', name: e.lugar } : undefined,
          description: e.tipo === 'colectiva' ? 'Exposición colectiva' : 'Exposición individual',
        })
      ),
  });
}

/** Obra de arte (VisualArtwork) para la ficha. */
export async function obraJsonLd(obra: Obra, sitio: URL, nombreTecnica: string, nombrePrincipal: string, serie?: Serie) {
  const d = obra.data;
  const t = d.tecnica;
  const abs = (src: string) => new URL(src, sitio).href;
  const imagenes = await Promise.all(
    [d.imagen, ...(d.imagenPlancha ? [d.imagenPlancha] : []), ...d.vistas.map((v) => v.imagen)].map(
      async (im) => abs((await getImage({ src: im, width: Math.min(im.width, 1200), format: 'jpg', quality: 78 })).src)
    )
  );
  const edicion = t.discriminant === 'grabado' ? limpio(t.value.edicion) : undefined;
  const ejemplares = typeof edicion === 'string' ? Number(edicion.match(/\d+/)?.[0]) || undefined : undefined;
  const m = medidasPrincipales(d);
  const descripcion = limpio(d.entradilla) ?? limpio(textoPlano(obra.body));
  return compacto({
    '@context': 'https://schema.org',
    '@type': 'VisualArtwork',
    '@id': `${abs(`/obra/${obra.id}`)}#obra`,
    name: d.titulo,
    url: abs(`/obra/${obra.id}`),
    image: imagenes.length === 1 ? imagenes[0] : imagenes,
    creator: { '@type': 'Person', '@id': idArtista(sitio), name: 'Jesús Senovilla' },
    artform: t.discriminant === 'grabado' ? 'Grabado' : 'Pintura',
    artMedium: t.discriminant === 'grabado' ? nombreTecnica : nombrePrincipal,
    artworkSurface: superficieTexto(d),
    height: m ? { '@type': 'Distance', name: `${cm(m.alto)} cm` } : undefined,
    width: m ? { '@type': 'Distance', name: `${cm(m.ancho)} cm` } : undefined,
    dateCreated: d.anio ? String(d.anio) : undefined,
    artEdition: ejemplares,
    description: descripcion,
    inLanguage: 'es-ES',
    isPartOf: serie ? { '@type': 'CreativeWorkSeries', name: serie.data.titulo, url: abs(`/serie/${serie.id}`) } : undefined,
    isBasedOn: limpio(d.interpretacionDe)
      ? { '@type': 'CreativeWork', creator: { '@type': 'Person', name: d.interpretacionDe } }
      : undefined,
  });
}

/** Listado de obras (Obra, técnica, serie): CollectionPage con su ItemList. */
export function coleccionJsonLd(sitio: URL, o: { url: string; nombre: string; descripcion?: string; obras: Obra[] }) {
  const url = new URL(o.url, sitio).href;
  return compacto({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${url}#pagina`,
    url,
    name: o.nombre,
    description: limpio(o.descripcion),
    inLanguage: 'es-ES',
    isPartOf: { '@id': idSitio(sitio) },
    about: { '@id': idArtista(sitio) },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: o.obras.length,
      itemListElement: o.obras.map((obra, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: new URL(`/obra/${obra.id}`, sitio).href,
        name: obra.data.titulo,
      })),
    },
  });
}

/** Preguntas frecuentes (FAQPage). */
export function faqJsonLd(sitio: URL, preguntas: { pregunta: string; respuesta: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${new URL('/preguntas-frecuentes', sitio).href}#faq`,
    inLanguage: 'es-ES',
    mainEntity: preguntas.map((p) => ({
      '@type': 'Question',
      name: p.pregunta,
      acceptedAnswer: { '@type': 'Answer', text: p.respuesta.replace(/\s*\n\s*\n\s*/g, '\n\n').trim() },
    })),
  };
}

/** Migas (BreadcrumbList). */
export function migasJsonLd(sitio: URL, migas: { nombre: string; href: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: migas.map((m, i) => ({ '@type': 'ListItem', position: i + 1, name: m.nombre, item: new URL(m.href, sitio).href })),
  };
}
