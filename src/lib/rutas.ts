/**
 * Ruta «limpia» de la página actual: sin «.html», sin «/index» y sin barra final.
 * (Con build.format 'file', Astro.url.pathname vale p. ej. «/obra/rosa.html».)
 */
export const rutaLimpia = (pathname: string) =>
  pathname.replace(/\.html$/, '').replace(/\/index$/, '').replace(/\/$/, '') || '/';
