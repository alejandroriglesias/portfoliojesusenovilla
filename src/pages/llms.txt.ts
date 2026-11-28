/**
 * /llms.txt (https://llmstxt.org): resumen en Markdown para asistentes de IA.
 * Quién es el artista, sus técnicas, las secciones principales, las series y
 * cómo comprar. Se genera en cada compilación con el contenido del panel.
 */
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { getAjustes } from '../lib/ajustes';
import { esMarcador, getObras, getObrasDeTecnica, getSeries, getSobreMi, getTecnicas, getObrasDeSerie } from '../lib/contenido';
import { getPreguntas } from '../lib/preguntas';
import { textoPlano, recortar } from '../lib/obra-datos';

export const GET: APIRoute = async ({ site }) => {
  const u = (ruta: string) => new URL(ruta, site).href;
  const [ajustes, sobreMi, obras, tecnicas, series, legales, faq] = await Promise.all([
    getAjustes(),
    getSobreMi(),
    getObras(),
    getTecnicas(),
    getSeries(),
    getCollection('legal'),
    getPreguntas(),
  ]);
  const nombre = (ajustes.persona?.nombre && !esMarcador(ajustes.persona.nombre) ? ajustes.persona.nombre : undefined) ?? 'Jesús Senovilla';
  const profesion = ajustes.persona?.profesion && !esMarcador(ajustes.persona.profesion) ? ajustes.persona.profesion : 'Pintor y grabador';
  const bio = textoPlano(sobreMi.body);
  const resumen =
    (ajustes.persona?.descripcion && !esMarcador(ajustes.persona.descripcion) ? ajustes.persona.descripcion : undefined) ??
    (ajustes.seoDescripcion && !esMarcador(ajustes.seoDescripcion) ? ajustes.seoDescripcion : undefined) ??
    `${profesion}. Óleo, acuarela y grabado.`;
  const lugar = [sobreMi.data.lugar, ajustes.taller].find((l) => l && !esMarcador(l));

  const l: string[] = [`# ${nombre}`, '', `> ${resumen.replace(/\s+/g, ' ').trim()}`, ''];
  l.push(
    `${nombre} es ${profesion.toLowerCase()}${lugar ? ` con taller en ${lugar}` : ''}. Esta es su web oficial: aquí se puede ver su obra (${obras.length} obras publicadas) y comprarla directamente al artista, sin intermediarios.`
  );
  if (bio && !bio.startsWith('[')) l.push('', recortar(bio, 600));

  l.push('', '## Secciones', '');
  l.push(`- [Obra](${u('/obra')}): índice completo de la obra, por técnica.`);
  l.push(`- [Técnicas](${u('/tecnicas')}): cómo trabaja cada técnica (óleo, acuarela y grabado).`);
  l.push(`- [Sobre mí](${u('/sobre-mi')}): biografía y trayectoria.`);
  l.push(`- [Contacto](${u('/contacto')}): correo y redes.`);
  l.push(`- [Preguntas frecuentes](${u('/preguntas-frecuentes')}): compra, pago, envíos, devoluciones y visitas al taller.`);

  l.push('', '## Técnicas', '');
  for (const t of tecnicas) {
    const n = (await getObrasDeTecnica(t.id)).length;
    const res = t.data.resumen && !esMarcador(t.data.resumen) ? `: ${t.data.resumen.replace(/\s+/g, ' ').trim()}` : '';
    l.push(`- [${t.data.nombre}](${u(`/tecnicas/${t.id}`)}) (${n} ${n === 1 ? 'obra' : 'obras'})${res}`);
  }

  if (series.length) {
    l.push('', '## Series', '');
    for (const s of series) {
      const n = (await getObrasDeSerie(s.id)).length;
      const ent = s.data.entradilla && !esMarcador(s.data.entradilla) ? `: ${s.data.entradilla.replace(/\s+/g, ' ').trim()}` : '';
      l.push(`- [${s.data.titulo}](${u(`/serie/${s.id}`)}) (${n} ${n === 1 ? 'obra' : 'obras'})${ent}`);
    }
  }

  l.push('', '## Cómo comprar', '');
  l.push(
    'No hay tienda online: las obras se compran escribiendo al artista desde la ficha de cada obra («Me interesa esta obra»). Él confirma por escrito la disponibilidad, el precio final con el envío y el plazo, y la obra queda reservada. Se paga por transferencia bancaria o Bizum. Los particulares tienen 14 días para devolverla.'
  );
  l.push('', `- [Condiciones de venta](${u('/condiciones-de-venta')})`);
  if (faq.preguntas.length) l.push(`- [Preguntas frecuentes](${u('/preguntas-frecuentes')})`);

  l.push('', '## Optional', '');
  for (const p of legales.sort((a, b) => a.data.orden - b.data.orden)) {
    if (p.id !== 'condiciones-de-venta') l.push(`- [${p.data.titulo}](${u(`/${p.id}`)})`);
  }
  l.push(`- [Mapa del sitio](${u('/sitemap.xml')})`, '');

  return new Response(l.join('\n'), { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
};
