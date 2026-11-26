/**
 * Índice del buscador de la cabecera (Ctrl/⌘ K). Se genera al compilar y el
 * navegador solo lo pide la primera vez que se abre el buscador.
 * Claves cortas para que pese poco: t título, u enlace, m línea secundaria,
 * d texto extra para buscar (descripción de la imagen), i miniatura.
 */
import type { APIRoute } from 'astro';
import { getImage } from 'astro:assets';
import { getObras, getTecnicas, etiquetaTecnica, slugTecnica, esMarcador } from '../lib/contenido';

export const GET: APIRoute = async () => {
  const obras = await getObras();
  const principales = await getTecnicas('principal');
  const subtecnicas = await getTecnicas('grabado');

  const itemsObras = await Promise.all(
    obras.map(async (o) => {
      const im = o.data.imagen;
      const mini = await getImage({ src: im, width: Math.min(im.width, 112), format: 'webp', quality: 60 });
      const tecnica = await etiquetaTecnica(o);
      return {
        t: o.data.titulo,
        u: `/obra/${o.id}`,
        m: [tecnica, o.data.anio].filter(Boolean).join(' · '),
        d: o.data.alt ?? '',
        i: mini.src,
        ...(o.data.destacada ? { x: 1 } : {}),
      };
    })
  );

  const cuenta = (slug: string) =>
    obras.filter((o) => o.data.tecnica.discriminant === slug || slugTecnica(o) === slug).length;
  const itemsTecnicas = [...principales, ...subtecnicas]
    .map((t) => ({
      t: t.data.nombre,
      u: t.data.grupo === 'principal' ? `/tecnicas#${t.id}` : `/tecnicas/${t.id}`,
      m: `${t.data.grupo === 'principal' ? 'Técnica' : 'Grabado'} · ${cuenta(t.id)} obras`,
      d: [t.data.lema, t.data.resumen].filter((x) => x && !esMarcador(x)).join(' '),
      n: cuenta(t.id),
    }))
    .filter((t) => t.n > 0)
    .map(({ n: _n, ...t }) => t);

  return new Response(JSON.stringify({ obras: itemsObras, tecnicas: itemsTecnicas }), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
