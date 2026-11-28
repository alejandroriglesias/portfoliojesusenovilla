/**
 * sitemap.xml: todas las páginas públicas, con <lastmod> (último cambio en git)
 * y, en las obras, sus imágenes (extensión image:image de Google).
 * Las portadas de comparación (/inicio/…), la 404 y el panel quedan fuera.
 */
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { getImage } from 'astro:assets';
import { getObras, getSeries, getTecnicas, slugTecnica } from '../lib/contenido';
import { ultimoCambio, masReciente } from '../lib/git-fechas';

interface Url {
  ruta: string;
  lastmod?: string;
  imagenes?: { loc: string; titulo: string }[];
}

const xml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Ruta del archivo de contenido de una entrada (para la fecha de git). */
const archivo = (coleccion: string, entrada: { filePath?: string; id: string }) =>
  entrada.filePath ?? `src/content/${coleccion}/${entrada.id}.mdoc`;

export const GET: APIRoute = async ({ site }) => {
  const sitio = site!;
  const [obras, tecnicas, series, legales] = await Promise.all([getObras(), getTecnicas(), getSeries(), getCollection('legal')]);

  const fechaObras = masReciente(...obras.map((o) => ultimoCambio(archivo('obras', o))));
  const urls: Url[] = [
    { ruta: '/', lastmod: masReciente(fechaObras, ultimoCambio('src/content/ajustes')) },
    { ruta: '/obra', lastmod: fechaObras },
    { ruta: '/tecnicas', lastmod: masReciente(fechaObras, ultimoCambio('src/content/tecnicas')) },
    { ruta: '/sobre-mi', lastmod: ultimoCambio('src/content/sobre-mi') },
    { ruta: '/contacto', lastmod: ultimoCambio('src/content/ajustes', 'src/pages/contacto.astro') },
    { ruta: '/preguntas-frecuentes', lastmod: ultimoCambio('src/content/preguntas') },
  ];

  for (const t of tecnicas) {
    const deEsta = obras.filter((o) => o.data.tecnica.discriminant === t.id || slugTecnica(o) === t.id);
    urls.push({
      ruta: `/tecnicas/${t.id}`,
      lastmod: masReciente(ultimoCambio(archivo('tecnicas', t)), ...deEsta.map((o) => ultimoCambio(archivo('obras', o)))),
    });
  }
  for (const s of series) {
    const deEsta = obras.filter((o) => o.data.serie === s.id);
    urls.push({
      ruta: `/serie/${s.id}`,
      lastmod: masReciente(ultimoCambio(archivo('series', s)), ...deEsta.map((o) => ultimoCambio(archivo('obras', o)))),
    });
  }
  for (const o of obras) {
    const fotos = [o.data.imagen, ...(o.data.imagenPlancha ? [o.data.imagenPlancha] : []), ...o.data.vistas.map((v) => v.imagen)];
    const imagenes = await Promise.all(
      fotos.map(async (im, i) => ({
        loc: new URL((await getImage({ src: im, width: Math.min(im.width, 1200), format: 'jpg', quality: 78 })).src, sitio).href,
        titulo: i === 0 ? o.data.titulo : `${o.data.titulo} (${i + 1})`,
      }))
    );
    urls.push({ ruta: `/obra/${o.id}`, lastmod: ultimoCambio(archivo('obras', o)), imagenes });
  }
  for (const l of legales) {
    urls.push({ ruta: `/${l.id}`, lastmod: ultimoCambio(archivo('legal', l)) ?? l.data.actualizado.toISOString() });
  }

  const cuerpo = urls
    .map((u) =>
      [
        '  <url>',
        `    <loc>${xml(new URL(u.ruta, sitio).href)}</loc>`,
        u.lastmod ? `    <lastmod>${u.lastmod}</lastmod>` : '',
        ...(u.imagenes ?? []).map((im) => `    <image:image>\n      <image:loc>${xml(im.loc)}</image:loc>\n    </image:image>`),
        '  </url>',
      ]
        .filter(Boolean)
        .join('\n')
    )
    .join('\n');

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${cuerpo}\n</urlset>\n`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } }
  );
};
