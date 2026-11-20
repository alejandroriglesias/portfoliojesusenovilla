import type { APIRoute } from 'astro';

/** robots.txt: la web se indexa (el WordPress tenía noindex); el panel no. */
export const GET: APIRoute = ({ site }) => {
  const sitemap = new URL('/sitemap-index.xml', site).href;
  return new Response(
    ['User-agent: *', 'Allow: /', 'Disallow: /keystatic', 'Disallow: /api/keystatic', '', `Sitemap: ${sitemap}`, ''].join('\n'),
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
  );
};
