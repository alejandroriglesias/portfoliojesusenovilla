import type { APIRoute } from 'astro';
import { getAjustes } from '../lib/ajustes';

/** Asistentes de IA que se pueden permitir o bloquear desde Ajustes. */
const BOTS_IA = ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended', 'CCBot'] as const;

/**
 * robots.txt: la web se indexa (el panel no). Los asistentes de IA, según
 * Ajustes → «Asistentes de IA que pueden leer la web» (por defecto, todos).
 */
export const GET: APIRoute = async ({ site }) => {
  const ajustes = await getAjustes();
  const permitidos = new Set<string>(ajustes.botsIA ?? BOTS_IA);
  const lineas = ['User-agent: *', 'Allow: /', 'Disallow: /keystatic', 'Disallow: /api/keystatic', ''];
  for (const bot of BOTS_IA) {
    lineas.push(`User-agent: ${bot}`);
    if (permitidos.has(bot)) lineas.push('Allow: /', 'Disallow: /keystatic', 'Disallow: /api/keystatic');
    else lineas.push('Disallow: /');
    lineas.push('');
  }
  lineas.push(`Sitemap: ${new URL('/sitemap.xml', site).href}`, '');
  return new Response(lineas.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
